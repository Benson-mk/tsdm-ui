import type { PublicWritingContext } from "./writing";

export interface ReplyCheckpoint {
  version: string;
  fingerprint: string;
}
export interface ReplyVariant {
  version: string;
  parent: string | null;
  context: PublicWritingContext | null;
}
export interface ReplyRow {
  schema: 1;
  threadId: string;
  variants: ReplyVariant[];
}
export interface ReplyUpdate {
  checkpoint: ReplyCheckpoint;
  threadId: string;
  before: PublicWritingContext | null;
  context: PublicWritingContext | null;
}
export interface ReplyRecovery {
  available: boolean | null;
  problem: { kind: "incompatible" | "refused"; raw: string | null } | null;
  conflicts: ReplyRow[];
  updates: ReplyUpdate[];
}

export const canonical = (value: unknown): string =>
  JSON.stringify(value, (_key, item: unknown) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(
          Object.entries(item).sort(([a], [b]) => a.localeCompare(b)),
        )
      : item,
  );
