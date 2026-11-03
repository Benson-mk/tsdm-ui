import type { Preferences } from "../workspace/preferences";
const translations: Record<string, readonly [string, string]> = {
  "Prepared publication review": ["发布前审阅", "發佈前審閱"],
  "Prepared revision": ["已准备修订", "已準備修訂"],
  "Body preview": ["正文预览", "正文預覽"],
  "Complete prepared source": ["完整已准备源码", "完整已準備原始碼"],
  "Effective settings": ["生效设置", "生效設定"],
  "Known uploaded references": ["已知上传引用", "已知上傳參照"],
  "Source attachment references": ["源码中的附件引用", "原始碼中的附件參照"],
  "Attachment fields": ["附件设置", "附件設定"],
  Yes: ["是", "是"],
  No: ["否", "否"],
  "disabled; not submitted": ["已禁用；不提交", "已停用；不提交"],
  "This read-only preview does not guarantee native rendering, notification delivery or publication. Links, images and attachment references are inert. Protected or unsupported markup is retained literally; inspect the complete source.":
    [
      "此只读预览不保证论坛原生显示、通知送达或发布成功。链接、图片和附件引用均不会触发操作。受保护或不支持的标记按原文保留；请查看完整源码。",
      "此唯讀預覽不保證論壇原生顯示、通知送達或發佈成功。連結、圖片和附件參照均不會觸發操作。受保護或不支援的標記按原文保留；請查看完整原始碼。",
    ],
  "BBCode is disabled in this prepared revision; the preview shows literal source.":
    [
      "此已准备修订禁用 BBCode；预览显示原文源码。",
      "此已準備修訂停用 BBCode；預覽顯示原文原始碼。",
    ],
  "Cancel review and return to writing": [
    "取消审阅并返回写作",
    "取消審閱並返回寫作",
  ],
};
export function reviewText(
  value: string,
  language: Preferences["language"],
): string {
  return language === "en"
    ? value
    : (translations[value]?.[language === "zh-CN" ? 0 : 1] ?? value);
}
