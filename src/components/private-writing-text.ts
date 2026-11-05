import type { Preferences } from "../workspace/preferences";
import { description } from "../layouts/strings";
const translations: Record<string, [string, string]> = {
  "Packet state and credit attribution remain separate. Ledger rows do not prove a specific debit or refund.":
    [
      "红包状态与积分归属分别处理。账目行不能证明某次具体扣款或退款。",
      "紅包狀態與積分歸屬分別處理。帳目列不能證明某次具體扣款或退款。",
    ],
  "Original public publication attempt": [
    "原始公开发布尝试",
    "原始公開發佈嘗試",
  ],
  "Original forum draft attempt": ["原始论坛草稿尝试", "原始論壇草稿嘗試"],
  "Inspect original public writing": ["查看原始公开写作", "查看原始公開寫作"],
  "Check original public result": ["检查原始公开结果", "檢查原始公開結果"],
  "Open original public destination in native forum": [
    "在原生论坛打开原始公开目标",
    "在原生論壇開啟原始公開目標",
  ],
  "Private formatting syntax has not been qualified. Keep the exact text and continue in the native forum.":
    [
      "私信格式语法尚未验证。请保留完整正文并在原生论坛继续。",
      "私訊格式語法尚未驗證。請保留完整正文並在原生論壇繼續。",
    ],
  "Write private message": ["撰写私信", "撰寫私訊"],
  "Private message": ["私信", "私訊"],
  "Private message text": ["私信正文", "私訊正文"],
  "To {value}": ["收件人：{value}", "收件者：{value}"],
  "Prepared private message review": ["已准备的私信审核", "已準備的私訊審核"],
  "Review private message": ["审核私信", "審核私訊"],
  "Send this private message": ["发送此私信", "傳送此私訊"],
  "Return to private writing": ["返回私信编辑", "返回私訊編輯"],
  "Plain text and line breaks. Formatting, attachments and group messages are not supported here.":
    [
      "支持纯文本和换行。此处不支持格式工具、附件或群发。",
      "支援純文字和換行。此處不支援格式工具、附件或群發。",
    ],
  "Current maximum: {value} characters.": [
    "当前最多 {value} 个字符。",
    "目前最多 {value} 個字元。",
  ],
  "Current writing is retained for this browser page session.": [
    "当前写作已保留在此浏览器页面会话中。",
    "目前寫作已保留在此瀏覽器頁面工作階段中。",
  ],
  "Recovery is not yet acknowledged. Keep this page open.": [
    "恢复记录尚未确认。请保持此页面开启。",
    "復原記錄尚未確認。請保持此頁面開啟。",
  ],
  "Sending paused until the current account and recipient are checked.": [
    "发送已暂停，须先核对当前账号和收件人。",
    "傳送已暫停，須先核對目前帳號和收件者。",
  ],
  "Reviewing has not sent this message. Sending will store this exact text for this recipient. Delivery and read status remain unknown.":
    [
      "审核尚未发送私信。发送会将此正文存储给此收件人。送达和已读状态仍未知。",
      "審核尚未傳送私訊。傳送會將此正文儲存給此收件者。送達和已讀狀態仍未知。",
    ],
  "This review has been used. Check its original outcome below; this approval cannot send again.":
    [
      "此审核已使用。请查看下方的原始结果；此批准不能再次发送。",
      "此審核已使用。請查看下方的原始結果；此批准不能再次傳送。",
    ],
  "Private message attempt to {value}": [
    "发给 {value} 的私信尝试",
    "傳給 {value} 的私訊嘗試",
  ],
  "Original submitted text · revision {value}": [
    "原始提交正文 · 修订 {value}",
    "原始提交正文 · 修訂 {value}",
  ],
  "Check private message result": ["检查私信结果", "檢查私訊結果"],
  "Open original private conversation in native forum": [
    "在原生论坛打开原始私人交谈",
    "在原生論壇開啟原始私人交談",
  ],
  "Checking reads the original conversation and may mark it read. No message will be resent.":
    [
      "检查会读取原始交谈，并可能将其标为已读。不会重发任何私信。",
      "檢查會讀取原始交談，並可能將其標為已讀。不會重傳任何私訊。",
    ],
  "Stored private message independently verified. Delivery and read status are unknown.":
    [
      "已独立核实存储的私信。送达和已读状态未知。",
      "已獨立核實儲存的私訊。送達和已讀狀態未知。",
    ],
  "Private message pending. Refresh retains uncertainty without replay.": [
    "私信正在处理。刷新后会保留为结果未确定，不会重发。",
    "私訊正在處理。重新載入後會保留為結果未確定，不會重傳。",
  ],
  "Pending private message restored as uncertain. Nothing was replayed; check the original attempt.":
    [
      "待处理私信已恢复为结果未确定。未重发任何操作；请检查原始尝试。",
      "待處理私訊已復原為結果未確定。未重傳任何操作；請檢查原始嘗試。",
    ],
  "The stored sender, recipient and exact text could not be uniquely confirmed. Check the original attempt deliberately; do not resend automatically.":
    [
      "无法唯一确认存储的发件人、收件人和完整正文。请主动检查原始尝试，不要自动重发。",
      "無法唯一確認儲存的寄件者、收件者和完整正文。請主動檢查原始嘗試，不要自動重傳。",
    ],
  "Independent result checking could not confirm the private message. Your original attempt and current text are retained; nothing was resent.":
    [
      "独立结果检查未能确认私信。原始尝试和当前正文均已保留；未重发任何私信。",
      "獨立結果檢查未能確認私訊。原始嘗試和目前正文均已保留；未重傳任何私訊。",
    ],
  "Private message was not sent because recovery or writing changed. Your text is retained.":
    [
      "恢复记录或写作发生变化，私信未发送。正文已保留。",
      "復原記錄或寫作發生變化，私訊未傳送。正文已保留。",
    ],
  "Private message was not sent because recovery or the account changed. Your text is retained.":
    [
      "恢复记录或账号发生变化，私信未发送。正文已保留。",
      "復原記錄或帳號發生變化，私訊未傳送。正文已保留。",
    ],
  "Private message was not sent because the current form could not be verified. Keep your text and continue in the native forum.":
    [
      "无法核实当前表单，私信未发送。请保留正文并在原生论坛继续。",
      "無法核實目前表單，私訊未傳送。請保留正文並在原生論壇繼續。",
    ],
  "Private message was not sent because the current sender, recipient, restrictions or complete history changed. Review again.":
    [
      "当前发件人、收件人、限制或完整历史发生变化，私信未发送。请重新审核。",
      "目前寄件者、收件者、限制或完整歷史發生變化，私訊未傳送。請重新審核。",
    ],
  "Private message was not sent: review approval is missing, used or stale.": [
    "私信未发送：审核批准缺失、已使用或已过期。",
    "私訊未傳送：審核批准缺失、已使用或已過期。",
  ],
  "This text was already confirmed or an earlier private attempt is unresolved. Check that original attempt or continue in the native forum; no resend was prepared.":
    [
      "此正文已确认，或先前私信结果尚未确定。请检查原始尝试或在原生论坛继续；未准备重发。",
      "此正文已確認，或先前私訊結果尚未確定。請檢查原始嘗試或在原生論壇繼續；未準備重傳。",
    ],
  "Enter private message text before review.": [
    "审核前请输入私信正文。",
    "審核前請輸入私訊正文。",
  ],
  "The private message exceeds the current text limit.": [
    "私信超出当前正文长度限制。",
    "私訊超出目前正文長度限制。",
  ],
  "Writing changed during review. Review the current text again.": [
    "审核时正文发生变化。请重新审核当前正文。",
    "審核時正文發生變化。請重新審核目前正文。",
  ],
  "The current private-message form is not supported. Keep your text and continue in the native forum.":
    [
      "不支持当前私信表单。请保留正文并在原生论坛继续。",
      "不支援目前私訊表單。請保留正文並在原生論壇繼續。",
    ],
  "The complete current private history is required for reliable result checking. Continue in the native forum.":
    [
      "可靠检查结果需要完整的当前私人历史。请在原生论坛继续。",
      "可靠檢查結果需要完整的目前私人歷史。請在原生論壇繼續。",
    ],
  "The current sender or private recipient could not be confirmed. Your text is retained.":
    [
      "无法确认当前发件人或私人收件人。正文已保留。",
      "無法確認目前寄件者或私人收件者。正文已保留。",
    ],
  "The current history is incomplete. The outcome remains uncertain; nothing was resent.":
    [
      "当前历史不完整。结果仍未确定；未重发任何私信。",
      "目前歷史不完整。結果仍未確定；未重傳任何私訊。",
    ],
  "The original pre-send history is unavailable. Continue in the native forum; nothing was resent.":
    [
      "发送前的原始历史不可用。请在原生论坛继续；未重发任何私信。",
      "傳送前的原始歷史不可用。請在原生論壇繼續；未重傳任何私訊。",
    ],
  "Replace current writing with a private message? Its unsent text will be discarded; original attempts remain available.":
    [
      "将当前写作替换为私信？未发送的正文会被丢弃；原始尝试仍会保留。",
      "將目前寫作取代為私訊？未傳送的正文會被捨棄；原始嘗試仍會保留。",
    ],
  "Discard and write private message": ["丢弃并撰写私信", "捨棄並撰寫私訊"],
};
export function privateWritingText(
  value: string,
  language: Preferences["language"],
): string {
  return language === "en"
    ? value
    : (translations[value]?.[language === "zh-CN" ? 0 : 1] ??
        description(value, language));
}
