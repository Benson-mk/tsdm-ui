import { createEditorSession, type EditorSession } from "../editor/session.js";
import { computed, readonly, shallowRef } from "vue";
import { isThreadVerification } from "../forum-client/thread-verification";
import {
  unresolvedWritingAttachments,
  editBaseline,
  type Account,
  type ForumClient,
  type PreparedWriting,
  type ThreadAttempt,
  type DraftAttempt,
  type ThreadPublication,
  type ReplyTarget,
  type MentionIdentity,
} from "../forum-client";
export interface WritingContext extends PreparedWriting {
  draftAttempts?: import("../forum-client").DraftAttempt[];
  id: string;
  revision: number;
  editorUnresolved?: boolean;
  attempts?: ThreadAttempt[];
  selection: {
    start: number;
    end: number;
    direction: "forward" | "backward" | "none";
  };
}
export function createWriting(
  client: ForumClient,
  changed: () => Promise<boolean>,
  accountObserved: (account: Account) => void,
  publishedDraft?: (url: string) => Promise<void>,
) {
  const state = shallowRef<{
    context: WritingContext | null;
    visible: boolean;
    preparing: boolean;
    message: string;
    replacement: { boardId: string; replyTarget?: ReplyTarget } | null;
    editReplacement: { threadURL: string; postId: string } | null;
    conflict: PreparedWriting | null;
    reloadWarning: boolean;
    overwriteWarning: boolean;
    draftReplacement: {
      row: import("../forum-client").DraftRow;
      account: Account;
    } | null;
    acknowledged: number;
    recoveryAvailable: boolean | null;
    accountVerified: boolean;
    composing: boolean;
    compositionDeferred: boolean;
    mentionPeople: MentionIdentity[];
    mentionGeneration: number;
    findingMention: boolean;
    publication: ThreadPublication | null;
    publishing: boolean;
    resend: string | null;
    draftResend: {
      id: string;
      contextId: string;
      revision: number;
      generation: number;
    } | null;
    copy: {
      prepared: PreparedWriting;
      generation: number;
      originalId: string;
    } | null;
  }>({
    context: null,
    visible: false,
    preparing: false,
    message: "",
    replacement: null,
    editReplacement: null,
    conflict: null,
    reloadWarning: false,
    overwriteWarning: false,
    draftReplacement: null,
    acknowledged: 0,
    recoveryAvailable: null,
    accountVerified: false,
    copy: null,
    composing: false,
    compositionDeferred: false,
    mentionPeople: [],
    mentionGeneration: -1,
    findingMention: false,
    publication: null,
    publishing: false,
    resend: null,
    draftResend: null,
  });
  const uploadBytes = new Map<string, import("../forum-client").UploadFile>();
  const uploadControllers = new Map<string, AbortController>();
  function updateUpload(
    key: string,
    patch: Partial<import("../forum-client").WritingUpload>,
  ) {
    const c = state.value.context;
    if (!c?.uploads?.some((u) => u.key === key)) return;
    state.value = {
      ...state.value,
      publication: null,
      context: {
        ...c,
        revision: c.revision + 1,
        uploads: c.uploads.map((u) => (u.key === key ? { ...u, ...patch } : u)),
      },
    };
    void changed();
  }
  function beginAttachmentSelection() {
    const origin = state.value.context;
    const generation = client.generation;
    let delivered = false;
    state.value = { ...state.value, message: "" };
    return {
      complete(files: import("../forum-client").UploadFile[]) {
        const current = state.value.context;
        if (delivered) return;
        delivered = true;
        if (
          !origin ||
          !current ||
          origin.id !== current.id ||
          origin.account.id !== current.account.id ||
          generation !== client.generation ||
          client.account.kind !== "member" ||
          client.account.id !== origin.account.id ||
          !state.value.accountVerified ||
          state.value.publishing
        ) {
          state.value = {
            ...state.value,
            message:
              "The writing context or account changed while reading files. Select them again for the current writing.",
          };
          return;
        }
        selectAttachments(files);
      },
      fail() {
        if (delivered) return;
        delivered = true;
        state.value = {
          ...state.value,
          message: "The selected files could not be read. Select them again.",
        };
      },
    };
  }
  function selectAttachments(files: import("../forum-client").UploadFile[]) {
    const c = state.value.context;
    if (!c || !state.value.accountVerified || state.value.publishing) return;
    const rows = files.map((file) => {
      const key = crypto.randomUUID();
      uploadBytes.set(key, { ...file, bytes: new Uint8Array(file.bytes) });
      return {
        key,
        name: file.name,
        type: file.type,
        size: file.bytes.length,
        status: "selected" as const,
        message: "",
        loaded: 0,
      };
    });
    state.value = {
      ...state.value,
      publication: null,
      context: {
        ...c,
        revision: c.revision + 1,
        uploads: [...(c.uploads ?? []), ...rows],
      },
    };
    void changed();
  }
  async function uploadAttachment(key: string) {
    const c = state.value.context,
      row = c?.uploads?.find((u) => u.key === key),
      file = uploadBytes.get(key);
    if (
      !c ||
      !row ||
      row.status !== "selected" ||
      !file ||
      !state.value.accountVerified ||
      state.value.publishing ||
      uploadControllers.size
    )
      return;
    const controller = new AbortController();
    uploadControllers.set(key, controller);
    updateUpload(key, {
      status: "uploading",
      message: "Uploading selected bytes…",
    });
    const saved = await changed();
    if (!saved) {
      uploadControllers.delete(key);
      updateUpload(key, {
        status: "selected",
        message: "Refresh recovery must be available before upload.",
      });
      return;
    }
    const result = await client.uploadAttachment(
      c,
      file,
      (loaded) => updateUpload(key, { loaded }),
      controller.signal,
    );
    uploadControllers.delete(key);
    accountObserved(client.account);
    observe(client.account);
    const current = state.value.context;
    if (current?.id !== c.id || !current.uploads?.some((u) => u.key === key))
      return;
    if (result.kind === "uploaded") {
      state.value = {
        ...state.value,
        publication: null,
        context: {
          ...current,
          revision: current.revision + 1,
          uploadedReferences: [...current.uploadedReferences, result.id],
          attachmentFields: [
            ...(current.attachmentFields ?? []),
            ...result.fields,
          ],
          uploads: (current.uploads ?? []).map((u) =>
            u.key === key
              ? {
                  ...u,
                  status: "uploaded",
                  serverId: result.id,
                  referenceKind: result.referenceKind,
                  originalSha256: result.sha256,
                  fields: result.fields,
                  loaded: u.size,
                  message:
                    "Original selected bytes sent. Upload success does not establish a saved association.",
                }
              : u,
          ),
        },
      };
      uploadBytes.delete(key);
      void changed();
    } else
      updateUpload(key, {
        status: result.kind === "uncertain" ? "uncertain" : "rejected",
        message: result.message,
        ...(result.kind === "uncertain" && result.id
          ? { serverId: result.id }
          : {}),
      });
  }
  function insertAttachment(key: string) {
    const c = state.value.context,
      u = c?.uploads?.find((u) => u.key === key);
    if (
      !c ||
      !u?.serverId ||
      state.value.composing ||
      !["uploaded", "associated"].includes(u.status)
    )
      return;
    if (!u.referenceKind) {
      updateUpload(key, {
        message:
          "This attachment has no verified insertion instruction. Continue in the native editor.",
      });
      return;
    }
    const tag = `[${u.referenceKind}]${u.serverId}[/${u.referenceKind}]`,
      session = editor();
    const { from, to } = session.sourceSelection;
    if (session.state.mode === "visual")
      session.command("reference", { kind: u.referenceKind, body: u.serverId });
    else
      session.updateSource({
        from,
        to,
        text: tag,
        selection: {
          from: from + tag.length,
          to: from + tag.length,
          direction: "none",
        },
      });
  }
  let editorSession: EditorSession | null = null;
  let editorContext = "";
  let recoveredInterpretation = false;
  function editor() {
    const context = state.value.context;
    if (!context) throw new Error("No writing context.");
    if (editorContext !== context.id || !editorSession) {
      editorSession?.dispose();
      editorContext = context.id;
      recoveredInterpretation = context.editorUnresolved === true;
      let initialized = false;
      editorSession = createEditorSession({
        source: context.source,
        compositionId: context.id,
        onChange: (snapshot) => {
          if (!initialized) return;
          const unresolved =
            recoveredInterpretation || !snapshot.readiness.ready;
          const current = state.value.context;
          if (!current) return;
          const range = editorSession?.recoverySelection;
          edit({
            source: snapshot.source,
            ...(unresolved || current.editorUnresolved !== undefined
              ? { editorUnresolved: unresolved }
              : {}),
            selection: range
              ? {
                  start: range.from,
                  end: range.to,
                  direction: range.direction,
                }
              : {
                  ...current.selection,
                  start: Math.min(
                    current.selection.start,
                    snapshot.source.length,
                  ),
                  end: Math.min(current.selection.end, snapshot.source.length),
                },
          });
        },
      });
      editorSession.setMode("source");
      editorSession.setSourceSelection(
        context.selection.start,
        context.selection.end,
        context.selection.direction,
      );
      initialized = true;
    }
    return editorSession;
  }
  function interpretEditorSource() {
    const session = editor();
    if (state.value.composing) return;
    recoveredInterpretation = false;
    for (const range of session.state.literalRanges)
      session.resolveLiteral(range.id, "bbcode");
    for (const range of session.state.representationRanges)
      session.resolveRepresentation(range.id);
    edit({ editorUnresolved: !session.state.readiness.ready });
  }
  let sequence = 0;
  let deferred: (() => void) | null = null;
  function deferViewChange(action: () => void) {
    if (!state.value.composing) return false;
    deferred = action;
    state.value = { ...state.value, compositionDeferred: true };
    return true;
  }
  function endComposition() {
    state.value = { ...state.value, composing: false };
    setTimeout(() => {
      if (state.value.composing) return;
      const action = deferred;
      deferred = null;
      state.value = { ...state.value, compositionDeferred: false };
      action?.();
    }, 0);
  }
  async function prepare(
    boardId: string,
    replace = false,
    replyTarget?: ReplyTarget,
  ) {
    if (
      deferViewChange(() => {
        void prepare(boardId, replace, replyTarget);
      })
    )
      return;
    const existing = state.value.context;
    const sameAction =
      existing?.action !== "edit-post" &&
      existing?.board.id === boardId &&
      JSON.stringify(existing?.replyTarget) === JSON.stringify(replyTarget);
    if (state.value.publishing && (replace || !sameAction)) {
      state.value = {
        ...state.value,
        message:
          "Publication or result checking is pending. Keep this context until it settles.",
      };
      return;
    }
    if (existing && !replace) {
      if (sameAction) {
        state.value = { ...state.value, visible: true, replacement: null };
        return;
      }
      state.value = {
        ...state.value,
        replacement: { boardId, ...(replyTarget ? { replyTarget } : {}) },
      };
      return;
    }
    const current = ++sequence;
    state.value = { ...state.value, preparing: true, message: "" };
    const result = await (replyTarget
      ? client.prepareReply(boardId, replyTarget)
      : client.prepareNewThread(boardId));
    if (result.kind !== "stale") {
      accountObserved(result.account);
      observe(result.account, result.kind === "prepared");
    }
    if (current !== sequence) return;
    if (result.kind !== "prepared") {
      state.value = {
        ...state.value,
        preparing: false,
        message: result.message,
      };
      return;
    }
    if (
      existing &&
      (state.value.context?.id !== existing.id ||
        state.value.context.revision !== existing.revision ||
        state.value.composing)
    ) {
      state.value = {
        ...state.value,
        preparing: false,
        message:
          "Writing changed while the new form was loading. Return to it or deliberately prepare replacement again.",
      };
      return;
    }
    state.value = {
      ...state.value,
      context: {
        ...result.prepared,
        id: crypto.randomUUID(),
        revision: 1,
        selection: { start: 0, end: 0, direction: "none" },
        ...(existing?.attempts?.length ? { attempts: existing.attempts } : {}),
        ...(existing?.draftAttempts?.length
          ? { draftAttempts: existing.draftAttempts }
          : {}),
      },
      preparing: false,
      visible: true,
      replacement: null,
      message: "",
      acknowledged: 0,
      mentionPeople: [],
      mentionGeneration: -1,
      findingMention: false,
      accountVerified: true,
      copy: null,
      publication: null,
      conflict: null,
      editReplacement: null,
      reloadWarning: false,
      overwriteWarning: false,
    };
    changed();
  }
  async function prepareEdit(
    threadURL: string,
    postId: string,
    replace = false,
  ) {
    if (
      deferViewChange(() => {
        void prepareEdit(threadURL, postId, replace);
      })
    )
      return;
    if (state.value.publishing || state.value.preparing) return;
    const existing = state.value.context;
    if (existing && !replace) {
      if (
        existing.action === "edit-post" &&
        existing.editTarget?.postId === postId
      ) {
        state.value = { ...state.value, visible: true };
        return;
      }
      state.value = { ...state.value, editReplacement: { threadURL, postId } };
      return;
    }
    const current = ++sequence;
    state.value = { ...state.value, preparing: true, message: "" };
    const result = await client.preparePostEdit(threadURL, postId);
    accountObserved(result.account);
    observe(result.account, result.kind === "prepared");
    if (current !== sequence) return;
    if (result.kind !== "prepared") {
      state.value = {
        ...state.value,
        preparing: false,
        message: result.message,
      };
      return;
    }
    if (
      existing &&
      (state.value.context?.id !== existing.id ||
        state.value.context.revision !== existing.revision ||
        state.value.composing)
    ) {
      state.value = {
        ...state.value,
        preparing: false,
        message:
          "Local writing changed while loading the edit. Review replacement again.",
      };
      return;
    }
    state.value = {
      ...state.value,
      context: {
        ...result.prepared,
        id: crypto.randomUUID(),
        revision: 1,
        selection: { start: 0, end: 0, direction: "none" },
        ...(existing?.attempts?.length ? { attempts: existing.attempts } : {}),
        ...(existing?.draftAttempts?.length
          ? { draftAttempts: existing.draftAttempts }
          : {}),
      },
      preparing: false,
      visible: true,
      editReplacement: null,
      conflict: null,
      reloadWarning: false,
      publication: null,
      acknowledged: 0,
      accountVerified: true,
    };
    await changed();
  }
  function reconcileEdit(mode: "manual" | "overwrite" | "reload") {
    if (deferViewChange(() => reconcileEdit(mode))) return;
    const latest = state.value.conflict,
      context = state.value.context;
    if (
      !latest?.editTarget ||
      !context?.editTarget ||
      state.value.preparing ||
      state.value.publishing ||
      latest.account.id !== context.account.id ||
      !state.value.accountVerified
    )
      return;
    const next =
      mode === "reload"
        ? {
            ...context,
            ...latest,
            selection: { start: 0, end: 0, direction: "none" as const },
          }
        : {
            ...context,
            ...(mode === "manual"
              ? { category: latest.category, options: latest.options }
              : {}),
            editTarget: latest.editTarget,
            uploadedReferences: latest.uploadedReferences,
            attachmentFields: latest.attachmentFields ?? [],
          };
    state.value = {
      ...state.value,
      context: { ...next, revision: context.revision + 1 },
      conflict: null,
      reloadWarning: false,
      overwriteWarning: false,
      publication: null,
      message:
        mode === "manual"
          ? "Reconcile your local source and options with the latest server version, then review the edit again."
          : "",
    };
    void changed();
    if (mode === "overwrite") void reviewPublication();
  }
  async function resumeDraft(
    row: import("../forum-client").DraftRow,
    account: Account,
    replace = false,
  ) {
    if (
      deferViewChange(() => {
        void resumeDraft(row, account, replace);
      })
    )
      return;
    const existing = state.value.context;
    if (state.value.publishing || state.value.preparing) return;
    if (
      existing?.draft?.threadId === row.threadId &&
      existing.account.id === (account.kind === "member" ? account.id : null) &&
      !replace
    ) {
      showExisting();
      return;
    }
    if (existing && !replace) {
      state.value = {
        ...state.value,
        draftReplacement: { row, account },
        replacement: null,
      };
      return;
    }
    const current = ++sequence;
    state.value = { ...state.value, preparing: true, message: "" };
    const result = await client.resumeDraft(row, account);
    accountObserved(result.account);
    observe(result.account, result.kind === "prepared");
    if (current !== sequence) return;
    if (result.kind !== "prepared") {
      state.value = {
        ...state.value,
        preparing: false,
        message: result.message,
      };
      return;
    }
    if (
      existing &&
      (state.value.context?.id !== existing.id ||
        state.value.context.revision !== existing.revision ||
        state.value.composing)
    ) {
      state.value = {
        ...state.value,
        preparing: false,
        message:
          "Writing changed while the draft was loading. Your current writing is retained.",
      };
      return;
    }
    state.value = {
      ...state.value,
      context: {
        ...result.prepared,
        id: crypto.randomUUID(),
        revision: 1,
        selection: { start: 0, end: 0, direction: "none" },
        ...(existing?.attempts ? { attempts: existing.attempts } : {}),
        ...(existing?.draftAttempts
          ? { draftAttempts: existing.draftAttempts }
          : {}),
      },
      preparing: false,
      visible: true,
      replacement: null,
      draftReplacement: null,
      message: "",
      acknowledged: 0,
      accountVerified: true,
      publication: null,
    };
    await changed();
  }
  function showExisting() {
    state.value = {
      ...state.value,
      visible: true,
      replacement: null,
      draftReplacement: null,
    };
  }
  async function checkDraft(
    id: string,
    row?: import("../forum-client").DraftRow,
  ) {
    const context = state.value.context,
      attempt = context?.draftAttempts?.find((a) => a.id === id);
    if (
      !context ||
      !attempt ||
      !["uncertain", "moderation"].includes(attempt.status) ||
      state.value.publishing ||
      state.value.preparing
    )
      return;
    state.value = { ...state.value, publishing: true };
    const result = await client.checkDraft(attempt, row);
    accountObserved(client.account);
    observe(client.account);
    const current = state.value.context;
    if (current?.id === context.id)
      state.value = {
        ...state.value,
        publishing: false,
        message: result.status === "published" ? result.message : "",
        context: {
          ...current,
          ...draftResult(current, result),
          draftAttempts: (current.draftAttempts ?? []).map((a) =>
            a.id === result.id ? result : a,
          ),
        },
      };
    else state.value = { ...state.value, publishing: false };
    await changed();
    if (result.status === "published" && result.publishedURL)
      await publishedDraft?.(result.publishedURL);
  }
  function edit(
    patch: Partial<
      Pick<
        WritingContext,
        | "title"
        | "source"
        | "category"
        | "options"
        | "selection"
        | "mentions"
        | "editorUnresolved"
      >
    >,
  ) {
    const context = state.value.context;
    if (context) {
      if (
        Object.entries(patch).every(
          ([key, value]) =>
            JSON.stringify(context[key as keyof WritingContext]) ===
            JSON.stringify(value),
        )
      )
        return;
      state.value = {
        ...state.value,
        context: { ...context, ...patch, revision: context.revision + 1 },
        publication: null,
      };
      changed();
    }
  }
  function submission(context: WritingContext) {
    const {
      id,
      revision,
      selection: _selection,
      attempts: _attempts,
      editorUnresolved: _editorUnresolved,
      draftAttempts: _draftAttempts,
      ...content
    } = context;
    void [_selection, _attempts, _editorUnresolved, _draftAttempts];
    return { contextId: id, revision, writing: content };
  }
  function updateAttempt(attempt: ThreadAttempt) {
    const context = state.value.context;
    if (
      !context ||
      (context.id !== attempt.publication.submission.contextId &&
        !context.attempts?.some((item) => item.id === attempt.id))
    )
      return;
    state.value = {
      ...state.value,
      context: {
        ...context,
        ...(attempt.status === "confirmed" &&
        context.id === attempt.publication.submission.contextId &&
        context.editTarget &&
        attempt.publication.submission.writing.editTarget
          ? {
              editTarget: {
                ...context.editTarget,
                baseline: editBaseline({
                  ...attempt.publication.submission.writing,
                  options: attempt.publication.submission.writing.options.map(
                    (option) => {
                      const normalization =
                        attempt.result?.verification?.normalizations.find(
                          (item) => item.name === option.name,
                        );
                      return normalization
                        ? { ...option, value: normalization.stored }
                        : option;
                    },
                  ),
                }),
              },
            }
          : {}),
        ...(attempt.status === "confirmed"
          ? {
              uploads: (context.uploads ?? []).map((u) =>
                u.serverId &&
                attempt.publication.submission.writing.uploadedReferences.includes(
                  u.serverId,
                )
                  ? {
                      ...u,
                      status: "associated" as const,
                      ...(attempt.result
                        ? {
                            storedPost: {
                              threadURL: attempt.result.url,
                              postId: attempt.result.postId,
                            },
                          }
                        : {}),
                    }
                  : u,
              ),
            }
          : {}),
        attempts: [
          ...(context.attempts ?? []).filter((item) => item.id !== attempt.id),
          attempt,
        ],
      },
    };
  }
  function draftResult(
    context: WritingContext,
    result: DraftAttempt,
  ): Partial<WritingContext> {
    if (!result.result || result.submission.contextId !== context.id) return {};
    const canonicalFields = (fields: PreparedWriting["attachmentFields"]) =>
      (fields ?? []).map((field) =>
        result.observation?.attachmentNormalizations?.some(
          (normalization) =>
            normalization.name === field.name &&
            !field.disabled &&
            field.value === normalization.submitted &&
            result.submission.writing.attachmentFields?.some(
              (original) =>
                original.name === field.name &&
                !original.disabled &&
                original.value === normalization.submitted,
            ),
        )
          ? { ...field, value: "0" }
          : field,
      );
    return {
      // An observed partial result is not consent to replace the original
      // conflict baseline with another session's newer content.
      draft:
        context.draft && !["confirmed", "published"].includes(result.status)
          ? context.draft
          : result.result,
      ...(result.observation?.attachments === "unknown"
        ? {
            uploads: (context.uploads ?? []).map((u) =>
              u.serverId &&
              result.submission.writing.uploadedReferences.includes(
                u.serverId,
              ) &&
              u.status === "associated"
                ? {
                    ...u,
                    status: "uploaded" as const,
                    message:
                      "Current attachment association is unconfirmed. Check the original draft attempt before saving again.",
                  }
                : u,
            ),
          }
        : {}),
      ...(["confirmed", "published"].includes(result.status)
        ? {
            attachmentFields: canonicalFields(context.attachmentFields),
            uploads: (context.uploads ?? []).map((u) =>
              u.serverId &&
              result.submission.writing.uploadedReferences.includes(
                u.serverId,
              ) &&
              ["uploaded", "associated"].includes(u.status)
                ? {
                    ...u,
                    status: "associated" as const,
                    fields: canonicalFields(u.fields),
                    storedPost: {
                      threadURL: result.result!.url,
                      postId: result.result!.postId,
                    },
                  }
                : u,
            ),
          }
        : {}),
    };
  }
  function sameDraftContext(attempt: DraftAttempt, context: WritingContext) {
    const original = attempt.submission.writing;
    // A first Save can acquire a verified target without rewriting its immutable
    // submission. Only that same observed draft participates in this lineage.
    const target =
      original.draft ??
      (attempt.observation?.state === "draft" ? attempt.result : null);
    return (
      attempt.submission.contextId === context.id &&
      original.account.id === context.account.id &&
      original.action === context.action &&
      context.action === "new-thread" &&
      original.board.id === context.board.id &&
      target?.threadId === context.draft?.threadId &&
      target?.postId === context.draft?.postId
    );
  }
  function canResendDraft(id: string) {
    const context = state.value.context,
      attempt = context?.draftAttempts?.find((a) => a.id === id);
    return (
      !!context &&
      !!attempt &&
      attempt.status === "uncertain" &&
      attempt.checked === true &&
      sameDraftContext(attempt, context) &&
      !context.editorUnresolved &&
      !state.value.composing &&
      !state.value.preparing &&
      !state.value.publishing
    );
  }
  function blocksDraft(
    attempt: DraftAttempt,
    context: WritingContext,
    resendId?: string,
  ) {
    // Explicit resend waives only its original unknown lineage, never another
    // unresolved operation or a confirmed publication of this target.
    const lineage = new Set<string>();
    let id = resendId;
    while (id && !lineage.has(id)) {
      const original = context.draftAttempts?.find((a) => a.id === id);
      if (!original || !sameDraftContext(original, context)) break;
      lineage.add(id);
      id = original.resendOf;
    }
    const confirmedResend = context.draftAttempts?.some((result) => {
      if (
        !result.resendOf ||
        !["confirmed", "published"].includes(result.status) ||
        result.submission.contextId !== context.id ||
        result.submission.writing.account.id !== context.account.id ||
        !context.draft ||
        result.result?.threadId !== context.draft.threadId
      )
        return false;
      const visited = new Set<string>();
      let parent: string | undefined = result.resendOf;
      while (parent && !visited.has(parent)) {
        if (parent === attempt.id) return true;
        visited.add(parent);
        parent = context.draftAttempts?.find((a) => a.id === parent)?.resendOf;
      }
      return false;
    });
    return (
      (["pending", "uncertain", "moderation"].includes(attempt.status) &&
        !(
          attempt.status === "uncertain" &&
          (lineage.has(attempt.id) || confirmedResend)
        )) ||
      (attempt.status === "published" &&
        (attempt.submission.contextId === context.id ||
          (!!context.draft &&
            attempt.submission.writing.draft?.threadId ===
              context.draft.threadId)))
    );
  }
  function warnDraftResend(id: string) {
    const context = state.value.context;
    if (!context || !canResendDraft(id)) return;
    state.value = {
      ...state.value,
      draftResend: {
        id,
        contextId: context.id,
        revision: context.revision,
        generation: client.generation,
      },
    };
  }
  async function confirmDraftResend() {
    const proposal = state.value.draftResend,
      context = state.value.context;
    state.value = { ...state.value, draftResend: null };
    if (!proposal || !context) return;
    if (
      proposal.contextId !== context.id ||
      proposal.revision !== context.revision ||
      proposal.generation !== client.generation ||
      !canResendDraft(proposal.id)
    ) {
      state.value = {
        ...state.value,
        message:
          "The draft resend proposal changed. Review the current action, account and revision again. Nothing was sent.",
      };
      return;
    }
    const attempt = context.draftAttempts!.find((a) => a.id === proposal.id)!;
    if (
      !attempt.submission.writing.draft &&
      attempt.result &&
      attempt.observation?.content !== "confirmed"
    ) {
      state.value = {
        ...state.value,
        message:
          "The observed draft content differs from the original submission. Resume its current revision before saving; no resend was sent.",
      };
      return;
    }
    if (attempt.operation === "publish") await publishDraft(proposal.id);
    else await saveDraft(false, proposal.id);
  }
  async function saveDraft(continueAfter = false, resendId?: string) {
    const context = state.value.context;
    if (
      !context ||
      state.value.preparing ||
      state.value.publishing ||
      state.value.composing
    )
      return;
    if (
      context.uploads?.some(
        (u) => !["uploaded", "associated", "removed"].includes(u.status),
      )
    ) {
      state.value = {
        ...state.value,
        message:
          "Finish uploads or explicitly remove pending selections before saving or publishing a draft.",
      };
      return;
    }
    if (context.editorUnresolved) {
      state.value = {
        ...state.value,
        message:
          "Review the complete source and resolve its interpretation before publication.",
      };
      return;
    }
    if (!state.value.accountVerified) {
      await check();
      if (
        !state.value.accountVerified ||
        state.value.context?.id !== context.id ||
        state.value.context.revision !== context.revision
      )
        return;
    }
    if (
      (resendId && !canResendDraft(resendId)) ||
      context.draftAttempts?.some((a) => blocksDraft(a, context, resendId))
    ) {
      state.value = {
        ...state.value,
        message:
          "An earlier draft save may have succeeded. Check its original result before another save.",
      };
      return;
    }
    const proposal: import("../forum-client").DraftAttempt = {
      id: crypto.randomUUID(),
      generation: client.generation,
      submission: submission(context),
      status: "pending",
      checked: false,
      ...(resendId ? { resendOf: resendId } : {}),
      message: "Saving forum draft…",
      result: null,
    };
    state.value = { ...state.value, publishing: true, publication: null };
    const attempt = await client.prepareDraftSave(proposal);
    accountObserved(client.account);
    observe(client.account);
    const beforeSend = state.value.context;
    if (
      beforeSend?.id !== context.id ||
      beforeSend.revision !== context.revision
    ) {
      state.value = {
        ...state.value,
        publishing: false,
        message:
          "Writing changed during draft-save preparation. Nothing was sent.",
      };
      return;
    }
    state.value = {
      ...state.value,
      publishing: true,
      publication: null,
      context: {
        ...beforeSend,
        draftAttempts: [...(beforeSend.draftAttempts ?? []), attempt],
      },
    };
    const retained = await changed();
    const result =
      attempt.status === "pending" &&
      retained &&
      state.value.context?.id === context.id &&
      state.value.context.revision === context.revision
        ? await client.saveDraft(attempt)
        : attempt.status === "not-sent"
          ? attempt
          : {
              ...attempt,
              status: "not-sent" as const,
              message:
                "Draft saving was not sent because the acknowledged revision changed.",
            };
    accountObserved(client.account);
    observe(client.account);
    const current = state.value.context;
    if (current?.id === context.id)
      state.value = {
        ...state.value,
        publishing: false,
        context: {
          ...current,
          ...draftResult(current, result),
          draftAttempts: [
            ...(current.draftAttempts ?? []).filter((a) => a.id !== result.id),
            result,
          ],
        },
      };
    else state.value = { ...state.value, publishing: false };
    await changed();
    if (
      continueAfter &&
      result.status === "confirmed" &&
      state.value.context?.id === context.id &&
      state.value.context.revision === context.revision &&
      !state.value.composing
    ) {
      if (state.value.editReplacement)
        await prepareEdit(
          state.value.editReplacement.threadURL,
          state.value.editReplacement.postId,
          true,
        );
      else if (state.value.draftReplacement)
        await resumeDraft(
          state.value.draftReplacement.row,
          state.value.draftReplacement.account,
          true,
        );
      else if (state.value.replacement)
        await prepare(
          state.value.replacement.boardId,
          true,
          state.value.replacement.replyTarget,
        );
    }
  }
  async function publishDraft(resendId?: string) {
    const context = state.value.context;
    if (
      !context?.draft ||
      state.value.preparing ||
      state.value.publishing ||
      state.value.composing
    )
      return;
    if (
      context.uploads?.some(
        (u) => !["uploaded", "associated", "removed"].includes(u.status),
      )
    ) {
      state.value = {
        ...state.value,
        message:
          "Finish uploads or explicitly remove pending selections before saving or publishing a draft.",
      };
      return;
    }
    if (context.editorUnresolved) {
      state.value = {
        ...state.value,
        message:
          "Review the complete source and resolve its interpretation before publication.",
      };
      return;
    }
    if (!state.value.accountVerified) {
      await check();
      if (
        !state.value.accountVerified ||
        state.value.context?.id !== context.id ||
        state.value.context.revision !== context.revision
      )
        return;
    }
    if (
      (resendId && !canResendDraft(resendId)) ||
      context.draftAttempts?.some((a) => blocksDraft(a, context, resendId))
    ) {
      state.value = {
        ...state.value,
        message:
          "An earlier draft operation remains unresolved or already published. Check the original result; no action was repeated.",
      };
      return;
    }
    const attempt: import("../forum-client").DraftAttempt = {
      id: crypto.randomUUID(),
      generation: client.generation,
      operation: "publish",
      submission: submission(context),
      status: "pending",
      checked: false,
      ...(resendId ? { resendOf: resendId } : {}),
      message: "Publishing the confirmed saved forum draft…",
      result: null,
    };
    state.value = {
      ...state.value,
      publishing: true,
      publication: null,
      context: {
        ...context,
        draftAttempts: [...(context.draftAttempts ?? []), attempt],
      },
    };
    const retained = await changed();
    const result =
      retained &&
      state.value.context?.id === context.id &&
      state.value.context.revision === context.revision
        ? await client.publishDraft(attempt)
        : {
            ...attempt,
            status: "not-sent" as const,
            message:
              "Draft publication was not sent because the acknowledged revision changed.",
          };
    accountObserved(client.account);
    observe(client.account);
    const current = state.value.context;
    if (current?.id === context.id)
      state.value = {
        ...state.value,
        publishing: false,
        message: result.message,
        context: {
          ...current,
          ...draftResult(current, result),
          draftAttempts: (current.draftAttempts ?? []).map((a) =>
            a.id === result.id ? result : a,
          ),
        },
      };
    else state.value = { ...state.value, publishing: false };
    await changed();
    if (result.status === "published" && result.publishedURL)
      await publishedDraft?.(result.publishedURL);
  }
  async function reviewPublication(resendId?: string) {
    if (
      state.value.context?.uploads?.some(
        (u) => !["uploaded", "associated", "removed"].includes(u.status),
      )
    ) {
      state.value = {
        ...state.value,
        message:
          "Finish uploads or explicitly remove pending selections before submitting.",
      };
      return;
    }
    const context = state.value.context;
    if (
      context?.action === "new-thread" &&
      (context.draft ||
        context.draftAttempts?.some(
          (a) => a.status === "uncertain" || a.status === "pending",
        ))
    ) {
      state.value = {
        ...state.value,
        message:
          "This context has a forum draft or unresolved save. It cannot create a separate new thread. Use the explicit draft publication workflow.",
      };
      return;
    }
    if (
      !context ||
      state.value.preparing ||
      state.value.publishing ||
      state.value.composing
    )
      return;
    if (context.editorUnresolved) {
      state.value = {
        ...state.value,
        message:
          "Review the complete source and resolve its interpretation before publication.",
      };
      return;
    }
    const unresolved =
      context.attempts?.filter((attempt) =>
        ["pending", "uncertain", "moderation"].includes(attempt.status),
      ) ?? [];
    if (
      unresolved.length &&
      !unresolved.some(
        (attempt) =>
          attempt.id === resendId &&
          attempt.checked &&
          attempt.status === "uncertain",
      )
    ) {
      state.value = {
        ...state.value,
        message:
          "An earlier attempt may already exist. Check result, then explicitly accept duplicate risk before another send.",
      };
      return;
    }
    state.value = {
      ...state.value,
      preparing: true,
      publication: null,
      message: "",
    };
    const result =
      context.action === "edit-post"
        ? await client.prepareEditPublication(submission(context))
        : await client.prepareThreadPublication(submission(context));
    accountObserved(result.account);
    observe(
      result.account,
      result.kind === "ready" || result.kind === "conflict",
    );
    if (
      state.value.context?.id !== context.id ||
      state.value.context.revision !== context.revision
    ) {
      state.value = {
        ...state.value,
        preparing: false,
        message:
          "Writing changed during publication preparation. Review the current revision again.",
      };
      return;
    }
    state.value = {
      ...state.value,
      preparing: false,
      publication: result.kind === "ready" ? result.publication : null,
      conflict:
        result.kind === "conflict" ? result.latest : state.value.conflict,
      message: result.kind === "ready" ? "" : result.message,
    };
  }
  async function publish() {
    const publication = state.value.publication,
      context = state.value.context;
    if (
      !publication ||
      !context ||
      state.value.publishing ||
      state.value.composing ||
      publication.submission.revision !== context.revision
    )
      return;
    state.value = { ...state.value, publishing: true, publication: null };
    const attempt: ThreadAttempt = {
      id: crypto.randomUUID(),
      publication,
      status: "pending",
      message:
        "Publication is pending. Refresh will retain it as uncertain without replay.",
      checked: false,
      candidateURL: null,
      result: null,
    };
    updateAttempt(attempt);
    const saved = await changed();
    let result: ThreadAttempt;
    if (
      !saved ||
      state.value.context?.revision !== context.revision ||
      client.generation !== publication.generation
    )
      result = {
        ...attempt,
        status: "not-sent",
        message:
          "Publication was not sent because recovery, writing or the account changed before send. Your source is retained.",
      };
    else
      result =
        context.action === "edit-post"
          ? await client.savePostEdit(attempt)
          : await client.publishThread(attempt);
    accountObserved(client.account);
    observe(client.account);
    updateAttempt(result);
    state.value = { ...state.value, publishing: false };
    await changed();
  }
  async function checkResult(id: string, url?: string) {
    const attempt = state.value.context?.attempts?.find(
      (item) => item.id === id,
    );
    if (!attempt || state.value.publishing || state.value.preparing) return;
    state.value = { ...state.value, publishing: true, publication: null };
    const result =
      attempt.publication.submission.writing.action === "edit-post"
        ? await client.checkEditResult(attempt)
        : await client.checkThreadResult(attempt, url);
    accountObserved(client.account);
    observe(client.account);
    updateAttempt(result);
    state.value = { ...state.value, publishing: false };
    await changed();
  }
  async function searchMention(query: string) {
    const context = state.value.context;
    if (!context || state.value.findingMention) return;
    state.value = {
      ...state.value,
      findingMention: true,
      mentionPeople: [],
      message: "",
    };
    const found = await client.findMention(submission(context).writing, query);
    accountObserved(found.account);
    observe(found.account, found.kind === "people");
    if (state.value.context?.id !== context.id) return;
    state.value = {
      ...state.value,
      findingMention: false,
      mentionPeople: found.kind === "people" ? [...found.people] : [],
      mentionGeneration: found.generation,
      message: found.kind === "people" ? "" : found.message,
    };
  }
  function insertMention(id: string) {
    const context = state.value.context,
      person = state.value.mentionPeople.find((p) => p.id === id);
    if (
      !context ||
      !person ||
      state.value.composing ||
      client.generation !== state.value.mentionGeneration ||
      client.account.kind !== "member" ||
      client.account.id !== context.account.id
    )
      return;
    const session = editor(),
      insert = `@\u2063${person.name}\u2063 `;
    // Use the active editor selection, including cell selections and the
    // textarea's displayed-to-raw CRLF mapping. Raw source slicing cannot
    // safely represent a visual structural selection.
    const { from, to } = session.sourceSelection;
    const applied =
      session.state.mode === "visual"
        ? session.command("paste", { text: insert })
        : session.updateSource({
            from,
            to,
            text: insert,
            selection: {
              from: from + insert.length,
              to: from + insert.length,
              direction: "none",
            },
          });
    if (!applied) return;
    edit({
      mentions: [
        ...(context.mentions ?? []).filter((p) => p.id !== id),
        person,
      ],
    });
    state.value = { ...state.value, mentionPeople: [] };
  }
  function observe(account: Account, verified = true) {
    state.value = {
      ...state.value,
      accountVerified:
        verified &&
        account.kind === "member" &&
        account.id === state.value.context?.account.id,
    };
    if (
      state.value.copy &&
      (account.kind !== "member" ||
        account.id !== state.value.copy.prepared.account.id ||
        client.generation !== state.value.copy.generation)
    )
      state.value = { ...state.value, copy: null };
  }
  async function check(copyText = false) {
    const original = state.value.context;
    if (!original || state.value.publishing) return;
    const current = ++sequence;
    state.value = { ...state.value, preparing: true, copy: null, message: "" };
    const result =
      original.action === "edit-post" && !copyText && original.editTarget
        ? await client.preparePostEdit(
            original.editTarget.threadURL,
            original.editTarget.postId,
          )
        : original.replyTarget
          ? await client.prepareReply(original.board.id, original.replyTarget)
          : original.draft && !copyText
            ? await client.resumeDraft(
                {
                  threadId: original.draft.threadId,
                  boardId: original.board.id,
                  title: original.title,
                  url: original.draft.url,
                },
                original.account,
              )
            : await client.prepareNewThread(original.board.id);
    if (result.kind !== "stale") {
      accountObserved(result.account);
      observe(result.account, result.kind === "prepared");
    }
    if (current !== sequence || state.value.context?.id !== original.id) return;
    if (result.kind !== "prepared") {
      state.value = {
        ...state.value,
        preparing: false,
        message: result.message,
      };
      return;
    }
    state.value = {
      ...state.value,
      preparing: false,
      message:
        original.draft &&
        !copyText &&
        result.prepared.draft?.version !== original.draft.version
          ? "The remote draft changed or is no longer available. Resume its current revision before saving; your local writing is retained."
          : "",
      copy: copyText
        ? {
            prepared: result.prepared,
            generation: result.generation,
            originalId: original.id,
          }
        : null,
    };
  }
  function confirmCopy() {
    if (deferViewChange(confirmCopy)) return;
    const candidate = state.value.copy,
      original = state.value.context;
    if (
      !candidate ||
      !original ||
      candidate.originalId !== original.id ||
      state.value.publishing
    )
      return;
    if (
      candidate.generation !== client.generation ||
      client.account.kind !== "member" ||
      client.account.id !== candidate.prepared.account.id
    ) {
      state.value = {
        ...state.value,
        copy: null,
        accountVerified: false,
        message: "The account changed again. Prepare the text copy again.",
      };
      return;
    }
    state.value = {
      ...state.value,
      context: {
        ...candidate.prepared,
        title: original.title,
        source: original.source,
        ...(original.editorUnresolved ? { editorUnresolved: true } : {}),
        uploadedReferences: [],
        id: crypto.randomUUID(),
        revision: 1,
        selection: { ...original.selection },
        ...(original.attempts?.length ? { attempts: original.attempts } : {}),
        ...(original.draftAttempts?.length
          ? { draftAttempts: original.draftAttempts }
          : {}),
      },
      copy: null,
      acknowledged: 0,
      mentionPeople: [],
      mentionGeneration: -1,
      findingMention: false,
      accountVerified: true,
    };
    changed();
  }
  return {
    prepareEdit,
    warnReload: () => {
      state.value = {
        ...state.value,
        reloadWarning: true,
        overwriteWarning: false,
      };
    },
    warnOverwrite: () => {
      state.value = {
        ...state.value,
        overwriteWarning: true,
        reloadWarning: false,
      };
    },
    cancelConflictWarning: () => {
      state.value = {
        ...state.value,
        reloadWarning: false,
        overwriteWarning: false,
      };
    },
    reconcileEdit,
    cancelEditReplacement: () => {
      state.value = { ...state.value, editReplacement: null };
    },
    replaceWithEdit: () => {
      const target = state.value.editReplacement;
      if (target) void prepareEdit(target.threadURL, target.postId, true);
    },
    editor,
    interpretEditorSource,
    deferViewChange,
    startComposition: () => {
      state.value = { ...state.value, composing: true };
    },
    endComposition,
    observe,
    check,
    searchMention,
    insertMention,
    reviewPublication,
    resumeDraft,
    checkDraft,
    canResendDraft,
    warnDraftResend,
    confirmDraftResend,
    cancelDraftResend: () => {
      state.value = { ...state.value, draftResend: null };
    },
    saveDraft,
    publishDraft,
    publish,
    checkResult,
    warnResend: (id: string) => {
      const attempt = state.value.context?.attempts?.find(
        (item) => item.id === id,
      );
      if (attempt?.status === "uncertain" && attempt.checked)
        state.value = { ...state.value, resend: id };
    },
    confirmResend: () => {
      const id = state.value.resend;
      state.value = { ...state.value, resend: null };
      if (id) void reviewPublication(id);
    },
    cancelResend: () => {
      state.value = { ...state.value, resend: null };
    },
    confirmCopy,
    cancelCopy: () => {
      state.value = { ...state.value, copy: null };
    },
    snapshot: () => state.value.context,
    restore: (context: WritingContext | null) => {
      uploadBytes.clear();
      if (context?.uploads)
        context = {
          ...context,
          uploads: context.uploads.map((u) =>
            u.status === "selected"
              ? {
                  ...u,
                  status: "reselect",
                  message:
                    "File bytes are not retained across refresh. Select the file again.",
                }
              : u.status === "removing"
                ? {
                    ...u,
                    status: "removal-uncertain",
                    message:
                      "Removal may have happened. Check result; nothing was replayed.",
                  }
                : u.status === "uploading"
                  ? {
                      ...u,
                      status: "uncertain",
                      message:
                        "Upload may already be stored. No upload was replayed.",
                    }
                  : u,
          ),
        };
      if (context?.draftAttempts)
        context = {
          ...context,
          draftAttempts: context.draftAttempts.map((attempt) =>
            attempt.status === "pending"
              ? {
                  ...attempt,
                  status: "uncertain",
                  message:
                    attempt.operation === "publish"
                      ? "Pending draft publication restored as uncertain. Nothing was replayed."
                      : "Pending draft save restored as uncertain. Nothing was replayed.",
                  checked: false,
                }
              : attempt,
          ),
        };
      const pending = context?.attempts?.some(
        (attempt) => attempt.status === "pending",
      );
      if (context?.attempts)
        context = {
          ...context,
          attempts: context.attempts.map((attempt) =>
            attempt.status === "pending"
              ? {
                  ...attempt,
                  status: "uncertain",
                  checked: false,
                  message:
                    "Pending publication restored as uncertain. Nothing has been replayed; check the original attempt.",
                }
              : attempt,
          ),
        };
      state.value = {
        ...state.value,
        context,
        visible: context !== null,
        acknowledged: context?.revision ?? 0,
        mentionPeople: [],
        mentionGeneration: -1,
        findingMention: false,
        recoveryAvailable: true,
        accountVerified: false,
        copy: null,
        publication: null,
        publishing: false,
        resend: null,
        draftResend: null,
      };
      if (pending) void changed();
    },
    acknowledge: (id: string | null, revision: number, available: boolean) => {
      state.value = {
        ...state.value,
        recoveryAvailable: available,
        acknowledged:
          available && state.value.context?.id === id
            ? Math.max(state.value.acknowledged, revision)
            : state.value.acknowledged,
      };
    },
    checkStoredAttachment: async (key: string) => {
      const c = state.value.context,
        u = c?.uploads?.find((v) => v.key === key);
      if (
        !c ||
        !u?.serverId ||
        !u.storedPost ||
        !u.originalSha256 ||
        !state.value.accountVerified
      )
        return;
      updateUpload(key, {
        message: "Checking independently received file bytes…",
      });
      const result = await client.downloadAttachment({
        threadURL: u.storedPost.threadURL,
        postId: u.storedPost.postId,
        attachmentId: u.serverId,
        account: c.account,
      });
      accountObserved(client.account);
      observe(client.account);
      if (state.value.context?.id !== c.id) return;
      if (result.kind !== "file") {
        updateUpload(key, { message: result.message });
        return;
      }
      const hash = Array.from(
        new Uint8Array(
          await crypto.subtle.digest("SHA-256", new Uint8Array(result.bytes)),
        ),
        (b) => b.toString(16).padStart(2, "0"),
      ).join("");
      updateUpload(key, {
        message:
          hash === u.originalSha256 &&
          result.bytes.length === u.size &&
          result.name === u.name
            ? "Stored filename and bytes match the selected file."
            : "Server file differs from selected bytes or filename. Server normalization is disclosed; original byte identity is not claimed.",
      });
    },
    removeServerAttachment: async (key: string, checkOnly = false) => {
      const c = state.value.context,
        u = c?.uploads?.find((v) => v.key === key);
      if (
        !c ||
        !u?.serverId ||
        state.value.publishing ||
        !state.value.accountVerified ||
        (!checkOnly &&
          !["uploaded", "associated", "removed"].includes(u.status))
      )
        return;
      updateUpload(key, {
        status: "removing",
        message:
          "Immediate server-file removal pending. Local discard cannot undo it.",
      });
      const acknowledged = await changed();
      if (!acknowledged) {
        updateUpload(key, {
          status: u.status,
          message: "Recovery unavailable; removal was not sent.",
        });
        return;
      }
      const result = await client.removeUploadedAttachment(
        c,
        u.serverId,
        checkOnly,
      );
      accountObserved(client.account);
      observe(client.account);
      const now = state.value.context;
      if (now?.id !== c.id || !now.uploads?.some((v) => v.key === key)) return;
      if (result.kind === "removed") {
        state.value = {
          ...state.value,
          publication: null,
          message: result.message,
          context: {
            ...now,
            revision: now.revision + 1,
            uploadedReferences: now.uploadedReferences.filter(
              (id) => id !== u.serverId,
            ),
            attachmentFields: (now.attachmentFields ?? []).filter(
              (f) =>
                !f.name.startsWith(`attachnew[${u.serverId}]`) &&
                !f.name.startsWith(`attachupdate[${u.serverId}]`),
            ),
            uploads: now.uploads.map((v) =>
              v.key === key
                ? { ...v, status: "removed", message: result.message }
                : v,
            ),
            ...(now.draft && result.latest?.draft
              ? {
                  draft: { ...now.draft, version: result.latest.draft.version },
                }
              : {}),
            ...(now.editTarget && result.latest
              ? {
                  editTarget: {
                    ...now.editTarget,
                    baseline: {
                      ...now.editTarget.baseline,
                      uploadedReferences:
                        now.editTarget.baseline.uploadedReferences.filter(
                          (id) => id !== u.serverId,
                        ),
                      attachmentFields: (
                        now.editTarget.baseline.attachmentFields ?? []
                      ).filter(
                        (f) =>
                          !f.name.startsWith(`attachnew[${u.serverId}]`) &&
                          !f.name.startsWith(`attachupdate[${u.serverId}]`),
                      ),
                    },
                  },
                }
              : {}),
          },
        };
        void changed();
      } else
        updateUpload(key, {
          status: result.kind === "uncertain" ? "removal-uncertain" : u.status,
          message: result.message,
        });
    },
    removeLocalAttachment: (key: string) => {
      const c = state.value.context,
        u = c?.uploads?.find((v) => v.key === key);
      if (
        !c ||
        !u ||
        state.value.publishing ||
        ![
          "selected",
          "uploading",
          "rejected",
          "reselect",
          "uncertain",
          "removed",
        ].includes(u.status)
      )
        return;
      uploadControllers.get(key)?.abort();
      uploadBytes.delete(key);
      state.value = {
        ...state.value,
        publication: null,
        message:
          "Local selection removed. No remote file was deleted; an interrupted upload may remain on the forum.",
        context: {
          ...c,
          revision: c.revision + 1,
          uploads: (c.uploads ?? []).filter((v) => v.key !== key),
        },
      };
      void changed();
    },
    beginAttachmentSelection,
    uploadAttachment,
    insertAttachment,
    unresolvedAttachments: computed(() => {
      const context = state.value.context;
      return context ? unresolvedWritingAttachments(context) : [];
    }),
    state: readonly(state),
    prepare,
    prepareReply: (boardId: string, target: ReplyTarget) =>
      prepare(boardId, false, target),
    edit,
    show: () => {
      const show = () => {
        ++sequence;
        state.value = {
          ...state.value,
          visible: true,
          replacement: null,
          draftReplacement: null,
          preparing: false,
        };
      };
      if (!deferViewChange(show)) show();
    },
    hide: () => {
      const hide = () => {
        state.value = { ...state.value, visible: false };
      };
      if (!deferViewChange(hide)) hide();
    },
    discardAndPrepare: () => {
      const draft = state.value.draftReplacement;
      if (draft) void resumeDraft(draft.row, draft.account, true);
      else {
        const replacement = state.value.replacement;
        if (replacement)
          void prepare(replacement.boardId, true, replacement.replyTarget);
      }
    },
  };
}

