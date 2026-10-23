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
  for (const field of submitted.attachmentFields ?? []) {
    if (
      !stored.attachmentFields?.some(
        (f) =>
          f.name === field.name &&
          f.value === field.value &&
          f.disabled === field.disabled,
      )
    )
      return null;
  }
  const normalizations: ThreadVerification["normalizations"] = [];
  for (const expected of options(submitted)) {
    if (creationName(expected)) continue;
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
    creationEffects: creationEffects(submitted),
  };
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

  let appended = submitted.source;
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
    appended = appended.replaceAll(
      `@\u2063${person.name}\u2063`,
      `[url=home.php?mod=space&uid=${person.id}]@${person.name}[/url]`,
    );
  }
  if (/[\u2063\u2064]/.test(appended)) return null;

  if (!before)
    return verifyStoredWriting({ ...submitted, source: appended }, stored);

  const prefix = `${before.source}\n\n[hr]\n[b]${submitted.account.name} 补充了以下内容 (`;
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
    remainder.slice(date[0].length) !== appended
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
    !keys(value, ["stored", "normalizations", "creationEffects"]) ||
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
