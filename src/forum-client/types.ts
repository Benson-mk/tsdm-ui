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
export interface ForumTransport {
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
export type ReadResult =
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
export interface ForumClient {
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
  prepareNewThread(boardId: string): Promise<PrepareWritingResult>;
  readThread(url: string): Promise<ReadResult>;
  readPage(url: string, options?: { fresh?: boolean }): Promise<ReadResult>;
  readonly account: Account;
  readonly generation: number;
}

export interface WritingOption {
  name: string;
  label: string;
  kind: "checkbox" | "select" | "text";
  value: string;
  checked: boolean;
  disabled: boolean;
  choices: { value: string; label: string; disabled: boolean }[];
  maxLength: number | null;
}
export interface PreparedWriting {
  action: "new-thread";
  board: { id: string; label: string; url: string };
  account: Extract<Account, { kind: "member" }>;
  title: string;
  source: string;
  category: WritingOption | null;
  options: WritingOption[];
  uploadedReferences: string[];
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
