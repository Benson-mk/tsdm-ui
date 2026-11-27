import type { WritingContext } from "./writing";
import type { ReadResult, DraftListResult } from "../forum-client";
export type Section =
  "boards" | "search" | "saved" | "notices" | "messages" | "drafts";
export interface ViewPosition {
  anchor: string | null;
  offset: number;
  scrollTop: number;
  readingScrollTop?: number;
  readingPaneTop?: number;
  readingRegionScrollTop?: number;
  resultsScrollTop?: number;
  resultsPaneTop?: number;
}
export interface ReadingMarker {
  savedAt: number;
  url: string;
  account: string;
  position: ViewPosition;
}
export interface NavigationEntry {
  readingMarker?: ReadingMarker;

  section?: Section;
  readingKey?: string | null;
  drafts?: Extract<DraftListResult, { kind: "drafts" }> | null;
  key: string;
  destination: string;
  originKey: string | null;
  selection: string | null;
  position: ViewPosition | null;
  result: ReadResult | null;
  account: string | null;
  documentNavigations: number;
}
export interface NavigationRecord {
  schema: 2 | 3 | 4 | 5 | 6;
  replyDisposals?: string[];
  replyCheckpoints?: Record<
    string,
    import("../workspace/reply-recovery").ReplyCheckpoint
  >;
  favoriteAttempts?: import("../forum-client").FavoriteAttempt[];
  writing: WritingContext | null;
  retainedReplies?: import("./writing").PublicWritingContext[];
  entries: Record<string, NavigationEntry>;
  pending: { entryKey: string; destination: string } | null;
}
export interface NavigationHost {
  captureLegacyReply?(
    threadId: string,
    attempt: import("../forum-client").ThreadAttempt,
  ): Promise<import("./reply-recovery").LegacyReplyObservation | null>;
  enrollLegacyReply?(
    captured: import("./reply-recovery").LegacyReplyObservation,
    checked?: import("../forum-client").ThreadAttempt,
  ): Promise<import("./reply-recovery").ReplySend | null>;
  retainFailedReply?(
    context: import("./writing").PublicWritingContext,
    candidate: import("./writing").PublicWritingContext,
    send: import("./reply-recovery").ReplySend,
  ): Promise<boolean>;
  reserveReplySend?(
    context: import("./writing").PublicWritingContext,
    attempt: import("../forum-client").ThreadAttempt,
    predecessor?: import("./reply-recovery").ReplySend,
  ): Promise<{
    acknowledged: boolean;
    send: import("./reply-recovery").ReplySend | null;
  }>;
  checkReplySend?(
    threadId: string,
    send: import("./reply-recovery").ReplySend,
  ): Promise<boolean>;
  observeReplySend?(
    threadId: string,
    send: import("./reply-recovery").ReplySend,
    attempt: import("../forum-client").ThreadAttempt,
  ): Promise<import("./reply-recovery").ReplySend | null>;
  discardReply?(
    row: import("./reply-recovery").ReplyRow,
    version: string,
  ): Promise<"discarded" | "stale" | "refused">;
  chooseReply?(
    row: import("./reply-recovery").ReplyRow,
    version: string,
  ): Promise<import("./reply-recovery").ReplyChoice>;

  disposeReply?(threadId: string): void;
  onReplyChange?(action: () => void): void;
  acceptReplyUpdates?(
    updates: import("../workspace/reply-recovery").ReplyUpdate[],
  ): void;
  replyRecovery?(): import("../workspace/reply-recovery").ReplyRecovery;
  entryKey(): string | null;
  recoveryProblem(): {
    kind: "incompatible" | "refused";
    raw: string | null;
  } | null;
  resetRecovery(): void;
  load(): Promise<NavigationRecord | null>;
  save(record: NavigationRecord): Promise<boolean>;
  push(key: string): void;
  replace(key: string): void;
  onPop(action: (key: string | null) => void): void;
  onCachedDocumentReturn?(action: (key: string | null) => void): void;
  back(): void;
  navigateDocument(url: string): void;
}
export interface ViewAdapter {
  dismissForHistory(): void;
  captureReading(): ViewPosition;
  followLatest(): void;
  nearLatest(): boolean;
  restoreReading(position: ViewPosition, history?: boolean): void;
  focusReadingPost(postId: string, preservePosition?: boolean): void;
  capture(): ViewPosition;
  restore(
    position: ViewPosition | null,
    target: string | null,
    selection: string | null,
  ): void;
}
