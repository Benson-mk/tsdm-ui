import type {
  PreparedWriting,
  ThreadCreationEffect,
  ThreadVerification,
  WritingOption,
} from "./types.js";

const options = (writing: PreparedWriting): WritingOption[] => [
  ...(writing.category ? [writing.category] : []),
  ...writing.options,
];
function creationName(
  option: WritingOption,
): ThreadCreationEffect["name"] | null {
  if (option.kind !== "checkbox") return null;
  switch (option.name) {
    case "addfeed":
    case "adddynamic":
    case "adddynamic_doing":
      return option.name;
    default:
      return null;
  }
}
function creationEffects(writing: PreparedWriting): ThreadCreationEffect[] {
  return writing.options.flatMap((option) => {
    const name = creationName(option);
    if (!name) return [];
    return [
      option.checked
        ? {
            name,
            requested: true as const,
            included: !option.disabled,
            outcome: "unknown" as const,
          }
        : {
            name,
            requested: false as const,
            included: false as const,
            outcome: "not-requested" as const,
          },
    ];
  });
}
/** Only qualified native action checkboxes are exempt from persistent readback. */
export function verifyStoredWriting(
  submitted: PreparedWriting,
  stored: PreparedWriting,
): ThreadVerification | null {
  if (submitted.title !== stored.title || submitted.source !== stored.source)
    return null;
  if (
    submitted.uploadedReferences.some(
      (id) => !stored.uploadedReferences.includes(id),
    )
  )
    return null;
  const attachmentNormalizations: NonNullable<
    ThreadVerification["attachmentNormalizations"]
  > = [];
  for (const field of submitted.attachmentFields ?? []) {
    const matches =
      stored.attachmentFields?.filter((actual) => actual.name === field.name) ??
      [];
    if (
      matches.length !== 1 ||
      submitted.attachmentFields!.filter((actual) => actual.name === field.name)
        .length !== 1 ||
      matches[0]!.disabled !== field.disabled
    )
      return null;
    const actual = matches[0]!;
    if (actual.value === field.value) continue;
    const attachment = /^attachnew\[([1-9]\d*)\]\[price\]$/.exec(field.name);
    if (
      !attachment ||
      field.disabled ||
      field.value !== "" ||
      actual.value !== "0" ||
      !submitted.uploadedReferences.includes(attachment[1]!)
    )
      return null;
    attachmentNormalizations.push({
      name: field.name,
      submitted: "",
      stored: "0",
    });
  }
  const normalizations: ThreadVerification["normalizations"] = [];
  for (const expected of options(submitted)) {
    if (
      creationName(expected) ||
      (submitted.redPacket && expected.name.startsWith("hb_"))
    )
      continue;
    const actual = options(stored).find(
      (option) => option.name === expected.name,
    );
    if (
      !actual ||
      actual.kind !== expected.kind ||
      actual.checked !== expected.checked
    )
      return null;
    if (actual.value === expected.value) continue;
    if (
      expected.name === "price" &&
      expected.kind === "text" &&
      !expected.disabled &&
      expected.value === "" &&
      actual.value === "0"
    )
      normalizations.push({ name: "price", submitted: "", stored: "0" });
    else return null;
  }
  return {
    stored: "verified",
    normalizations,
    ...(attachmentNormalizations.length ? { attachmentNormalizations } : {}),
    creationEffects: creationEffects(submitted),
  };
}
/** Only the observed native representation of explicitly selected people. */
function selectedMentionSource(submitted: PreparedWriting): string | null {
  let expanded = submitted.source;
  const names = new Set<string>();
  for (const person of submitted.mentions ?? []) {
    // A marker can only name one selected identity. Unsafe BBCode names and
    // incomplete/unselected markers have no qualified stored representation.
    if (
      names.has(person.name) ||
      !/^[1-9]\d*$/.test(person.id) ||
      !person.name ||
      /[[\]\r\n\u2063\u2064]/.test(person.name)
    )
      return null;
    names.add(person.name);
    expanded = expanded.replaceAll(
      `@\u2063${person.name}\u2063`,
      `[url=home.php?mod=space&uid=${person.id}]@${person.name}[/url]`,
    );
  }
  if (/[\u2063\u2064]/.test(expanded)) return null;

  return expanded;
}
/** Direct thread publication has qualified the same selected UID links as replies. */
export function verifyStoredThread(
  submitted: PreparedWriting,
  stored: PreparedWriting,
): ThreadVerification | null {
  if (
    submitted.action !== "new-thread" ||
    submitted.draft ||
    submitted.replyTarget
  )
    return null;
  const exact = verifyStoredWriting(submitted, stored);
  if (exact) return exact;
  const source = selectedMentionSource(submitted);
  return source === null
    ? null
    : verifyStoredWriting({ ...submitted, source }, stored);
}
/** Bounded native reply source observations; never a general BBCode normalizer. */
export function verifyStoredReply(
  submitted: PreparedWriting,
  before: PreparedWriting | null,
  stored: PreparedWriting,
): ThreadVerification | null {
  if (
    !submitted.replyTarget ||
    !["reply", "quick-quote"].includes(submitted.action) ||
    (before &&
      (before.account.id !== submitted.account.id ||
        before.account.name !== submitted.account.name ||
        before.board.id !== submitted.board.id ||
        JSON.stringify(before.replyTarget) !==
          JSON.stringify(submitted.replyTarget))) ||
    stored.account.id !== submitted.account.id ||
    stored.account.name !== submitted.account.name ||
    stored.board.id !== submitted.board.id ||
    JSON.stringify(stored.replyTarget) !== JSON.stringify(submitted.replyTarget)
  )
    return null;

  const appended = selectedMentionSource(submitted);
  if (appended === null) return null;

  if (!before)
    return verifyStoredWriting({ ...submitted, source: appended }, stored);

  // Two observed native merge envelopes; source inside either remains exact.
  const quoteWrapped = stored.source.startsWith(`${before.source}\n\n[quote]`);
  const prefix = `${before.source}\n\n${quoteWrapped ? "[quote]" : "[hr]\n"}[b]${submitted.account.name} 补充了以下内容 (`;
  if (!stored.source.startsWith(prefix)) return null;
  const remainder = stored.source.slice(prefix.length);
  const date = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})\)\[\/b\]\n/.exec(
    remainder,
  );
  if (!date) return null;
  const [year, month, day, hour, minute] = date.slice(1).map(Number);
  const calendar = new Date(Date.UTC(year!, month! - 1, day!, hour!, minute!));
  if (
    year! < 1000 ||
    calendar.getUTCFullYear() !== year ||
    calendar.getUTCMonth() + 1 !== month ||
    calendar.getUTCDate() !== day ||
    calendar.getUTCHours() !== hour ||
    calendar.getUTCMinutes() !== minute ||
    remainder.slice(date[0].length) !==
      appended + (quoteWrapped ? "[/quote]" : "")
  )
    return null;

  // Existing post options must remain intact, and requested options must also
  // match. Creation effects retain their existing explicitly unknown outcome.
  if (!verifyStoredWriting({ ...before, source: stored.source }, stored))
    return null;
  return verifyStoredWriting({ ...submitted, source: stored.source }, stored);
}

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const keys = (value: Record<string, unknown>, names: string[]) =>
  Object.keys(value).length === names.length &&
  names.every((name) => Object.hasOwn(value, name));
