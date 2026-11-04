import type { WritingContext } from "./writing";
import type { ReadResult, DraftListResult } from "../forum-client";
export type Section =
  "boards" | "search" | "saved" | "notices" | "messages" | "drafts";
export interface ViewPosition {
  anchor: string | null;
  offset: number;
  scrollTop: number;
  readingScrollTop?: number;
  resultsScrollTop?: number;
}
export interface NavigationEntry {
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
  schema: 2;
  favoriteAttempts?: import("../forum-client").FavoriteAttempt[];
  writing: WritingContext | null;
  entries: Record<string, NavigationEntry>;
  pending: { entryKey: string; destination: string } | null;
}
export interface NavigationHost {
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
  back(): void;
  navigateDocument(url: string): void;
}
export interface ViewAdapter {
  captureReading(): ViewPosition;
  restoreReading(position: ViewPosition): void;
  capture(): ViewPosition;
  restore(
    position: ViewPosition | null,
    target: string | null,
    selection: string | null,
  ): void;
}
