import type { Preferences } from "../workspace/preferences";
const translations: Record<string, [string, string]> = {
  "This attribute cannot be represented safely.": [
    "无法安全表示此属性。",
    "無法安全表示此屬性。",
  ],
  "Attribute cannot be represented safely.": [
    "无法安全表示此属性。",
    "無法安全表示此屬性。",
  ],
  "Unsupported format.": ["不支持此格式。", "不支援此格式。"],
  "Choose 1–20 rows and columns.": [
    "请选择 1–20 行和列。",
    "請選擇 1–20 列和欄。",
  ],
  "Choose a valid emoticon token.": [
    "请选择有效的表情代码。",
    "請選擇有效的表情代碼。",
  ],
  "Use a plain author name.": [
    "请使用不含标记的作者名称。",
    "請使用不含標記的作者名稱。",
  ],
  "Unsupported section.": ["不支持此区块。", "不支援此區塊。"],
  "Select an editable structure.": [
    "请选择可编辑的结构。",
    "請選擇可編輯的結構。",
  ],
  "Unsupported table span.": ["不支持此单元格跨度。", "不支援此儲存格跨度。"],
  "Unsupported reference.": ["不支持此引用。", "不支援此參照。"],
  "Image dimensions must be positive integers.": [
    "图片尺寸必须是正整数。",
    "圖片尺寸必須是正整數。",
  ],
  "Choose a selection position.": [
    "请选择一个选区位置。",
    "請選擇一個選取位置。",
  ],
  "Unknown editor command.": ["无法识别此编辑命令。", "無法辨識此編輯命令。"],
  "Reversed source selection.": ["源码选区范围无效。", "原始碼選取範圍無效。"],
  "Stale editor transaction.": [
    "此编辑已过期，未应用更改。",
    "此編輯已過期，未套用變更。",
  ],
  "Conversion would change source.": [
    "此转换会更改现有源码。",
    "此轉換會變更現有原始碼。",
  ],
  "This edit could not be applied.": ["无法应用此编辑。", "無法套用此編輯。"],
  "This fragment contains a closing code tag. Nothing was rewritten automatically; resolve it explicitly in source mode.":
    [
      "此片段包含代码结束标记；未自动改写，请在源码中明确处理。",
      "此片段包含程式碼結束標記；未自動改寫，請在原始碼中明確處理。",
    ],
  "Finish the current input composition first.": [
    "请先完成当前输入法组合。",
    "請先完成目前的輸入法組字。",
  ],
  "Source is retained. Resolve the interpretation of the affected literal fragments first.":
    [
      "源码已保留；请先明确受影响字面片段的解释。",
      "原始碼已保留；請先明確指定受影響字面片段的解讀方式。",
    ],
  "Some markup is protected in visual mode. Edit its complete source to change it.":
    [
      "部分标记在可视模式下受到保护。请编辑完整源码以修改。",
      "部分標記在視覺模式下受到保護。請編輯完整原始碼以修改。",
    ],
  "Paste plain text or insert an image URL. Your selection is retained.": [
    "请粘贴纯文本或插入图片网址。已保留所选内容。",
    "請貼上純文字或插入圖片網址。已保留選取內容。",
  ],
  "Visual editor": ["可视编辑", "視覺編輯"],
  "Source editor": ["源码编辑", "原始碼編輯"],
  "Visual post content": ["可视帖子内容", "視覺文章內容"],
  Undo: ["撤销", "復原"],
  Redo: ["重做", "重做"],
  Formatting: ["格式", "格式"],
  "Format value": ["格式值", "格式值"],
  "Apply formatting": ["应用格式", "套用格式"],
  Bold: ["粗体", "粗體"],
  Italic: ["斜体", "斜體"],
  Underline: ["下划线", "底線"],
  Strike: ["删除线", "刪除線"],
  Font: ["字体", "字型"],
  Size: ["字号", "字級"],
  Color: ["颜色", "顏色"],
  Subscript: ["下标", "下標"],
  Superscript: ["上标", "上標"],
  Alignment: ["对齐", "對齊"],
  "Unordered list": ["无序列表", "無序清單"],
  "Ordered list": ["有序列表", "有序清單"],
  Indent: ["缩进", "縮排"],
  "Indent list": ["增加列表缩进", "增加清單縮排"],
  "Outdent list": ["减少列表缩进", "減少清單縮排"],
  "Link URL": ["链接网址", "連結網址"],
  Email: ["邮箱", "電子郵件"],
  "Image URL": ["图片网址", "圖片網址"],
  "Emoticon code": ["表情代码", "表情代碼"],
  "Named quote": ["署名引用", "具名引用"],
  Code: ["代码", "程式碼"],
  "Interpret complete source as BBCode": [
    "将完整源码解释为 BBCode",
    "將完整原始碼解讀為 BBCode",
  ],
  "Visual conversion could not preserve this content. The complete source remains editable.":
    [
      "无法完整保留可视转换，您仍可编辑完整源码。",
      "視覺轉換無法完整保留內容，您仍可編輯完整原始碼。",
    ],
  "Some visual input has no unambiguous BBCode representation. Complete source is retained. Review it before choosing how it should be interpreted.":
    [
      "部分可视输入无法明确表示为 BBCode。完整源码已保留，请检查后再选择解释方式。",
      "部分視覺輸入無法明確表示為 BBCode。完整原始碼已保留，請檢查後再選擇解讀方式。",
    ],
};
// The pinned editor core emits these authored messages in simplified Chinese.
// Canonicalize only known diagnostics here; source and unexpected errors stay intact.
const authoredMessages: Record<string, string> = {
  "无法应用此编辑。": "This edit could not be applied.",
  "此片段包含代码结束标记；未自动改写，请在源码中明确处理。":
    "This fragment contains a closing code tag. Nothing was rewritten automatically; resolve it explicitly in source mode.",
  "请先完成当前输入法组合。": "Finish the current input composition first.",
  "源码已保留；请先明确受影响字面片段的解释。":
    "Source is retained. Resolve the interpretation of the affected literal fragments first.",
};
export function editorText(
  value: string,
  language: Preferences["language"],
): string {
  const message = Object.hasOwn(authoredMessages, value)
    ? authoredMessages[value]!
    : value;
  return language === "en" || !Object.hasOwn(translations, message)
    ? message
    : translations[message]![language === "zh-CN" ? 0 : 1];
}
