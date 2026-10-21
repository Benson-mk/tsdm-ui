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
