import { description } from "../layouts/strings";
import type { Preferences } from "../workspace/preferences";
const labels: Record<string, readonly [string, string]> = {
  "The pending favorite attempt could not be saved for recovery. Nothing was sent.":
    [
      "无法保存待处理的收藏尝试以供恢复。未发送操作。",
      "無法儲存待處理的收藏嘗試以供恢復。未送出操作。",
    ],
  "Saved boards and threads": ["收藏的版块与主题", "收藏的版塊與主題"],
  Account: ["账号", "帳號"],
  "Favorite record": ["收藏记录", "收藏記錄"],
  "Saved kinds": ["收藏分类", "收藏分類"],
  "Saved pages": ["收藏分页", "收藏分頁"],
  "Load saved threads": ["载入收藏主题", "載入收藏主題"],
  "Load saved boards": ["载入收藏版块", "載入收藏版塊"],
  "No favorites on this page.": ["此页没有收藏。", "此頁沒有收藏。"],
  "Remove favorite": ["移除收藏", "移除收藏"],
  "Save thread": ["收藏主题", "收藏主題"],
  "Save board": ["收藏版块", "收藏版塊"],
  "Favorite action": ["收藏操作", "收藏操作"],
  "Confirm favorite action": ["确认收藏操作", "確認收藏操作"],
  "Review new favorite attempt": ["检查新的收藏尝试", "檢視新的收藏嘗試"],
  "Check favorite result": ["检查收藏结果", "檢查收藏結果"],
  Saved: ["收藏", "收藏"],
  Threads: ["主题", "主題"],
  Boards: ["版块", "版塊"],
  Page: ["页", "頁"],
  add: ["添加", "新增"],
  remove: ["移除", "移除"],
  thread: ["主题", "主題"],
  forum: ["版块", "版塊"],
  pending: ["处理中", "處理中"],
  confirmed: ["已确认", "已確認"],
  uncertain: ["结果不确定", "結果不確定"],
  "not-sent": ["未发送", "未送出"],
  "Confirmed favorite present.": ["已确认收藏存在。", "已確認收藏存在。"],
  "Confirmed favorite absent.": ["已确认收藏不存在。", "已確認收藏不存在。"],
  "Already saved.": ["已收藏。", "已收藏。"],
  "Already absent.": ["收藏已经不存在。", "收藏已經不存在。"],
  "Preparing current favorite action…": [
    "正在准备当前收藏操作…",
    "正在準備目前收藏操作…",
  ],
  "Favorite action pending…": ["正在处理收藏操作…", "正在處理收藏操作…"],
  "Checking favorite result…": ["正在检查收藏结果…", "正在檢查收藏結果…"],
  "A current member account is required.": [
    "需要当前会员账号。",
    "需要目前會員帳號。",
  ],
  "The response was lost. The favorite may have changed; check result before considering a new attempt.":
    [
      "响应丢失。收藏可能已更改；考虑再次尝试之前，请先检查结果。",
      "回應遺失。收藏可能已變更；考慮再次嘗試之前，請先檢查結果。",
    ],
  "The tab recovered a pending favorite action. Its outcome is uncertain; no action was replayed.":
    [
      "已恢复尚未完成的收藏操作。结果不确定；没有重放操作。",
      "已恢復尚未完成的收藏操作。結果不確定；沒有重放操作。",
    ],
  "Check the original uncertain favorite result before considering a warned new attempt.":
    [
      "考虑新的尝试之前，请先检查原先不确定的收藏结果。",
      "考慮新的嘗試之前，請先檢查原先不確定的收藏結果。",
    ],
  "The favorite list response is unsupported.": [
    "不支持此收藏列表响应。",
    "不支援此收藏清單回應。",
  ],
  "The favorite list could not be interpreted.": [
    "无法解析收藏列表。",
    "無法解析收藏清單。",
  ],
  "Native verification is required.": [
    "需要在原版论坛完成验证。",
    "需要在原版論壇完成驗證。",
  ],
  "Sign in through the native forum to read Saved.": [
    "请在原版论坛登录后读取收藏。",
    "請在原版論壇登入後讀取收藏。",
  ],
  "The current account cannot read these favorites.": [
    "当前账号无法读取这些收藏。",
    "目前帳號無法讀取這些收藏。",
  ],
  "The favorite list or current account could not be confirmed.": [
    "无法确认收藏列表或当前账号。",
    "無法確認收藏清單或目前帳號。",
  ],
  "The forum returned a different favorite kind or page.": [
    "论坛返回了不同的收藏分类或页面。",
    "論壇傳回了不同的收藏分類或頁面。",
  ],
  "The favorite list is incomplete; it has not been treated as empty.": [
    "收藏列表不完整；没有将其视为空列表。",
    "收藏清單不完整；沒有將其視為空清單。",
  ],
  "A favorite has ambiguous record or target identity.": [
    "某项收藏的记录或目标身份不明确。",
    "某項收藏的記錄或目標身分不明確。",
  ],
  "A favorite target does not match its record.": [
    "收藏目标与记录不符。",
    "收藏目標與記錄不符。",
  ],
  "The favorite list contains duplicate identities.": [
    "收藏列表含有重复身份。",
    "收藏清單含有重複身分。",
  ],
  "The favorite page identity is inconsistent.": [
    "收藏页面身份不一致。",
    "收藏頁面身分不一致。",
  ],
  "The returned favorite pages could not be preserved completely.": [
    "无法完整保留返回的收藏分页。",
    "無法完整保留傳回的收藏分頁。",
  ],
  "Complete result checking exceeded 100 returned pages. No absence is confirmed.":
    [
      "结果检查超过 100 个返回页面，未确认收藏不存在。",
      "結果檢查超過 100 個傳回頁面，未確認收藏不存在。",
    ],
  "The account changed during favorite readback.": [
    "读取收藏结果时账号发生变化。",
    "讀取收藏結果時帳號發生變化。",
  ],
  "The favorite account changed or could not be confirmed.": [
    "收藏账号发生变化或无法确认。",
    "收藏帳號發生變化或無法確認。",
  ],
  "The favorite list is unavailable.": [
    "收藏列表不可用。",
    "收藏清單無法使用。",
  ],
  "Favorite record identity no longer matches its target.": [
    "收藏记录身份不再与目标相符。",
    "收藏記錄身分不再與目標相符。",
  ],
  "The account changed before favorite preparation.": [
    "准备收藏前账号发生变化。",
    "準備收藏前帳號發生變化。",
  ],
  "The current favorite target/account could not be confirmed.": [
    "无法确认当前收藏目标或账号。",
    "無法確認目前收藏目標或帳號。",
  ],
  "A current native favorite control is not available.": [
    "当前原版收藏控件不可用。",
    "目前原版收藏控制項無法使用。",
  ],
  "The favorite control is not an active native control.": [
    "收藏控件不是有效的原版控件。",
    "收藏控制項不是有效的原版控制項。",
  ],
  "The native favorite destination is unavailable.": [
    "原版收藏目标不可用。",
    "原版收藏目標無法使用。",
  ],
  "The current native favorite action is unsupported.": [
    "不支持当前原版收藏操作。",
    "不支援目前原版收藏操作。",
  ],
  "The current favorite removal form is unavailable.": [
    "当前移除收藏表单不可用。",
    "目前移除收藏表單無法使用。",
  ],
  "Unsupported favorite removal form.": [
    "不支持此移除收藏表单。",
    "不支援此移除收藏表單。",
  ],
  "The removal form does not identify this favorite record.": [
    "移除表单未指定此收藏记录。",
    "移除表單未指定此收藏記錄。",
  ],
  "The removal form contains unsupported controls.": [
    "移除表单含有不支持的控件。",
    "移除表單含有不支援的控制項。",
  ],
  "The removal form is incomplete.": ["移除表单不完整。", "移除表單不完整。"],
  "The original favorite attempt is invalid.": [
    "原收藏尝试无效。",
    "原收藏嘗試無效。",
  ],
  "The desired favorite presence/absence is not established. No action was resent.":
    [
      "尚未确认所需的收藏状态。没有重新发送操作。",
      "尚未確認所需的收藏狀態。沒有重新送出操作。",
    ],
  "Check the original uncertain attempt and explicitly authorize a new attempt first.":
    [
      "请先检查原先不确定的尝试，并明确确认新尝试。",
      "請先檢查原先不確定的嘗試，並明確確認新嘗試。",
    ],
  "A current member and valid favorite target are required.": [
    "需要当前会员和有效的收藏目标。",
    "需要目前會員和有效的收藏目標。",
  ],
  "The favorite cannot currently be removed.": [
    "当前无法移除此收藏。",
    "目前無法移除此收藏。",
  ],
  "The account changed during preparation.": [
    "准备期间账号发生变化。",
    "準備期間帳號發生變化。",
  ],
  "This favorite preparation/account is stale or already active. Nothing was sent.":
    [
      "收藏准备或账号已过期，或已有进行中的操作。未发送操作。",
      "收藏準備或帳號已過期，或已有進行中的操作。未送出操作。",
    ],
  "The account changed before send. Nothing was sent.": [
    "发送前账号发生变化。未发送操作。",
    "送出前帳號發生變化。未送出操作。",
  ],
  "The account changed while the favorite action was in flight. Possible effects remain uncertain.":
    [
      "收藏请求处理中账号发生变化。可能的效果仍不确定。",
      "收藏請求處理中帳號發生變化。可能的效果仍不確定。",
    ],
};
const prefixes: Record<string, readonly [string, string]> = {
  "Favorite result is uncertain. ": ["收藏结果不确定。", "收藏結果不確定。"],
  "Favorite preflight failed before send. ": [
    "发送前的收藏检查失败。",
    "送出前的收藏檢查失敗。",
  ],
  "Previous confirmation retained. This recheck is inconclusive. ": [
    "保留先前确认。本次检查无结论。",
    "保留先前確認。本次檢查無結論。",
  ],
  "A new attempt may repeat favorite effects. The original outcome stays uncertain. ":
    [
      "新尝试可能重复收藏效果。原结果仍不确定。",
      "新嘗試可能重複收藏效果。原結果仍不確定。",
    ],
};
export function favoriteText(
  value: string,
  language: Preferences["language"],
): string {
  if (language === "en") return value;
  const index = language === "zh-CN" ? 0 : 1;
  if (labels[value]) return labels[value][index];
  for (const [prefix, translations] of Object.entries(prefixes))
    if (value.startsWith(prefix))
      return (
        translations[index] + favoriteText(value.slice(prefix.length), language)
      );
  const review =
    /^Review (add|remove) (board|thread) (\d+), account (\d+)(?:, favorite record (\d+))?\. This changes your favorite record\.$/.exec(
      value,
    );
  if (review)
    return language === "zh-CN"
      ? `确认${review[1] === "add" ? "添加" : "移除"}${review[2] === "board" ? "版块" : "主题"} ${review[3]} 的收藏，账号 ${review[4]}${review[5] ? `，收藏记录 ${review[5]}` : ""}。此操作更改收藏记录。`
      : `確認${review[1] === "add" ? "新增" : "移除"}${review[2] === "board" ? "版塊" : "主題"} ${review[3]} 的收藏，帳號 ${review[4]}${review[5] ? `，收藏記錄 ${review[5]}` : ""}。此操作變更收藏記錄。`;
  const unavailable = /^Unavailable (board|thread) (\d+)$/.exec(value);
  if (unavailable)
    return `${language === "zh-CN" ? "不可用的" : "無法使用的"}${unavailable[1] === "board" ? (language === "zh-CN" ? "版块" : "版塊") : language === "zh-CN" ? "主题" : "主題"} ${unavailable[2]}`;
  return description(value, language);
}