const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const string = (value: unknown): value is string => typeof value === "string";
const integer = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
function validAttachmentFields(fields: unknown, edit: boolean): boolean {
  return (
    fields === undefined ||
    (Array.isArray(fields) &&
      fields.every(
        (field) =>
          object(field) &&
          string(field.name) &&
          string(field.value) &&
          typeof field.disabled === "boolean" &&
          (edit
            ? /^(?:attachnew\[[1-9]\d*\]\[(?:description|readperm|price)\]|attachupdate\[[1-9]\d*\])$/
            : /^attachnew\[[1-9]\d*\]\[[a-z_]+\]$/
          ).test(field.name),
      ))
  );
}
export function isWritingContext(value: unknown): value is WritingContext {
  if (
    !object(value) ||
    !string(value.id) ||
    !integer(value.revision) ||
    value.revision < 1 ||
    !["new-thread", "reply", "quick-quote", "edit-post"].includes(
      String(value.action),
    ) ||
    (value.action === "new-thread" && value.replyTarget !== undefined) ||
    (value.action === "reply" &&
      (!object(value.replyTarget) || value.replyTarget.postId !== null)) ||
    (value.action === "quick-quote" &&
      (!object(value.replyTarget) ||
        !string(value.replyTarget.postId) ||
        !/^[1-9]\d*$/.test(value.replyTarget.postId))) ||
    (["reply", "quick-quote"].includes(String(value.action)) &&
      (!object(value.replyTarget) ||
        !string(value.replyTarget.threadId) ||
        !/^[1-9]\d*$/.test(value.replyTarget.threadId) ||
        (value.replyTarget.postId !== null &&
          (!string(value.replyTarget.postId) ||
            !/^[1-9]\d*$/.test(value.replyTarget.postId))) ||
        !string(value.replyTarget.author) ||
        !(
          value.replyTarget.authorId === null ||
          string(value.replyTarget.authorId)
        ))) ||
    !object(value.board) ||
    !string(value.board.id) ||
    !/^[1-9]\d*$/.test(value.board.id) ||
    !string(value.board.label) ||
    !string(value.board.url) ||
    !object(value.account) ||
    value.account.kind !== "member" ||
    !string(value.account.id) ||
    !/^[1-9]\d*$/.test(value.account.id) ||
    !string(value.account.name) ||
    (value.mentions !== undefined &&
      (!Array.isArray(value.mentions) ||
        !value.mentions.every(
          (p) =>
            object(p) &&
            string(p.id) &&
            /^[1-9]\d*$/.test(p.id) &&
            string(p.name) &&
            p.name.length > 0 &&
            !/[\r\n\u2063\u2064]/.test(p.name),
        ))) ||
    !string(value.title) ||
    !(
      value.titleAvailable === undefined ||
      typeof value.titleAvailable === "boolean"
    ) ||
    !string(value.source) ||
    (value.editorUnresolved !== undefined &&
      typeof value.editorUnresolved !== "boolean")
  )
    return false;
  if (
    value.uploads !== undefined &&
    (!Array.isArray(value.uploads) ||
      value.uploads.length > 100 ||
      !value.uploads.every(
        (u) =>
          object(u) &&
          string(u.key) &&
          string(u.name) &&
          string(u.type) &&
          integer(u.size) &&
          integer(u.loaded) &&
          string(u.message) &&
          (u.originalSha256 === undefined ||
            (string(u.originalSha256) &&
              /^[a-f0-9]{64}$/.test(u.originalSha256))) &&
          (u.storedPost === undefined ||
            (object(u.storedPost) &&
              safeThreadURL(u.storedPost.threadURL) &&
              string(u.storedPost.postId) &&
              /^[1-9]\d*$/.test(u.storedPost.postId))) &&
          [
            "selected",
            "uploading",
            "uploaded",
            "uncertain",
            "rejected",
            "reselect",
            "associated",
            "removed",
            "removing",
            "removal-uncertain",
          ].includes(String(u.status)) &&
          (u.serverId === undefined ||
            (string(u.serverId) && /^[1-9]\d*$/.test(u.serverId))) &&
          (u.referenceKind === undefined ||
            u.referenceKind === "attach" ||
            u.referenceKind === "attachimg") &&
          validAttachmentFields(u.fields, true),
      ))
  )
    return false;
  if (
    !validAttachmentFields(
      value.attachmentFields,
      value.action === "edit-post" || value.draft !== undefined,
    )
  )
    return false;
  if (value.action === "edit-post") {
    const target = value.editTarget;
    if (
      !object(target) ||
      !string(target.threadId) ||
      !/^[1-9]\d*$/.test(target.threadId) ||
      !string(target.postId) ||
      !/^[1-9]\d*$/.test(target.postId) ||
      !safeThreadURL(target.threadURL) ||
      new URL(target.threadURL as string).searchParams.get("tid") !==
        target.threadId ||
      !object(target.baseline) ||
      !validAttachmentFields(target.baseline.attachmentFields, true)
    )
      return false;
    if (
      !isWritingContext({
        ...value,
        ...target.baseline,
        attachmentFields: undefined,
        action: "new-thread",
        editTarget: undefined,
        attempts: undefined,
        selection: { start: 0, end: 0, direction: "none" },
      })
    )
      return false;
  }
  try {
    const url = new URL(value.board.url);
    if (
      url.origin !== location.origin ||
      url.pathname !== "/forum.php" ||
      url.searchParams.get("mod") !== "forumdisplay" ||
      url.searchParams.get("fid") !== value.board.id
    )
      return false;
  } catch {
    return false;
  }
  const option = (o: unknown) =>
    object(o) &&
    string(o.name) &&
    string(o.label) &&
    ["checkbox", "select", "text"].includes(String(o.kind)) &&
    string(o.value) &&
    typeof o.checked === "boolean" &&
    typeof o.disabled === "boolean" &&
    (o.maxLength === null || integer(o.maxLength)) &&
    Array.isArray(o.choices) &&
    o.choices.every(
      (c) =>
        object(c) &&
        string(c.value) &&
        string(c.label) &&
        typeof c.disabled === "boolean",
    );
  const selection = value.selection;
  const attempts = value.attempts;
  if (
    value.draftSaveAvailable !== undefined &&
    typeof value.draftSaveAvailable !== "boolean"
  )
    return false;
  if (value.draft !== undefined && !isDraftIdentity(value.draft)) return false;
  if (
    value.draftAttempts !== undefined &&
    (!Array.isArray(value.draftAttempts) ||
      !value.draftAttempts.every((attempt) => {
        if (
          !object(attempt) ||
          !string(attempt.id) ||
          !integer(attempt.generation) ||
          ![
            "pending",
            "uncertain",
            "rejected",
            "not-sent",
            "confirmed",
            "published",
            "remaining-draft",
            "moderation",
          ].includes(String(attempt.status)) ||
          !string(attempt.message) ||
          !object(attempt.submission) ||
          !object(attempt.submission.writing) ||
          (attempt.checked !== undefined &&
            typeof attempt.checked !== "boolean") ||
          (attempt.resendOf !== undefined &&
            (!string(attempt.resendOf) || !attempt.resendOf)) ||
          !(attempt.result === null || isDraftIdentity(attempt.result))
        )
          return false;
        if (
          attempt.observation !== undefined &&
          (!object(attempt.observation) ||
            !["draft", "published"].includes(
              String(attempt.observation.state),
            ) ||
            !["confirmed", "unknown"].includes(
              String(attempt.observation.content),
            ) ||
            !["confirmed", "unknown"].includes(
              String(attempt.observation.attachments),
            ) ||
            (attempt.observation.attachmentNormalizations !== undefined &&
              (!Array.isArray(attempt.observation.attachmentNormalizations) ||
                !attempt.observation.attachmentNormalizations.every(
                  (n) =>
                    object(n) &&
                    string(n.name) &&
                    /^attachnew\[[1-9]\d*\]\[price\]$/.test(n.name) &&
                    n.submitted === "" &&
                    n.stored === "0",
                ))))
        )
          return false;
        if (
          attempt.priorDraftIds !== undefined &&
          (!Array.isArray(attempt.priorDraftIds) ||
            !attempt.priorDraftIds.every(
              (id) => string(id) && /^[1-9]\d*$/.test(id),
            ))
        )
          return false;
        if (
          attempt.operation !== undefined &&
          !["save", "publish"].includes(String(attempt.operation))
        )
          return false;
        if (
          attempt.publishedURL !== undefined &&
          !safeThreadURL(attempt.publishedURL)
        )
          return false;
        return isWritingContext({
          ...attempt.submission.writing,
          id: attempt.submission.contextId,
          revision: attempt.submission.revision,
          selection: { start: 0, end: 0, direction: "none" },
          attempts: undefined,
          draftAttempts: undefined,
        });
      }))
  )
    return false;
  return (
    (attempts === undefined ||
      (Array.isArray(attempts) && attempts.every(isAttempt))) &&
    (value.category === null || option(value.category)) &&
    Array.isArray(value.options) &&
    value.options.every(option) &&
    Array.isArray(value.uploadedReferences) &&
    value.uploadedReferences.every(
      (id) => string(id) && /^[1-9]\d*$/.test(id),
    ) &&
    object(selection) &&
    integer(selection.start) &&
    integer(selection.end) &&
    selection.start <= selection.end &&
    selection.end <= value.source.length &&
    ["forward", "backward", "none"].includes(String(selection.direction))
  );
}

