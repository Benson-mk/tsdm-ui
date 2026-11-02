export interface HostResponse {
  status: number;
  url: string;
  contentType: string;
  body: string;
  redirect?: "opaque" | "followed" | "none";
}
export interface FileResponse {
  status: number;
  url: string;
  contentType: string;
  contentLength: string | null;
  contentEncoding: string;
  disposition: string;
  redirected: boolean;
  bytes: Uint8Array;
}
export interface Attachment {
  id: string;
  name: string;
  url: string;
  details: string;
}
export type AttachmentResult =
  | {
      kind: "file";
      name: string;
      contentType: string;
      bytes: Uint8Array;
      generation: number;
    }
  | { kind: FailureKind; message: string };
export interface AttachmentRequest {
  threadURL: string;
  postId: string;
  attachmentId: string;
  account: Account;
}
export interface UploadCancellation {
  readonly aborted: boolean;
  addEventListener(
    type: "abort",
    listener: () => void,
    options?: { once?: boolean },
  ): void;
  removeEventListener(type: "abort", listener: () => void): void;
}
export interface UploadFile {
  name: string;
  type: string;
  bytes: Uint8Array;
}
export interface WritingUpload {
  key: string;
  name: string;
  type: string;
  size: number;
  status:
    | "selected"
    | "uploading"
    | "uploaded"
    | "uncertain"
    | "rejected"
    | "reselect"
    | "associated"
    | "removing"
    | "removal-uncertain"
    | "removed";
  serverId?: string;
  referenceKind?: "attach" | "attachimg";
  originalSha256?: string;
  storedPost?: { threadURL: string; postId: string };
  fields?: { name: string; value: string; disabled: boolean }[];
  message: string;
  loaded: number;
}
export type UploadResult =
  | {
      kind: "uploaded";
      referenceKind: "attach" | "attachimg";
      sha256: string;
      id: string;
      fields: { name: string; value: string; disabled: boolean }[];
    }
  | {
      kind: "not-sent" | "rejected" | "uncertain";
      message: string;
      id?: string;
    };
export interface ForumTransport {
  upload?(
    url: string,
    fields: { name: string; value: string }[],
    file: UploadFile,
    progress: (loaded: number) => void,
    signal: UploadCancellation,
  ): Promise<HostResponse>;
  requestFile?(url: string): Promise<FileResponse>;
  request(
    url: string,
    request?: { fresh?: boolean } & (
      | { method: "POST"; body: string }
      | { method?: undefined; body?: undefined }
    ),
  ): Promise<HostResponse>;
}
export type Account =
  | { kind: "member"; id: string; name: string }
  | { kind: "guest" }
  | { kind: "unknown" };
export type ContentNode =
  | { kind: "text"; text: string }
  | {
      kind: "element";
      tag: string;
      attributes: Record<string, string>;
      children: readonly ContentNode[];
    }
  | {
      kind: "unsupported";
      description: string;
      children: readonly ContentNode[];
    };
export interface Post {
  redPacketThreadId?: string;
  id: string;
  author: string;
  authorId: string | null;
  floor: string;
  date: string;
  url: string;
  content: ContentNode[];
  attachments?: Attachment[];
}
export interface ForumLink {
  label: string;
  url: string;
}
export interface Pagination {
  current: string;
  links: ForumLink[];
}
export interface Notice {
  id: string;
  time: string;
  body: ContentNode[];
}
export interface Notices {
  url: string;
  categories: (ForumLink & { current: boolean })[];
  entries: Notice[];
  pages: Pagination;
  empty: string;
  unread: { kind: "observed"; count: number } | { kind: "absent" | "unknown" };
}
export interface BoardLink extends ForumLink {
  id: string;
  description: string;
  stats: string;
}
export interface Directory {
  groups: { title: string; boards: BoardLink[] }[];
  url: string;
  pages: Pagination;
}
export interface ThreadRow extends ForumLink {
  id: string;
  rowId: string;
  pinned: boolean;
  moved: boolean;
  category: string;
  author: string;
  date: string;
  replies: string;
  views: string;
  lastPost: ForumLink | null;
}
export interface Board {
  id: string;
  title: string;
  url: string;
  boards: BoardLink[];
  threads: ThreadRow[];
  filters: ForumLink[];
  criteria: ForumLink[];
  pages: Pagination;
  empty: string;
}
export interface Thread {
  id: string;
  title: string;
  url: string;
  posts: Post[];
  pages: Pagination;
  filters: ForumLink[];
  parent: ForumLink | null;
  target: string | null;
  notices: string[];
}
export type FailureKind =
  | "cost"
  | "throttle"
  | "expired"
  | "limited"
  | "login"
  | "permission"
  | "missing"
  | "challenge"
  | "invalid"
  | "network"
  | "stale";
