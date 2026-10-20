import type { Preferences } from "../workspace/preferences";
const english = {
  searchOverviewLabel: "Search overview",
  searchExplanation:
    "Search threads or authors. Editing criteria does not run a search.",
  searchEffects:
    "Each deliberate search may use forum credits or quota. No search is repeated automatically.",
  forumDefault: "Forum default",
  editedSearch: "Edited criteria have not been searched.",
  searchResults: "Search results",
  noSearchMatches: "No matching threads.",
  effectiveSearch: "Effective search criteria",
  searchPages: "Search pages",
  searchNavigation: "Search navigation",
  newSearch: "New search",
  deliberateSearch: "Only deliberate submissions run a search.",
  rerunSearch: "Rerun effective search (may use credits)",
  missingSearch:
    "Searches are never rerun automatically. Open Search to submit again deliberately; a new search may use credits or quota.",
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
    "TSDM Workspace 0.3.0. Reading uses your current forum account.",
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
  noticesOverviewLabel: "Notices overview",
  loadNotices: "Load notices",
  refreshNotices: "Refresh notices",
  noticeEffects:
    "Every load, refresh, category and page request can mark notices read on the server. Failed loading can still have effects.",
  noticeCategories: "Notice categories",
  noticePages: "Notice pages",
  noticeUnreadObserved:
    "Returned unread indicator: {value}. Current unread state may already have changed.",
  noticeUnreadAbsent:
    "No unread indicator was returned. The current unread count is unknown.",
  noticeUnreadUnknown:
    "The returned unread indicator could not be interpreted. The current unread count is unknown.",
  deferredNotices:
    "Private messages, broadcasts and native activity actions continue in the forum. Standard social-activity notices are included in the list.",
  nativePM: "Private messages and broadcasts — continue in native forum",
  nativeNotices: "Notice actions — continue in native forum",
  draftsHeading: "Forum drafts",
  searchOverview: "Search threads or authors in the native forum.",
  savedOverview: "View your saved boards and threads in the native forum.",
  noticesOverview:
    "Opening this overview makes no notice request. Notices are loaded only by your deliberate action; there is no background polling.",
  draftsOverview: "View and resume your forum drafts in the native forum.",
  savedBoards: "Boards",
  savedThreads: "Threads",
  searchScope: "Thread and author criteria",
  noticesScope: "Reply, mention, system and activity notices",
  draftsScope: "Saved forum drafts",
  newThread: "New thread",
  returnWriting: "Return to writing",
  preparingForm: "Preparing current form…",
  replaceWritingWarning:
    "Another writing context is already retained. Replacing it discards local changes; existing forum content and uploads are unchanged.",
  returnOriginal: "Return",
  discardPrepare: "Discard local changes and prepare",
  writingContext: "Writing context",
  finishComposition: "Finish the current input composition to change views.",
  newThreadIn: "New thread in {value}",
  writingAs: "Writing as {value}",
  writingBoard: "Board {value}",
  writingPaused:
    "Sending paused — the current account is expired, changed or not yet rechecked. Original writing remains bound to {value}.",
  unresolvedAttachments:
    "Attachment references need reattachment or explicit removal: {value}. Source is preserved; uploads are not transferred.",
  checkWriting: "Check current account and form",
  prepareTextCopy: "Prepare text copy for current account",
  copyWritingPrompt:
    "Replace writing from {value} with a text copy for {account}?",
  copyWritingLimits:
    "Only title and complete source are copied. Category, permissions and credit settings come from the fresh form; uploads and ownership are not transferred.",
  keepWriting: "Keep original writing",
  replaceTextCopy: "Replace with text copy",
  localWriting:
    "Local writing only. Nothing has been submitted or saved as a forum draft.",
  writingRecoveryUnavailable:
    "Refresh recovery unavailable. Live writing remains here; unacknowledged changes may be lost on reload.",
  writingAcknowledged:
    "Recovery acknowledged for revision {value} in this browser page session. Restoration depends on the browser.",
  writingPending:
    "Recovery pending for revision {value}; acknowledged revision {acknowledged}.",
  writingTitle: "Title",
  writingCategory: "Category",
  completeSource: "Complete source",
  currentFormOptions: "Current form options",
  returnReading: "Return to reading",
  incompatibleRecovery:
    "Stored recovery data is incompatible or malformed. It is retained without overwriting; new changes cannot be recovered until you resolve it.",
  inspectRecovery: "Inspect retained recovery data",
  retainedRecovery: "Retained recovery data",
  resetRecovery: "Reset incompatible recovery",
  discardRecoveryWarning:
    "Copy any needed source before discarding this local recovery record. This cannot restore its old writing afterward.",
  keepRecovery: "Keep recovery record",
  discardRecovery: "Discard incompatible recovery record",
  readRecoveryRefused:
    "Browser page-session storage could not be read. Live work remains available; refresh recovery is unavailable.",
};
type Strings = { [Key in keyof typeof english]: string };
const simplified: Strings = {
  searchOverviewLabel: "搜索总览",
  searchExplanation: "搜索主题或作者。编辑条件不会执行搜索。",
  searchEffects: "每次主动搜索都可能消耗论坛积分或额度。系统不会自动重复搜索。",
  forumDefault: "论坛默认值",
  editedSearch: "尚未使用编辑后的条件搜索。",
  searchResults: "搜索结果",
  noSearchMatches: "没有匹配的主题。",
  effectiveSearch: "当前有效搜索条件",
  searchPages: "搜索结果分页",
  searchNavigation: "搜索导航",
  newSearch: "新搜索",
  deliberateSearch: "只有主动提交才会执行搜索。",
  rerunSearch: "重新执行有效搜索（可能消耗积分）",
  missingSearch:
    "系统绝不会自动重新搜索。请打开搜索并主动再次提交；新搜索可能消耗积分或额度。",
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
  aboutDescription: "TSDM 工作区 0.3.0。阅读使用当前论坛账号。",
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
  noticesOverviewLabel: "通知总览",
  loadNotices: "加载通知",
  refreshNotices: "刷新通知",
  noticeEffects:
    "每次加载、刷新、分类和翻页请求都可能在服务器上将通知标为已读。加载失败也可能产生影响。",
  noticeCategories: "通知分类",
  noticePages: "通知分页",
  noticeUnreadObserved: "返回的未读提示：{value}。当前未读状态可能已改变。",
  noticeUnreadAbsent: "响应没有返回未读提示。当前未读数量未知。",
  noticeUnreadUnknown: "无法识别返回的未读提示。当前未读数量未知。",
  deferredNotices:
    "私信、广播和原版动态操作请继续前往论坛。标准坛友互动通知包含在列表中。",
  nativePM: "私信与广播 — 前往原版论坛",
  nativeNotices: "通知操作 — 前往原版论坛",
  draftsHeading: "论坛草稿",
  searchOverview: "在原版论坛中搜索主题或作者。",
  savedOverview: "在原版论坛中查看收藏的版块与主题。",
  noticesOverview:
    "打开此总览不会请求通知。只有您的主动操作才会加载通知；没有后台轮询。",
  draftsOverview: "在原版论坛中查看及继续编辑论坛草稿。",
  savedBoards: "版块",
  savedThreads: "主题",
  searchScope: "主题与作者条件",
  noticesScope: "回复、提及、系统与动态通知",
  draftsScope: "已保存的论坛草稿",
  newThread: "新主题",
  returnWriting: "返回写作",
  preparingForm: "正在准备当前表单…",
  replaceWritingWarning:
    "已保留另一份写作内容。替换将丢弃本地更改；现有论坛内容和上传文件保持不变。",
  returnOriginal: "返回原内容",
  discardPrepare: "丢弃本地更改并准备",
  writingContext: "写作内容",
  finishComposition: "请完成当前输入组合后再切换视图。",
  newThreadIn: "在 {value} 中发表新主题",
  writingAs: "写作账号：{value}",
  writingBoard: "版块 {value}",
  writingPaused:
    "发送已暂停 — 当前账号已过期、已变更或尚未重新检查。原写作内容仍属于 {value}。",
  unresolvedAttachments:
    "附件引用需要重新附加或明确移除：{value}。源码已保留；上传文件不会转移。",
  checkWriting: "检查当前账号和表单",
  prepareTextCopy: "为当前账号准备文字副本",
  copyWritingPrompt: "将 {value} 的写作内容替换为 {account} 的文字副本？",
  copyWritingLimits:
    "仅复制标题和完整源码。分类、权限和积分设置来自新表单；上传文件和所有权不会转移。",
  keepWriting: "保留原写作内容",
  replaceTextCopy: "替换为文字副本",
  localWriting: "仅在本地写作。尚未提交内容或保存论坛草稿。",
  writingRecoveryUnavailable:
    "刷新恢复不可用。当前写作内容仍在此处；未经确认的更改可能在重新加载时丢失。",
  writingAcknowledged:
    "已确认此浏览器页面会话中版本 {value} 的恢复记录。能否恢复取决于浏览器。",
  writingPending: "版本 {value} 的恢复记录待确认；已确认版本 {acknowledged}。",
  writingTitle: "标题",
  writingCategory: "分类",
  completeSource: "完整源码",
  currentFormOptions: "当前表单选项",
  returnReading: "返回阅读",
  incompatibleRecovery:
    "存储的恢复数据不兼容或格式错误。数据将保留而不被覆盖；解决前无法恢复新的更改。",
  inspectRecovery: "查看保留的恢复数据",
  retainedRecovery: "保留的恢复数据",
  resetRecovery: "重置不兼容的恢复记录",
  discardRecoveryWarning:
    "丢弃此本地恢复记录前，请复制需要的源码。之后将无法恢复原写作内容。",
  keepRecovery: "保留恢复记录",
  discardRecovery: "丢弃不兼容的恢复记录",
  readRecoveryRefused:
    "无法读取浏览器页面会话存储。当前内容仍可使用；刷新恢复不可用。",
};
const traditional: Strings = {
  searchOverviewLabel: "搜尋總覽",
  searchExplanation: "搜尋主題或作者。編輯條件不會執行搜尋。",
  searchEffects: "每次主動搜尋都可能消耗論壇積分或額度。系統不會自動重複搜尋。",
  forumDefault: "論壇預設值",
  editedSearch: "尚未使用編輯後的條件搜尋。",
  searchResults: "搜尋結果",
  noSearchMatches: "沒有相符的主題。",
  effectiveSearch: "目前有效搜尋條件",
  searchPages: "搜尋結果分頁",
  searchNavigation: "搜尋導覽",
  newSearch: "新搜尋",
  deliberateSearch: "只有主動提交才會執行搜尋。",
  rerunSearch: "重新執行有效搜尋（可能消耗積分）",
  missingSearch:
    "系統絕不會自動重新搜尋。請開啟搜尋並主動再次提交；新搜尋可能消耗積分或額度。",
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
  aboutDescription: "TSDM 工作區 0.3.0。閱讀使用目前論壇帳號。",
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
  noticesOverviewLabel: "通知總覽",
  loadNotices: "載入通知",
  refreshNotices: "重新載入通知",
  noticeEffects:
    "每次載入、重新載入、分類和翻頁請求都可能在伺服器上將通知標為已讀。載入失敗也可能產生影響。",
  noticeCategories: "通知分類",
  noticePages: "通知分頁",
  noticeUnreadObserved: "傳回的未讀提示：{value}。目前未讀狀態可能已改變。",
  noticeUnreadAbsent: "回應沒有傳回未讀提示。目前未讀數量未知。",
  noticeUnreadUnknown: "無法識別傳回的未讀提示。目前未讀數量未知。",
  deferredNotices:
    "私訊、廣播和原版動態操作請繼續前往論壇。標準壇友互動通知包含在清單中。",
  nativePM: "私訊與廣播 — 前往原版論壇",
  nativeNotices: "通知操作 — 前往原版論壇",
  draftsHeading: "論壇草稿",
  searchOverview: "在原版論壇中搜尋主題或作者。",
  savedOverview: "在原版論壇中查看收藏的版塊與主題。",
  noticesOverview:
    "開啟此總覽不會請求通知。只有您的主動操作才會載入通知；沒有背景輪詢。",
  draftsOverview: "在原版論壇中查看及繼續編輯論壇草稿。",
  savedBoards: "版塊",
  savedThreads: "主題",
  searchScope: "主題與作者條件",
  noticesScope: "回覆、提及、系統與動態通知",
  draftsScope: "已儲存的論壇草稿",
  newThread: "新主題",
  returnWriting: "返回寫作",
  preparingForm: "正在準備目前表單…",
  replaceWritingWarning:
    "已保留另一份寫作內容。替換將捨棄本機變更；現有論壇內容和上傳檔案保持不變。",
  returnOriginal: "返回原內容",
  discardPrepare: "捨棄本機變更並準備",
  writingContext: "寫作內容",
  finishComposition: "請完成目前輸入組合後再切換檢視。",
  newThreadIn: "在 {value} 中發表新主題",
  writingAs: "寫作帳號：{value}",
  writingBoard: "版塊 {value}",
  writingPaused:
    "傳送已暫停 — 目前帳號已過期、已變更或尚未重新檢查。原寫作內容仍屬於 {value}。",
  unresolvedAttachments:
    "附件引用需要重新附加或明確移除：{value}。原始碼已保留；上傳檔案不會轉移。",
  checkWriting: "檢查目前帳號和表單",
  prepareTextCopy: "為目前帳號準備文字副本",
  copyWritingPrompt: "將 {value} 的寫作內容替換為 {account} 的文字副本？",
  copyWritingLimits:
    "僅複製標題和完整原始碼。分類、權限和積分設定來自新表單；上傳檔案和所有權不會轉移。",
  keepWriting: "保留原寫作內容",
  replaceTextCopy: "替換為文字副本",
  localWriting: "僅在本機寫作。尚未提交內容或儲存論壇草稿。",
  writingRecoveryUnavailable:
    "重新載入復原無法使用。目前寫作內容仍在此處；未經確認的變更可能在重新載入時遺失。",
  writingAcknowledged:
    "已確認此瀏覽器頁面工作階段中版本 {value} 的復原記錄。能否復原取決於瀏覽器。",
  writingPending: "版本 {value} 的復原記錄待確認；已確認版本 {acknowledged}。",
  writingTitle: "標題",
  writingCategory: "分類",
  completeSource: "完整原始碼",
  currentFormOptions: "目前表單選項",
  returnReading: "返回閱讀",
  incompatibleRecovery:
    "儲存的復原資料不相容或格式錯誤。資料將保留而不被覆寫；解決前無法復原新的變更。",
  inspectRecovery: "檢視保留的復原資料",
  retainedRecovery: "保留的復原資料",
  resetRecovery: "重設不相容的復原記錄",
  discardRecoveryWarning:
    "捨棄此本機復原記錄前，請複製需要的原始碼。之後將無法復原原寫作內容。",
  keepRecovery: "保留復原記錄",
  discardRecovery: "捨棄不相容的復原記錄",
  readRecoveryRefused:
    "無法讀取瀏覽器頁面工作階段儲存空間。目前內容仍可使用；重新載入復原無法使用。",
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
  Cost: ["积分限制", "積分限制"],
  Throttle: ["搜索频率受限", "搜尋頻率受限"],
  Expired: ["搜索结果已过期", "搜尋結果已過期"],
  "This page was not offered by the current search results.": [
    "当前搜索结果未提供此分页。",
    "目前搜尋結果未提供此分頁。",
  ],
  "A newer request replaced this search page.": [
    "此搜索分页已被较新的请求替代。",
    "此搜尋分頁已被較新的請求取代。",
  ],
  "The current account could not be established from this search page. Review the current account before searching again deliberately.":
    [
      "无法从此搜索分页确认当前账号。再次主动搜索前，请检查当前账号。",
      "無法從此搜尋分頁確認目前帳號。再次主動搜尋前，請檢查目前帳號。",
    ],
  "The account changed while reading search results. Review the current account before searching again deliberately.":
    [
      "阅读搜索结果时账号发生了变化。再次主动搜索前，请检查当前账号。",
      "閱讀搜尋結果時帳號發生了變更。再次主動搜尋前，請檢查目前帳號。",
    ],
  "The returned page belongs to a different search.": [
    "返回的分页属于另一次搜索。",
    "傳回的分頁屬於另一次搜尋。",
  ],
  "The search page could not be loaded. It has not been requested again automatically.":
    [
      "无法加载搜索分页。系统未自动再次请求此页。",
      "無法載入搜尋分頁。系統未自動再次請求此頁。",
    ],
  "The search form is not from this forum.": [
    "此搜索表单不属于当前论坛。",
    "此搜尋表單不屬於目前論壇。",
  ],
  "A newer action replaced this search.": [
    "此搜索已被较新的操作替代。",
    "此搜尋已被較新的操作取代。",
  ],
  "The current account could not be established. Search has not been submitted.":
    ["无法确认当前账号。尚未提交搜索。", "無法確認目前帳號。尚未提交搜尋。"],
  "The account changed while preparing search. Review the current form and submit again deliberately.":
    [
      "准备搜索时账号发生了变化。请检查当前表单，再主动提交。",
      "準備搜尋時帳號發生了變更。請檢查目前表單，再主動提交。",
    ],
  "A newer action replaced this search. The earlier request may still have had effects.":
    [
      "此搜索已被较新的操作替代。先前的请求仍可能已经产生影响。",
      "此搜尋已被較新的操作取代。先前的請求仍可能已經產生影響。",
    ],
  "The current account could not be established from the search response. The request may still have used credits or quota.":
    [
      "无法从搜索响应确认当前账号。该请求仍可能已经消耗积分或额度。",
      "無法從搜尋回應確認目前帳號。該請求仍可能已經消耗積分或額度。",
    ],
  "The account changed during search. Its effects are not isolated; review the current account before another deliberate search.":
    [
      "搜索期间账号发生了变化，其影响无法隔离。再次主动搜索前，请检查当前账号。",
      "搜尋期間帳號發生了變更，其影響無法隔離。再次主動搜尋前，請檢查目前帳號。",
    ],
  "Search could not be completed. It may have used credits or quota. Submit again only deliberately.":
    [
      "无法完成搜索。此次搜索可能已经消耗积分或额度。仅在主动选择后再次提交。",
      "無法完成搜尋。此次搜尋可能已經消耗積分或額度。僅在主動選擇後再次提交。",
    ],
  "An existing search page must be opened deliberately from its returned results. Open Search to prepare a new search.":
    [
      "已有搜索分页必须从返回的结果中主动打开。请打开搜索以准备新搜索。",
      "既有搜尋分頁必須從傳回的結果中主動開啟。請開啟搜尋以準備新搜尋。",
    ],
  "Native verification is required before another deliberate search.": [
    "再次主动搜索前，需要在原版论坛完成验证。",
    "再次主動搜尋前，需要在原版論壇完成驗證。",
  ],
  "Sign in through the native forum before another deliberate search.": [
    "再次主动搜索前，请先在原版论坛登录。",
    "再次主動搜尋前，請先在原版論壇登入。",
  ],
  "Search results expired. Your criteria are retained; rerun explicitly if you accept possible credits or quota use.":
    [
      "搜索结果已过期。条件已保留；若接受可能消耗积分或额度，请主动重新搜索。",
      "搜尋結果已過期。條件已保留；若接受可能消耗積分或額度，請主動重新搜尋。",
    ],
  "The search form response could not be displayed reliably.": [
    "无法可靠地显示搜索表单响应。",
    "無法可靠地顯示搜尋表單回應。",
  ],
  "The current advanced search form is unavailable. Continue in the native forum.":
    [
      "当前高级搜索表单不可用。请在原版论坛中继续。",
      "目前進階搜尋表單無法使用。請在原版論壇中繼續。",
    ],
  "Enter keywords or an author before searching.": [
    "搜索前，请输入关键词或作者。",
    "搜尋前，請輸入關鍵字或作者。",
  ],
  "Search controls changed. Refresh the form and review your criteria.": [
    "搜索控件已更改。请刷新表单并检查条件。",
    "搜尋控制項已變更。請重新整理表單並檢查條件。",
  ],
  "The search result could not be displayed reliably. The request may still have used credits or quota.":
    [
      "无法可靠地显示搜索结果。该请求仍可能已经消耗积分或额度。",
      "無法可靠地顯示搜尋結果。該請求仍可能已經消耗積分或額度。",
    ],
  "The forum did not return a usable search identity. It will not be searched again automatically.":
    [
      "论坛未返回可用的搜索标识。系统不会自动再次搜索。",
      "論壇未傳回可用的搜尋識別。系統不會自動再次搜尋。",
    ],
  "The search contains unrecognized or incomplete results. It has not been treated as zero matches.":
    [
      "搜索结果无法识别或不完整，未将其视为零条匹配结果。",
      "搜尋結果無法辨識或不完整，未將其視為零筆相符結果。",
    ],
  "The search contains an unsupported result-page link.": [
    "搜索结果包含不支持的分页链接。",
    "搜尋結果包含不支援的分頁連結。",
  ],
  "This native search request may have used credits or quota before the workspace started. No search has been repeated. Open Search to prepare a deliberate new search.":
    [
      "此原版搜索请求可能在工作区启动前就已消耗积分或额度。系统未重复搜索。请打开搜索，准备主动执行新搜索。",
      "此原版搜尋請求可能在工作區啟動前就已消耗積分或額度。系統未重複搜尋。請開啟搜尋，準備主動執行新搜尋。",
    ],
  "The current account cannot search.": [
    "当前账号无法搜索。",
    "目前帳號無法搜尋。",
  ],
  "Unexpected HTTP response.": [
    "收到非预期的 HTTP 响应。",
    "收到非預期的 HTTP 回應。",
  ],
  Keywords: ["关键词", "關鍵字"],
  Author: ["作者", "作者"],
  "Time range": ["时间范围", "時間範圍"],
  "Time relation": ["时间关系", "時間關係"],
  Order: ["排序依据", "排序依據"],
  Direction: ["排序方向", "排序方向"],
  Boards: ["版块", "版塊"],
  "Search scope": ["搜索范围", "搜尋範圍"],
  "Thread types": ["主题类型", "主題類型"],
  "Search index": ["搜索索引", "搜尋索引"],
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
  "This action requires current native forum controls.": [
    "此操作需要当前的原版论坛控件。",
    "此操作需要目前的原版論壇控制項。",
  ],
  "The notice request failed. It may still have marked notices read. Retry only deliberately.":
    [
      "通知请求失败，仍可能已将通知标为已读。请仅在主动操作时重试。",
      "通知請求失敗，仍可能已將通知標為已讀。請僅在主動操作時重試。",
    ],
  "This is not a supported notice destination.": [
    "此目标不是受支持的通知页面。",
    "此目標不是受支援的通知頁面。",
  ],
  "This category or page was not offered by the current notice list.": [
    "当前通知列表未提供此分类或分页。",
    "目前通知清單未提供此分類或分頁。",
  ],
  "A newer request replaced this notice load. It may still have marked notices read.":
    [
      "较新的请求已替代此次通知加载。之前的请求仍可能已将通知标为已读。",
      "較新的請求已替代此次通知載入。先前的請求仍可能已將通知標為已讀。",
    ],
  "The account changed while loading notices. Previous notices were cleared. This request may still have had read effects.":
    [
      "加载通知时账号已更改。之前的通知已清除；此次请求仍可能产生已读影响。",
      "載入通知時帳號已更改。先前的通知已清除；此次請求仍可能產生已讀影響。",
    ],
  "Notices must be loaded deliberately. Each load may mark notices read.": [
    "请主动加载通知。每次加载都可能将通知标为已读。",
    "請主動載入通知。每次載入都可能將通知標為已讀。",
  ],
  "This native notice request may have marked notices read before the workspace started. No notice request has been repeated. Load notices only deliberately.":
    [
      "此原版通知请求可能在工作区启动前已将通知标为已读。没有重复请求通知。请仅主动加载通知。",
      "此原版通知請求可能在工作區啟動前已將通知標為已讀。沒有重複請求通知。請僅主動載入通知。",
    ],
  "The forum returned an unsupported notice response. This request may still have marked notices read.":
    [
      "论坛返回了不支持的通知响应。此次请求仍可能已将通知标为已读。",
      "論壇傳回了不支援的通知回應。此次請求仍可能已將通知標為已讀。",
    ],
  "The notice response could not be interpreted. This request may still have marked notices read.":
    [
      "无法识别通知响应。此次请求仍可能已将通知标为已读。",
      "無法識別通知回應。此次請求仍可能已將通知標為已讀。",
    ],
  "Native verification is required. This request may still have marked notices read.":
    [
      "需要原版论坛验证。此次请求仍可能已将通知标为已读。",
      "需要原版論壇驗證。此次請求仍可能已將通知標為已讀。",
    ],
  "Sign in through the native forum before loading notices deliberately. This request may still have had read effects.":
    [
      "请先在原版论坛登录，再主动加载通知。此次请求仍可能产生已读影响。",
      "請先在原版論壇登入，再主動載入通知。此次請求仍可能產生已讀影響。",
    ],
  "The current account cannot read these notices. This request may still have had read effects.":
    [
      "当前账号无法读取这些通知。此次请求仍可能产生已读影响。",
      "目前帳號無法讀取這些通知。此次請求仍可能產生已讀影響。",
    ],
  "The forum is limiting requests. Retry notices only deliberately; this request may still have had read effects.":
    [
      "论坛正在限制请求。请仅主动重试通知；此次请求仍可能产生已读影响。",
      "論壇正在限制請求。請僅主動重試通知；此次請求仍可能產生已讀影響。",
    ],
  "The notices could not be displayed reliably. This request may still have marked notices read.":
    [
      "无法可靠地显示通知。此次请求仍可能已将通知标为已读。",
      "無法可靠地顯示通知。此次請求仍可能已將通知標為已讀。",
    ],
  "The current notice account could not be confirmed. This request may still have had read effects.":
    [
      "无法确认当前通知账号。此次请求仍可能产生已读影响。",
      "無法確認目前通知帳號。此次請求仍可能產生已讀影響。",
    ],
  "The forum returned a different notice category or page. This request may still have had read effects.":
    [
      "论坛返回了不同通知分类或分页。此次请求仍可能产生已读影响。",
      "論壇傳回了不同通知分類或分頁。此次請求仍可能產生已讀影響。",
    ],
  "The complete notice list could not be recognized. Continue in the native forum; this request may still have marked notices read.":
    [
      "无法识别完整通知列表。请前往原版论坛；此次请求仍可能已将通知标为已读。",
      "無法識別完整通知清單。請前往原版論壇；此次請求仍可能已將通知標為已讀。",
    ],
  "A notice has incomplete or ambiguous content. Continue in the native forum for the complete list; this request may still have marked notices read.":
    [
      "一则通知的内容不完整或有歧义。请前往原版论坛查看完整列表；此次请求仍可能已将通知标为已读。",
      "一則通知的內容不完整或有歧義。請前往原版論壇查看完整清單；此次請求仍可能已將通知標為已讀。",
    ],
  "The returned notice categories could not be recognized. Continue in the native forum for the complete inbox; this request may still have marked notices read.":
    [
      "无法识别返回的通知分类。请前往原版论坛查看完整通知；此次请求仍可能已将通知标为已读。",
      "無法識別傳回的通知分類。請前往原版論壇查看完整通知；此次請求仍可能已將通知標為已讀。",
    ],
  "The returned notice pagination could not be preserved completely. Continue in the native forum; this request may still have marked notices read.":
    [
      "无法完整保留返回的通知分页。请前往原版论坛；此次请求仍可能已将通知标为已读。",
      "無法完整保留傳回的通知分頁。請前往原版論壇；此次請求仍可能已將通知標為已讀。",
    ],
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
  "A valid board is required.": ["需要有效的版块。", "需要有效的版塊。"],
  "A newer account request replaced this preparation.": [
    "较新的账号请求已替代此次准备。",
    "較新的帳號請求已取代此次準備。",
  ],
  "The form could not be reached. Your writing is retained.": [
    "无法获取表单。写作内容已保留。",
    "無法取得表單。寫作內容已保留。",
  ],
  "The forum returned an unsupported preparation response.": [
    "论坛返回了不支持的准备响应。",
    "論壇傳回了不支援的準備回應。",
  ],
  "The forum returned invalid preparation data.": [
    "论坛返回了无效的准备数据。",
    "論壇傳回了無效的準備資料。",
  ],
  "Complete native verification, then prepare again.": [
    "请在原版论坛完成验证，然后重新准备。",
    "請在原版論壇完成驗證，然後重新準備。",
  ],
  "Sign in through the native forum, then prepare again. A form token does not establish an account.":
    [
      "请通过原版论坛登录，然后重新准备。表单令牌不能确认账号身份。",
      "請透過原版論壇登入，然後重新準備。表單權杖不能確認帳號身分。",
    ],
  "The current account cannot prepare this new thread.": [
    "当前账号无法准备此新主题。",
    "目前帳號無法準備此新主題。",
  ],
  "The forum is limiting requests. Try again explicitly later.": [
    "论坛正在限制请求。请稍后主动重试。",
    "論壇正在限制請求。請稍後主動重試。",
  ],
  "A current member account and complete native form are required.": [
    "需要当前会员账号和完整的原版表单。",
    "需要目前會員帳號和完整的原版表單。",
  ],
  "The current native new-thread form is unavailable.": [
    "当前原版新主题表单不可用。",
    "目前原版新主題表單無法使用。",
  ],
  "The returned form targets a different action or board.": [
    "返回的表单指向不同的操作或版块。",
    "傳回的表單指向不同的操作或版塊。",
  ],
  "The native form does not provide unambiguous complete source and options.": [
    "原版表单未提供明确完整的源码和选项。",
    "原版表單未提供明確完整的原始碼和選項。",
  ],
  "Writing changed while the new form was loading. Return to it or deliberately prepare replacement again.":
    [
      "加载新表单时写作内容已更改。请返回原内容，或主动重新准备替换。",
      "載入新表單時寫作內容已變更。請返回原內容，或主動重新準備替換。",
    ],
  "The account changed again. Prepare the text copy again.": [
    "账号再次变更。请重新准备文字副本。",
    "帳號再次變更。請重新準備文字副本。",
  ],
};

