import type { Preferences } from "../workspace/preferences";
const english = {
  attachments: "Attachments",
  download: "Download",
  saveFile: "Save file",
  fileDownload: "File download",
  settings: "Settings",
  settingsDescription: "Changes preview and save immediately.",
  textSize: "Text size",
  compact: "Compact",
  default: "Default",
  spacing: "spacing",
  reset: "Reset to 100%",
  close: "Close",
  theme: "Color theme",
  language: "Interface language",
  storageUnavailable:
    "Preferences are available for this page only. Storage is unavailable; changes may not survive reload.",
  about: "About this workspace",
  aboutDescription:
    "TSDM Workspace 0.2.0. Reading uses your current forum account.",
  nativeHelp:
    "For unsupported content or verification, continue at the same destination in the native forum.",
  snapshotMember: "Snapshot from {value}",
  snapshotGuest: "Snapshot from guest browsing",
  signedIn: "Signed in as {value}",
  guest: "Browsing as a guest",
  accountUnknown: "Account not yet confirmed",
  actions: "Thread actions",
  allBoards: "All boards",
  back: "Back",
  refresh: "Refresh",
  refreshThread: "Refresh thread",
  native: "Continue in native forum",
  boardNavigation: "Board navigation",
  chooseBoard: "Choose a board",
  recoveryUnavailable:
    "Refresh recovery unavailable. This tab keeps navigation while the page remains open.",
  snapshotUnavailable: "This navigation snapshot is unavailable.",
  snapshotReload:
    "Reload explicitly to request the destination again. If its saved context is unavailable, Reload opens Boards.",
  reload: "Reload",
  returnUnavailable:
    "Return recovery could not be saved. Continue only if you accept losing this return snapshot.",
  continueWithoutRecovery: "Continue without return recovery",
  restored: "Restored snapshot — account and content have not been rechecked.",
  stale: "Previous results are stale.",
  loading: "Loading…",
  mainDestinations: "Main destinations",
  sectionNavigation: "Section navigation",
  boards: "Boards",
  search: "Search",
  saved: "Saved",
  notices: "Notices",
  drafts: "Drafts",
  browseBoards: "Browse boards",
  boardsNavigation: "Boards navigation",
  boardsOverview: "Boards overview",
  chooseBoardDescription: "Choose a board to read its threads.",
  directoryPages: "Directory pages",
  threadResults: "Thread results",
  subordinateBoards: "Subordinate boards",
  boardFilters: "Board filters",
  criteria: "Effective criteria",
  page: "Page",
  pinned: "Pinned",
  moved: "Moved",
  replies: "replies",
  views: "views",
  lastReply: "Last reply to {value}",
  boardPages: "Board pages",
  threadReading: "Thread reading",
  thread: "THREAD",
  threadFilters: "Thread filters",
  missingPost: "Requested post {value} is missing from this page.",
  post: "Post",
  floor: "Floor",
  unknown: "unknown",
  pages: "Pages",
  contentUnavailable: "Content unavailable",
  chooseThread: "Choose a thread",
  chooseThreadDescription:
    "Read complete posts, follow exact replies, and return to this result page.",
  searchHeading: "Search threads or authors",
  savedHeading: "Saved boards and threads",
  noticesHeading: "Load notices deliberately",
  draftsHeading: "Forum drafts",
  searchOverview: "Search threads or authors in the native forum.",
  savedOverview: "View your saved boards and threads in the native forum.",
  noticesOverview:
    "Load notices in the native forum. Opening this overview leaves notices unread.",
  draftsOverview: "View and resume your forum drafts in the native forum.",
  savedBoards: "Boards",
  savedThreads: "Threads",
  searchScope: "Thread and author criteria",
  noticesScope: "Reply, mention, system and activity notices",
  draftsScope: "Saved forum drafts",
};
type Strings = { [Key in keyof typeof english]: string };
const simplified: Strings = {
  attachments: "附件",
  download: "下载",
  saveFile: "保存文件",
  fileDownload: "文件下载",
  settings: "设置",
  settingsDescription: "更改会立即预览并保存。",
  textSize: "文字大小",
  compact: "紧凑",
  default: "默认",
  spacing: "间距",
  reset: "重设为 100%",
  close: "关闭",
  theme: "颜色主题",
  language: "界面语言",
  storageUnavailable:
    "偏好设置仅在当前页面有效。存储不可用；重新加载后可能无法保留更改。",
  about: "关于此工作区",
  aboutDescription: "TSDM 工作区 0.2.0。阅读使用当前论坛账号。",
  nativeHelp:
    "如需查看不支持的内容或完成验证，请在原版论坛中继续访问同一目标。",
  snapshotMember: "来自 {value} 的快照",
  snapshotGuest: "游客浏览快照",
  signedIn: "当前登录：{value}",
  guest: "正在以游客身份浏览",
  accountUnknown: "尚未确认账号",
  actions: "主题操作",
  allBoards: "全部版块",
  back: "返回",
  refresh: "刷新",
  refreshThread: "刷新主题",
  native: "在原版论坛中继续",
  boardNavigation: "版块导航",
  chooseBoard: "选择版块",
  recoveryUnavailable: "刷新恢复不可用。页面保持打开时，此标签页仍会保留导航。",
  snapshotUnavailable: "此导航快照不可用。",
  snapshotReload:
    "请主动重新加载以再次请求目标。若保存的上下文不可用，将打开版块总览。",
  reload: "重新加载",
  returnUnavailable: "无法保存返回快照。仅在接受丢失此返回快照时继续。",
  continueWithoutRecovery: "不保留返回快照并继续",
  restored: "已恢复快照 — 尚未重新检查账号与内容。",
  stale: "先前的结果已过时。",
  loading: "正在加载…",
  mainDestinations: "主要导航",
  sectionNavigation: "栏目导航",
  boards: "版块",
  search: "搜索",
  saved: "收藏",
  notices: "通知",
  drafts: "草稿",
  browseBoards: "浏览版块",
  boardsNavigation: "版块导航列表",
  boardsOverview: "版块总览",
  chooseBoardDescription: "选择版块以阅读主题。",
  directoryPages: "版块总览分页",
  threadResults: "主题列表",
  subordinateBoards: "子版块",
  boardFilters: "版块筛选",
  criteria: "当前有效条件",
  page: "第",
  pinned: "置顶",
  moved: "已移动",
  replies: "回复",
  views: "浏览",
  lastReply: "{value} 的最新回复",
  boardPages: "版块分页",
  threadReading: "主题阅读",
  thread: "主题",
  threadFilters: "主题筛选",
  missingPost: "请求的帖子 {value} 不在此页中。",
  post: "帖子",
  floor: "楼层",
  unknown: "未知",
  pages: "分页",
  contentUnavailable: "内容不可用",
  chooseThread: "选择主题",
  chooseThreadDescription: "阅读完整帖子、跳转到指定回复，并返回此结果页。",
  searchHeading: "搜索主题或作者",
  savedHeading: "收藏的版块与主题",
  noticesHeading: "主动加载通知",
  draftsHeading: "论坛草稿",
  searchOverview: "在原版论坛中搜索主题或作者。",
  savedOverview: "在原版论坛中查看收藏的版块与主题。",
  noticesOverview: "在原版论坛中加载通知。打开此总览不会将通知标为已读。",
  draftsOverview: "在原版论坛中查看及继续编辑论坛草稿。",
  savedBoards: "版块",
  savedThreads: "主题",
  searchScope: "主题与作者条件",
  noticesScope: "回复、提及、系统与动态通知",
  draftsScope: "已保存的论坛草稿",
};
const traditional: Strings = {
  attachments: "附件",
  download: "下載",
  saveFile: "儲存檔案",
  fileDownload: "檔案下載",
  settings: "設定",
  settingsDescription: "變更會立即預覽並儲存。",
  textSize: "文字大小",
  compact: "緊湊",
  default: "預設",
  spacing: "間距",
  reset: "重設為 100%",
  close: "關閉",
  theme: "色彩主題",
  language: "介面語言",
  storageUnavailable:
    "偏好設定僅在目前頁面有效。儲存空間無法使用；重新載入後可能無法保留變更。",
  about: "關於此工作區",
  aboutDescription: "TSDM 工作區 0.2.0。閱讀使用目前論壇帳號。",
  nativeHelp:
    "如需查看不支援的內容或完成驗證，請在原版論壇中繼續存取同一目標。",
  snapshotMember: "來自 {value} 的快照",
  snapshotGuest: "訪客瀏覽快照",
  signedIn: "目前登入：{value}",
  guest: "正在以訪客身分瀏覽",
  accountUnknown: "尚未確認帳號",
  actions: "主題操作",
  allBoards: "全部版塊",
  back: "返回",
  refresh: "重新整理",
  refreshThread: "重新整理主題",
  native: "在原版論壇中繼續",
  boardNavigation: "版塊導覽",
  chooseBoard: "選擇版塊",
  recoveryUnavailable:
    "重新載入復原無法使用。頁面保持開啟時，此分頁仍會保留導覽。",
  snapshotUnavailable: "此導覽快照無法使用。",
  snapshotReload:
    "請主動重新載入以再次請求目標。若儲存的情境無法使用，將開啟版塊總覽。",
  reload: "重新載入",
  returnUnavailable: "無法儲存返回快照。僅在接受遺失此返回快照時繼續。",
  continueWithoutRecovery: "不保留返回快照並繼續",
  restored: "已復原快照 — 尚未重新檢查帳號與內容。",
  stale: "先前的結果已過時。",
  loading: "正在載入…",
  mainDestinations: "主要導覽",
  sectionNavigation: "欄目導覽",
  boards: "版塊",
  search: "搜尋",
  saved: "收藏",
  notices: "通知",
  drafts: "草稿",
  browseBoards: "瀏覽版塊",
  boardsNavigation: "版塊導覽清單",
  boardsOverview: "版塊總覽",
  chooseBoardDescription: "選擇版塊以閱讀主題。",
  directoryPages: "版塊總覽分頁",
  threadResults: "主題清單",
  subordinateBoards: "子版塊",
  boardFilters: "版塊篩選",
  criteria: "目前有效條件",
  page: "第",
  pinned: "置頂",
  moved: "已移動",
  replies: "回覆",
  views: "瀏覽",
  lastReply: "{value} 的最新回覆",
  boardPages: "版塊分頁",
  threadReading: "主題閱讀",
  thread: "主題",
  threadFilters: "主題篩選",
  missingPost: "請求的帖子 {value} 不在此頁中。",
  post: "帖子",
  floor: "樓層",
  unknown: "未知",
  pages: "分頁",
  contentUnavailable: "內容無法使用",
  chooseThread: "選擇主題",
  chooseThreadDescription: "閱讀完整帖子、跳轉至指定回覆，並返回此結果頁。",
  searchHeading: "搜尋主題或作者",
  savedHeading: "收藏的版塊與主題",
  noticesHeading: "主動載入通知",
  draftsHeading: "論壇草稿",
  searchOverview: "在原版論壇中搜尋主題或作者。",
  savedOverview: "在原版論壇中查看收藏的版塊與主題。",
  noticesOverview: "在原版論壇中載入通知。開啟此總覽不會將通知標為已讀。",
  draftsOverview: "在原版論壇中查看及繼續編輯論壇草稿。",
  savedBoards: "版塊",
  savedThreads: "主題",
  searchScope: "主題與作者條件",
  noticesScope: "回覆、提及、系統與動態通知",
  draftsScope: "已儲存的論壇草稿",
};
export function strings(language: Preferences["language"]): Strings {
  return language === "zh-CN"
    ? simplified
    : language === "zh-TW"
      ? traditional
      : english;
}

