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
  schema: 1 | 2;
  retained?: ReplyVariant[];
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
  sessionAvailable?: boolean | null;
  available: boolean | null;
  problem: { kind: "incompatible" | "refused"; raw: string | null } | null;
  conflicts: ReplyRow[];
  alternatives: ReplyRow[];
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

export type ReplyChoice =
  | {
      kind: "chosen";
      checkpoint: ReplyCheckpoint;
      context: PublicWritingContext | null;
    }
  | { kind: "stale" | "refused" };

/** Read-only evidence projection: never merges identities or ranks observations. */
export function hasUnsettledReply(
  context: {
    readonly attempts?: readonly { readonly status: string }[];
    readonly draftAttempts?: readonly { readonly status: string }[];
    readonly privateAttempts?: readonly { readonly status: string }[];
    readonly uploads?: readonly { readonly status: string }[];
  } | null,
): boolean {
  return (
    !!context &&
    ([context.attempts, context.draftAttempts, context.privateAttempts].some(
      (attempts) =>
        attempts?.some((attempt) =>
          ["pending", "uncertain", "moderation"].includes(attempt.status),
        ),
    ) ||
      !!context.uploads?.some((upload) =>
        ["uploading", "removing", "uncertain", "removal-uncertain"].includes(
          upload.status,
        ),
      ))
  );
}