const searchPrefixes: Record<string, readonly [string, string]> = {
  "Search cost restriction: ": ["搜索积分限制：", "搜尋積分限制："],
  "Search frequency restriction: ": ["搜索频率限制：", "搜尋頻率限制："],
  "Search permission denied: ": ["搜索权限不足：", "搜尋權限不足："],
  "The search response could not be interpreted: ": [
    "无法解析搜索响应：",
    "無法解析搜尋回應：",
  ],
};

/** Translate only application-authored explanations; returned forum content is untouched. */
export function description(
  value: string,
  language: Preferences["language"],
  nativeText?: string | null,
): string {
  if (language === "en") return value;
  const localized = descriptions[value];
  if (localized) return localized[language === "zh-CN" ? 0 : 1];
  for (const [prefix, translated] of Object.entries(searchPrefixes)) {
    if (!value.startsWith(prefix)) continue;
    const suffix = value.slice(prefix.length);
    return (
      translated[language === "zh-CN" ? 0 : 1] +
      (nativeText === null ? description(suffix, language) : suffix)
    );
  }
  const restriction =
    /^The current (.+) restriction does not allow this value\. Review your criteria\.$/.exec(
      value,
    );
  if (restriction) {
    const field =
      nativeText === null
        ? description(restriction[1]!, language)
        : restriction[1]!;
    return language === "zh-CN"
      ? `当前的「${field}」限制不允许此值。请检查条件。`
      : `目前的「${field}」限制不允許此值。請檢查條件。`;
  }
  const formatting = /^Unsupported formatting \((.+)\)$/.exec(value);
  if (formatting)
    return `${language === "zh-CN" ? "不支持的格式" : "不支援的格式"} (${formatting[1]})`;
  return value;
}