function isAttempt(value: unknown): value is ThreadAttempt {
  if (
    !object(value) ||
    !string(value.id) ||
    !value.id ||
    !string(value.status) ||
    ![
      "pending",
      "uncertain",
      "rejected",
      "moderation",
      "confirmed",
      "not-sent",
    ].includes(value.status) ||
    !string(value.message) ||
    typeof value.checked !== "boolean" ||
    !(value.candidateURL === null || safeThreadURL(value.candidateURL)) ||
    !object(value.publication) ||
    !string(value.publication.id) ||
    !value.publication.id ||
    !integer(value.publication.generation) ||
    !object(value.publication.submission)
  )
    return false;
  const submission = value.publication.submission;
  if (!object(submission.writing)) return false;
  const submittedWriting = {
    ...submission.writing,
    id: submission.contextId,
    revision: submission.revision,
    selection: { start: 0, end: 0, direction: "none" },
    attempts: undefined,
  };
  if (!isWritingContext(submittedWriting)) return false;
  const snapshot = (candidate: unknown) =>
    object(candidate) &&
    isWritingContext({
      ...candidate,
      id: "observed",
      revision: 1,
      selection: { start: 0, end: 0, direction: "none" },
      attempts: undefined,
    }) &&
    object(candidate.account) &&
    candidate.account.id === submittedWriting.account.id &&
    object(candidate.board) &&
    candidate.board.id === submittedWriting.board.id &&
    JSON.stringify(candidate.replyTarget) ===
      JSON.stringify(submittedWriting.replyTarget);
  const before = value.publication.replyBefore;
  if (
    before !== undefined &&
    (!object(before) ||
      !safeThreadURL(before.pageURL) ||
      !submittedWriting.replyTarget ||
      new URL(String(before.pageURL)).searchParams.get("tid") !==
        submittedWriting.replyTarget.threadId ||
      !Array.isArray(before.postIds) ||
      !before.postIds.every((id) => string(id) && /^[1-9]\d*$/.test(id)) ||
      new Set(before.postIds).size !== before.postIds.length ||
      !Array.isArray(before.owned) ||
      !before.owned.every(
        (post) =>
          object(post) &&
          string(post.postId) &&
          before.postIds instanceof Array &&
          before.postIds.includes(post.postId) &&
          snapshot(post.writing),
      ))
  )
    return false;
  const comparison = value.replyComparison;
  if (
    comparison !== undefined &&
    (!object(comparison) ||
      !string(comparison.postId) ||
      !/^[1-9]\d*$/.test(comparison.postId) ||
      !snapshot(comparison.observed) ||
      !(comparison.before === null || snapshot(comparison.before)))
  )
    return false;

  if (object(comparison)) {
    const prior =
      object(before) && Array.isArray(before.owned)
        ? before.owned.find(
            (post) => object(post) && post.postId === comparison.postId,
          )
        : null;
    if (
      JSON.stringify(comparison.before) !==
      JSON.stringify(object(prior) ? prior.writing : null)
    )
      return false;
  }
  return (
    (value.result === null && value.status !== "confirmed") ||
    (object(value.result) &&
      value.status === "confirmed" &&
      value.checked === true &&
      string(value.result.threadId) &&
      /^[1-9]\d*$/.test(value.result.threadId) &&
      string(value.result.postId) &&
      /^[1-9]\d*$/.test(value.result.postId) &&
      safeThreadURL(value.result.url) &&
      new URL(value.result.url as string).searchParams.get("tid") ===
        value.result.threadId &&
      new URL(value.result.url as string).hash ===
        `#pid${value.result.postId}` &&
      (!Object.hasOwn(value.result, "verification") ||
        isThreadVerification(value.result.verification, submittedWriting)))
  );
}
function safeThreadURL(value: unknown): boolean {
  if (!string(value)) return false;
  try {
    const url = new URL(value);
    return (
      url.origin === location.origin &&
      !url.username &&
      !url.password &&
      url.pathname === "/forum.php" &&
      url.searchParams.get("mod") === "viewthread" &&
      /^[1-9]\d*$/.test(url.searchParams.get("tid") ?? "")
    );
  } catch {
    return false;
  }
}

function isDraftIdentity(value: unknown): boolean {
  return (
    object(value) &&
    string(value.threadId) &&
    /^[1-9]\d*$/.test(value.threadId) &&
    string(value.postId) &&
    /^[1-9]\d*$/.test(value.postId) &&
    string(value.version) &&
    value.version.length > 0 &&
    safeThreadURL(value.url) &&
    new URL(String(value.url)).searchParams.get("tid") === value.threadId
  );
}