export type FavoriteKind = "thread" | "forum";
export interface FavoriteRecord {
  id: string;
  kind: FavoriteKind;
  targetId: string;
  url: string | null;
  title: string;
  time: string;
  note: string;
  removable: boolean;
  unavailableText?: string;
}
export interface Favorites {
  kind: FavoriteKind;
  url: string;
  records: FavoriteRecord[];
  pages: { current: string; links: ForumLink[] };
}
export type ReadResult =
  | {
      kind: "favorites";
      favorites: Favorites;
      account: Account;
      generation: number;
      sourceURL: string;
    }
  | {
      kind: "notices";
      notices: Notices;
      account: Account;
      generation: number;
      sourceURL: string;
    }
  | {
      kind: "search";
      search: Search;
      account: Account;
      generation: number;
      sourceURL: string;
    }
  | {
      kind: "document-navigation";
      message: string;
      destination: string;
      account: Account;
      generation: number;
      sourceURL: string;
    }
  | {
      kind: "directory";
      directory: Directory;
      account: Account;
      generation: number;
      sourceURL: string;
    }
  | {
      kind: "board";
      board: Board;
      account: Account;
      generation: number;
      sourceURL: string;
    }
  | {
      kind: "thread";
      thread: Thread;
      account: Account;
      generation: number;
      sourceURL: string;
    }
  | {
      kind: FailureKind;
      message: string;
      /** Native fragment in an authored wrapper; null means an authored fallback. Absent on older snapshots. */
      nativeText?: string | null;
      account: Account;
      generation: number;
      sourceURL: string;
    };
export type SearchCriteria = Record<string, string[]>;
export interface SearchField {
  name: string;
  label: string;
  /** Absent on older snapshots; only explicit false permits fallback translation. */
  labelFromForum?: boolean;
  kind: "text" | "select" | "choices";
  multiple: boolean;
  disabled: boolean;
  readOnly: boolean;
  maxLength: number | null;
  options: { value: string; label: string; disabled: boolean }[];
  values: string[];
}
export interface SearchForm {
  url: string;
  fields: SearchField[];
  restrictions: string[];
}
export interface SearchRow extends ForumLink {
  id: string;
  author: ForumLink;
  board: ForumLink;
  date: string;
  snippet: string;
  stats: string;
}
export interface SearchResults {
  id: string;
  url: string;
  summary: string;
  rows: SearchRow[];
  pages: Pagination;
}
export interface Search {
  form: SearchForm;
  edited: SearchCriteria;
  effective: SearchCriteria | null;
  submitted: SearchCriteria | null;
  results: SearchResults | null;
}
export type AttachmentRemovalResult = {
  kind: "removed" | "uncertain" | "not-sent";
  message: string;
  latest?: PreparedWriting;
};
export interface ForumClient {
  removeUploadedAttachment(
    writing: PreparedWriting,
    id: string,
    checkOnly?: boolean,
  ): Promise<AttachmentRemovalResult>;
  uploadAttachment(
    writing: PreparedWriting,
    file: UploadFile,
    progress: (loaded: number) => void,
    signal: UploadCancellation,
  ): Promise<UploadResult>;
  resumeDraft(
    row: DraftRow,
    expectedAccount: Account,
  ): Promise<PrepareWritingResult>;
  prepareDraftSave(attempt: DraftAttempt): Promise<DraftAttempt>;
  saveDraft(attempt: DraftAttempt): Promise<DraftAttempt>;
  publishDraft(attempt: DraftAttempt): Promise<DraftAttempt>;
  checkDraft(attempt: DraftAttempt, row?: DraftRow): Promise<DraftAttempt>;

