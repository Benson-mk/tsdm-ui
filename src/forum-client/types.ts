export interface HostResponse {
  status: number;
  url: string;
  contentType: string;
  body: string;
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
export interface Thread {
  id: string;
  title: string;
  url: string;
  posts: Post[];
}
export type FailureKind =
  | "login"
  | "permission"
  | "missing"
  | "challenge"
  | "invalid"
  | "network"
  | "stale";
export type ReadResult =
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
  readonly account: Account;
  readonly generation: number;
}
