import type { Preferences } from "../workspace/preferences";
const english = {
  editPost: "Edit post {value}",
  reviewEdit: "Review edit",
  saveEditedPost: "Save edited post",
  editReview:
    "Review revision {value} for post {post} as {account}. Saving changes this existing post, including its selected options.",
  editRepeatWarning:
    "The earlier save remains unknown. Saving again may repeat effects and overwrite intervening changes. It cannot undo the original attempt.",
  latestServerVersion: "Latest server version",
  editCompare:
    "Local writing is retained. Compare complete source, options and attachment references. The forum provides no atomic conflict lock.",
  latestServerSource: "Latest server source",
  attachmentReferences: "Attachment references",
  attachmentDescription: "Description",
  attachmentReadPermission: "Read permission",
  attachmentPrice: "Price",
  attachmentAssociation: "Existing association",
  reloadLatest: "Reload latest",
  reconcileManually: "Reconcile manually",
  manualEditExplanation:
    "Manual reconciliation keeps your local title and source, and adopts the latest server options and attachment metadata. Review editable options again before saving.",
  saveMyVersion: "Save my version",
  reloadEditWarning:
    "Reloading discards your current local source and options. Forum content and attachments are not deleted.",
  keepLocalWriting: "Keep local writing",
  discardReloadLatest: "Discard local changes and reload latest",
  overwriteEditWarning:
    "Saving your version may overwrite the latest server changes. Changes after this review may still race with save; no atomic conflict prevention is guaranteed.",
  acceptOverwriteReview: "Accept overwrite and review",
  replaceEditWarning:
    "Editing this post replaces the retained writing context. Discarding local writing does not delete forum content or attachments.",
  discardAndEdit: "Discard local writing and edit post",
  keepCurrentWriting: "Keep current writing",
  disabledOption: "disabled",
  noReferences: "None",

  draftAttempt: "Draft attempt {value}",
  checkOriginalDraft: "Check original draft attempt {value}",
  reviewDraftResend: "Review draft resend {value}",
  draftAttemptTarget: "Draft {thread}, post {post}",
  draftAttemptDetails:
    "{value} · {account} · Board {board} · {target} · revision {revision}",
  draftResendWarning:
    "This may duplicate draft content or publication and repeat native creation effects. The original result remains unknown. This resend proposes the current revision shown below, using fresh forum validation. Review its options and any known forum costs before confirming.",
  cancelDraftResend: "Cancel draft resend",
  confirmDraftResend: "Confirm draft resend",
  draftCreationInstructions:
    "Initial creation instructions are retained with the original save. Draft updates and publication use current native controls; feed or notification delivery is not confirmed.",
  draftIn: "Forum draft in {value}",
  draftIdentity:
    "Forum draft identity: {value}. Saving is explicit; local retention does not update the forum.",
  publishSavedDraft: "Publish saved draft",
  loadDrafts: "Load forum drafts",
  resumeDraft: "Resume {value}",
  draftPage: "Draft page {value}",
  draftPages: "Draft pages",
  saveForumDraft: "Save forum draft",
  saveDraftContinue: "Save forum draft and continue",
  discardResumeDraft: "Discard local changes and resume draft",
  checkDraftRevision: "Check saved revision in {value}",
  checkDraftSave: "Check original save",

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
    "TSDM Workspace 0.4.0. Reading uses your current forum account.",
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
  draftsOverview:
    "Load your actual forum drafts, resume complete saved source, and explicitly save revisions. Local recovery is separate.",
  savedBoards: "Boards",
  savedThreads: "Threads",
  searchScope: "Thread and author criteria",
  noticesScope: "Reply, mention, system and activity notices",
  draftsScope: "Saved forum drafts",
  replyComparison: "Reply source comparison",
  replyBeforeSource: "Complete source before sending",
  replyObservedSource: "Complete observed result source",
  replyComparisonLimits:
    "Known before and current source are observations, not proof of a merge rule or notification delivery. Your submitted source is kept separately.",
  replyBeforeUnknown: "No source baseline was observed for this returned post.",
  mentions: "Mentions",
  findMentionPerson: "Find a person to mention",
  findMention: "Find mention",
  mentionPerson: "Mention {value} (UID {id})",
  quickQuote: "Quick Quote",
  addressedTo: "Addressed to {value} · Post {post}",
  replyDeliveryUnknown:
    "Quoted source does not change the addressed post. Quote and mention notification delivery is unverified.",
  replyToThread: "Reply to thread",
  replyIn: "Reply in thread {value}",
  sendReply: "Send reply",
  openConfirmedPost: "Open confirmed post",
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
  openConfirmedThread: "Open confirmed thread",
  normalizedStoredPrice:
    "Stored price: 0 (normalized from an empty submitted value).",
  deliveryUnverified: "Delivery unverified",
  effectNotRequested: "Not requested",
  effectNotIncluded: "Not included in the command",
  legacyStoredConfirmation:
    "Previous stored confirmation. This legacy result has no separate normalization or creation-effect evidence.",
  candidateThreadURL: "Candidate thread URL",
  checkThreadResult: "Check result",
  prepareAnotherAttempt: "Prepare another attempt",
  duplicatePublicationWarning:
    "The earlier attempt remains unknown. Sending again may create a duplicate thread and repeat its effects. This cannot undo the first attempt.",
  keepOriginalAttempt: "Keep original attempt",
  acceptDuplicateReview: "Accept duplicate risk and review",
  reviewPublication: "Review publication",
  publicationReview:
    "Review revision {value} for {account} in {board}. Publishing may create a public thread with the selected price and read permission.",
  replyPublicationReview:
    "Review reply revision {value} for {account} in thread {thread} ({board}). Sending may add a reply or merge it into an existing post.",
  publishThread: "Publish thread",
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
  editPost: "编辑帖子 {value}",
  reviewEdit: "检查编辑",
  saveEditedPost: "保存编辑",
  editReview:
    "以 {account} 检查帖子 {post} 的修订 {value}。保存将更改现有帖子及所选选项。",
  editRepeatWarning:
    "上次保存结果仍未知。再次保存可能重复产生效果并覆盖期间的更改，无法撤销原尝试。",
  latestServerVersion: "服务器最新版本",
  editCompare:
    "本地内容已保留。请比较完整源码、选项及附件引用。论坛无法提供原子冲突锁定。",
  latestServerSource: "服务器最新源码",
  attachmentReferences: "附件引用",
  attachmentDescription: "说明",
  attachmentReadPermission: "阅读权限",
  attachmentPrice: "价格",
  attachmentAssociation: "现有关联",
  reloadLatest: "重新加载最新版本",
  reconcileManually: "手动整合",
  manualEditExplanation:
    "手动整合保留本地标题和源码，并采用服务器最新选项及附件信息。保存前请再次检查可编辑选项。",
  saveMyVersion: "保存我的版本",
  reloadEditWarning:
    "重新加载将丢弃当前本地源码和选项，不会删除论坛内容或附件。",
  keepLocalWriting: "保留本地内容",
  discardReloadLatest: "丢弃本地更改并加载最新版本",
  overwriteEditWarning:
    "保存你的版本可能覆盖服务器最新更改。检查后仍可能发生并发更改，无法保证原子冲突防护。",
  acceptOverwriteReview: "接受覆盖并检查",
  replaceEditWarning:
    "编辑此帖将替换保留的写作内容。丢弃本地内容不会删除论坛内容或附件。",
  discardAndEdit: "丢弃本地内容并编辑帖子",
  keepCurrentWriting: "保留当前内容",
  disabledOption: "已禁用",
  noReferences: "无",

  draftAttempt: "草稿操作 {value}",
  checkOriginalDraft: "核对原草稿操作 {value}",
  reviewDraftResend: "检查草稿重新发送 {value}",
  draftAttemptTarget: "草稿 {thread}，帖子 {post}",
  draftAttemptDetails:
    "{value} · {account} · 版块 {board} · {target} · 版本 {revision}",
  draftResendWarning:
    "此操作可能重复创建草稿或发布内容，并重复原版创建指令的影响。原操作结果仍未知。此次重新发送使用下方所示的当前版本，并重新验证论坛表单。确认前请检查选项及已知的论坛费用。",
  cancelDraftResend: "取消草稿重新发送",
  confirmDraftResend: "确认草稿重新发送",
  draftCreationInstructions:
    "初次创建指令与原保存操作一起保留。草稿更新及发布使用当前原版控件；未确认动态或通知已送达。",
  draftIn: "{value} 中的论坛草稿",
  draftIdentity:
    "论坛草稿编号：{value}。保存需要明确操作；本地保留不会更新论坛。",
  publishSavedDraft: "发布已保存的草稿",
  loadDrafts: "载入论坛草稿",
  resumeDraft: "继续编辑 {value}",
  draftPage: "草稿第 {value} 页",
  draftPages: "草稿分页",
  saveForumDraft: "保存论坛草稿",
  saveDraftContinue: "保存论坛草稿并继续",
  discardResumeDraft: "放弃本地修改并继续编辑草稿",
  checkDraftRevision: "在 {value} 中核对已保存版本",
  checkDraftSave: "核对原保存结果",

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
  aboutDescription: "TSDM 工作区 0.4.0。阅读使用当前论坛账号。",
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
  draftsOverview:
    "载入论坛草稿、继续编辑完整来源并明确保存版本。本地恢复与论坛草稿分开。",
  savedBoards: "版块",
  savedThreads: "主题",
  searchScope: "主题与作者条件",
  noticesScope: "回复、提及、系统与动态通知",
  draftsScope: "已保存的论坛草稿",
  replyComparison: "回复源码比较",
  replyBeforeSource: "发送前的完整源码",
  replyObservedSource: "结果的完整实测源码",
  replyComparisonLimits:
    "已知的先前内容和当前源码只是观察结果，不代表已确认合并规则或通知送达。提交的源码单独保留。",
  replyBeforeUnknown: "未观察到这个返回帖子的先前源码。",
  mentions: "提及",
  findMentionPerson: "查找要提及的用户",
  findMention: "查找用户",
  mentionPerson: "提及 {value}（UID {id}）",
  quickQuote: "快速引用",
  addressedTo: "回复对象：{value} · 帖子 {post}",
  replyDeliveryUnknown:
    "引用源码不会更改回复对象。引用和提及的通知送达状态未确认。",
  replyToThread: "回复主题",
  replyIn: "回复主题 {value}",
  sendReply: "发送回复",
  openConfirmedPost: "打开已确认的帖子",
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
  openConfirmedThread: "打开已确认的主题",
  normalizedStoredPrice: "存储售价为 0（由提交的空值规范化）。",
  deliveryUnverified: "尚未验证送达",
  effectNotRequested: "未请求",
  effectNotIncluded: "未包含在提交指令中",
  legacyStoredConfirmation:
    "先前的存储确认。此旧版结果没有独立的规范化或创建影响证据。",
  candidateThreadURL: "待检查的主题网址",
  checkThreadResult: "检查结果",
  prepareAnotherAttempt: "准备再次尝试",
  duplicatePublicationWarning:
    "先前尝试的结果仍未知。再次发送可能建立重复主题并重复其影响，而且无法撤销首次尝试。",
  keepOriginalAttempt: "保留原尝试",
  acceptDuplicateReview: "接受重复风险并检查",
  reviewPublication: "检查发布",
  publicationReview:
    "检查 {account} 在 {board} 的第 {value} 版。发布可能建立公开主题，并采用所选售价和阅读权限。",
  replyPublicationReview:
    "检查 {account} 在 {board} 版块主题 {thread} 中的回复修订 {value}。发送可能新增回复，也可能合并到已有帖子。",
  publishThread: "发布主题",
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
  editPost: "編輯貼文 {value}",
  reviewEdit: "檢查編輯",
  saveEditedPost: "儲存編輯",
  editReview:
    "以 {account} 檢查貼文 {post} 的修訂 {value}。儲存將更改現有貼文及所選選項。",
  editRepeatWarning:
    "上次儲存結果仍未知。再次儲存可能重複產生效果並覆蓋期間的更改，無法撤銷原嘗試。",
  latestServerVersion: "伺服器最新版本",
  editCompare:
    "本機內容已保留。請比較完整原始碼、選項及附件參照。論壇無法提供原子衝突鎖定。",
  latestServerSource: "伺服器最新原始碼",
  attachmentReferences: "附件參照",
  attachmentDescription: "說明",
  attachmentReadPermission: "閱讀權限",
  attachmentPrice: "價格",
  attachmentAssociation: "現有關聯",
  reloadLatest: "重新載入最新版本",
  reconcileManually: "手動整合",
  manualEditExplanation:
    "手動整合保留本機標題和原始碼，並採用伺服器最新選項及附件資訊。儲存前請再次檢查可編輯選項。",
  saveMyVersion: "儲存我的版本",
  reloadEditWarning:
    "重新載入將捨棄目前本機原始碼和選項，不會刪除論壇內容或附件。",
  keepLocalWriting: "保留本機內容",
  discardReloadLatest: "捨棄本機更改並載入最新版本",
  overwriteEditWarning:
    "儲存你的版本可能覆蓋伺服器最新更改。檢查後仍可能發生並行更改，無法保證原子衝突防護。",
  acceptOverwriteReview: "接受覆蓋並檢查",
  replaceEditWarning:
    "編輯此貼文將取代保留的寫作內容。捨棄本機內容不會刪除論壇內容或附件。",
  discardAndEdit: "捨棄本機內容並編輯貼文",
  keepCurrentWriting: "保留目前內容",
  disabledOption: "已停用",
  noReferences: "無",

  draftAttempt: "草稿操作 {value}",
  checkOriginalDraft: "核對原草稿操作 {value}",
  reviewDraftResend: "檢查草稿重新傳送 {value}",
  draftAttemptTarget: "草稿 {thread}，貼文 {post}",
  draftAttemptDetails:
    "{value} · {account} · 版塊 {board} · {target} · 版本 {revision}",
  draftResendWarning:
    "此操作可能重複建立草稿或發佈內容，並重複原版建立指令的影響。原操作結果仍未知。此次重新傳送使用下方所示的目前版本，並重新驗證論壇表單。確認前請檢查選項及已知的論壇費用。",
  cancelDraftResend: "取消草稿重新傳送",
  confirmDraftResend: "確認草稿重新傳送",
  draftCreationInstructions:
    "初次建立指令與原儲存操作一起保留。草稿更新及發佈使用目前原版控制項；未確認動態或通知已送達。",
  draftIn: "{value} 中的論壇草稿",
  draftIdentity:
    "論壇草稿編號：{value}。儲存需要明確操作；本機保留不會更新論壇。",
  publishSavedDraft: "發佈已儲存的草稿",
  loadDrafts: "載入論壇草稿",
  resumeDraft: "繼續編輯 {value}",
  draftPage: "草稿第 {value} 頁",
  draftPages: "草稿分頁",
  saveForumDraft: "儲存論壇草稿",
  saveDraftContinue: "儲存論壇草稿並繼續",
  discardResumeDraft: "捨棄本機修改並繼續編輯草稿",
  checkDraftRevision: "在 {value} 中核對已儲存版本",
  checkDraftSave: "核對原儲存結果",

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
  aboutDescription: "TSDM 工作區 0.4.0。閱讀使用目前論壇帳號。",
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
  draftsOverview:
    "載入論壇草稿、繼續編輯完整來源並明確儲存版本。本機復原與論壇草稿分開。",
  savedBoards: "版塊",
  savedThreads: "主題",
  searchScope: "主題與作者條件",
  noticesScope: "回覆、提及、系統與動態通知",
  draftsScope: "已儲存的論壇草稿",
  replyComparison: "回覆原始碼比較",
  replyBeforeSource: "傳送前的完整原始碼",
  replyObservedSource: "結果的完整實測原始碼",
  replyComparisonLimits:
    "已知的先前內容和目前原始碼只是觀察結果，不代表已確認合併規則或通知送達。提交的原始碼另外保留。",
  replyBeforeUnknown: "未觀察到這個返回帖子的先前原始碼。",
  mentions: "提及",
  findMentionPerson: "尋找要提及的用戶",
  findMention: "尋找用戶",
  mentionPerson: "提及 {value}（UID {id}）",
  quickQuote: "快速引用",
  addressedTo: "回覆對象：{value} · 帖子 {post}",
  replyDeliveryUnknown:
    "引用原始碼不會更改回覆對象。引用和提及的通知送達狀態未確認。",
  replyToThread: "回覆主題",
  replyIn: "回覆主題 {value}",
  sendReply: "傳送回覆",
  openConfirmedPost: "開啟已確認的帖子",
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
  openConfirmedThread: "開啟已確認的主題",
  normalizedStoredPrice: "儲存售價為 0（由提交的空值正規化）。",
  deliveryUnverified: "尚未驗證送達",
  effectNotRequested: "未請求",
  effectNotIncluded: "未包含在提交指令中",
  legacyStoredConfirmation:
    "先前的儲存確認。此舊版結果沒有獨立的正規化或建立影響證據。",
  candidateThreadURL: "待檢查的主題網址",
  checkThreadResult: "檢查結果",
  prepareAnotherAttempt: "準備再次嘗試",
  duplicatePublicationWarning:
    "先前嘗試的結果仍未知。再次傳送可能建立重複主題並重複其影響，而且無法撤銷首次嘗試。",
  keepOriginalAttempt: "保留原嘗試",
  acceptDuplicateReview: "接受重複風險並檢查",
  reviewPublication: "檢查發佈",
  publicationReview:
    "檢查 {account} 在 {board} 的第 {value} 版。發佈可能建立公開主題，並採用所選售價和閱讀權限。",
  replyPublicationReview:
    "檢查 {account} 在 {board} 版塊主題 {thread} 中的回覆修訂 {value}。傳送可能新增回覆，也可能合併到已有帖子。",
  publishThread: "發佈主題",
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
  "The writing context or account changed while reading files. Select them again for the current writing.":
    [
      "读取文件时编辑上下文或账号已改变。请为当前编辑重新选择文件。",
      "讀取檔案時編輯內容或帳號已改變。請為目前編輯重新選擇檔案。",
    ],
  "The selected files could not be read. Select them again.": [
    "无法读取所选文件。请重新选择。",
    "無法讀取所選檔案。請重新選擇。",
  ],

  "Finish uploads or explicitly remove pending selections before saving or publishing a draft.":
    [
      "请完成上传或明确移除待处理的选择后再保存或发布草稿。",
      "請完成上傳或明確移除待處理的選擇後再儲存或發佈草稿。",
    ],
  "Finish uploads or explicitly remove pending selections before submitting.": [
    "请完成上传或明确移除待处理的选择后再提交。",
    "請完成上傳或明確移除待處理的選擇後再提交。",
  ],
  "Local selection removed. No remote file was deleted; an interrupted upload may remain on the forum.":
    [
      "已移除本地选择。未删除远程文件；中断的上传可能仍保留在论坛。",
      "已移除本機選擇。未刪除遠端檔案；中斷的上傳可能仍保留在論壇。",
    ],
  "The account changed during attachment validation. Nothing was sent.": [
    "验证附件期间账号已更改。未发送任何内容。",
    "驗證附件期間帳號已更改。未傳送任何內容。",
  ],
  "The current draft changed during attachment validation. Nothing was sent.": [
    "验证附件期间当前草稿已更改。未发送任何内容。",
    "驗證附件期間目前草稿已更改。未傳送任何內容。",
  ],
  "Current attachment association is unconfirmed. Check the original draft attempt before saving again.":
    [
      "当前附件关联未确认。再次保存前请检查原草稿尝试。",
      "目前附件關聯未確認。再次儲存前請檢查原草稿嘗試。",
    ],
  "The observed draft content differs from the original submission. Resume its current revision before saving; no resend was sent.":
    [
      "观察到的草稿内容与原提交不同。保存前请恢复当前版本；未重新发送。",
      "觀察到的草稿內容與原提交不同。儲存前請恢復目前版本；未重新傳送。",
    ],
  "The account changed during attachment validation. Review again; nothing was sent.":
    [
      "验证附件时账号已改变。请重新审核；未发送任何内容。",
      "驗證附件時帳號已改變。請重新審核；未傳送任何內容。",
    ],
  "The account or preparation changed during attachment validation. Nothing was sent.":
    [
      "验证附件时账号或准备内容已改变。未发送任何内容。",
      "驗證附件時帳號或準備內容已改變。未傳送任何內容。",
    ],
  "The account changed before save. Nothing was sent.": [
    "保存前账号已改变。未发送任何内容。",
    "儲存前帳號已改變。未傳送任何內容。",
  ],
  "Server file removal verified. Source references are separate; remove any remaining tag before saving.":
    [
      "已验证服务器文件移除。正文引用是独立内容；保存前请移除任何剩余标签。",
      "已驗證伺服器檔案移除。正文引用是獨立內容；儲存前請移除任何剩餘標籤。",
    ],

  "Review the complete source and resolve its interpretation before publication.":
    [
      "请检查完整源码，并在发布前明确其解释方式。",
      "請檢查完整原始碼，並在發佈前明確指定其解讀方式。",
    ],
  "A supported ordinary thread target is required.": [
    "需要支持的普通主题目标。",
    "需要支援的普通主題目標。",
  ],
  "A newer action replaced reply preparation.": [
    "较新的操作已替代回复准备。",
    "較新的操作已取代回覆準備。",
  ],
  "The reply form could not be reached. Your writing is retained.": [
    "无法获取回复表单。已保留写作内容。",
    "無法取得回覆表單。已保留寫作內容。",
  ],
  "The reply target controls are ambiguous or unsupported.": [
    "回复对象控件不明确或不受支持。",
    "回覆對象控制項不明確或不受支援。",
  ],
  "The native addressed target did not match the selected post.": [
    "原生回复对象与所选帖子不符。",
    "原生回覆對象與所選帖子不符。",
  ],
  "An ordinary reply unexpectedly contains an addressed target.": [
    "普通回复意外包含特定回复对象。",
    "普通回覆意外包含特定回覆對象。",
  ],
  "A selected mention identity changed or could not be revalidated. Resolve the person again.":
    [
      "所选提及身份已改变或无法重新验证。请重新查找用户。",
      "所選提及身分已變更或無法重新驗證。請重新尋找用戶。",
    ],
  "A selected mention identity changed before send. Nothing was sent.": [
    "所选提及身份在发送前已改变。未发送任何内容。",
    "所選提及身分在傳送前已變更。未傳送任何內容。",
  ],
  "The account or preparation changed during prior-source observation.": [
    "读取先前源码时，账号或准备状态已改变。",
    "讀取先前原始碼時，帳號或準備狀態已變更。",
  ],
  "A previously observed post changed before send. Review the current reply again; nothing was sent.":
    [
      "先前观察的帖子在发送前已改变。请重新检查当前回复；未发送任何内容。",
      "先前觀察的帖子在傳送前已變更。請重新檢查目前回覆；未傳送任何內容。",
    ],
  "The account changed before send. Nothing was sent.": [
    "账号在发送前已改变。未发送任何内容。",
    "帳號在傳送前已變更。未傳送任何內容。",
  ],
  "The returned post existed before sending. Complete before and observed source are retained for comparison; a merged result has not been confirmed.":
    [
      "返回的帖子在发送前已存在。已保留完整的先前及实测源码以供比较；尚未确认合并结果。",
      "返回的帖子在傳送前已存在。已保留完整的先前及實測原始碼以供比較；尚未確認合併結果。",
    ],
  "Enter a person name or UID to resolve.": [
    "请输入用户名或 UID。",
    "請輸入用戶名稱或 UID。",
  ],
  "The account changed during mention lookup. Resolve the person again.": [
    "查找提及用户时账号已改变。请重新查找。",
    "尋找提及用戶時帳號已變更。請重新尋找。",
  ],
  "The current forum mention service could not resolve this person. Plain text was preserved.":
    [
      "当前论坛提及服务无法确认这个用户。已保留原文。",
      "目前論壇提及服務無法確認這個用戶。已保留原文。",
    ],
  "A valid owned-post destination is required.": [
    "需要有效的本人帖子目标。",
    "需要有效的本人貼文目標。",
  ],
  "A newer account request replaced this edit preparation.": [
    "较新的账号请求替代了此次编辑准备。",
    "較新的帳號請求取代了此次編輯準備。",
  ],
  "The owned post could not be established. Your writing is retained.": [
    "无法确认本人帖子。写作内容已保留。",
    "無法確認本人貼文。寫作內容已保留。",
  ],
  "Only the current account's own post can be edited.": [
    "只能编辑当前账号自己的帖子。",
    "只能編輯目前帳號自己的貼文。",
  ],
  "Actual editable source and current options are unavailable. Rendered content cannot replace complete source.":
    [
      "无法获取实际可编辑源码和当前选项。渲染内容不能替代完整源码。",
      "無法取得實際可編輯原始碼和目前選項。呈現內容不能取代完整原始碼。",
    ],
  "The editable source could not be reached. Your writing is retained.": [
    "无法获取可编辑源码。写作内容已保留。",
    "無法取得可編輯原始碼。寫作內容已保留。",
  ],
  "A complete owned-post edit revision is required.": [
    "需要完整的本人帖子编辑版本。",
    "需要完整的本人貼文編輯版本。",
  ],
  "Actual current source, options or original account are unavailable. Editing remains paused.":
    [
      "无法获取实际当前源码、选项或原账号。编辑继续暂停。",
      "無法取得實際目前原始碼、選項或原帳號。編輯繼續暫停。",
    ],
  "The server post changed. Review latest source, options and attachments before saving your version.":
    [
      "服务器帖子已更改。保存你的版本前请检查最新源码、选项和附件。",
      "伺服器貼文已更改。儲存你的版本前請檢查最新原始碼、選項和附件。",
    ],
  "Required current form content or attachment references cannot be preserved. Nothing was sent.":
    [
      "无法保留所需的当前表单内容或附件引用。未发送任何内容。",
      "無法保留所需的目前表單內容或附件參照。未傳送任何內容。",
    ],
  "Fresh edit preparation failed. Local writing is retained.": [
    "重新准备编辑失败。本地写作内容已保留。",
    "重新準備編輯失敗。本機寫作內容已保留。",
  ],
  "The original edit target is unavailable.": [
    "原编辑目标不可用。",
    "原編輯目標無法使用。",
  ],
  "The account changed while checking the saved post.": [
    "检查已保存帖子期间账号发生更改。",
    "檢查已儲存貼文期間帳號發生更改。",
  ],
  "Saved actor or post could not be independently established.": [
    "无法独立确认已保存的作者或帖子。",
    "無法獨立確認已儲存的作者或貼文。",
  ],
  "Complete saved source, options or attachment references are unavailable or differ. No confirmation is claimed.":
    [
      "完整的已保存源码、选项或附件引用不可用或不一致。尚未确认保存。",
      "完整的已儲存原始碼、選項或附件參照無法取得或不一致。尚未確認儲存。",
    ],
  "Moderation remains pending. Saved source matches, but the existing public post does not prove this edited revision was released.":
    [
      "审核仍在等待中。已保存源码相符，但现有公开帖子不能证明此编辑版本已发布。",
      "審核仍在等待中。已儲存原始碼相符，但現有公開貼文不能證明此編輯版本已發佈。",
    ],
  "Saved post readback failed. Check this original attempt; nothing was repeated.":
    [
      "读取已保存帖子失败。请检查原尝试；未重复发送。",
      "讀取已儲存貼文失敗。請檢查原嘗試；未重複傳送。",
    ],
  "This edit preparation is stale or already active. Nothing was sent.": [
    "此次编辑准备已过期或正在进行。未发送任何内容。",
    "此次編輯準備已過期或正在進行。未傳送任何內容。",
  ],
  "Current source or original account changed before save. Review again.": [
    "保存前当前源码或原账号已更改。请重新检查。",
    "儲存前目前原始碼或原帳號已更改。請重新檢查。",
  ],
  "The server post changed before save. Review latest source again; nothing was sent.":
    [
      "保存前服务器帖子已更改。请重新检查最新源码；未发送任何内容。",
      "儲存前伺服器貼文已更改。請重新檢查最新原始碼；未傳送任何內容。",
    ],
  "Required current form content cannot be preserved. Nothing was sent.": [
    "无法保留所需的当前表单内容。未发送任何内容。",
    "無法保留所需的目前表單內容。未傳送任何內容。",
  ],
  "The account changed during save. The edit may have been accepted; no rollback is guaranteed.":
    [
      "保存期间账号已更改。编辑可能已被接受；无法保证回滚。",
      "儲存期間帳號已更改。編輯可能已被接受；無法保證回復。",
    ],
  "The edit response was lost. Check the original saved post; nothing was repeated.":
    [
      "编辑响应丢失。请检查原已保存帖子；未重复发送。",
      "編輯回應遺失。請檢查原已儲存貼文；未重複傳送。",
    ],
  "Fresh edit preflight failed. Your source remains retained.": [
    "保存前重新检查失败。源码仍已保留。",
    "儲存前重新檢查失敗。原始碼仍已保留。",
  ],
  "Local writing changed while loading the edit. Review replacement again.": [
    "加载编辑期间本地内容已更改。请重新检查替换操作。",
    "載入編輯期間本機內容已更改。請重新檢查取代操作。",
  ],
  "Reconcile your local source and options with the latest server version, then review the edit again.":
    [
      "请将本地源码和选项与服务器最新版本手动整合，然后重新检查编辑。",
      "請將本機原始碼和選項與伺服器最新版本手動整合，然後重新檢查編輯。",
    ],
  "Existing attachment controls are unavailable or cannot be preserved safely.":
    [
      "现有附件控件不可用或无法安全保留。",
      "現有附件控制項無法取得或無法安全保留。",
    ],

  "The forum returned a different or unsupported draft list.": [
    "论坛返回了不同或不支持的草稿列表。",
    "論壇回傳了不同或不支援的草稿清單。",
  ],
  "The draft list could not be interpreted.": [
    "无法解析草稿列表。",
    "無法解析草稿清單。",
  ],
  "Complete native verification before loading drafts.": [
    "请先在原版论坛完成验证，再载入草稿。",
    "請先在原版論壇完成驗證，再載入草稿。",
  ],
  "Sign in before loading forum drafts.": [
    "请先登录再载入论坛草稿。",
    "請先登入再載入論壇草稿。",
  ],
  "The current account cannot read these drafts.": [
    "当前账号无法读取这些草稿。",
    "目前帳號無法讀取這些草稿。",
  ],
  "The forum is limiting draft requests.": [
    "论坛正在限制草稿请求。",
    "論壇正在限制草稿請求。",
  ],
  "A complete current-account draft list is required.": [
    "需要当前账号的完整草稿列表。",
    "需要目前帳號的完整草稿清單。",
  ],
  "The forum draft filter or list structure is unavailable.": [
    "论坛草稿筛选或列表结构不可用。",
    "論壇草稿篩選或清單結構無法使用。",
  ],
  "A draft row could not be interpreted; the list is not complete.": [
    "无法解析一个草稿项目；列表不完整。",
    "無法解析一個草稿項目；清單不完整。",
  ],
  "A draft row has ambiguous identity.": [
    "草稿项目的身份不明确。",
    "草稿項目的身分不明確。",
  ],
  "A draft row has unsupported or repeated identity.": [
    "草稿项目的身份不支持或重复。",
    "草稿項目的身分不支援或重複。",
  ],
  "No authoritative empty draft list was returned.": [
    "未收到论坛明确确认的空草稿列表。",
    "未收到論壇明確確認的空草稿清單。",
  ],
  "The draft pager returned an unsupported destination.": [
    "草稿分页返回了不支持的目标。",
    "草稿分頁回傳了不支援的目標。",
  ],
  "This draft page was not offered by the current list.": [
    "当前列表未提供这个草稿页面。",
    "目前清單未提供這個草稿頁面。",
  ],
  "A newer request replaced this draft list.": [
    "较新的请求已取代此草稿列表。",
    "較新的請求已取代此草稿清單。",
  ],
  "The account changed while loading drafts. Load the current account's list explicitly.":
    [
      "载入草稿时账号已变更。请主动载入当前账号的列表。",
      "載入草稿時帳號已變更。請主動載入目前帳號的清單。",
    ],
  "The draft list is incomplete.": ["草稿列表不完整。", "草稿清單不完整。"],
  "The forum draft list could not be reached.": [
    "无法连接论坛草稿列表。",
    "無法連線論壇草稿清單。",
  ],
  "The same draft is no longer listed for the expected account.": [
    "预期账号的列表已没有同一份草稿。",
    "預期帳號的清單已沒有同一份草稿。",
  ],
  "The account changed during draft preparation.": [
    "准备草稿时账号已变更。",
    "準備草稿時帳號已變更。",
  ],
  "The draft board or thread could not be independently verified.": [
    "无法独立核实草稿的版块或主题。",
    "無法獨立核實草稿的版塊或主題。",
  ],
  "The draft opening-post owner is unverified.": [
    "尚未核实草稿首帖的作者。",
    "尚未核實草稿首帖的作者。",
  ],
  "The thread is not independently confirmed as an unpublished draft.": [
    "尚未独立确认此主题为未发布的草稿。",
    "尚未獨立確認此主題為未發佈的草稿。",
  ],
  "The account changed during saved-source readback.": [
    "重新读取已保存来源时账号已变更。",
    "重新讀取已儲存來源時帳號已變更。",
  ],
  "The draft could not be independently read. Existing writing is retained.": [
    "无法独立读取草稿。现有写作内容已保留。",
    "無法獨立讀取草稿。現有寫作內容已保留。",
  ],
  "The save may have succeeded. Select the actual draft from Drafts to check this original attempt; no save was repeated.":
    [
      "保存可能已成功。请从草稿列表选择实际草稿来核对原操作；未重复保存。",
      "儲存可能已成功。請從草稿清單選擇實際草稿來核對原操作；未重複儲存。",
    ],
  "This record predates this save, differs from its original target, or the pre-send list was not retained. It cannot confirm this original attempt. No save was repeated.":
    [
      "此记录早于本次保存、与原目标不同，或发送前的列表未被保留。它不能确认原操作。未重复保存。",
      "此紀錄早於本次儲存、與原目標不同，或傳送前的清單未被保留。它不能確認原操作。未重複儲存。",
    ],
  "The same draft's complete saved revision could not be confirmed. No save was repeated.":
    [
      "无法确认同一草稿的完整已保存版本。未重复保存。",
      "無法確認同一草稿的完整已儲存版本。未重複儲存。",
    ],
  "The original draft publication identity is unavailable.": [
    "原草稿发布身份不可用。",
    "原草稿發佈身分無法使用。",
  ],
  "The record is still an unpublished forum draft. Publication is not confirmed; no action was repeated.":
    [
      "该记录仍是未发布的论坛草稿。尚未确认发布；未重复操作。",
      "該紀錄仍是未發佈的論壇草稿。尚未確認發佈；未重複操作。",
    ],
  "The draft remains listed but its current state is unverified.": [
    "草稿仍在列表中，但当前状态尚未核实。",
    "草稿仍在清單中，但目前狀態尚未核實。",
  ],
  "The actual published thread could not be independently read for the original account.":
    [
      "无法以原账号独立读取实际发布的主题。",
      "無法以原帳號獨立讀取實際發佈的主題。",
    ],
  "The resulting thread identity, author or published state did not match the original draft.":
    [
      "结果主题的身份、作者或发布状态与原草稿不符。",
      "結果主題的身分、作者或發佈狀態與原草稿不符。",
    ],
  "The resulting thread has native state restrictions. Public thread publication has not been confirmed.":
    [
      "结果主题仍有论坛状态限制。尚未确认主题已公开发布。",
      "結果主題仍有論壇狀態限制。尚未確認主題已公開發佈。",
    ],
  "The complete published source or account could not be confirmed. No publication was repeated.":
    [
      "无法确认完整已发布来源或账号。未重复发布。",
      "無法確認完整已發佈來源或帳號。未重複發佈。",
    ],
  "Publication may have succeeded, but independent draft and stored-source readback failed. No action was repeated.":
    [
      "发布可能已成功，但独立读取草稿及已保存来源失败。未重复操作。",
      "發佈可能已成功，但獨立讀取草稿及已儲存來源失敗。未重複操作。",
    ],
  "This draft publication is stale or already active. Nothing was sent.": [
    "此草稿发布已过期或正在执行。未发送内容。",
    "此草稿發佈已過期或正在執行。未傳送內容。",
  ],
  "The saved draft or account changed before publication. Current writing is retained.":
    [
      "发布前，已保存草稿或账号发生变更。当前写作内容已保留。",
      "發佈前，已儲存草稿或帳號發生變更。目前寫作內容已保留。",
    ],
  "The current saved draft changed before publication. Nothing was sent.": [
    "发布前已保存草稿发生变更。未发送内容。",
    "發佈前已儲存草稿發生變更。未傳送內容。",
  ],
  "The current native draft publication controls are unsupported. Nothing was sent.":
    [
      "不支持当前原版草稿发布控件。未发送内容。",
      "不支援目前原版草稿發佈控制項。未傳送內容。",
    ],
  "The account changed during draft publication. Possible effects are retained.":
    [
      "发布草稿时账号已变更。可能产生的影响仍被保留。",
      "發佈草稿時帳號已變更。可能產生的影響仍被保留。",
    ],
  "The forum reports moderation. Public thread publication has not been confirmed.":
    [
      "论坛报告需要审核。尚未确认主题已公开发布。",
      "論壇報告需要審核。尚未確認主題已公開發佈。",
    ],
  "Draft publication may have succeeded. Check the original attempt before another deliberate action.":
    [
      "草稿发布可能已成功。再次主动操作前，请核对原操作。",
      "草稿發佈可能已成功。再次主動操作前，請核對原操作。",
    ],
  "Fresh draft publication preparation failed. Nothing was sent.": [
    "重新准备草稿发布失败。未发送内容。",
    "重新準備草稿發佈失敗。未傳送內容。",
  ],
  "Fresh draft-save preparation failed or the account changed. Nothing was sent.":
    [
      "重新准备草稿保存失败或账号已变更。未发送内容。",
      "重新準備草稿儲存失敗或帳號已變更。未傳送內容。",
    ],
  "This draft attempt is stale or already active. Nothing was sent.": [
    "此草稿操作已过期或正在执行。未发送内容。",
    "此草稿操作已過期或正在執行。未傳送內容。",
  ],
  "The remote draft changed or is no longer available. Resume its current revision before saving; your local writing is retained.":
    [
      "论坛草稿已变更或不可用。保存前请继续编辑其当前版本；本地写作内容已保留。",
      "論壇草稿已變更或無法使用。儲存前請繼續編輯其目前版本；本機寫作內容已保留。",
    ],
  "The account changed before draft saving. Nothing was sent.": [
    "保存草稿前账号已变更。未发送内容。",
    "儲存草稿前帳號已變更。未傳送內容。",
  ],
  "The current draft form changed. Your writing is retained; nothing was sent.":
    [
      "当前草稿表单已变更。写作内容已保留；未发送内容。",
      "目前草稿表單已變更。寫作內容已保留；未傳送內容。",
    ],
  "The current attachment references changed before saving. Nothing was sent; original source and metadata are retained.":
    [
      "保存前当前附件引用已变更。未发送内容；原来源及元数据已保留。",
      "儲存前目前附件參照已變更。未傳送內容；原來源及中繼資料已保留。",
    ],
  "The current native draft-save controls are unsupported. Nothing was sent.": [
    "不支持当前原版草稿保存控件。未发送内容。",
    "不支援目前原版草稿儲存控制項。未傳送內容。",
  ],
  "The account changed during saving. Possible effects and original writing are retained.":
    [
      "保存期间账号已变更。可能产生的影响及原写作内容已保留。",
      "儲存期間帳號已變更。可能產生的影響及原寫作內容已保留。",
    ],
  "The forum rejected draft saving. Your writing is retained.": [
    "论坛拒绝保存草稿。写作内容已保留。",
    "論壇拒絕儲存草稿。寫作內容已保留。",
  ],
  "Draft saving may have succeeded. Check the original attempt before saving again; your writing is retained.":
    [
      "保存草稿可能已成功。再次保存前请核对原操作；写作内容已保留。",
      "儲存草稿可能已成功。再次儲存前請核對原操作；寫作內容已保留。",
    ],
  "Draft preparation failed. Nothing was sent and writing is retained.": [
    "准备草稿失败。未发送内容，写作内容已保留。",
    "準備草稿失敗。未傳送內容，寫作內容已保留。",
  ],
  "The draft resend proposal changed. Review the current action, account and revision again. Nothing was sent.":
    [
      "草稿重新发送方案已变更。请重新检查当前操作、账号及版本。未发送内容。",
      "草稿重新傳送方案已變更。請重新檢查目前操作、帳號及版本。未傳送內容。",
    ],
  "Pending draft publication restored as uncertain. Nothing was replayed.": [
    "待处理的草稿发布已恢复为结果未知。未重放操作。",
    "待處理的草稿發佈已恢復為結果未知。未重播操作。",
  ],
  "Saving forum draft…": ["正在保存论坛草稿…", "正在儲存論壇草稿…"],
  "Publishing the confirmed saved forum draft…": [
    "正在发布已确认保存的论坛草稿…",
    "正在發佈已確認儲存的論壇草稿…",
  ],
  "Pending draft save restored as uncertain. Nothing was replayed.": [
    "待处理草稿操作已恢复为结果不确定。未重放任何操作。",
    "待處理草稿操作已還原為結果不確定。未重播任何操作。",
  ],
  "Writing changed while the draft was loading. Your current writing is retained.":
    [
      "载入草稿时写作内容发生变更。当前写作内容已保留。",
      "載入草稿時寫作內容發生變更。目前寫作內容已保留。",
    ],
  "Writing changed during draft-save preparation. Nothing was sent.": [
    "准备保存草稿时写作内容发生变更。未发送内容。",
    "準備儲存草稿時寫作內容發生變更。未傳送內容。",
  ],
  "An earlier draft save may have succeeded. Check its original result before another save.":
    [
      "较早的草稿保存可能已成功。再次保存前请核对原结果。",
      "較早的草稿儲存可能已成功。再次儲存前請核對原結果。",
    ],
  "Draft saving was not sent because the acknowledged revision changed.": [
    "已确认保留的版本发生变更，因此未发送草稿保存。",
    "已確認保留的版本發生變更，因此未傳送草稿儲存。",
  ],
  "An earlier draft operation remains unresolved or already published. Check the original result; no action was repeated.":
    [
      "较早的草稿操作仍未确定或已发布。请核对原结果；未重复操作。",
      "較早的草稿操作仍未確定或已發佈。請核對原結果；未重複操作。",
    ],
  "Draft publication was not sent because the acknowledged revision changed.": [
    "已确认保留的版本发生变更，因此未发送草稿发布。",
    "已確認保留的版本發生變更，因此未傳送草稿發佈。",
  ],
  "This context has a forum draft or unresolved save. It cannot create a separate new thread. Use the explicit draft publication workflow.":
    [
      "此写作内容已有论坛草稿或未确定的保存结果，不能另建新主题。请使用明确的草稿发布操作。",
      "此寫作內容已有論壇草稿或未確定的儲存結果，不能另建新主題。請使用明確的草稿發佈操作。",
    ],

  "The forum reports pending moderation. Public stored source has not been confirmed.":
    [
      "论坛报告正在等待审核。尚未确认公开储存的源码。",
      "論壇回報正在等候審核。尚未確認公開儲存的原始碼。",
    ],
  "The forum explicitly refused validation. Nothing is confirmed published.": [
    "论坛明确拒绝了验证。尚未确认发布任何内容。",
    "論壇明確拒絕了驗證。尚未確認發佈任何內容。",
  ],
  "The publication outcome is uncertain. Check the original attempt before considering another send.":
    [
      "发布结果不确定。考虑再次发送前，请检查原尝试。",
      "發佈結果不確定。考慮再次傳送前，請檢查原嘗試。",
    ],
  "No supported candidate thread URL is available. Enter its thread URL to check this original attempt.":
    [
      "没有可用的受支持主题网址。请输入主题网址以检查原尝试。",
      "沒有可用的受支援主題網址。請輸入主題網址以檢查原嘗試。",
    ],
  "The account changed during result checking. Original writing and possible effects are retained.":
    [
      "检查结果时账号发生变化。保留原写作内容和可能产生的影响。",
      "檢查結果時帳號發生變更。保留原寫作內容和可能產生的影響。",
    ],
  "The candidate thread could not be independently read. Publication remains uncertain.":
    [
      "无法独立读取待检查的主题。发布结果仍不确定。",
      "無法獨立讀取待檢查的主題。發佈結果仍不確定。",
    ],
  "Candidate actor, board, title or opening-post identity did not match the submitted revision.":
    [
      "待检查主题的作者、版块、标题或首帖身份与提交版本不符。",
      "待檢查主題的作者、版塊、標題或首帖身分與提交版本不符。",
    ],
  "The account changed during stored-source readback. Possible publication remains uncertain.":
    [
      "回读已储存源码时账号发生变化。可能已发布，但结果仍不确定。",
      "回讀已儲存原始碼時帳號發生變更。可能已發佈，但結果仍不確定。",
    ],
  "Complete stored source or offered options did not match, or were unavailable. No confirmation is claimed.":
    [
      "完整储存源码或所提供选项不符或无法取得。尚未确认发布成功。",
      "完整儲存原始碼或所提供選項不符或無法取得。尚未確認發佈成功。",
    ],
  "Independent stored-result readback failed. Publication remains uncertain; no send was repeated.":
    [
      "独立回读储存结果失败。发布结果仍不确定；没有重复发送。",
      "獨立回讀儲存結果失敗。發佈結果仍不確定；沒有重複傳送。",
    ],
  "A title, complete source and valid ordinary new-thread revision are required.":
    [
      "需要标题、完整源码和有效的普通新主题版本。",
      "需要標題、完整原始碼和有效的普通新主題版本。",
    ],
  "The account changed or expired during preparation. Original writing remains paused.":
    [
      "准备期间账号发生变化或已过期。原写作内容保持暂停发送。",
      "準備期間帳號發生變更或已過期。原寫作內容保持暫停傳送。",
    ],
  "The current native options changed or are unavailable. Review the current form before publication; no values were reset.":
    [
      "当前原生选项已变化或无法取得。发布前请检查当前表单；没有重设任何值。",
      "目前原生選項已變更或無法取得。發佈前請檢查目前表單；沒有重設任何值。",
    ],
  "The current native successful controls or required values are unsupported. Nothing was sent.":
    [
      "不支持当前原生表单的提交控件或必要值。没有发送任何内容。",
      "不支援目前原生表單的提交控制項或必要值。沒有傳送任何內容。",
    ],
  "Fresh publication preparation failed. Your writing remains here.": [
    "重新准备发布失败。写作内容仍保留在这里。",
    "重新準備發佈失敗。寫作內容仍保留在這裡。",
  ],
  "This preparation, account or attempt is stale or already active. Nothing was sent.":
    [
      "此准备、账号或尝试已失效或正在进行。没有发送任何内容。",
      "此準備、帳號或嘗試已失效或正在進行。沒有傳送任何內容。",
    ],
  "The account changed or expired before send. Original writing remains retained and paused.":
    [
      "发送前账号已变化或过期。保留原写作内容并暂停发送。",
      "傳送前帳號已變更或過期。保留原寫作內容並暫停傳送。",
    ],
  "The current form changed before send. Nothing was sent; review again.": [
    "发送前当前表单已变化。没有发送任何内容；请重新检查。",
    "傳送前目前表單已變更。沒有傳送任何內容；請重新檢查。",
  ],
  "The current successful controls changed before send. Nothing was sent.": [
    "发送前当前表单的提交控件已变化。没有发送任何内容。",
    "傳送前目前表單的提交控制項已變更。沒有傳送任何內容。",
  ],
  "The account changed while publication was in flight. It may have been accepted; no rollback or atomic account isolation is guaranteed.":
    [
      "发布请求进行期间账号发生变化。请求可能已被接受；无法保证回滚或账号的原子隔离。",
      "發佈請求進行期間帳號發生變更。請求可能已被接受；無法保證回滾或帳號的原子隔離。",
    ],
  "The response was lost. The forum may have accepted this attempt. Check result; no send was repeated.":
    [
      "响应已丢失。论坛可能已接受此尝试。请检查结果；没有重复发送。",
      "回應已遺失。論壇可能已接受此嘗試。請檢查結果；沒有重複傳送。",
    ],
  "Fresh preflight failed before publication was sent. Your writing is retained; review again deliberately.":
    [
      "发布发送前的重新检查失败。写作内容已保留；请主动重新检查。",
      "發佈傳送前的重新檢查失敗。寫作內容已保留；請主動重新檢查。",
    ],
  "Publication or result checking is pending. Keep this context until it settles.":
    [
      "发布或结果检查正在进行。请保留此写作内容，直到操作结束。",
      "發佈或結果檢查正在進行。請保留此寫作內容，直到操作結束。",
    ],
  "An earlier attempt may already exist. Check result, then explicitly accept duplicate risk before another send.":
    [
      "先前尝试可能已产生主题。再次发送前，请检查结果并明确接受重复风险。",
      "先前嘗試可能已產生主題。再次傳送前，請檢查結果並明確接受重複風險。",
    ],
  "Writing changed during publication preparation. Review the current revision again.":
    [
      "准备发布期间写作内容已变化。请重新检查当前版本。",
      "準備發佈期間寫作內容已變更。請重新檢查目前版本。",
    ],
  "Publication is pending. Refresh will retain it as uncertain without replay.":
    [
      "发布正在进行。刷新后将保留为不确定状态，不会重新发送。",
      "發佈正在進行。重新載入後將保留為不確定狀態，不會重新傳送。",
    ],
  "Publication was not sent because recovery, writing or the account changed before send. Your source is retained.":
    [
      "由于恢复、写作内容或账号在发送前变化，发布尚未发送。源码已保留。",
      "由於復原、寫作內容或帳號在傳送前變更，發佈尚未傳送。原始碼已保留。",
    ],
  "Pending publication restored as uncertain. Nothing has been replayed; check the original attempt.":
    [
      "进行中的发布已恢复为不确定状态。没有重新发送；请检查原尝试。",
      "進行中的發佈已復原為不確定狀態。沒有重新傳送；請檢查原嘗試。",
    ],
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
  const retained =
    "Previous stored confirmation retained. This recheck did not verify the current result. ";
  if (value.startsWith(retained))
    return (
      (language === "zh-CN"
        ? "保留先前的存储确认。本次检查未验证当前结果。"
        : "保留先前的儲存確認。本次檢查未驗證目前結果。") +
      description(value.slice(retained.length), language, nativeText)
    );
  const localized = descriptions[value];
  if (localized) return localized[language === "zh-CN" ? 0 : 1];
  const reply =
    /^Confirmed stored reply in thread (\d+), post (\d+), submitted revision (\d+)\.$/.exec(
      value,
    );
  if (reply)
    return language === "zh-CN"
      ? `已确认储存回复：主题 ${reply[1]}、帖子 ${reply[2]}，提交版本 ${reply[3]}。`
      : `已確認儲存回覆：主題 ${reply[1]}、帖子 ${reply[2]}，提交版本 ${reply[3]}。`;
  const partialDraft =
    /^(Draft|Published thread) (\d+) observed; submitted content (confirmed|unconfirmed); attachment associations (confirmed|unconfirmed)\. No (save|publication) was repeated\.$/.exec(
      value,
    );
  if (partialDraft) {
    const published = partialDraft[1] === "Published thread";
    const content = partialDraft[3] === "confirmed";
    const attachments = partialDraft[4] === "confirmed";
    return language === "zh-CN"
      ? `已观察到${published ? "已发布主题" : "草稿"} ${partialDraft[2]}；提交内容${content ? "已确认" : "未确认"}；附件关联${attachments ? "已确认" : "未确认"}。未重复${published ? "发布" : "保存"}。`
      : `已觀察到${published ? "已發佈主題" : "草稿"} ${partialDraft[2]}；提交內容${content ? "已確認" : "未確認"}；附件關聯${attachments ? "已確認" : "未確認"}。未重複${published ? "發佈" : "儲存"}。`;
  }
  const draftSave =
    /^Confirmed forum draft (\d+), submitted revision (\d+)\. Later changes remain unsaved\.$/.exec(
      value,
    );
  if (draftSave)
    return language === "zh-CN"
      ? `已确认论坛草稿 ${draftSave[1]} 的提交版本 ${draftSave[2]}。之后的修改尚未保存。`
      : `已確認論壇草稿 ${draftSave[1]} 的提交版本 ${draftSave[2]}。之後的修改尚未儲存。`;
  const draftPublish =
    /^Confirmed publication of forum draft (\d+), post (\d+)\. The draft list no longer contains this record\.$/.exec(
      value,
    );
  if (draftPublish)
    return language === "zh-CN"
      ? `已确认论坛草稿 ${draftPublish[1]} 发布为帖子 ${draftPublish[2]}。草稿列表已不含此记录。`
      : `已確認論壇草稿 ${draftPublish[1]} 發佈為帖子 ${draftPublish[2]}。草稿清單已不含此紀錄。`;
  const publication =
    /^Confirmed stored thread (\d+), post (\d+), submitted revision (\d+)\.$/.exec(
      value,
    );
  if (publication)
    return language === "zh-CN"
      ? `已确认储存主题 ${publication[1]}、帖子 ${publication[2]}，提交版本 ${publication[3]}。`
      : `已確認儲存主題 ${publication[1]}、帖子 ${publication[2]}，提交版本 ${publication[3]}。`;
  for (const [prefix, translated] of Object.entries(searchPrefixes)) {
    if (!value.startsWith(prefix)) continue;
    const suffix = value.slice(prefix.length);
    return (
      translated[language === "zh-CN" ? 0 : 1] +
      (nativeText === null ? description(suffix, language) : suffix)
    );
  }
  const editConfirmation =
    /^Confirmed saved post (\d+), submitted revision (\d+)\.$/.exec(value);
  if (editConfirmation)
    return language === "zh-CN"
      ? `已确认保存帖子 ${editConfirmation[1]}，提交修订 ${editConfirmation[2]}。`
      : `已確認儲存貼文 ${editConfirmation[1]}，提交修訂 ${editConfirmation[2]}。`;
  if (value.startsWith("Moderation remains pending. "))
    return `${language === "zh-CN" ? "审核仍在等待中。" : "審核仍在等待中。"}${description(value.slice("Moderation remains pending. ".length), language)}`;
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
