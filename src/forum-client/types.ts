export interface HostResponse {
  status: number;
  url: string;
  contentType: string;
  body: string;
  redirect?: "opaque" | "followed" | "none";
}
export interface ForumTransport {
  request(url: string): Promise<HostResponse>;
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
}
export interface ForumLink {
  label: string;
  url: string;
}
export interface Pagination {
  current: string;
  links: ForumLink[];
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
      account: Account;
      generation: number;
      sourceURL: string;
    };
export interface ForumClient {
  readThread(url: string): Promise<ReadResult>;
  readPage(url: string): Promise<ReadResult>;
  readonly account: Account;
  readonly generation: number;
}