  readDrafts(
    destination?: string,
    prior?: DraftList,
    expectedAccount?: Account,
  ): Promise<DraftListResult>;
  prepareFavorite(
    intent: FavoriteIntent,
    previousAttemptId?: string,
  ): Promise<FavoritePreparation>;
  changeFavorite(attempt: FavoriteAttempt): Promise<FavoriteAttempt>;
  checkFavoriteResult(attempt: FavoriteAttempt): Promise<FavoriteAttempt>;
  readNotices(
    destination: string,
    prior?: Notices,
    expectedAccount?: Account,
  ): Promise<ReadResult>;
  cancelDownload(): void;
  downloadAttachment(request: AttachmentRequest): Promise<AttachmentResult>;
  readSearchPage(
    url: string,
    prior: Search,
    expectedAccount: Account,
  ): Promise<ReadResult>;
  search(
    criteria: SearchCriteria,
    form: SearchForm,
    expectedAccount: Account,
  ): Promise<ReadResult>;
  findMention(writing: PreparedWriting, query: string): Promise<MentionResult>;
  preparePostEdit(
    threadURL: string,
    postId: string,
  ): Promise<PrepareWritingResult>;
  prepareEditPublication(
    submission: ThreadSubmission,
  ): Promise<PublicationPreparationResult>;
  savePostEdit(attempt: ThreadAttempt): Promise<ThreadAttempt>;
  checkEditResult(attempt: ThreadAttempt): Promise<ThreadAttempt>;
  prepareNewThread(
    boardId: string,
    redPacket?: boolean,
  ): Promise<PrepareWritingResult>;
  prepareReply(
    boardId: string,
    target: ReplyTarget,
  ): Promise<PrepareWritingResult>;
  prepareThreadPublication(
    submission: ThreadSubmission,
  ): Promise<PublicationPreparationResult>;
  publishThread(attempt: ThreadAttempt): Promise<ThreadAttempt>;
  checkThreadResult(
    attempt: ThreadAttempt,
    candidateURL?: string,
  ): Promise<ThreadAttempt>;
  readThread(url: string): Promise<ReadResult>;
  readPage(url: string, options?: { fresh?: boolean }): Promise<ReadResult>;
  readonly account: Account;
  readonly generation: number;
}

export interface WritingOption {
  minimum?: string;
  maximum?: string;
  step?: string;
  name: string;
  label: string;
  kind: "checkbox" | "select" | "text";
  value: string;
  checked: boolean;
  disabled: boolean;
  choices: { value: string; label: string; disabled: boolean }[];
  maxLength: number | null;
}
export interface MentionIdentity {
  id: string;
  name: string;
}
export type MentionResult =
  | {
      kind: "people";
      people: MentionIdentity[];
      generation: number;
      account: Account;
    }
  | {
      kind: FailureKind;
      message: string;
      generation: number;
      account: Account;
    };
export interface ReplyTarget {
  threadId: string;
  postId: string | null;
  author: string;
  authorId: string | null;
}
export interface WritingBaseline {
  title: string;
  titleAvailable?: boolean;
  source: string;
  category: WritingOption | null;
  options: WritingOption[];
  uploadedReferences: string[];
  attachmentFields?: { name: string; value: string; disabled: boolean }[];
}
export interface PreparedWriting {
  uploads?: WritingUpload[];
  action: "new-thread" | "reply" | "quick-quote" | "edit-post";
  replyTarget?: ReplyTarget;
  mentions?: MentionIdentity[];
  existingRedPacket?: boolean;
  redPacket?: { hints: string[] };
  editTarget?: {
    threadId: string;
    postId: string;
    threadURL: string;
    baseline: WritingBaseline;
  };
  draftSaveAvailable?: boolean;
  draft?: DraftIdentity;
  board: { id: string; label: string; url: string };
  account: Extract<Account, { kind: "member" }>;
  title: string;
  titleAvailable?: boolean;
  source: string;
  category: WritingOption | null;
  options: WritingOption[];
  uploadedReferences: string[];
  attachmentFields?: { name: string; value: string; disabled: boolean }[];
}
export type PrepareWritingResult =
  | {
      kind: "prepared";
      prepared: PreparedWriting;
      account: Account;
      generation: number;
      sourceURL: string;
    }
  | {
      kind: FailureKind;
      message: string;
      account: Account;
      generation: number;
      sourceURL: string;
    };

