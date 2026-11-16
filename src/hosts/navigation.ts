import {
  canonical,
  type ReplyCheckpoint,
  type ReplyRecovery,
  type ReplyChoice,
  type ReplyRow,
  type ReplySend,
} from "../workspace/reply-recovery";
import type { NavigationHost } from "../workspace/navigation";
import { isNavigationRecord } from "./navigation-record";
import {
  isOrdinaryReply,
  type PublicWritingContext,
} from "../workspace/writing";
import {
  createReplyDraftStore,
  projectReply,
  replyMeaning,
  replyFingerprint,
  recoverReplyOwners,
  explicitReplyOwners,
} from "./reply-drafts";
import type { NavigationRecord } from "../workspace/navigation";
const storageKey = "tsdm.workspace.recovery";
export function createBrowserNavigation(): NavigationHost {
  const drafts = createReplyDraftStore();
  const channel =
    typeof BroadcastChannel === "function"
      ? new BroadcastChannel("tsdm.workspace.reply-drafts")
      : null;
  let replyChanged = () => {};
  if (channel) channel.onmessage = () => replyChanged();
  const pendingDisposals = new Set<string>();
  let checkpoints: Record<string, ReplyCheckpoint> = {};
  let replyState: ReplyRecovery = {
    available: null,
    problem: null,
    conflicts: [],
    alternatives: [],
    updates: [],
  };
  const contexts = (record: NavigationRecord) =>
    [record.writing, ...(record.retainedReplies ?? [])].filter(
      (value): value is PublicWritingContext =>
        !!value && isOrdinaryReply(value),
    );
  function replyFailure(error: unknown) {
    const raw =
      error && typeof error === "object" && "raw" in error
        ? String(error.raw)
        : null;
    replyState = {
      ...replyState,
      available: false,
      problem: { kind: raw === null ? "refused" : "incompatible", raw },
    };
  }
  async function recoverReplies(record: NavigationRecord | null) {
    try {
      const rows = await drafts.read();
      if (!rows.length && !record) return null;
      const next: NavigationRecord = record ?? {
        schema: 6,
        writing: null,
        retainedReplies: [],
        entries: {},
        pending: null,
        replyCheckpoints: {},
      };
      checkpoints = { ...(next.replyCheckpoints ?? {}) };
      for (const thread of next.replyDisposals ?? [])
        pendingDisposals.add(thread);
      const local = new Map(
        contexts(next).map((context) => [
          context.replyTarget!.threadId,
          context,
        ]),
      );
      for (const row of rows) {
        if (pendingDisposals.has(row.threadId)) continue;
        const current = local.get(row.threadId),
          checkpoint = checkpoints[row.threadId];
        const variant =
          row.variants.find((item) => item.version === checkpoint?.version) ??
          row.variants[0]!;
        const clean =
          !current ||
          (!!checkpoint &&
            checkpoint.fingerprint ===
              (await replyFingerprint(projectReply(current))));
        const equivalent =
          !!current &&
          replyMeaning(projectReply(current)) === replyMeaning(variant.context);
        if (
          !current ||
          (row.variants.length === 1 && (clean || (!checkpoint && equivalent)))
        ) {
          if (variant.context)
            local.set(row.threadId, recoverReplyOwners(variant.context));
          else local.delete(row.threadId);
          checkpoints[row.threadId] = {
            version: variant.version,
            fingerprint: await replyFingerprint(variant.context),
          };
        }
      }
      const active =
        next.writing && isOrdinaryReply(next.writing)
          ? next.writing.replyTarget!.threadId
          : null;
      if (active) next.writing = local.get(active) ?? null;
      next.retainedReplies = [...local.entries()]
        .filter(([thread]) => thread !== active)
        .map(([, context]) => context);
      if (next.writing && isOrdinaryReply(next.writing))
        next.writing = recoverReplyOwners(next.writing);
      next.retainedReplies = (next.retainedReplies ?? []).map(
        recoverReplyOwners,
      );
      next.schema = 6;
      next.replyCheckpoints = { ...checkpoints };
      replyState = {
        available: true,
        problem: null,
        conflicts: rows.filter((row) => row.variants.length > 1),
        alternatives: rows.filter((row) => row.retained?.length),
        sends: rows
          .filter((row) => row.sends?.length)
          .map((row) => ({ threadId: row.threadId, sends: row.sends! })),
        updates: [],
      };
      return next;
    } catch (error) {
      replyFailure(error);
      return record;
    }
  }
  let latestRecord: NavigationRecord | null = null;
  let sessionAvailable: boolean | null = null;
  function captureSession(completedDisposals: string[] = []) {
    if (!latestRecord) return false;
    const snapshot = JSON.stringify({
      ...latestRecord,
      schema: 6,
      retainedReplies: latestRecord.retainedReplies ?? [],
      replyCheckpoints: { ...checkpoints },
      replyDisposals: [...pendingDisposals].filter(
        (thread) => !completedDisposals.includes(thread),
      ),
    });
    try {
      sessionStorage.setItem(storageKey, snapshot);
      sessionAvailable = sessionStorage.getItem(storageKey) === snapshot;
      return sessionAvailable;
    } catch (error) {
      sessionAvailable = false;
      throw error;
    }
  }
  let saveQueue = Promise.resolve(true);
  const admittedSends = new Map<string, string>();
  function observeRows(rows: ReplyRow[]) {
    replyState = {
      ...replyState,
      conflicts: rows.filter((row) => row.variants.length > 1),
      alternatives: rows.filter((row) => row.retained?.length),
      sends: rows
        .filter((row) => row.sends?.length)
        .map((row) => ({ threadId: row.threadId, sends: row.sends! })),
    };
  }
  const resolutionEpochs = new Map<string, number>();
  let problem: { kind: "incompatible" | "refused"; raw: string | null } | null =
    null;
  const entryKey = () =>
    /^#workspace=([a-zA-Z0-9-]+)$/.exec(location.hash)?.[1] ?? null;
  const address = (key: string) =>
    `${location.origin}/forum.php#workspace=${key}`;
  return {
    entryKey,
    captureLegacyReply(threadId, attempt) {
      const operation = saveQueue.then(async () => {
        try {
          const rows = await drafts.read();
          observeRows(rows);
          const row = rows.find((item) => item.threadId === threadId);
          const observations =
            row &&
            [...row.variants, ...(row.retained ?? [])].flatMap((variant) =>
              (variant.context?.attempts ?? []).filter(
                (item) => item.id === attempt.id,
              ),
            );
          if (
            !row ||
            row.sends?.some((send) => send.attempt.id === attempt.id) ||
            !observations?.some(
              (item) => canonical(item) === canonical(attempt),
            ) ||
            observations.some(
              (item) =>
                canonical(item.publication) !== canonical(attempt.publication),
            )
          )
            return null;
          return { threadId, attempt, observations };
        } catch (error) {
          replyFailure(error);
          return null;
        }
      });
      saveQueue = operation.then(() => false);
      return operation;
    },
    enrollLegacyReply(captured, checked) {
      const operation = saveQueue.then(async () => {
        try {
          const send = await drafts.enrollLegacy(captured, checked);
          if (send) channel?.postMessage("changed");
          const rows = await drafts.read();
          observeRows(rows);
          const current = rows
            .find((row) => row.threadId === captured.threadId)
            ?.sends?.find((item) => item.attempt.id === captured.attempt.id);
          return send &&
            canonical(current) === canonical(send) &&
            captureSession()
            ? send
            : null;
        } catch (error) {
          replyFailure(error);
          return null;
        }
      });
      saveQueue = operation.then(() => false);
      return operation;
    },
    retainFailedReply(context, candidate, send) {
      const operation = saveQueue.then(async () => {
        try {
          const projected = projectReply(context),
            replacement = projectReply(candidate);
          const thread = projected.replyTarget!.threadId;
          const retained = await drafts.retainFailed(
            projected,
            replacement,
            checkpoints[thread]?.version ?? null,
            send,
          );
          const rows = await drafts.read();
          observeRows(rows);
          if (retained) channel?.postMessage("changed");
          return (
            retained &&
            !!rows
              .find((row) => row.threadId === thread)
              ?.retained?.some(
                (item) =>
                  replyMeaning(item.context) === replyMeaning(replacement),
              ) &&
            captureSession()
          );
        } catch (error) {
          replyFailure(error);
          return false;
        }
      });
      saveQueue = operation.then(() => false);
      return operation;
    },
    reserveReplySend(context, attempt, predecessor) {
      let send: ReplySend | null = null;
      const operation = saveQueue.then(async () => {
        try {
          const projected = projectReply(context);
          const thread = projected.replyTarget!.threadId;
          send = await drafts.reserve(
            projected,
            checkpoints[thread]?.version ?? null,
            attempt,
            predecessor,
          );
          if (!send) return { acknowledged: false, send: null };
          channel?.postMessage("changed");
          const rows = await drafts.read();
          observeRows(rows);
          const row = rows.find((item) => item.threadId === thread);
          const current = row?.sends?.find(
            (item) => item.attempt.id === attempt.id,
          );
          const acknowledged =
            row?.variants.length === 1 &&
            canonical(current) === canonical(send) &&
            captureSession();
          if (acknowledged) admittedSends.set(attempt.id, send.revision);
          return { acknowledged, send };
        } catch (error) {
          replyFailure(error);
          return { acknowledged: false, send };
        }
      });
      saveQueue = operation.then(() => false);
      return operation;
    },
    async checkReplySend(threadId, send) {
      try {
        const rows = await drafts.read();
        observeRows(rows);
        const row = rows.find((item) => item.threadId === threadId);
        const current = row?.sends?.find(
          (item) => item.attempt.id === send.attempt.id,
        );
        return (
          admittedSends.get(send.attempt.id) === send.revision &&
          row?.variants.length === 1 &&
          !!current &&
          !current.successor &&
          current.attempt.status === "pending" &&
          canonical(current) === canonical(send)
        );
      } catch (error) {
        replyFailure(error);
        return false;
      }
    },
    observeReplySend(threadId, expected, attempt) {
      const operation = saveQueue.then(async () => {
        try {
          const send = await drafts.observeSend(threadId, expected, attempt);
          if (!send) return null;
          channel?.postMessage("changed");
          const rows = await drafts.read();
          observeRows(rows);
          const current = rows
            .find((row) => row.threadId === threadId)
            ?.sends?.find((item) => item.attempt.id === attempt.id);
          if (canonical(current) !== canonical(send) || !captureSession())
            return null;
          admittedSends.delete(attempt.id);
          return send;
        } catch (error) {
          replyFailure(error);
          return null;
        }
      });
      saveQueue = operation.then(() => false);
      return operation;
    },
    chooseReply(observed, version) {
      const operation = saveQueue.then(async (): Promise<ReplyChoice> => {
        try {
          const selected = await drafts.choose(observed, version);
          if (!selected) return { kind: "stale" };
          resolutionEpochs.set(
            observed.threadId,
            (resolutionEpochs.get(observed.threadId) ?? 0) + 1,
          );
          channel?.postMessage("changed");
          const rows = await drafts.read();
          replyState = {
            available: false,
            problem: null,
            conflicts: rows.filter((row) => row.variants.length > 1),
            alternatives: rows.filter((row) => row.retained?.length),
            sends: rows
              .filter((row) => row.sends?.length)
              .map((row) => ({ threadId: row.threadId, sends: row.sends! })),
            updates: [],
          };
          if (
            canonical(
              rows.find((row) => row.threadId === observed.threadId),
            ) !== canonical(selected)
          )
            return { kind: "stale" };
          const chosen = selected.variants[0]!;
          return {
            kind: "chosen",
            checkpoint: {
              version: chosen.version,
              fingerprint: await replyFingerprint(chosen.context),
            },
            context: chosen.context ? recoverReplyOwners(chosen.context) : null,
          };
        } catch (error) {
          replyFailure(error);
          return { kind: "refused" };
        }
      });
      saveQueue = operation.then(() => false);
      return operation;
    },
    discardReply(observed, version) {
      const operation = saveQueue.then(
        async (): Promise<"discarded" | "stale" | "refused"> => {
          try {
            const discarded = await drafts.discard(observed, version);
            if (!discarded) return "stale";
            channel?.postMessage("changed");
            const rows = await drafts.read();
            replyState = {
              available: false,
              problem: null,
              conflicts: rows.filter((row) => row.variants.length > 1),
              alternatives: rows.filter((row) => row.retained?.length),
              sends: rows
                .filter((row) => row.sends?.length)
                .map((row) => ({ threadId: row.threadId, sends: row.sends! })),
              updates: [],
            };
            return canonical(
              rows.find((row) => row.threadId === observed.threadId),
            ) === canonical(discarded)
              ? "discarded"
              : "stale";
          } catch (error) {
            replyFailure(error);
            return "refused";
          }
        },
      );
      saveQueue = operation.then(() => false);
      return operation;
    },
    replyRecovery: () => ({ ...replyState, sessionAvailable }),
    disposeReply: (thread) => {
      pendingDisposals.add(thread);
    },
    onReplyChange: (action) => {
      replyChanged = action;
      window.addEventListener("focus", action);
    },
    acceptReplyUpdates: (updates) => {
      for (const update of updates) {
        // Accepted remote content replaces the local slot just like an explicit
        // choice. Older queued captures must not re-author its previous value.
        resolutionEpochs.set(
          update.threadId,
          (resolutionEpochs.get(update.threadId) ?? 0) + 1,
        );
        checkpoints[update.threadId] = update.checkpoint;
      }
    },
    recoveryProblem: () => problem,
    resetRecovery: () => {
      problem = null;
    },
    async load() {
      let raw: string | null = null;
      try {
        raw = sessionStorage.getItem(storageKey);
        if (raw === null) return recoverReplies(null);
        let value: unknown;
        try {
          value = JSON.parse(raw);
        } catch {
          problem = { kind: "incompatible", raw };
          return recoverReplies(null);
        }
        if (
          value &&
          typeof value === "object" &&
          "schema" in value &&
          value.schema === 1
        )
          value = { ...value, schema: 2, writing: null };
        if (isNavigationRecord(value)) return recoverReplies(value);
        problem = { kind: "incompatible", raw };
        return recoverReplies(null);
      } catch {
        problem = { kind: "refused", raw };
        return recoverReplies(null);
      }
    },
    save(record) {
      if (problem?.kind === "incompatible") return Promise.resolve(false);
      let captured: NavigationRecord;
      try {
        captured = JSON.parse(JSON.stringify(record));
      } catch {
        return Promise.resolve(false);
      }
      if (captured.writing && isOrdinaryReply(captured.writing))
        captured.writing = explicitReplyOwners(captured.writing);
      if (captured.retainedReplies)
        captured.retainedReplies =
          captured.retainedReplies.map(explicitReplyOwners);
      latestRecord = captured;
      // Navigation and live source are captured synchronously. Strict durable
      // work may still be queued; its later checkpoint cannot roll this back.
      try {
        if (!captureSession()) throw Error("Page-session capture failed");
      } catch (error) {
        replyFailure(error);
        return Promise.resolve(false);
      }
      const disposals = [...pendingDisposals];
      const capturedEpochs = new Map(resolutionEpochs);
      replyState = { ...replyState, available: null };
      saveQueue = saveQueue.then(async () => {
        const snapshot: NavigationRecord = {
          ...captured,
          schema: 6,
          retainedReplies: captured.retainedReplies ?? [],
          replyCheckpoints: { ...checkpoints },
          replyDisposals: disposals,
        };
        const sessionOnly =
          !snapshot.writing || !isOrdinaryReply(snapshot.writing);
        try {
          if (!captureSession())
            throw Error("Page-session acknowledgement failed");
          if (replyState.problem?.kind === "incompatible") return sessionOnly;
          let rows = await drafts.read();
          const expected = new Map<string, string>();
          const updates: ReplyRecovery["updates"] = [];
          let wrote = false;
          const skipped = new Set<string>();
          for (const original of contexts(snapshot)) {
            const context = projectReply(original),
              thread = context.replyTarget!.threadId;
            if (
              (capturedEpochs.get(thread) ?? 0) !==
              (resolutionEpochs.get(thread) ?? 0)
            ) {
              skipped.add(thread);
              continue;
            }
            const fingerprint = await replyFingerprint(context),
              checkpoint = checkpoints[thread];
            const row = rows.find((item) => item.threadId === thread);
            if (
              checkpoint &&
              fingerprint === checkpoint.fingerprint &&
              row?.variants.length === 1 &&
              row.variants[0]!.version !== checkpoint.version
            ) {
              updates.push({
                checkpoint: {
                  version: row.variants[0]!.version,
                  fingerprint: await replyFingerprint(row.variants[0]!.context),
                },
                threadId: thread,
                before: original,
                context: row.variants[0]!.context
                  ? recoverReplyOwners(row.variants[0]!.context)
                  : null,
              });
              continue;
            }
            // A clean old observer can remain read-only through a new conflict.
            // Its preserved alternative is not a newly authored current branch.
            if (
              checkpoint &&
              fingerprint === checkpoint.fingerprint &&
              row?.retained?.some((item) => item.version === checkpoint.version)
            )
              continue;
            const equivalent =
              !checkpoint &&
              row?.variants.length === 1 &&
              replyMeaning(row.variants[0]!.context) === replyMeaning(context);
            const unchanged =
              checkpoint &&
              fingerprint === checkpoint.fingerprint &&
              row?.variants.some((item) => item.version === checkpoint.version);
            const saved =
              equivalent || unchanged
                ? row!
                : await drafts.save(
                    thread,
                    context,
                    checkpoint?.version ?? null,
                  );
            const variant =
              saved.variants.find(
                (item) => canonical(item.context) === canonical(context),
              ) ??
              (equivalent
                ? saved.variants[0]
                : unchanged
                  ? saved.variants.find(
                      (item) => item.version === checkpoint!.version,
                    )
                  : undefined);
            if (canonical(saved) !== canonical(row)) wrote = true;
            if (variant) {
              checkpoints[thread] = {
                version: variant.version,
                fingerprint: await replyFingerprint(variant.context),
              };
              expected.set(thread, variant.version);
            }
          }
          for (const thread of disposals) {
            if (
              (capturedEpochs.get(thread) ?? 0) !==
              (resolutionEpochs.get(thread) ?? 0)
            ) {
              skipped.add(thread);
              continue;
            }
            if (
              contexts(snapshot).some(
                (context) => context.replyTarget!.threadId === thread,
              )
            )
              continue;
            const prior = rows.find((row) => row.threadId === thread);
            const saved = await drafts.save(
              thread,
              null,
              checkpoints[thread]?.version ?? null,
            );
            const variant = saved.variants.find(
              (item) => item.context === null,
            )!;
            checkpoints[thread] = {
              version: variant.version,
              fingerprint: await replyFingerprint(null),
            };
            expected.set(thread, variant.version);
            if (canonical(saved) !== canonical(prior)) wrote = true;
          }
          rows = await drafts.read();
          const present = new Set(
            contexts(snapshot).map((context) => context.replyTarget!.threadId),
          );
          for (const row of rows) {
            if (
              !present.has(row.threadId) &&
              !disposals.includes(row.threadId) &&
              row.variants.length === 1 &&
              row.variants[0]!.context
            )
              updates.push({
                threadId: row.threadId,
                before: null,
                context: row.variants[0]!.context
                  ? recoverReplyOwners(row.variants[0]!.context)
                  : null,
                checkpoint: {
                  version: row.variants[0]!.version,
                  fingerprint: await replyFingerprint(row.variants[0]!.context),
                },
              });
          }
          if (wrote) channel?.postMessage("changed");
          const current = [...expected].every(([thread, version]) => {
            const row = rows.find((item) => item.threadId === thread);
            return (
              row?.variants.length === 1 && row.variants[0]!.version === version
            );
          });
          replyState = {
            available: current && updates.length === 0 && skipped.size === 0,
            problem: null,
            conflicts: rows.filter((row) => row.variants.length > 1),
            alternatives: rows.filter((row) => row.retained?.length),
            sends: rows
              .filter((row) => row.sends?.length)
              .map((row) => ({ threadId: row.threadId, sends: row.sends! })),
            updates,
          };
          const completedDisposals = disposals.filter(
            (thread) => !skipped.has(thread),
          );
          if (!captureSession(completedDisposals))
            throw Error("Page-session checkpoint failed");
          for (const thread of completedDisposals)
            pendingDisposals.delete(thread);
          // Retained conflicts remain globally visible, but authorization belongs
          // to the active writing owner, never to an unrelated thread's head.
          const active = snapshot.writing;
          if (!active || !isOrdinaryReply(active)) return true;
          const thread = active.replyTarget!.threadId;
          const row = rows.find((item) => item.threadId === thread);
          return (
            expected.has(thread) &&
            row?.variants.length === 1 &&
            row.variants[0]!.version === expected.get(thread) &&
            !updates.some((update) => update.threadId === thread)
          );
        } catch (error) {
          replyFailure(error);
          // The full captured page session was already acknowledged before
          // entering this queue. Durable reply failure cannot revoke unrelated
          // non-reply recovery, while reply failure remains globally visible.
          return sessionOnly;
        }
      });
      return saveQueue;
    },
    push(key) {
      history.pushState({ tsdmEntry: key }, "", address(key));
    },
    replace(key) {
      history.replaceState({ tsdmEntry: key }, "", address(key));
    },
    onPop(action) {
      window.addEventListener("popstate", () => action(entryKey()));
    },
    back() {
      history.back();
    },
    navigateDocument(url) {
      location.replace(url);
    },
  };
}

/** Recovery is available independently of Vue startup on safe opaque history entries. */
export async function recoverNavigationDestination(): Promise<string> {
  const host = createBrowserNavigation(),
    key = host.entryKey();
  if (!key) return location.href;
  const record = await host.load(),
    entry = record?.entries[key];
  if (entry && typeof entry.destination === "string") {
    try {
      const url = new URL(entry.destination);
      if (
        url.origin === location.origin &&
        url.protocol === "https:" &&
        !url.username &&
        !url.password
      )
        return url.href;
    } catch {
      /* Use safe overview below. */
    }
  }
  return `${location.origin}/forum.php`;
}
