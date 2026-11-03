import type { WritingValidationIssue } from "../forum-client";
export function validationText(
  issue: WritingValidationIssue,
  language: string,
): string {
  const cn = language === "zh-CN",
    tw = language === "zh-TW";
  if (issue.code === "native-limit")
    return cn
      ? "请输入当前原生限制内的整数。"
      : tw
        ? "請輸入目前原生限制內的整數。"
        : "Use a whole number within the current native limits.";
  if (issue.code === "packet-minimum")
    return cn
      ? "总金额必须满足每份的原生最低要求。"
      : tw
        ? "總金額必須滿足每份的原生最低要求。"
        : "The total must cover the native minimum for every share.";
  if (issue.code === "single-line")
    return cn
      ? "标题只能占一行。"
      : tw
        ? "標題只能佔一行。"
        : "Use a single line for the title.";
  if (issue.code === "too-long")
    return cn
      ? `最多输入 ${issue.limit} 个字符。`
      : tw
        ? `最多輸入 ${issue.limit} 個字元。`
        : `Use at most ${issue.limit} characters.`;
  if (issue.code === "unavailable")
    return issue.field === "category"
      ? cn
        ? "请选择可用的分类。"
        : tw
          ? "請選擇可用的分類。"
          : "Choose an available category."
      : cn
        ? "请选择可用的选项。"
        : tw
          ? "請選擇可用的選項。"
          : "Choose an available option.";
  if (issue.field === "title")
    return cn ? "请输入标题。" : tw ? "請輸入標題。" : "Enter a title.";
  if (issue.field === "source")
    return cn ? "请输入正文。" : tw ? "請輸入正文。" : "Enter the post body.";
  return cn ? "请填写此字段。" : tw ? "請填寫此欄位。" : "Complete this field.";
}
