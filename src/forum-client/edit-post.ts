import { mentionsCurrent } from "./mentions.js";
import { validateUploadFields } from "./upload-authoring.js";
import { observeRedPacket, observePacketLedger } from "./hongbao.js";
import { decodeThread } from "./read-thread.js";
import {
  decodeWriting,
  unresolvedWritingAttachments,
} from "./prepare-writing.js";
import { compatible, outcome, successful } from "./publish-thread.js";
import { verifyStoredWriting } from "./thread-verification.js";
import type {
  Account,
  ForumTransport,
  PreparedWriting,
  PrepareWritingResult,
  PublicationPreparationResult,
  ThreadAttempt,
  ThreadPublication,
  ThreadSubmission,
  WritingBaseline,
} from "./types.js";
const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const equal = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
export const editBaseline = (v: PreparedWriting): WritingBaseline =>
  copy({
    title: v.title,
    titleAvailable: v.titleAvailable ?? true,
    source: v.source,
    category: v.category,
    options: v.options,
    uploadedReferences: v.uploadedReferences,
    attachmentFields: (v.attachmentFields ?? []).filter(
      (f) => !/^attachupdate\[[1-9]\d*\]$/.test(f.name),
    ),
  });
export function createPostEditor(config: {
  origin: string;
  transport: ForumTransport;
  account: () => Account;
  generation: () => number;
  observe: (a: Account) => void;
}) {
  const prepared = new Map<string, ThreadPublication>();
  const pending = new Set<string>();
  let loadSequence = 0;
  function sourceURL(w: PreparedWriting) {
    const u = new URL("/forum.php", config.origin);
    for (const [key, value] of Object.entries({
      mod: "post",
      action: "edit",
      fid: w.board.id,
      tid: w.editTarget!.threadId,
      pid: w.editTarget!.postId,
      tsdmapp: "json",
    }))
      u.searchParams.set(key, value);
    return u.href;
  }
  async function current(w: PreparedWriting) {
    const url = sourceURL(w);
    let generation = config.generation();
    const ownership = decodeThread(
      await config.transport.request(w.editTarget!.threadURL, { fresh: true }),
      w.editTarget!.threadURL,
    );
    if (generation !== config.generation()) return null;
    config.observe(ownership.account);
    if (
      ownership.kind !== "thread" ||
      ownership.account.kind !== "member" ||
      ownership.account.id !== w.account.id ||
      ownership.thread.id !== w.editTarget!.threadId ||
      ownership.thread.posts.find((p) => p.id === w.editTarget!.postId)
        ?.authorId !== w.account.id
    )
      return null;
    generation = config.generation();
    const response = await config.transport.request(url, { fresh: true });
    const decoded = decodeWriting(response, url, w.board.id, w.editTarget);
    if (generation !== config.generation()) return null;
    config.observe(decoded.account);
    if (
      config.generation() !== generation ||
      decoded.account.kind !== "member" ||
      decoded.account.id !== w.account.id ||
      decoded.kind !== "prepared"
    )
      return null;
    const latest: PreparedWriting = {
      ...decoded.prepared,
      action: "edit-post",
      draftSaveAvailable: false,
      ...(ownership.thread.posts.find((p) => p.id === w.editTarget!.postId)
        ?.redPacketThreadId === w.editTarget!.threadId
        ? { existingRedPacket: true }
        : {}),
      editTarget: {
        ...w.editTarget!,
        baseline: editBaseline(decoded.prepared),
      },
    };
    return { response, latest };
  }
  async function load(
    threadURL: string,
    postId: string,
  ): Promise<PrepareWritingResult> {
    const sequence = ++loadSequence;
    const fail = (message: string): PrepareWritingResult => ({
      kind: "invalid",
      message,
      account: config.account(),
      generation: config.generation(),
      sourceURL: threadURL,
    });
    let url: URL;
    try {
      url = new URL(threadURL);
    } catch {
      return fail("A valid owned-post destination is required.");
    }
    if (
      url.origin !== config.origin ||
      url.pathname !== "/forum.php" ||
      url.searchParams.get("mod") !== "viewthread" ||
      !/^[1-9]\d*$/.test(url.searchParams.get("tid") ?? "") ||
      !/^[1-9]\d*$/.test(postId)
    )
      return fail("A valid owned-post destination is required.");
    try {
      const generation = config.generation();
      const response = await config.transport.request(url.href, {
        fresh: true,
      });
      if (sequence !== loadSequence || generation !== config.generation())
        return fail("A newer account request replaced this edit preparation.");
      const read = decodeThread(response, url.href);
      config.observe(read.account);
      if (
        read.kind !== "thread" ||
        read.account.kind !== "member" ||
        !read.thread.parent
      )
        return fail(
          "The owned post could not be established. Your writing is retained.",
        );
      const post = read.thread.posts.find((p) => p.id === postId),
        boardId = new URL(read.thread.parent.url).searchParams.get("fid");
      if (!post || post.authorId !== read.account.id || !boardId)
        return fail("Only the current account's own post can be edited.");
      const base: PreparedWriting = {
        action: "edit-post",
        draftSaveAvailable: false,
        title: "",
        source: "",
        category: null,
        options: [],
        uploadedReferences: [],
        account: read.account,
        board: {
          id: boardId,
          label: read.thread.parent.label,
          url: read.thread.parent.url,
        },
        editTarget: {
          threadId: read.thread.id,
          postId,
          threadURL: url.href,
          baseline: {
            title: "",
            source: "",
            category: null,
            options: [],
            uploadedReferences: [],
          },
        },
      };
      const result = await current(base);
      if (sequence !== loadSequence || !result)
        return fail(
          "Actual editable source and current options are unavailable. Rendered content cannot replace complete source.",
        );
      return {
        kind: "prepared",
        prepared: result.latest,
        account: config.account(),
        generation: config.generation(),
        sourceURL: sourceURL(base),
      };
    } catch {
      return fail(
        "The editable source could not be reached. Your writing is retained.",
      );
    }
  }
  async function prepare(
    submission: ThreadSubmission,
  ): Promise<PublicationPreparationResult> {
    const fail = (message: string): PublicationPreparationResult => ({
      kind: "validation",
      message,
      account: config.account(),
      generation: config.generation(),
    });
    submission = copy(submission);
    const writing = submission.writing;
    if (
      writing.action !== "edit-post" ||
      !writing.editTarget ||
      !submission.contextId ||
      !Number.isSafeInteger(submission.revision) ||
      submission.revision < 1 ||
      !writing.source.trim()
    )
      return fail("A complete owned-post edit revision is required.");
    for (const [key, p] of prepared)
      if (p.submission.contextId === submission.contextId) prepared.delete(key);
    try {
      let fresh = await current(writing);
      if (!fresh)
        return fail(
          "Actual current source, options or original account are unavailable. Editing remains paused.",
        );
      if (writing.mentions?.length) {
        const generation = config.generation();
        if (
          !(await mentionsCurrent(config, writing)) ||
          config.generation() !== generation
        )
          return fail(
            "A selected mention identity changed or could not be revalidated. Resolve the person again.",
          );
        // Re-read after identity lookup so its awaits do not leave stale source
        // or options as the revision being approved.
        fresh = await current(writing);
        if (!fresh || config.generation() !== generation)
          return fail(
            "Actual current source, options or original account are unavailable. Editing remains paused.",
          );
      }
      if (!equal(writing.editTarget.baseline, editBaseline(fresh.latest)))
        return {
          kind: "conflict",
          latest: fresh.latest,
          message:
            "The server post changed. Review latest source, options and attachments before saving your version.",
          account: config.account(),
          generation: config.generation(),
        };
      const generation = config.generation();
      const uploadFields = await validateUploadFields(
        config.transport,
        writing,
        fresh.response,
      );
      if (config.generation() !== generation)
        return fail(
          "The account changed during attachment validation. Review again; nothing was sent.",
        );
      const newIds = (writing.uploads ?? [])
        .filter((u) => u.status === "uploaded")
        .map((u) => u.serverId);
      if (
        (fresh.latest.titleAvailable === false && writing.title !== "") ||
        unresolvedWritingAttachments(writing).length ||
        !compatible(writing, fresh.latest) ||
        !equal(
          writing.uploadedReferences.filter((id) => !newIds.includes(id)),
          fresh.latest.uploadedReferences,
        ) ||
        !uploadFields ||
        !successful(fresh.response, writing, false, uploadFields)
      )
        return fail(
          "Required current form content or attachment references cannot be preserved. Nothing was sent.",
        );
      const publication: ThreadPublication = {
        id: crypto.randomUUID(),
        generation: config.generation(),
        submission,
      };
      prepared.set(publication.id, copy(publication));
      return {
        kind: "ready",
        publication,
        account: config.account(),
        generation: config.generation(),
      };
    } catch {
      return fail("Fresh edit preparation failed. Local writing is retained.");
    }
  }
  async function checkContent(attempt: ThreadAttempt): Promise<ThreadAttempt> {
    attempt = copy(attempt);
    const writing = attempt.publication.submission.writing,
      target = writing.editTarget;
    const uncertain = (message: string): ThreadAttempt =>
      attempt.status === "confirmed" && attempt.result
        ? {
            ...attempt,
            checked: true,
            message: `Previous stored confirmation retained. This recheck did not verify the current result. ${message}`,
          }
        : {
            ...attempt,
            status:
              attempt.status === "moderation" ? "moderation" : "uncertain",
            checked: true,
            message:
              attempt.status === "moderation"
                ? `Moderation remains pending. ${message}`
                : message,
            result: null,
          };
    if (!target || writing.action !== "edit-post")
      return uncertain("The original edit target is unavailable.");
    try {
      const generation = config.generation();
      const response = await config.transport.request(target.threadURL, {
        fresh: true,
      });
      if (generation !== config.generation())
        return uncertain("The account changed while checking the saved post.");
      const read = decodeThread(response, target.threadURL);
      config.observe(read.account);
      if (
        read.kind !== "thread" ||
        read.account.kind !== "member" ||
        read.account.id !== writing.account.id ||
        read.thread.id !== target.threadId ||
        read.thread.posts.find((p) => p.id === target.postId)?.authorId !==
          writing.account.id
      )
        return uncertain(
          "Saved actor or post could not be independently established.",
        );
      const fresh = await current(writing);
      const verification =
        fresh &&
        equal(writing.uploadedReferences, fresh.latest.uploadedReferences)
          ? verifyStoredWriting(writing, fresh.latest)
          : null;
      if (!verification)
        return uncertain(
          "Complete saved source, options or attachment references are unavailable or differ. No confirmation is claimed.",
        );
      if (attempt.status === "moderation")
        return {
          ...attempt,
          checked: true,
          result: null,
          message:
            "Moderation remains pending. Saved source matches, but the existing public post does not prove this edited revision was released.",
        };
      return {
        ...attempt,
        status: "confirmed",
        checked: true,
        candidateURL: target.threadURL,
        message: `Confirmed saved post ${target.postId}, submitted revision ${attempt.publication.submission.revision}.`,
        result: {
          threadId: target.threadId,
          postId: target.postId,
          url: `${target.threadURL.split("#")[0]}#pid${target.postId}`,
          verification,
        },
      };
    } catch {
      return uncertain(
        "Saved post readback failed. Check this original attempt; nothing was repeated.",
      );
    }
  }
  async function check(attempt: ThreadAttempt): Promise<ThreadAttempt> {
    const result = await checkContent(attempt),
      writing = attempt.publication.submission.writing;
    if (
      !writing.existingRedPacket ||
      !writing.editTarget ||
      config.account().kind !== "member"
    )
      return result;
    const generation = config.generation();
    const observed = await observeRedPacket(
      config.transport,
      config.origin,
      writing.editTarget.threadId,
    );
    const credits = await observePacketLedger(
      config.transport,
      config.origin,
      writing.account.id,
    );
    if (credits.account.kind !== "unknown") config.observe(credits.account);
    return {
      ...result,
      redPacket:
        generation === config.generation()
          ? { ...observed, ledger: credits.ledger }
          : { state: "unknown", conditions: [], credit: "unknown" },
    };
  }
  async function save(attempt: ThreadAttempt): Promise<ThreadAttempt> {
    attempt = copy(attempt);
    const known = prepared.get(attempt.publication.id),
      contextId = attempt.publication.submission.contextId;
    const notSent = (message: string): ThreadAttempt => ({
      ...attempt,
      status: "not-sent",
      message,
    });
    if (
      !known ||
      !equal(known, attempt.publication) ||
      attempt.status !== "pending" ||
      pending.has(contextId) ||
      config.generation() !== known.generation
    )
      return notSent(
        "This edit preparation is stale or already active. Nothing was sent.",
      );
    prepared.delete(known.id);
    pending.add(contextId);
    let sent = false;
    try {
      const w = known.submission.writing;
      if (!(await mentionsCurrent(config, w)))
        return notSent(
          "A selected mention identity changed before send. Nothing was sent.",
        );
      if (config.generation() !== known.generation)
        return notSent("The account changed before save. Nothing was sent.");
      const fresh = await current(w);
      if (!fresh || config.generation() !== known.generation)
        return notSent(
          "Current source or original account changed before save. Review again.",
        );
      if (
        !equal(w.editTarget!.baseline, editBaseline(fresh.latest)) ||
        !compatible(w, fresh.latest)
      )
        return notSent(
          "The server post changed before save. Review latest source again; nothing was sent.",
        );
      const uploadFields = await validateUploadFields(
        config.transport,
        w,
        fresh.response,
      );
      if (config.generation() !== known.generation)
        return notSent("The account changed before save. Nothing was sent.");
      const request =
        uploadFields && successful(fresh.response, w, false, uploadFields);
      if (!request)
        return notSent(
          "Required current form content cannot be preserved. Nothing was sent.",
        );
      sent = true;
      const response = await config.transport.request(request.url, {
        method: "POST",
        body: request.body,
        fresh: true,
      });
      if (config.generation() !== known.generation)
        return {
          ...attempt,
          status: "uncertain",
          message:
            "The account changed during save. The edit may have been accepted; no rollback is guaranteed.",
        };
      const result = outcome(response, config.origin);
      if (result.kind === "candidate")
        return check({
          ...attempt,
          candidateURL: w.editTarget!.threadURL,
          status: "uncertain",
        });
      return {
        ...attempt,
        status: result.kind === "unknown" ? "uncertain" : result.kind,
        message: result.message,
        candidateURL: w.editTarget!.threadURL,
      };
    } catch {
      return sent
        ? {
            ...attempt,
            status: "uncertain",
            candidateURL: known.submission.writing.editTarget!.threadURL,
            message:
              "The edit response was lost. Check the original saved post; nothing was repeated.",
          }
        : notSent("Fresh edit preflight failed. Your source remains retained.");
    } finally {
      pending.delete(contextId);
    }
  }
  return { load, prepare, save, check };
}