/** An immutable submitted revision, separate from subsequently edited writing. */
export interface ThreadSubmission {
  contextId: string;
  revision: number;
  writing: PreparedWriting;
}
export interface ReplyBefore {
  /** Observed page only; this is not a complete census or a predicted merge target. */
  pageURL: string;
  postIds: string[];
  owned: { postId: string; writing: PreparedWriting }[];
}
export interface ThreadPublication {
  id: string;
  generation: number;
  submission: ThreadSubmission;
  replyBefore?: ReplyBefore;
}
export type PublicationPreparationResult =
  | {
      kind: "ready";
      publication: ThreadPublication;
      account: Account;
      generation: number;
    }
  | {
      kind: "conflict";
      latest: PreparedWriting;
      message: string;
      account: Account;
      generation: number;
    }
  | {
      kind: FailureKind | "validation";
      message: string;
      account: Account;
      generation: number;
    };
/** A command instruction, independent of the verified stored thread. */
export type ThreadCreationEffect = {
  name: "addfeed" | "adddynamic" | "adddynamic_doing";
} & (
  | { requested: true; included: boolean; outcome: "unknown" }
  | { requested: false; included: false; outcome: "not-requested" }
);
/** A qualified enabled attachment-price default; the submitted field stays exact. */
export interface AttachmentNormalization {
  name: string;
  submitted: "";
  stored: "0";
}
/** Fresh complete stored-source/options verification, not effect-delivery proof. */
export interface ThreadVerification {
  stored: "verified";
  normalizations: { name: "price"; submitted: ""; stored: "0" }[];
  attachmentNormalizations?: AttachmentNormalization[];
  creationEffects: ThreadCreationEffect[];
}
export interface RedPacketLedger {
  state: "observed" | "unavailable";
  rows: {
    operation: "HBS" | "HBR" | "HBG";
    change: string;
    details: string;
    time: string;
  }[];
}
export interface RedPacketObservation {
  ledger?: RedPacketLedger;
  state: string;
  conditions: string[];
  credit: "unknown";
}
export interface ThreadAttempt {
  redPacket?: RedPacketObservation;
  id: string;
  publication: ThreadPublication;
  status:
    | "pending"
    | "uncertain"
    | "rejected"
    | "moderation"
    | "confirmed"
    | "not-sent";
  message: string;
  checked: boolean;
  candidateURL: string | null;
  replyComparison?: {
    postId: string;
    before: PreparedWriting | null;
    observed: PreparedWriting;
  };
  result: {
    threadId: string;
    postId: string;
    url: string;
    /** Absent only on compatible legacy confirmations. New readbacks supply it. */
    verification?: ThreadVerification;
  } | null;
}

export interface DraftRow {
  threadId: string;
  boardId: string;
  title: string;
  url: string;
}
export interface DraftList {
  url: string;
  rows: DraftRow[];
  pages: Pagination;
  empty: string;
}
export type DraftListResult = (
  { kind: "drafts"; drafts: DraftList } | { kind: FailureKind; message: string }
) & { account: Account; generation: number; sourceURL: string };

export interface DraftIdentity {
  threadId: string;
  postId: string;
  url: string;
  version: string;
}
export interface DraftAttempt {
  redPacket?: RedPacketObservation;
  fundingReviewed?: true;
  observation?: {
    packetMarker?: true;
    state: "draft" | "published";
    content: "confirmed" | "unknown";
    attachments: "confirmed" | "unknown";
    /** Independently observed native free-price defaults; submission stays exact. */
    attachmentNormalizations?: AttachmentNormalization[];
  };
  checked?: boolean;
  resendOf?: string;
  priorDraftIds?: string[];
  operation?: "save" | "publish";
  publishedURL?: string;
  id: string;
  generation: number;
  submission: ThreadSubmission;
  status:
    | "pending"
    | "uncertain"
    | "rejected"
    | "not-sent"
    | "confirmed"
    | "published"
    | "remaining-draft"
    | "moderation";
  message: string;
  result: DraftIdentity | null;
}
export interface FavoriteIntent {
  action: "add" | "remove";
  kind: FavoriteKind;
  targetId: string;
  recordId: string | null;
  accountId: string;
}
export interface FavoriteCommand {
  id: string;
  generation: number;
  intent: FavoriteIntent;
}
export interface FavoriteAttempt {
  id: string;
  command: FavoriteCommand;
  status: "pending" | "confirmed" | "uncertain" | "not-sent";
  checked: boolean;
  message: string;
  pages: Favorites[] | null;
}
export type FavoritePreparation =
  | { kind: "ready"; command: FavoriteCommand }
  | { kind: "already"; message: string; pages: Favorites[] }
  | { kind: "unavailable"; message: string };