/** Validate recovered evidence against its immutable command; no authenticity claim. */
export function isThreadVerification(
  value: unknown,
  submitted: PreparedWriting,
): value is ThreadVerification {
  if (
    !record(value) ||
    !keys(value, [
      "stored",
      "normalizations",
      "creationEffects",
      ...(Object.hasOwn(value, "attachmentNormalizations")
        ? ["attachmentNormalizations"]
        : []),
    ]) ||
    value.stored !== "verified" ||
    !Array.isArray(value.normalizations) ||
    value.normalizations.length > 1 ||
    !Array.isArray(value.creationEffects)
  )
    return false;
  if (
    !value.normalizations.every(
      (entry: unknown) =>
        record(entry) &&
        keys(entry, ["name", "submitted", "stored"]) &&
        entry.name === "price" &&
        entry.submitted === "" &&
        entry.stored === "0" &&
        submitted.options.some(
          (option) =>
            option.name === "price" &&
            option.kind === "text" &&
            !option.disabled &&
            option.value === "",
        ),
    )
  )
    return false;
  if (Object.hasOwn(value, "attachmentNormalizations")) {
    const entries = value.attachmentNormalizations;
    const names = new Set<string>();
    if (
      !Array.isArray(entries) ||
      !entries.length ||
      entries.length > submitted.uploadedReferences.length ||
      !entries.every((entry: unknown) => {
        if (
          !record(entry) ||
          !keys(entry, ["name", "submitted", "stored"]) ||
          typeof entry.name !== "string" ||
          entry.submitted !== "" ||
          entry.stored !== "0" ||
          names.has(entry.name)
        )
          return false;
        const match = /^attachnew\[([1-9]\d*)\]\[price\]$/.exec(entry.name);
        const fields =
          submitted.attachmentFields?.filter(
            (field) => field.name === entry.name,
          ) ?? [];
        if (
          !match ||
          !submitted.uploadedReferences.includes(match[1]!) ||
          fields.length !== 1 ||
          fields[0]!.disabled ||
          fields[0]!.value !== ""
        )
          return false;
        names.add(entry.name);
        return true;
      })
    )
      return false;
  }
  const expected = creationEffects(submitted);
  const entries = value.creationEffects;
  return (
    value.creationEffects.length === expected.length &&
    expected.every((effect, index) => {
      const actual: unknown = entries[index];
      return (
        record(actual) &&
        keys(actual, ["name", "requested", "included", "outcome"]) &&
        actual.name === effect.name &&
        actual.requested === effect.requested &&
        actual.included === effect.included &&
        actual.outcome === effect.outcome
      );
    })
  );
}
