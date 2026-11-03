import { packetMinimum, packetNumberValid } from "./hongbao.js";
import type { PreparedWriting, WritingValidationIssue } from "./types.js";
/** Local content checks do not establish or observe a current account. */
export function writingIssues(
  writing: PreparedWriting,
  current: PreparedWriting = writing,
): WritingValidationIssue[] {
  const issues: WritingValidationIssue[] = [];
  if (
    !writing.replyTarget &&
    writing.titleAvailable !== false &&
    !writing.title.trim()
  )
    issues.push({ field: "title", code: "required" });
  else if (/[\r\n]/.test(writing.title))
    issues.push({ field: "title", code: "single-line" });
  if (!writing.source.trim())
    issues.push({ field: "source", code: "required" });
  for (const option of [
    ...(writing.category ? [writing.category] : []),
    ...writing.options,
  ]) {
    const fresh = [
      ...(current.category ? [current.category] : []),
      ...current.options,
    ].find((field) => field.name === option.name);
    if (option.disabled) continue;
    const field = option === writing.category ? "category" : "option";
    if (
      !fresh ||
      fresh.disabled ||
      (option.kind === "select" &&
        !fresh.choices.some(
          (choice) => choice.value === option.value && !choice.disabled,
        ))
    )
      issues.push({ field, name: option.name, code: "unavailable" });
    else if (fresh.maxLength !== null && option.value.length > fresh.maxLength)
      issues.push({
        field,
        name: option.name,
        code: "too-long",
        limit: fresh.maxLength,
      });
    else if (
      writing.redPacket &&
      ["hb_total", "hb_shares"].includes(option.name) &&
      !packetNumberValid({ ...fresh, value: option.value })
    )
      issues.push({ field, name: option.name, code: "native-limit" });
  }
  if (
    writing.redPacket &&
    !issues.some(
      (issue) => issue.name === "hb_total" || issue.name === "hb_shares",
    )
  ) {
    const minimum = packetMinimum(current),
      value = (name: string) =>
        Number(writing.options.find((option) => option.name === name)?.value);
    if (minimum !== null && value("hb_total") < value("hb_shares") * minimum)
      issues.push({
        field: "option",
        name: "hb_total",
        code: "packet-minimum",
      });
  }
  return issues;
}
