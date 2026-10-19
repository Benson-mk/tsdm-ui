import type { ReadResult } from "../forum-client";
export interface ViewPosition {
  anchor: string | null;
  offset: number;
  scrollTop: number;
}
export interface NavigationEntry {
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
  schema: 1;
  entries: Record<string, NavigationEntry>;
  pending: { entryKey: string; destination: string } | null;
}
export interface NavigationHost {
  entryKey(): string | null;
  load(): Promise<NavigationRecord | null>;
  save(record: NavigationRecord): Promise<boolean>;
  push(key: string): void;
  replace(key: string): void;
  onPop(action: (key: string | null) => void): void;
  back(): void;
  navigateDocument(url: string): void;
}
export interface ViewAdapter {
  capture(): ViewPosition;
  restore(
    position: ViewPosition | null,
    target: string | null,
    selection: string | null,
  ): void;
}
