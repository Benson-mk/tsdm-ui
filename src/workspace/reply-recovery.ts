import type { PublicWritingContext } from "./writing";
import type { ThreadAttempt } from "../forum-client";

export interface ReplySend {
  revision: string;
  attempt: ThreadAttempt;
  successor: string | null;
}
export interface LegacyReplyObservation {
  threadId: string;
  attempt: ThreadAttempt;
  observations: ThreadAttempt[];
}
export function legacyFailedReply(attempt: ThreadAttempt) {
  const writing = attempt.publication.submission.writing;
  return (
    ["reply", "quick-quote"].includes(writing.action) &&
    !!writing.replyTarget &&
    !writing.draft &&
    !writing.editTarget &&
    !writing.redPacket &&
    ["rejected", "not-sent"].includes(attempt.status) &&
    !attempt.checked &&
    attempt.result === null &&
    attempt.candidateURL === null &&
    !attempt.replyComparison &&
    !attempt.redPacket
  );
}

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
  schema: 1 | 2 | 3;
  sends?: ReplySend[];
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
  sends?: { threadId: string; sends: ReplySend[] }[];
  sessionAvailable?: boolean | null;
  available: boolean | null;
  problem: { kind: "incompatible" | "refused"; raw: string | null } | null;
  conflicts: ReplyRow[];
  alternatives: ReplyRow[];
  updates: ReplyUpdate[];
}

export const unsettledSend = (attempt: Pick<ThreadAttempt, "status">) =>
  ["pending", "uncertain", "moderation"].includes(attempt.status);

type AttemptIdentity = {
  readonly id: string;
  readonly publication: unknown;
  readonly status: ThreadAttempt["status"];
};
type HoldSend = {
  readonly attempt: AttemptIdentity;
  readonly successor: string | null;
};
export function matchingSend(
  attempt: AttemptIdentity,
  sends: readonly HoldSend[],
) {
  return sends.find(
    (send) =>
      send.attempt.id === attempt.id &&
      canonical(send.attempt.publication) === canonical(attempt.publication),
  );
}

/** Registered observations order this exact operation only, never authored versions. */
export function hasReplyHold(
  context:
    | (Omit<
        NonNullable<Parameters<typeof hasUnsettledReply>[0]>,
        "attempts"
      > & { readonly attempts?: readonly AttemptIdentity[] })
    | null,
  sends: readonly HoldSend[],
  ignored: readonly string[] = [],
) {
  if (!context) return false;
  return (
    hasUnsettledReply({ ...context, attempts: [] }) ||
    !!context.attempts?.some((attempt) => {
      if (ignored.includes(attempt.id)) return false;
      const registered = matchingSend(attempt, sends);
      return registered
        ? !registered.successor && unsettledSend(registered.attempt)
        : unsettledSend(attempt);
    })
  );
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