export const insert = (pattern: string, value: string | number) =>
  pattern.replace("{value}", String(value));

const descriptions: Record<string, readonly [string, string]> = {
  "This download attempt was replaced or cancelled.": [
    "本次下载已被替代或取消。",
    "本次下載已被取代或取消。",
  ],
  "File downloads are unavailable in this host.": [
    "当前运行环境不支持文件下载。",
    "目前執行環境不支援檔案下載。",
  ],
  "Current attachment access could not be confirmed. Refresh the thread or continue in the native forum.":
    [
      "无法确认当前附件权限。请刷新主题或在原版论坛中继续。",
      "無法確認目前附件權限。請重新整理主題或在原版論壇中繼續。",
    ],
  "The forum account changed or could not be confirmed. Refresh the thread before downloading.":
    [
      "论坛账号已改变或无法确认。请刷新主题后再下载。",
      "論壇帳號已變更或無法確認。請重新整理主題後再下載。",
    ],
  "The forum no longer offers this attachment for direct download. No purchase was attempted.":
    [
      "论坛已不再提供此附件的直接下载。未尝试购买。",
      "論壇已不再提供此附件的直接下載。未嘗試購買。",
    ],
  "The forum account changed while receiving the file. Refresh the thread before downloading.":
    [
      "接收文件时论坛账号发生了改变。请刷新主题后再下载。",
      "接收檔案時論壇帳號發生了變更。請重新整理主題後再下載。",
    ],
  "The forum returned a different file destination. Nothing is ready to save.":
    [
      "论坛返回了不同的文件目标。没有可保存的文件。",
      "論壇傳回了不同的檔案目標。沒有可儲存的檔案。",
    ],
  "The file transfer failed or was interrupted. Nothing is ready to save.": [
    "文件传输失败或已中断。没有可保存的文件。",
    "檔案傳輸失敗或已中斷。沒有可儲存的檔案。",
  ],
  "The forum returned a login page instead of a file. Sign in through the native forum, then try again.":
    [
      "论坛返回了登录页面，未返回文件。请在原版论坛登录后重试。",
      "論壇傳回了登入頁面，未傳回檔案。請在原版論壇登入後重試。",
    ],
  "The forum returned a verification challenge instead of a file. Complete it in the native forum.":
    [
      "论坛返回了验证页面，未返回文件。请在原版论坛完成验证。",
      "論壇傳回了驗證頁面，未傳回檔案。請在原版論壇完成驗證。",
    ],
  "The forum requires payment before download. No purchase was attempted and no file is ready to save.":
    [
      "论坛要求付费后才能下载。未尝试购买，也没有可保存的文件。",
      "論壇要求付費後才能下載。未嘗試購買，也沒有可儲存的檔案。",
    ],
  "The forum refused download permission. No file is ready to save.": [
    "论坛拒绝了下载权限。没有可保存的文件。",
    "論壇拒絕了下載權限。沒有可儲存的檔案。",
  ],
  "The attachment file is missing. No file is ready to save.": [
    "附件文件不存在。没有可保存的文件。",
    "附件檔案不存在。沒有可儲存的檔案。",
  ],
  "The forum returned an HTML page instead of a confirmed file. Nothing is ready to save.":
    [
      "论坛返回了 HTML 页面，无法确认是文件。没有可保存的文件。",
      "論壇傳回了 HTML 頁面，無法確認是檔案。沒有可儲存的檔案。",
    ],
  "The forum returned a response document instead of a confirmed file. Nothing is ready to save.":
    [
      "论坛返回了响应文档，无法确认是文件。没有可保存的文件。",
      "論壇傳回了回應文件，無法確認是檔案。沒有可儲存的檔案。",
    ],
  "The forum did not return a complete file. Nothing is ready to save.": [
    "论坛未返回完整文件。没有可保存的文件。",
    "論壇未傳回完整檔案。沒有可儲存的檔案。",
  ],
  "The file response was empty or incomplete. Nothing is ready to save.": [
    "文件响应为空或不完整。没有可保存的文件。",
    "檔案回應為空或不完整。沒有可儲存的檔案。",
  ],
  "Browser file preparation failed. No save was requested.": [
    "浏览器准备文件失败。尚未请求保存。",
    "瀏覽器準備檔案失敗。尚未要求儲存。",
  ],
  "Browser save could not start. File delivery is unconfirmed.": [
    "无法启动浏览器保存。文件是否送达尚未确认。",
    "無法啟動瀏覽器儲存。檔案是否送達尚未確認。",
  ],
  "Checking current attachment access and receiving file…": [
    "正在检查当前附件权限并接收文件…",
    "正在檢查目前附件權限並接收檔案…",
  ],
  "File ready to save": ["文件已准备好，可以保存", "檔案已準備好，可以儲存"],
  "Browser save requested. Check your browser Downloads for completion; this workspace cannot confirm whether the file was saved or cancelled.":
    [
      "已请求浏览器保存。请在浏览器的下载记录中检查是否完成；本工作区无法确认文件是否已保存或已取消。",
      "已要求瀏覽器儲存。請在瀏覽器的下載紀錄中檢查是否完成；本工作區無法確認檔案是否已儲存或已取消。",
    ],
  "Scrollable code": ["可滚动的代码", "可捲動的程式碼"],
  "Scrollable table": ["可滚动的表格", "可捲動的表格"],
  Login: ["需要登录", "需要登入"],
  Permission: ["权限不足", "權限不足"],
  Missing: ["目标不存在", "目標不存在"],
  Challenge: ["需要验证", "需要驗證"],
  Limited: ["请求受限", "請求受限"],
  Network: ["网络故障", "網路故障"],
  Stale: ["结果已被替代", "結果已被取代"],
  "The current account does not have permission to read this thread.": [
    "当前账号没有阅读此主题的权限。",
    "目前帳號沒有閱讀此主題的權限。",
  ],
  "The current account does not have permission to read this board.": [
    "当前账号没有阅读此版块的权限。",
    "目前帳號沒有閱讀此版塊的權限。",
  ],
  "Sign in through the native forum, then retry this thread.": [
    "请在原版论坛登录，然后重试此主题。",
    "請在原版論壇登入，然後重試此主題。",
  ],
  "Sign in through the native forum, then retry.": [
    "请在原版论坛登录，然后重试。",
    "請在原版論壇登入，然後重試。",
  ],
  "Native verification is required. Your intended thread is preserved.": [
    "需要在原版论坛完成验证。已保留目标主题。",
    "需要在原版論壇完成驗證。已保留目標主題。",
  ],
  "Native verification is required. Your destination is preserved.": [
    "需要在原版论坛完成验证。已保留目标。",
    "需要在原版論壇完成驗證。已保留目標。",
  ],
  "This thread is missing or has been deleted.": [
    "此主题不存在或已被删除。",
    "此主題不存在或已被刪除。",
  ],
  "This board is missing or has been deleted.": [
    "此版块不存在或已被删除。",
    "此版塊不存在或已被刪除。",
  ],
  "The forum could not be reached. Retry or continue in the native forum.": [
    "无法连接论坛。请重试或在原版论坛中继续。",
    "無法連線論壇。請重試或在原版論壇中繼續。",
  ],
  "The forum is limiting requests. Retry explicitly later.": [
    "论坛正在限制请求。请稍后主动重试。",
    "論壇正在限制請求。請稍後主動重試。",
  ],
  "This is not a supported thread destination.": [
    "不支持此主题目标。",
    "不支援此主題目標。",
  ],
  "A newer request has replaced this result.": [
    "此结果已被较新的请求替代。",
    "此結果已被較新的請求取代。",
  ],
  "The forum redirect requires a document navigation.": [
    "论坛跳转需要重新加载页面。",
    "論壇跳轉需要重新載入頁面。",
  ],
  "The forum returned an unsupported response envelope.": [
    "论坛返回了不支持的响应格式。",
    "論壇傳回了不支援的回應格式。",
  ],
  "The forum returned an invalid response.": [
    "论坛返回了无效响应。",
    "論壇傳回了無效回應。",
  ],
  "The forum response could not be displayed reliably.": [
    "无法可靠地显示论坛响应。",
    "無法可靠地顯示論壇回應。",
  ],
  "The forum returned a different destination. Continue in the native forum.": [
    "论坛返回了不同目标。请在原版论坛中继续。",
    "論壇傳回了不同目標。請在原版論壇中繼續。",
  ],
  "The returned thread identity did not match.": [
    "返回的主题标识不匹配。",
    "傳回的主題識別不符。",
  ],
  "Unrecognized thread content. Continue in the native forum.": [
    "无法识别主题内容。请在原版论坛中继续。",
    "無法辨識主題內容。請在原版論壇中繼續。",
  ],
  "This thread has unrecognized or incomplete content.": [
    "此主题的内容无法识别或不完整。",
    "此主題的內容無法辨識或不完整。",
  ],
  "The returned post identities are ambiguous.": [
    "返回的帖子标识存在歧义。",
    "傳回的帖子識別存在歧義。",
  ],
  "The last reply requires canonical forum resolution.": [
    "最新回复需要由论坛解析实际目标。",
    "最新回覆需要由論壇解析實際目標。",
  ],
  "The exact destination could not be resolved after navigation. Continue in the native forum.":
    [
      "跳转后无法解析确切目标。请在原版论坛中继续。",
      "跳轉後無法解析確切目標。請在原版論壇中繼續。",
    ],
  "The forum redirect returned a different thread. The requested destination is preserved for native recovery.":
    [
      "论坛跳转返回了不同主题。已保留原目标以便在原版论坛恢复。",
      "論壇跳轉傳回了不同主題。已保留原目標以便在原版論壇復原。",
    ],
  "Unsupported interactive content": ["不支持的交互内容", "不支援的互動內容"],
  "Image or attachment requires native viewing": [
    "图片或附件需要在原版论坛中查看",
    "圖片或附件需要在原版論壇中查看",
  ],
  "Native red-packet interaction requires the native forum.": [
    "红包交互需要在原版论坛中完成。",
    "紅包互動需要在原版論壇中完成。",
  ],
  "Additional native content is hidden; view it in the native forum.": [
    "其他原版内容处于隐藏状态；请在原版论坛中查看。",
    "其他原版內容處於隱藏狀態；請在原版論壇中查看。",
  ],
};

/** Translate only application-authored explanations; returned forum content is untouched. */
export function description(
  value: string,
  language: Preferences["language"],
): string {
  if (language === "en") return value;
  const localized = descriptions[value];
  if (localized) return localized[language === "zh-CN" ? 0 : 1];
  const formatting = /^Unsupported formatting \((.+)\)$/.exec(value);
  if (formatting)
    return `${language === "zh-CN" ? "不支持的格式" : "不支援的格式"} (${formatting[1]})`;
  return value;
}
