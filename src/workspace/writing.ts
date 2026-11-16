import {
  canonical,
  hasReplyHold,
  legacyFailedReply,
  unsettledSend,
  type ReplySend,
  type ReplyUpdate,
} from "../workspace/reply-recovery";
import { isPrivateAttempt } from "../forum-client/private-writing.js";
import { createEditorSession, type EditorSession } from "../editor/session.js";
import { computed, readonly, shallowRef } from "vue";
import {
  verifyStoredWriting,
  isThreadVerification,
} from "../forum-client/thread-verification";
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
export interface PublicWritingContext extends PreparedWriting {
  privateAttempts?: import("../forum-client").PrivateAttempt[];
  draftAttempts?: import("../forum-client").DraftAttempt[];
  unappliedPacketOptions?: import("../forum-client").WritingOption[];
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
export type PrivateWritingContext =
  import("../forum-client").PreparedPrivateWriting &
    Pick<
      PublicWritingContext,
      | "id"
      | "revision"
      | "selection"
      | "attempts"
      | "draftAttempts"
      | "editorUnresolved"
      | "privateAttempts"
    > & {
      [
        K in Exclude<
          keyof PreparedWriting,
          keyof import("../forum-client").PreparedPrivateWriting
        >
      ]?: never;
    } & { unappliedPacketOptions?: never };
export type WritingContext = PublicWritingContext | PrivateWritingContext;
export function createWriting(
  client: ForumClient,
  changed: (disposed?: PublicWritingContext) => Promise<boolean>,
  accountObserved: (account: Account) => void,
  publishedDraft?: (url: string, contextId: string) => Promise<void>,
  replyHost?: Pick<
    import("./navigation").NavigationHost,
    | "reserveReplySend"
    | "checkReplySend"
    | "observeReplySend"
    | "replyRecovery"
    | "retainFailedReply"
    | "captureLegacyReply"
    | "enrollLegacyReply"
  >,
) {
  const state = shallowRef<{
    context: WritingContext | null;
    privateReview: import("../forum-client").PrivateReview | null;
    privateReviewConsumed: boolean;
    privateReplacement: { url: string; account: Account } | null;
    visible: boolean;
    preparing: boolean;
    message: string;
    validationIssues: import("../forum-client").WritingValidationIssue[];
    validationFocus: number;
    replacement: {
      boardId: string;
      replyTarget?: ReplyTarget;
      redPacket?: boolean;
    } | null;
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
    accountObservation: Account;
    composing: boolean;
    compositionDeferred: boolean;
    mentionPeople: MentionIdentity[];
    mentionGeneration: number;
    findingMention: boolean;
    publication: ThreadPublication | null;
    publishing: boolean;
    resend: string | null;
    fundedDraftReview: {
      contextId: string;
      revision: number;
      generation: number;
      writing: PreparedWriting;
      continueAfter: boolean;
      resendId?: string;
    } | null;
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
    privateReview: null,
    privateReviewConsumed: false,
    privateReplacement: null,
    visible: false,
    preparing: false,
    message: "",
    validationIssues: [],
    validationFocus: 0,
    replacement: null,
    editReplacement: null,
    conflict: null,
    reloadWarning: false,
    overwriteWarning: false,
    draftReplacement: null,
    acknowledged: 0,
    recoveryAvailable: null,
    accountVerified: false,
    accountObservation: { kind: "unknown" },
    copy: null,
    composing: false,
    compositionDeferred: false,
    mentionPeople: [],
    mentionGeneration: -1,
    findingMention: false,
    publication: null,
    publishing: false,
    resend: null,
    fundedDraftReview: null,
    draftResend: null,
  });
  const editorGeneration = shallowRef(0);
  const conflictedReplies = shallowRef<string[]>([]);
  const replyBlocked = computed(() => {
    const context = state.value.context;
    return (
      !!context &&
      isOrdinaryReply(context) &&
      conflictedReplies.value.includes(context.replyTarget!.threadId)
    );
  });
  const retainedUnsettledReplies = shallowRef<string[]>([]);
  const registeredSends = shallowRef<Record<string, ReplySend[]>>({});
  const liveSends = shallowRef<Record<string, boolean>>({});
  const unsavedSendResults = shallowRef<Record<string, ThreadAttempt>>({});
  function observeReplySends() {
    registeredSends.value = Object.fromEntries(
      (replyHost?.replyRecovery?.().sends ?? []).map((row) => [
        row.threadId,
        row.sends,
      ]),
    );
  }
  function registeredAttempt(attempt: ThreadAttempt) {
    const thread = attempt.publication.submission.writing.replyTarget?.threadId;
    return (
      thread &&
      registeredSends.value[thread]?.find(
        (send) =>
          send.attempt.id === attempt.id &&
          canonical(send.attempt.publication) ===
            canonical(attempt.publication),
      )
    );
  }
  function observedAttempt(attempt: ThreadAttempt): ThreadAttempt {
    const send = registeredAttempt(attempt);
    if (!send) return attempt;
    const raw = unsavedSendResults.value[attempt.id] ?? send.attempt;
    return raw.status === "pending" && !liveSends.value[raw.id]
      ? {
          ...raw,
          status: "uncertain",
          checked: false,
          message:
            "Pending reply restored as Unknown. Nothing was replayed; check its original status.",
        }
      : raw;
  }
  const contextAttemptHistory = computed(() => {
    const context = state.value.context;
    return (context?.attempts ?? []).filter(
      (attempt) =>
        !registeredAttempt(attempt) &&
        !(
          context &&
          isOrdinaryReply(context) &&
          ["reply", "quick-quote"].includes(
            attempt.publication.submission.writing.action,
          ) &&
          attempt.publication.submission.writing.replyTarget?.threadId ===
            context.replyTarget!.threadId
        ),
    );
  });
  function replyAttempts(threadId: string) {
    const context =
      state.value.context?.replyTarget?.threadId === threadId
        ? state.value.context
        : retainedReplies.value[threadId];
    const attempts = new Map(
      (context?.attempts ?? [])
        .filter(
          (attempt) =>
            ["reply", "quick-quote"].includes(
              attempt.publication.submission.writing.action,
            ) &&
            attempt.publication.submission.writing.replyTarget?.threadId ===
              threadId,
        )
        .map((attempt) => [attempt.id, observedAttempt(attempt)]),
    );
    for (const send of registeredSends.value[threadId] ?? []) {
      attempts.set(send.attempt.id, observedAttempt(send.attempt));
    }
    return [...attempts.values()];
  }
  const replySendBlocked = computed(() => {
    const context = state.value.context;
    return (
      !!context &&
      isOrdinaryReply(context) &&
      (registeredSends.value[context.replyTarget!.threadId] ?? []).some(
        (send) => !send.successor && unsettledSend(send.attempt),
      )
    );
  });
  const replyPublicationBlocked = computed(() => {
    const context = state.value.context;
    return (
      replySendBlocked.value ||
      (!!context &&
        isOrdinaryReply(context) &&
        retainedUnsettledReplies.value.includes(context.replyTarget!.threadId))
    );
  });
  function refuseReplyDisposal() {
    const context = state.value.context;
    if (
      !context ||
      !isOrdinaryReply(context) ||
      !hasReplyHold(
        context,
        registeredSends.value[context.replyTarget!.threadId] ?? [],
      )
    )
      return false;
    state.value = {
      ...state.value,
      message:
        "This reply has an unsettled operation. Check its original result before discarding or replacing it. Your writing is retained.",
    };
    return true;
  }
  // Ordinary composition account is stable provenance. Every new operation
  // captures the independently observed current actor without changing its lineage.
  function captureOperation(context = state.value.context) {
    if (!context || context.action === "private-message") return null;
    const generation = client.generation;
    const captured = canonical(context);
    const ordinary = Boolean(isOrdinaryReply(context));
    const actor = ordinary ? state.value.accountObservation : context.account;
    if (
      ordinary &&
      (!observedAccountVerified ||
        actor.kind !== "member" ||
        client.account.kind !== "member" ||
        client.account.id !== actor.id)
    )
      return null;
    if (actor.kind !== "member") return null;
    return {
      writing: ordinary ? { ...context, account: actor } : context,
      generation,
      current: () =>
        canonical(state.value.context) === captured &&
        (!ordinary ||
          (!replyBlocked.value &&
            observedAccountVerified &&
            client.generation === generation &&
            client.account.kind === "member" &&
            client.account.id === actor.id &&
            state.value.accountObservation.kind === "member" &&
            state.value.accountObservation.id === actor.id)),
    };
  }
  const currentActor = computed<Account | undefined>(() => {
    const context = state.value.context;
    return context && isOrdinaryReply(context)
      ? (captureOperation(context)?.writing.account ?? { kind: "unknown" })
      : undefined;
  });
  // Presentation-only form recheck affordance; it grants no publishing authority.
  const replyFormFailure = shallowRef<string | null>(null);
  const replyFormCheckNeeded = computed(() => {
    const context = state.value.context;
    return (
      !!context &&
      isOrdinaryReply(context) &&
      (!state.value.accountVerified || replyFormFailure.value === context.id)
    );
  });
  const retainedReplies = shallowRef<Record<string, PublicWritingContext>>({});
  let selectedReplyThread: string | null = null;
  function replaced(previous: WritingContext | null) {
    replyFormFailure.value = null;
    const next = state.value.context;
    return changed(
      previous &&
        isOrdinaryReply(previous) &&
        (!next ||
          !isOrdinaryReply(next) ||
          next.replyTarget!.threadId !== previous.replyTarget!.threadId)
        ? previous
        : undefined,
    );
  }
  function canDeactivate() {
    const context = state.value.context;
    return (
      !state.value.publishing &&
      !uploadControllers.size &&
      !context?.uploads?.some((upload) =>
        ["uploading", "removing"].includes(upload.status),
      )
    );
  }
  function canSelectThread() {
    const context = state.value.context;
    return (!context || isOrdinaryReply(context)) && canDeactivate();
  }
  function selectThread(threadId: string, replace = false) {
    if (!canDeactivate() || (!replace && !canSelectThread())) return false;
    const current = state.value.context;
    const destination = retainedReplies.value[threadId];
    if (replace && current && !isOrdinaryReply(current) && destination) {
      const observation = (value: unknown) =>
        JSON.stringify(value, (_key, part: unknown) =>
          object(part)
            ? Object.fromEntries(
                Object.entries(part).sort(([left], [right]) =>
                  left.localeCompare(right),
                ),
              )
            : part,
        );
      const incompatible = (
        ["attempts", "draftAttempts", "privateAttempts"] as const
      ).some((family) =>
        current[family]?.some((attempt) => {
          const retained = destination[family]?.find(
            (item) => item.id === attempt.id,
          );
          return retained && observation(retained) !== observation(attempt);
        }),
      );
      if (incompatible) {
        state.value = {
          ...state.value,
          visible: true,
          preparing: false,
          replacement: null,
          message:
            "Different observations of the same earlier operation are retained in these writing contexts. Both are kept; replacement is paused. Check the original outcome or continue in the native forum before replacing writing.",
        };
        return false;
      }
    }
    if (
      !replace &&
      selectedReplyThread === threadId &&
      (!current || current.replyTarget?.threadId === threadId)
    )
      return;
    selectedReplyThread = threadId;
    ++sequence;
    ++mentionSequence;
    if (current?.replyTarget?.threadId === threadId) return;
    const retained = { ...retainedReplies.value };
    if (current && isOrdinaryReply(current))
      retained[current.replyTarget!.threadId] = current;
    let next = retained[threadId] ?? null;
    if (next && replace && current && !isOrdinaryReply(current)) {
      const history = <T extends { id: string }>(left?: T[], right?: T[]) =>
        left?.length || right?.length
          ? [
              ...new Map(
                [...(left ?? []), ...(right ?? [])].map((attempt) => [
                  attempt.id,
                  attempt,
                ]),
              ).values(),
            ]
          : undefined;
      const attempts = history(current.attempts, next.attempts);
      const draftAttempts = history(current.draftAttempts, next.draftAttempts);
      const privateAttempts = history(
        current.privateAttempts,
        next.privateAttempts,
      );
      next = {
        ...next,
        ...(attempts ? { attempts } : {}),
        ...(draftAttempts ? { draftAttempts } : {}),
        ...(privateAttempts ? { privateAttempts } : {}),
      };
    }
    delete retained[threadId];
    editorSession?.dispose();
    editorSession = null;
    editorContext = "";
    retainedReplies.value = retained;
    replyFormFailure.value = null;
    state.value = {
      ...state.value,
      context: next,
      visible: next !== null,
      preparing: false,
      publication: null,
      privateReview: null,
      privateReviewConsumed: false,
      copy: null,
      resend: null,
      draftResend: null,
      fundedDraftReview: null,
      replacement: null,
      editReplacement: null,
      draftReplacement: null,
      privateReplacement: null,
      conflict: null,
      reloadWarning: false,
      overwriteWarning: false,
      validationIssues: [],
      message: "",
      acknowledged: 0,
      accountVerified: false,
      mentionPeople: [],
      mentionGeneration: -1,
      findingMention: false,
    };
    observe(state.value.accountObservation, observedAccountVerified);
    void changed();
    return true;
  }
  function replyMeaning(context: PreparedWriting) {
    return JSON.stringify({
      source: context.source,
      thread: context.replyTarget?.threadId,
      post: context.replyTarget?.postId,
      options: context.options
        .filter((option) => !option.disabled)
        .map((option) => [option.name, option.value, option.checked])
        .sort((left, right) => String(left[0]).localeCompare(String(right[0]))),
      references: [...context.uploadedReferences].sort(),
      fields: (context.attachmentFields ?? [])
        .filter((field) => !field.disabled)
        .map((field) => [field.name, field.value])
        .sort((left, right) => left[0]!.localeCompare(right[0]!)),
      uploads: (context.uploads ?? [])
        .filter((upload) => upload.status !== "removed")
        .map((upload) => [
          upload.key,
          upload.name,
          upload.type,
          upload.size,
          upload.serverId ?? null,
        ])
        .sort((left, right) => String(left[0]).localeCompare(String(right[0]))),
    });
  }
  const localReplyThreads = computed(() => {
    const contexts = [
      state.value.context,
      ...Object.values(retainedReplies.value),
    ];
    return contexts
      .filter((context) => {
        if (
          !context ||
          !isOrdinaryReply(context) ||
          !(
            context.source.length > 0 ||
            context.replyTarget?.postId ||
            context.uploadedReferences.length > 0 ||
            context.uploads?.some((upload) => upload.status !== "removed")
          )
        )
          return false;
        return !context.attempts?.some(
          (attempt) =>
            attempt.status === "confirmed" &&
            attempt.publication.submission.contextId === context.id &&
            replyMeaning(attempt.publication.submission.writing) ===
              replyMeaning(context),
        );
      })
      .map((context) => context!.replyTarget!.threadId);
  });
  const uploadBytes = new Map<string, import("../forum-client").UploadFile>();
  const uploadControllers = new Map<string, AbortController>();
  const attachmentProofs = shallowRef<
    Record<string, { identity: string; available: boolean }>
  >({});
  const attachmentChecks = new Map<string, Promise<void>>();
  function attachmentIdentity(
    context: PublicWritingContext,
    upload: import("../forum-client").WritingUpload,
  ) {
    const operation = captureOperation(context);
    return operation
      ? canonical({
          context: context.id,
          actor: operation.writing.account.id,
          generation: operation.generation,
          board: context.board.id,
          target: context.replyTarget,
          upload: {
            key: upload.key,
            serverId: upload.serverId,
            ownerId: upload.ownerId,
            referenceKind: upload.referenceKind,
            fields: upload.fields,
          },
        })
      : "";
  }
  function attachmentUnavailable(key: string) {
    const context = state.value.context;
    if (!context || !isOrdinaryReply(context)) return false;
    const upload = context.uploads?.find((u) => u.key === key);
    if (!upload) return false;
    if (
      [
        "reselect",
        "rejected",
        "uncertain",
        "removal-uncertain",
        "removed",
      ].includes(upload.status)
    )
      return true;
    if (!["uploaded", "associated"].includes(upload.status)) return false;
    const proof = attachmentProofs.value[key];
    return (
      !proof?.available ||
      proof.identity !== attachmentIdentity(context, upload)
    );
  }
  async function revalidateAttachments(force = false) {
    const context = state.value.context;
    if (!context || !isOrdinaryReply(context) || replyBlocked.value) return;
    const operation = captureOperation(context);
    if (!operation) return;
    const uploads = (context.uploads ?? []).filter((u) =>
      ["uploaded", "associated"].includes(u.status),
    );
    if (!uploads.length) return;
    const identities = uploads.map(
      (u) => [u.key, attachmentIdentity(context, u)] as const,
    );
    const key = canonical(identities);
    if (attachmentChecks.has(key)) return attachmentChecks.get(key);
    if (
      !force &&
      identities.every(
        ([id, identity]) => attachmentProofs.value[id]?.identity === identity,
      )
    )
      return;
    attachmentProofs.value = {
      ...attachmentProofs.value,
      ...Object.fromEntries(
        identities.map(([id, identity]) => [
          id,
          { identity, available: false },
        ]),
      ),
    };
    const checkAttachments = client.checkReplyAttachments;
    if (!checkAttachments) return;
    const pending = Promise.resolve().then(async () => {
      try {
        const result = await checkAttachments.call(client, {
          ...operation.writing,
          uploads:
            operation.writing.uploads?.map((u) => ({
              ...u,
              ownerId: u.ownerId ?? null,
            })) ?? [],
        });
        accountObserved(client.account);
        observe(client.account, result.accountVerified);
        if (!operation.current() || result.generation !== operation.generation)
          return;
        if (
          !result.accountVerified ||
          result.account.kind !== "member" ||
          result.account.id !== operation.writing.account.id
        )
          return;
        if (!(await changed()) || !operation.current()) return;
        attachmentProofs.value = {
          ...attachmentProofs.value,
          ...Object.fromEntries(
            identities.map(([id, identity]) => [
              id,
              { identity, available: result.usableKeys.includes(id) },
            ]),
          ),
        };
      } finally {
        attachmentChecks.delete(key);
      }
    });
    attachmentChecks.set(key, pending);
    await pending;
  }
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
    const origin = captureOperation()?.writing;
    const generation = client.generation;
    let delivered = false;
    state.value = { ...state.value, message: "" };
    return {
      complete(files: import("../forum-client").UploadFile[]) {
        const current = captureOperation()?.writing;
        if (delivered || replyBlocked.value) return;
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
    if (replyBlocked.value) return;
    const c = state.value.context;
    const operation = captureOperation(c);
    if (
      !c ||
      !operation ||
      c.action === "private-message" ||
      !state.value.accountVerified ||
      state.value.publishing
    )
      return;
    const rows = files.map((file) => {
      const key = crypto.randomUUID();
      uploadBytes.set(key, { ...file, bytes: new Uint8Array(file.bytes) });
      return {
        key,
        name: file.name,
        type: file.type,
        size: file.bytes.length,
        status: "selected" as const,
        ...(isOrdinaryReply(c)
          ? { ownerId: operation.writing.account.id }
          : {}),
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
    if (replyBlocked.value) return;
    const c = captureOperation()?.writing,
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
    if (!saved || replyBlocked.value) {
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
      effectGuard(),
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
                  ...(isOrdinaryReply(c) ? { ownerId: c.account.id } : {}),
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
      const acknowledged = await changed();
      const uploaded = state.value.context?.uploads?.find((u) => u.key === key);
      const latest = state.value.context;
      if (
        acknowledged &&
        latest &&
        isOrdinaryReply(latest) &&
        uploaded &&
        captureOperation(latest)?.writing.account.id === c.account.id
      ) {
        attachmentProofs.value = {
          ...attachmentProofs.value,
          [key]: {
            identity: attachmentIdentity(latest, uploaded),
            available: true,
          },
        };
      }
    } else
      updateUpload(key, {
        status: result.kind === "uncertain" ? "uncertain" : "rejected",
        message: result.message,
        ...(result.kind === "uncertain" && result.id
          ? { serverId: result.id }
          : {}),
      });
  }
  let repairSourceTransaction = false;
  function repairedSource(
    source: string,
    id: string,
    replacement?: { id: string; kind: "attach" | "attachimg" },
  ) {
    return source.replace(
      /(\[(attach(?:img)?)\])(\s*)([1-9]\d*)(\s*)(\[\/\2\])/gi,
      (
        span,
        opening: string,
        kind: string,
        before: string,
        found: string,
        after: string,
        closing: string,
      ) => {
        if (found !== id) return span;
        if (!replacement) return "";
        return (
          (kind.toLowerCase() === replacement.kind
            ? opening
            : `[${replacement.kind}]`) +
          before +
          replacement.id +
          after +
          (kind.toLowerCase() === replacement.kind
            ? closing
            : `[/${replacement.kind}]`)
        );
      },
    );
  }
  function applyAttachmentEdit(
    next: PublicWritingContext,
    source: string,
    restoringCapturedIntent = false,
  ) {
    if (
      state.value.composing ||
      (replyBlocked.value && !restoringCapturedIntent)
    )
      return false;
    const session = editor();
    if (session.state.locks.busy || session.state.locks.session) return false;
    const previous = state.value.context;
    repairSourceTransaction = true;
    try {
      state.value = { ...state.value, publication: null, context: next };
      if (source !== session.state.source && !session.replaceSource(source)) {
        state.value = { ...state.value, context: previous };
        return false;
      }
      return true;
    } finally {
      repairSourceTransaction = false;
    }
  }
  async function removeUnavailableAttachment(key: string) {
    const context = state.value.context;
    const upload = context?.uploads?.find((u) => u.key === key);
    if (
      !context ||
      !isOrdinaryReply(context) ||
      !upload ||
      !attachmentUnavailable(key) ||
      replyBlocked.value ||
      state.value.composing ||
      state.value.publishing ||
      uploadControllers.size
    )
      return;
    const source = upload.serverId
      ? repairedSource(context.source, upload.serverId)
      : context.source;
    const next: PublicWritingContext = {
      ...context,
      revision: context.revision + 1,
      uploads: context.uploads!.filter((u) => u.key !== key),
      uploadedReferences: context.uploadedReferences.filter(
        (id) => id !== upload.serverId,
      ),
      attachmentFields: (context.attachmentFields ?? []).filter(
        (f) =>
          !upload.serverId ||
          (!f.name.startsWith(`attachnew[${upload.serverId}]`) &&
            !f.name.startsWith(`attachupdate[${upload.serverId}]`)),
      ),
    };
    if (!applyAttachmentEdit(next, source)) return;
    uploadBytes.delete(key);
    state.value = {
      ...state.value,
      message:
        "Unavailable attachment intent and its exact references removed locally. No server file was deleted.",
    };
    await changed();
  }
  function beginAttachmentReattachment(key: string) {
    const operation = captureOperation();
    let delivered = false;
    return {
      async complete(file: import("../forum-client").UploadFile) {
        if (delivered) return;
        delivered = true;
        if (!operation?.current() || !attachmentUnavailable(key)) {
          state.value = {
            ...state.value,
            message:
              "The writing or account changed while reading the replacement. Choose it again.",
          };
          return;
        }
        await reattachAttachment(key, file);
      },
      fail() {
        if (delivered) return;
        delivered = true;
        state.value = {
          ...state.value,
          message:
            "The replacement file could not be read. Original attachment intent is retained.",
        };
      },
    };
  }
  async function reattachAttachment(
    key: string,
    file: import("../forum-client").UploadFile,
  ) {
    const original = state.value.context;
    const actor = captureOperation(original);
    const old = original?.uploads?.find((u) => u.key === key);
    if (
      !original ||
      !isOrdinaryReply(original) ||
      !actor ||
      !old ||
      !attachmentUnavailable(key) ||
      state.value.composing ||
      state.value.publishing ||
      uploadControllers.size ||
      replyBlocked.value
    )
      return;
    if (!old.serverId) {
      uploadBytes.set(key, { ...file, bytes: new Uint8Array(file.bytes) });
      state.value = {
        ...state.value,
        publication: null,
        context: {
          ...original,
          revision: original.revision + 1,
          uploads: original.uploads!.map((u) =>
            u.key === key
              ? {
                  key,
                  name: file.name,
                  type: file.type,
                  size: file.bytes.length,
                  status: "selected",
                  ownerId: actor.writing.account.id,
                  message:
                    "Replacement bytes selected locally. Upload is a separate explicit action.",
                  loaded: 0,
                }
              : u,
          ),
        },
      };
      await changed();
      return;
    }
    const pendingKey = crypto.randomUUID();
    const pending: import("../forum-client").WritingUpload = {
      key: pendingKey,
      name: file.name,
      type: file.type,
      size: file.bytes.length,
      ownerId: actor.writing.account.id,
      status: "uploading",
      loaded: 0,
      message:
        "Replacement upload pending. The original attachment and source remain retained.",
    };
    const controller = new AbortController();
    uploadControllers.set(pendingKey, controller);
    state.value = {
      ...state.value,
      publication: null,
      context: {
        ...original,
        revision: original.revision + 1,
        uploads: [...(original.uploads ?? []), pending],
      },
    };
    const operation = captureOperation();
    const acknowledged = await changed();
    const result =
      acknowledged && operation?.current()
        ? await client.uploadAttachment(
            operation.writing,
            file,
            () => {},
            controller.signal,
            effectGuard(),
          )
        : {
            kind: "not-sent" as const,
            message:
              "Recovery or writing changed. No replacement was uploaded.",
          };
    uploadControllers.delete(pendingKey);
    accountObserved(client.account);
    observe(client.account);
    const current = state.value.context;
    if (!current || !isOrdinaryReply(current) || current.id !== original.id)
      return;
    const others = (current.uploads ?? []).filter((u) => u.key !== pendingKey);
    if (result.kind !== "uploaded") {
      state.value = {
        ...state.value,
        message: result.message,
        context: {
          ...current,
          revision: current.revision + 1,
          uploads:
            result.kind === "uncertain"
              ? [
                  ...others,
                  {
                    ...pending,
                    status: "uncertain",
                    message: result.message,
                    ...(result.id ? { serverId: result.id } : {}),
                  },
                ]
              : others,
        },
      };
      await changed();
      return;
    }
    const accepted: import("../forum-client").WritingUpload = {
      ...pending,
      status: "uploaded",
      serverId: result.id,
      referenceKind: result.referenceKind,
      originalSha256: result.sha256,
      fields: result.fields,
      loaded: file.bytes.length,
      message:
        "Replacement upload stored for its captured account. No reply was sent.",
    };
    const retainedResult = () => {
      const latest = state.value.context;
      if (!latest || !isOrdinaryReply(latest) || latest.id !== original.id)
        return;
      state.value = {
        ...state.value,
        publication: null,
        message:
          "The replacement upload reached the forum, but writing or authority changed. Original intent and the separate upload result are retained; nothing was retried.",
        context: {
          ...latest,
          revision: latest.revision + 1,
          uploads: [
            ...(latest.uploads ?? []).filter((u) => u.key !== pendingKey),
            accepted,
          ],
          uploadedReferences: [
            ...new Set([...latest.uploadedReferences, result.id]),
          ],
          attachmentFields: [
            ...(latest.attachmentFields ?? []),
            ...result.fields,
          ],
        },
      };
    };
    if (!operation?.current() || state.value.composing) {
      retainedResult();
      await changed();
      return;
    }
    const source = repairedSource(current.source, old.serverId, {
      id: result.id,
      kind: result.referenceKind,
    });
    const next: PublicWritingContext = {
      ...current,
      revision: current.revision + 1,
      uploads: others.map((u) => (u.key === key ? { ...accepted, key } : u)),
      uploadedReferences: [
        ...new Set([
          ...current.uploadedReferences.filter((id) => id !== old.serverId),
          result.id,
        ]),
      ],
      attachmentFields: [
        ...(current.attachmentFields ?? []).filter(
          (f) =>
            !f.name.startsWith(`attachnew[${old.serverId}]`) &&
            !f.name.startsWith(`attachupdate[${old.serverId}]`),
        ),
        ...result.fields,
      ],
    };
    if (!applyAttachmentEdit(next, source)) {
      retainedResult();
      await changed();
      return;
    }
    const repaired = state.value.context;
    const saved = await changed();
    if (!saved && state.value.context === repaired) {
      // A refused final acknowledgement cannot erase the old intent or claim rollback of the real upload.
      applyAttachmentEdit(current, current.source, true);
      retainedResult();
      await changed();
      return;
    }
    const latest = state.value.context;
    const row = latest?.uploads?.find((u) => u.key === key);
    if (
      saved &&
      latest &&
      isOrdinaryReply(latest) &&
      row &&
      row.serverId === result.id &&
      captureOperation(latest)?.writing.account.id === actor.writing.account.id
    )
      attachmentProofs.value = {
        ...attachmentProofs.value,
        [key]: { identity: attachmentIdentity(latest, row), available: true },
      };
  }
  function insertAttachment(key: string) {
    if (attachmentUnavailable(key)) return;
    if (replyBlocked.value) return;
    const c = state.value.context,
      u = c?.uploads?.find((u) => u.key === key);
    if (
      !c ||
      c.action === "private-message" ||
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
          const current = state.value.context;
          const unresolved =
            current?.action !== "private-message" &&
            (recoveredInterpretation || !snapshot.readiness.ready);
          if (!current || current.id !== context.id) return;
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
      if (
        !["reply", "quick-quote"].includes(context.action) ||
        context.editorUnresolved
      )
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
  let mentionSequence = 0;
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
  async function preparePrivate(
    url: string,
    account: Account,
    replace = false,
  ) {
    if (replace && refuseReplyDisposal()) return;
    if (replyBlocked.value) return;
    if (
      deferViewChange(() => {
        void preparePrivate(url, account, replace);
      }) ||
      state.value.publishing
    )
      return;
    const existing = state.value.context;
    if (existing && !replace) {
      if (
        existing.action === "private-message" &&
        existing.recipient.url === url &&
        account.kind === "member" &&
        existing.account.id === account.id
      ) {
        state.value = { ...state.value, visible: true };
        return;
      }
      state.value = { ...state.value, privateReplacement: { url, account } };
      return;
    }
    const current = ++sequence;
    state.value = {
      ...state.value,
      preparing: true,
      message: "",
      privateReview: null,
    };
    const result = await client.preparePrivateWriting(url, account);
    accountObserved(result.account);
    observe(result.account);
    if (current !== sequence) return;
    if (
      result.kind !== "prepared" ||
      (existing &&
        (state.value.context?.id !== existing.id ||
          state.value.context.revision !== existing.revision))
    ) {
      state.value = {
        ...state.value,
        preparing: false,
        message:
          result.kind === "refused"
            ? result.message
            : "Writing changed during preparation. Your text is retained.",
      };
      return;
    }
    state.value = {
      ...state.value,
      preparing: false,
      visible: true,
      privateReplacement: null,
      publication: null,
      privateReview: null,
      acknowledged: 0,
      accountVerified: true,
      context: {
        ...result.prepared,
        id: crypto.randomUUID(),
        revision: 1,
        selection: { start: 0, end: 0, direction: "none" },
        ...(existing?.privateAttempts?.length
          ? { privateAttempts: existing.privateAttempts }
          : {}),
        ...(existing?.attempts ? { attempts: existing.attempts } : {}),
        ...(existing?.draftAttempts
          ? { draftAttempts: existing.draftAttempts }
          : {}),
      },
    };
    await replaced(existing);
  }
  async function reviewPrivate() {
    const context = state.value.context;
    if (
      context?.action !== "private-message" ||
      state.value.preparing ||
      state.value.publishing ||
      state.value.composing
    )
      return;
    if (
      context.privateAttempts?.some(
        (a) =>
          a.submission.writing.account.id === context.account.id &&
          a.submission.writing.recipient.id === context.recipient.id &&
          (["pending", "uncertain"].includes(a.status) ||
            (a.status === "confirmed" &&
              a.submission.writing.source === context.source)),
      )
    ) {
      state.value = {
        ...state.value,
        privateReview: null,
        privateReviewConsumed: false,
        message:
          "This text was already confirmed or an earlier private attempt is unresolved. Check that original attempt or continue in the native forum; no resend was prepared.",
      };
      return;
    }
    state.value = {
      ...state.value,
      preparing: true,
      privateReview: null,
      privateReviewConsumed: false,
      message: "",
    };
    const { id, revision } = context;
    const result = await client.preparePrivateReview({
      contextId: id,
      revision,
      writing: {
        action: context.action,
        account: context.account,
        recipient: context.recipient,
        source: context.source,
        maxLength: context.maxLength,
      },
    });
    accountObserved(result.account);
    observe(result.account, result.kind === "ready");
    const same =
      state.value.context?.id === id &&
      state.value.context.revision === revision;
    state.value = {
      ...state.value,
      preparing: false,
      validationIssues:
        same && result.kind === "refused" && result.issue ? [result.issue] : [],
      validationFocus: state.value.validationFocus + 1,
      privateReview: same && result.kind === "ready" ? result.review : null,
      message: !same
        ? "Writing changed during review. Review the current text again."
        : result.kind === "refused"
          ? result.message
          : "",
    };
  }
  function updatePrivateAttempt(
    attempt: import("../forum-client").PrivateAttempt,
  ) {
    const context = state.value.context;
    if (
      !context ||
      (context.id !== attempt.submission.contextId &&
        !context.privateAttempts?.some((a) => a.id === attempt.id))
    )
      return;
    const attempts = [...(context.privateAttempts ?? [])];
    const index = attempts.findIndex((a) => a.id === attempt.id);
    if (index < 0) attempts.push(attempt);
    else attempts[index] = attempt;
    state.value = {
      ...state.value,
      context: { ...context, privateAttempts: attempts },
    };
  }
  async function sendPrivate() {
    const context = state.value.context,
      review = state.value.privateReview;
    if (
      context?.action !== "private-message" ||
      !review ||
      state.value.privateReviewConsumed ||
      state.value.publishing ||
      state.value.preparing ||
      state.value.composing ||
      review.submission.contextId !== context.id ||
      review.submission.revision !== context.revision ||
      review.generation !== client.generation
    )
      return;
    state.value = {
      ...state.value,
      privateReviewConsumed: true,
      publishing: true,
    };
    const attempt: import("../forum-client").PrivateAttempt = {
      id: crypto.randomUUID(),
      submission: review.submission,
      before: [],
      status: "pending",
      checked: false,
      message:
        "Private message pending. Refresh retains uncertainty without replay.",
      result: null,
    };
    updatePrivateAttempt(attempt);
    const retained = await changed();
    const result =
      retained &&
      state.value.context?.id === context.id &&
      state.value.context.revision === context.revision
        ? await client.sendPrivateMessage(review, attempt, async (pending) => {
            updatePrivateAttempt(pending);
            return changed();
          })
        : {
            ...attempt,
            status: "not-sent" as const,
            message:
              "Private message was not sent because recovery or writing changed. Your text is retained.",
          };
    accountObserved(client.account);
    observe(client.account);
    updatePrivateAttempt(result);
    state.value = { ...state.value, publishing: false };
    await changed();
  }
  async function checkPrivate(id: string) {
    const attempt = state.value.context?.privateAttempts?.find(
      (a) => a.id === id,
    );
    if (
      !attempt ||
      attempt.status !== "uncertain" ||
      state.value.publishing ||
      state.value.preparing
    )
      return;
    state.value = { ...state.value, publishing: true, privateReview: null };
    const result = await client.checkPrivateMessage(attempt);
    accountObserved(client.account);
    observe(client.account);
    updatePrivateAttempt(result);
    state.value = { ...state.value, publishing: false };
    await changed();
  }
  async function prepare(
    boardId: string,
    replace = false,
    replyTarget?: ReplyTarget,
    redPacket = false,
  ) {
    if (replace && refuseReplyDisposal()) return;
    if (
      deferViewChange(() => {
        void prepare(boardId, replace, replyTarget, redPacket);
      })
    )
      return;
    if (
      replyBlocked.value ||
      (replyTarget && conflictedReplies.value.includes(replyTarget.threadId))
    )
      return;
    const existing = state.value.context;
    const sameAction =
      existing?.action !== "private-message" &&
      existing?.action !== "edit-post" &&
      existing?.board.id === boardId &&
      Boolean(existing?.redPacket) === redPacket &&
      JSON.stringify(existing?.replyTarget) === JSON.stringify(replyTarget);
    const retarget =
      !replace &&
      !!replyTarget &&
      existing?.action !== "private-message" &&
      existing?.action !== "edit-post" &&
      existing?.board.id === boardId &&
      existing?.replyTarget?.threadId === replyTarget.threadId &&
      !sameAction;
    if (
      (state.value.publishing || (retarget && !canDeactivate())) &&
      (replace || !sameAction)
    ) {
      state.value = {
        ...state.value,
        message:
          "Publication or result checking is pending. Keep this context until it settles.",
      };
      return;
    }
    if (replace && replyTarget && retainedReplies.value[replyTarget.threadId]) {
      if (!canDeactivate()) return;
      if (!selectThread(replyTarget.threadId, true)) return;
      await prepare(boardId, false, replyTarget, redPacket);
      return;
    }
    const current = ++sequence;
    state.value = {
      ...state.value,
      preparing: false,
      ...(!replace
        ? { replacement: null, editReplacement: null, draftReplacement: null }
        : {}),
    };
    if (existing && !replace && !retarget) {
      if (sameAction) {
        state.value = { ...state.value, visible: true, replacement: null };
        return;
      }
      state.value = {
        ...state.value,
        replacement: {
          boardId,
          redPacket,
          ...(replyTarget ? { replyTarget } : {}),
        },
      };
      return;
    }
    if (retarget) ++mentionSequence;
    state.value = {
      ...state.value,
      preparing: true,
      message: "",
      ...(retarget && existing
        ? {
            // Revoke the old submitted revision before waiting for a fresh target.
            context: { ...existing, revision: existing.revision + 1 },
            publication: null,
            copy: null,
            mentionPeople: [],
            mentionGeneration: -1,
            findingMention: false,
          }
        : {}),
    };
    const operation = retarget ? captureOperation() : null;
    const result = await (replyTarget
      ? client.prepareReply(boardId, replyTarget)
      : client.prepareNewThread(boardId, redPacket));
    if (current !== sequence) return;
    if (result.kind !== "stale") {
      accountObserved(result.account);
      observe(result.account, result.kind === "prepared");
    }
    if (result.kind !== "prepared") {
      state.value = {
        ...state.value,
        preparing: false,
        message: result.message,
      };
      return;
    }
    if (retarget && existing && replyTarget) {
      const latest = state.value.context;
      const latestOperation = captureOperation(latest);
      if (
        !latest ||
        latest.id !== existing.id ||
        latest.action === "private-message" ||
        !operation ||
        !latestOperation?.current() ||
        latestOperation.generation !== operation.generation ||
        latestOperation.writing.account.id !== operation.writing.account.id ||
        result.prepared.account.id !== operation.writing.account.id ||
        !state.value.accountVerified
      ) {
        state.value = {
          ...state.value,
          preparing: false,
          message:
            "The writing context or account changed. The reply target was not changed.",
        };
        return;
      }
      replyFormFailure.value = null;
      state.value = {
        ...state.value,
        context: {
          ...latest,
          action: result.prepared.action,
          replyTarget,
          revision: latest.revision + 1,
        },
        preparing: false,
        visible: true,
        replacement: null,
        publication: null,
        copy: null,
        validationIssues: [],
        message: "",
      };
      await changed();
      void revalidateAttachments();
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
      validationIssues: [],
      context: {
        ...result.prepared,
        id: crypto.randomUUID(),
        revision: 1,
        selection: { start: 0, end: 0, direction: "none" },
        ...(existing?.privateAttempts?.length
          ? { privateAttempts: existing.privateAttempts }
          : {}),
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
    replaced(existing);
  }
  async function prepareEdit(
    threadURL: string,
    postId: string,
    replace = false,
  ) {
    if (replace && refuseReplyDisposal()) return;
    if (replyBlocked.value) return;
    if (
      deferViewChange(() => {
        void prepareEdit(threadURL, postId, replace);
      })
    )
      return;
    if (state.value.publishing) return;
    const current = ++sequence;
    state.value = {
      ...state.value,
      preparing: false,
      ...(!replace
        ? { replacement: null, editReplacement: null, draftReplacement: null }
        : {}),
    };
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
    state.value = { ...state.value, preparing: true, message: "" };
    const result = await client.preparePostEdit(threadURL, postId);
    if (current !== sequence) return;
    accountObserved(result.account);
    observe(result.account, result.kind === "prepared");
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
      validationIssues: [],
      context: {
        ...result.prepared,
        id: crypto.randomUUID(),
        revision: 1,
        selection: { start: 0, end: 0, direction: "none" },
        ...(existing?.privateAttempts?.length
          ? { privateAttempts: existing.privateAttempts }
          : {}),
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
    await replaced(existing);
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
    if (replace && refuseReplyDisposal()) return;
    if (replyBlocked.value) return;
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
      validationIssues: [],
      context: {
        ...result.prepared,
        id: crypto.randomUUID(),
        revision: 1,
        selection: { start: 0, end: 0, direction: "none" },
        ...(existing?.privateAttempts?.length
          ? { privateAttempts: existing.privateAttempts }
          : {}),
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
    await replaced(existing);
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
          ...draftResult(current, result),
          draftAttempts: (current.draftAttempts ?? []).map((a) =>
            a.id === result.id ? result : a,
          ),
        },
      };
    else state.value = { ...state.value, publishing: false };
    await changed();
    if (result.status === "published" && result.publishedURL)
      await publishedDraft?.(result.publishedURL, result.submission.contextId);
  }
  function edit(
    patch: Partial<
      Pick<
        PublicWritingContext,
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
    if (replyBlocked.value) return;
    if (context) {
      if (context.action === "private-message") {
        const source = patch.source ?? context.source,
          selection = patch.selection ?? context.selection;
        if (
          source === context.source &&
          JSON.stringify(selection) === JSON.stringify(context.selection)
        )
          return;
        state.value = {
          ...state.value,
          context: {
            ...context,
            source,
            selection,
            revision: context.revision + 1,
          },
          privateReview: null,
        };
        void changed();
        return;
      }
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
      if (!repairSourceTransaction) void changed();
    }
  }
  function submission(context: PublicWritingContext) {
    const {
      id,
      revision,
      selection: _selection,
      attempts: _attempts,
      editorUnresolved: _editorUnresolved,
      privateAttempts: _privateAttempts,
      draftAttempts: _draftAttempts,
      unappliedPacketOptions: _unappliedPacketOptions,
      ...content
    } = context;
    void [
      _selection,
      _attempts,
      _editorUnresolved,
      _draftAttempts,
      _privateAttempts,
      _unappliedPacketOptions,
    ];
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
    if (context.action === "private-message") {
      state.value = {
        ...state.value,
        context: {
          ...context,
          attempts: [
            ...(context.attempts ?? []).filter((a) => a.id !== attempt.id),
            attempt,
          ],
        },
      };
      return;
    }
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
                  attachmentFields: (
                    attempt.publication.submission.writing.attachmentFields ??
                    []
                  ).map((field) => {
                    const normalized =
                      attempt.result?.verification?.attachmentNormalizations?.find(
                        (item) => item.name === field.name,
                      );
                    return normalized
                      ? { ...field, value: normalized.stored }
                      : field;
                  }),
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
  ): WritingContext {
    if (
      context.action === "private-message" ||
      !result.result ||
      result.submission.contextId !== context.id
    )
      return context;
    const current = { ...context };
    if (current.redPacket) {
      const laterOptions = current.options.filter((option) => {
        if (!option.name.startsWith("hb_")) return false;
        const submitted = result.submission.writing.options.find(
          (original) => original.name === option.name,
        );
        return (
          !submitted ||
          option.value !== submitted.value ||
          option.checked !== submitted.checked
        );
      });
      if (laterOptions.length)
        current.unappliedPacketOptions = laterOptions.map((option) => ({
          ...option,
          choices: option.choices.map((choice) => ({ ...choice })),
        }));
      delete current.redPacket;
      current.options = current.options.filter(
        (o) => !o.name.startsWith("hb_"),
      );
      if (result.observation?.packetMarker) current.existingRedPacket = true;
    }
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
      ...current,
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
  async function confirmFundedDraft() {
    const review = state.value.fundedDraftReview;
    state.value = { ...state.value, fundedDraftReview: null };
    const context = state.value.context;
    if (
      !review ||
      !context ||
      context.id !== review.contextId ||
      context.revision !== review.revision ||
      client.generation !== review.generation
    ) {
      state.value = {
        ...state.value,
        message:
          "The funded draft review changed. Review the current revision and account again. Nothing was sent.",
      };
      return;
    }
    await saveDraft(review.continueAfter, review.resendId, true);
  }
  function blockUnappliedContinuation(continueAfter: boolean) {
    if (!continueAfter || !state.value.context?.unappliedPacketOptions?.length)
      return false;
    state.value = {
      ...state.value,
      message:
        "Save-and-continue is blocked because unapplied packet settings remain. They cannot be saved to the existing packet. Return to copy them before explicitly discarding this writing; ordinary Save keeps them here.",
    };
    return true;
  }
  async function saveDraft(
    continueAfter = false,
    resendId?: string,
    fundingReviewed = false,
  ) {
    if (replyBlocked.value) return;
    const context = state.value.context;
    if (
      !context ||
      context.action === "private-message" ||
      state.value.preparing ||
      state.value.publishing ||
      state.value.composing
    )
      return;
    if (blockUnappliedContinuation(continueAfter)) return;
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
    if (context.redPacket && !context.draft && !fundingReviewed) {
      state.value = {
        ...state.value,
        fundedDraftReview: {
          contextId: context.id,
          revision: context.revision,
          generation: client.generation,
          writing: submission(context).writing,
          continueAfter,
          ...(resendId ? { resendId } : {}),
        },
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
      ...(fundingReviewed ? { fundingReviewed: true as const } : {}),
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
      state.value.context?.id === context.id &&
      blockUnappliedContinuation(continueAfter)
    )
      return;
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
          state.value.replacement.redPacket,
        );
    }
  }
  async function reviewDraftPublication() {
    const context = state.value.context;
    if (
      !context?.draft ||
      state.value.preparing ||
      state.value.publishing ||
      state.value.composing ||
      state.value.publication
    )
      return;
    if (
      context.editorUnresolved ||
      context.uploads?.some(
        (u) => !["uploaded", "associated", "removed"].includes(u.status),
      ) ||
      context.draftAttempts?.some((a) => blocksDraft(a, context))
    ) {
      state.value = {
        ...state.value,
        message: context.editorUnresolved
          ? "Review the complete source and resolve its interpretation before publication."
          : context.draftAttempts?.some((a) => blocksDraft(a, context))
            ? "An earlier draft operation remains unresolved or already published. Check the original result; no action was repeated."
            : "Finish uploads or explicitly remove pending selections before saving or publishing a draft.",
      };
      return;
    }
    state.value = { ...state.value, preparing: true, message: "" };
    const result = await client.resumeDraft(
      {
        threadId: context.draft.threadId,
        boardId: context.board.id,
        title: context.title,
        url: context.draft.url,
      },
      context.account,
    );
    accountObserved(result.account);
    observe(result.account, result.kind === "prepared");
    if (
      state.value.context?.id !== context.id ||
      state.value.context.revision !== context.revision ||
      state.value.composing
    ) {
      state.value = {
        ...state.value,
        preparing: false,
        message:
          "Writing changed during publication preparation. Review the current revision again.",
      };
      return;
    }
    if (result.kind !== "prepared") {
      state.value = {
        ...state.value,
        preparing: false,
        message: result.message,
      };
      return;
    }
    if (
      result.prepared.draft?.version !== context.draft.version ||
      !verifyStoredWriting(context, result.prepared)
    ) {
      state.value = {
        ...state.value,
        preparing: false,
        message:
          "Save local changes to the forum draft before reviewing publication. If the remote draft changed, resume its current revision; local writing is retained.",
      };
      return;
    }
    state.value = {
      ...state.value,
      preparing: false,
      publication: {
        id: crypto.randomUUID(),
        generation: result.generation,
        submission: JSON.parse(JSON.stringify(submission(context))),
      },
    };
  }
  async function publishReviewedDraft() {
    const review = state.value.publication,
      context = state.value.context;
    if (
      !review ||
      !context?.draft ||
      state.value.composing ||
      state.value.preparing ||
      state.value.publishing
    )
      return;
    if (
      review.submission.contextId !== context.id ||
      review.submission.revision !== context.revision ||
      review.generation !== client.generation ||
      !state.value.accountVerified ||
      client.account.kind !== "member" ||
      client.account.id !== context.account.id
    ) {
      state.value = {
        ...state.value,
        publication: null,
        message:
          "The draft publication review changed. Review the current action, account and revision again. Nothing was sent.",
      };
      return;
    }
    state.value = { ...state.value, publication: null, privateReview: null };
    await publishDraft();
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
          ...draftResult(current, result),
          draftAttempts: (current.draftAttempts ?? []).map((a) =>
            a.id === result.id ? result : a,
          ),
        },
      };
    else state.value = { ...state.value, publishing: false };
    await changed();
    if (result.status === "published" && result.publishedURL)
      await publishedDraft?.(result.publishedURL, result.submission.contextId);
  }
  async function reviewPublication(resendId?: string) {
    if (replyBlocked.value || replyPublicationBlocked.value) return;
    if (state.value.context?.action === "private-message")
      return reviewPrivate();
    if (state.value.context?.draft && !resendId)
      return reviewDraftPublication();
    const currentReply = state.value.context;
    if (
      currentReply &&
      isOrdinaryReply(currentReply) &&
      !state.value.preparing &&
      !state.value.publishing &&
      !state.value.composing
    ) {
      const captured = canonical(currentReply);
      if (!captureOperation(currentReply)) await check();
      else if (currentReply.uploads?.some((u) => attachmentUnavailable(u.key)))
        await revalidateAttachments(true);
      if (replyBlocked.value || canonical(state.value.context) !== captured)
        return;
    }
    if (
      state.value.context?.uploads?.some(
        (u) =>
          attachmentUnavailable(u.key) ||
          !["uploaded", "associated", "removed"].includes(u.status),
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
    if (
      context.redPacket &&
      context.attempts?.some((a) => a.status === "confirmed" && a.result)
    ) {
      state.value = {
        ...state.value,
        message:
          "An existing red-packet thread is already confirmed. Edit that thread or start a separate writing context; no re-funding was prepared.",
      };
      return;
    }
    const ordinaryReply = Boolean(isOrdinaryReply(context));
    const unresolved =
      (ordinaryReply
        ? replyAttempts(context.replyTarget!.threadId).filter(
            (attempt) =>
              !registeredSends.value[context.replyTarget!.threadId]?.some(
                (send) => send.attempt.id === attempt.id && send.successor,
              ),
          )
        : context.attempts?.map(observedAttempt)
      )?.filter((attempt) =>
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
    const operation = captureOperation(context);
    if (isOrdinaryReply(context) && !operation) {
      state.value = {
        ...state.value,
        message:
          "Check the current account and form before reviewing this shared reply.",
      };
      return;
    }
    const preparation = ++sequence;
    state.value = {
      ...state.value,
      preparing: true,
      publication: null,
      message: "",
    };
    const result =
      context.action === "edit-post"
        ? await client.prepareEditPublication(submission(context))
        : await client.prepareThreadPublication(
            submission(operation?.writing ?? context),
          );
    if (preparation !== sequence) return;
    const local =
      "validation" in result && result.validation?.source === "local";
    if (!local) {
      accountObserved(result.account);
      observe(
        result.account,
        result.kind === "ready" ||
          result.kind === "conflict" ||
          ("accountVerified" in result && result.accountVerified === true),
      );
    }
    if (
      (isOrdinaryReply(context) &&
        (!operation?.current() || replyPublicationBlocked.value)) ||
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
    if (isOrdinaryReply(context) && !local)
      replyFormFailure.value =
        result.kind === "ready" || result.kind === "conflict"
          ? null
          : context.id;
    state.value = {
      ...state.value,
      preparing: false,
      publication: result.kind === "ready" ? result.publication : null,
      conflict:
        result.kind === "conflict" ? result.latest : state.value.conflict,
      message: result.kind === "ready" || local ? "" : result.message,
      validationIssues:
        "validation" in result ? (result.validation?.issues ?? []) : [],
      validationFocus: state.value.validationFocus + 1,
    };
    return result.kind === "ready" ? result.publication : undefined;
  }
  const replySendActive = new Set<string>();
  async function sendReply(resendId?: string) {
    const context = state.value.context;
    if (
      !context ||
      !isOrdinaryReply(context) ||
      replySendActive.has(context.replyTarget!.threadId) ||
      replyBlocked.value ||
      replyPublicationBlocked.value ||
      state.value.preparing ||
      state.value.publishing ||
      state.value.composing
    )
      return;
    const sendingThread = context.replyTarget!.threadId;
    replySendActive.add(sendingThread);
    try {
      const operation = captureOperation(context);
      if (!operation) {
        await check();
        state.value = {
          ...state.value,
          message:
            "The sending account was not verified when Send was activated. Check the current account, then choose Send again. Your reply is retained.",
        };
        return;
      }
      const publication = await reviewPublication(resendId);
      if (!publication || state.value.publication !== publication) return;
      if (!operation.current()) {
        state.value = {
          ...state.value,
          publication: null,
          message:
            "The reply or sending account changed during preparation. Nothing was sent. Choose Send again for the current reply.",
        };
        return;
      }
      await publish();
    } finally {
      replySendActive.delete(sendingThread);
    }
  }
  function effectGuard(
    publication = false,
  ): import("../forum-client").EffectGuard | undefined {
    const context = state.value.context;
    if (!context || !isOrdinaryReply(context)) return undefined;
    const operation = captureOperation(context);
    const current = () =>
      operation?.current() === true &&
      (!publication || !replyPublicationBlocked.value);
    return {
      current,
      check: async () => current() && (await changed()) && current(),
    };
  }
  async function publish() {
    if (replyBlocked.value || replyPublicationBlocked.value) return;
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
    const ordinaryReply = Boolean(isOrdinaryReply(context));
    if (ordinaryReply) {
      await publishReply(context as PublicWritingContext, attempt);
      return;
    }
    updateAttempt(attempt);
    const saved = await changed();
    let result: ThreadAttempt;
    if (
      !saved ||
      replyBlocked.value ||
      replyPublicationBlocked.value ||
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
          : await client.publishThread(attempt, effectGuard(true));
    accountObserved(client.account);
    observe(client.account);
    updateAttempt(result);
    state.value = { ...state.value, publishing: false };
    await changed();
  }
  async function publishReply(
    context: PublicWritingContext,
    attempt: ThreadAttempt,
    predecessor?: ReplySend,
  ) {
    const thread = context.replyTarget!.threadId;
    updateAttempt(attempt);
    const activation = captureOperation();
    const pendingContext = state.value.context as PublicWritingContext;
    const saved = await changed();
    const reservation =
      saved && activation?.current()
        ? await replyHost?.reserveReplySend?.(
            pendingContext,
            attempt,
            predecessor,
          )
        : undefined;
    observeReplySends();
    const registered = reservation?.send;
    let result: ThreadAttempt;
    if (!reservation?.acknowledged || !registered || !activation?.current()) {
      result = {
        ...attempt,
        status: "not-sent",
        message:
          "Reply was not sent because pending recovery, writing or the account changed. Your input is retained.",
      };
      state.value = { ...state.value, publishing: false };
    } else {
      if (!predecessor) {
        const mode = editorSession?.state.mode;
        const current = state.value.context as PublicWritingContext;
        editorSession?.dispose();
        editorSession = null;
        editorContext = "";
        state.value = {
          ...state.value,
          publishing: false,
          context: {
            ...current,
            revision: current.revision + 1,
            source: "",
            title: "",
            uploadedReferences: [],
            attachmentFields: [],
            uploads: [],
            mentions: [],
            editorUnresolved: false,
            selection: { start: 0, end: 0, direction: "none" },
          },
        };
        if (mode) editor().setMode(mode);
        editorGeneration.value++;
      } else state.value = { ...state.value, publishing: false };
      liveSends.value = { ...liveSends.value, [attempt.id]: true };
      await changed();
      const actor = attempt.publication.submission.writing.account;
      const generation = attempt.publication.generation;
      let valid = true;
      const currentAuthority = () =>
        valid &&
        client.generation === generation &&
        client.account.kind === "member" &&
        client.account.id === actor.id &&
        !conflictedReplies.value.includes(thread);
      result = await client.publishThread(attempt, {
        current: currentAuthority,
        check: async () => {
          valid =
            currentAuthority() &&
            (await replyHost?.checkReplySend?.(thread, registered)) === true;
          return currentAuthority();
        },
      });
    }
    accountObserved(client.account);
    observe(client.account);
    if (registered) {
      const acknowledged = await replyHost?.observeReplySend?.(
        thread,
        registered,
        result,
      );
      if (!acknowledged) {
        updateOwnedReplyAttempt(thread, result);
        unsavedSendResults.value = {
          ...unsavedSendResults.value,
          [attempt.id]: result,
        };
        state.value = {
          ...state.value,
          message:
            "The reply outcome is retained in this tab but could not be durably acknowledged. Check its original status; no retry was sent.",
        };
      }
    } else updateOwnedReplyAttempt(thread, result);
    liveSends.value = { ...liveSends.value, [attempt.id]: false };
    observeReplySends();
    await changed();
  }
  const replyAction = shallowRef<string | null>(null);
  const replyAttachmentResults = shallowRef<Record<string, string>>({});
  function checkableReplyAttachment(thread: string, id: string, key: string) {
    const attempt = replyAttempts(thread).find((item) => item.id === id);
    const writing = attempt?.publication.submission.writing;
    const upload = writing?.uploads?.find((item) => item.key === key);
    return (
      !!attempt?.result &&
      attempt.status === "confirmed" &&
      !!upload?.serverId &&
      !!upload.originalSha256 &&
      writing!.uploadedReferences.includes(upload.serverId) &&
      (upload.ownerId === undefined ? writing!.account.id : upload.ownerId) ===
        writing!.account.id &&
      !replyAction.value &&
      observedAccountVerified &&
      client.account.kind === "member" &&
      client.account.id === writing!.account.id
    );
  }
  async function checkReplyAttachment(thread: string, id: string, key: string) {
    if (!checkableReplyAttachment(thread, id, key)) return;
    const attempt = replyAttempts(thread).find((item) => item.id === id)!;
    const upload = attempt.publication.submission.writing.uploads!.find(
      (item) => item.key === key,
    )!;
    const generation = client.generation,
      captured = canonical(attempt);
    const current = () =>
      client.generation === generation &&
      canonical(replyAttempts(thread).find((item) => item.id === id)) ===
        captured;
    const feedbackKey = `${id}:${key}`;
    const feedback = (message: string) => {
      replyAttachmentResults.value = {
        ...replyAttachmentResults.value,
        [feedbackKey]: message,
      };
    };
    replyAction.value = feedbackKey;
    feedback("Checking independently received file bytes…");
    try {
      const result = await client.downloadAttachment({
        threadURL: attempt.result!.url,
        postId: attempt.result!.postId,
        attachmentId: upload.serverId!,
        account: attempt.publication.submission.writing.account,
      });
      accountObserved(client.account);
      observe(client.account);
      if (!current()) {
        feedback(
          "The account or reply observation changed. Check stored bytes again.",
        );
        return;
      }
      if (result.kind !== "file") {
        feedback(result.message);
        return;
      }
      const hash = Array.from(
        new Uint8Array(
          await crypto.subtle.digest("SHA-256", new Uint8Array(result.bytes)),
        ),
        (byte) => byte.toString(16).padStart(2, "0"),
      ).join("");
      if (!current()) {
        feedback(
          "The account or reply observation changed. Check stored bytes again.",
        );
        return;
      }
      feedback(
        hash === upload.originalSha256 &&
          result.bytes.length === upload.size &&
          result.name === upload.name
          ? "Stored filename and bytes match the selected file."
          : "Server file differs from selected bytes or filename. Server normalization is disclosed; original byte identity is not claimed.",
      );
    } finally {
      replyAction.value = null;
    }
  }
  function editableReply(thread: string, id: string) {
    const context = state.value.context;
    const send = registeredSends.value[thread]?.find(
      (item) => item.attempt.id === id,
    );
    const attempt =
      send?.attempt ?? replyAttempts(thread).find((item) => item.id === id);
    return (
      !!attempt &&
      (send || legacyFailedReply(attempt)) &&
      ["rejected", "not-sent"].includes(attempt.status) &&
      !!context &&
      isOrdinaryReply(context) &&
      context.replyTarget!.threadId === thread &&
      !replyAction.value &&
      !replyBlocked.value &&
      canDeactivate() &&
      !state.value.composing
    );
  }
  async function editFailedReply(thread: string, id: string) {
    if (!editableReply(thread, id)) return;
    const context = state.value.context as PublicWritingContext;
    const before = canonical(context);
    let send = registeredSends.value[thread]?.find(
      (item) => item.attempt.id === id,
    );
    replyAction.value = id;
    try {
      if (!send) {
        const legacy = replyAttempts(thread).find((item) => item.id === id);
        const saved = await changed();
        const captured =
          saved &&
          legacy &&
          (await replyHost?.captureLegacyReply?.(thread, legacy));
        send = captured
          ? ((await replyHost?.enrollLegacyReply?.(captured)) ?? undefined)
          : undefined;
        observeReplySends();
        if (!send || before !== canonical(state.value.context)) {
          state.value = {
            ...state.value,
            message:
              "The writing or saved reply changed, or recovery failed. Your newer draft is retained; try Edit again.",
          };
          return;
        }
      }
      const candidate = recoverContext({
        ...send.attempt.publication.submission.writing,
        id: crypto.randomUUID(),
        revision: 1,
        selection: { start: 0, end: 0, direction: "none" },
        ...(context.attempts ? { attempts: context.attempts } : {}),
        ...(context.draftAttempts
          ? { draftAttempts: context.draftAttempts }
          : {}),
        ...(context.privateAttempts
          ? { privateAttempts: context.privateAttempts }
          : {}),
      }) as PublicWritingContext;
      const saved = await changed();
      const retained =
        saved &&
        before === canonical(state.value.context) &&
        (await replyHost?.retainFailedReply?.(context, candidate, send));
      await changed();
      state.value = {
        ...state.value,
        message: retained
          ? "The failed reply is a recoverable version. Choose it to edit, or keep writing your newer draft. Nothing was sent."
          : "The writing or saved reply changed, or recovery failed. Your newer draft is retained; try Edit again.",
      };
    } finally {
      replyAction.value = null;
    }
  }
  const replyRisk = shallowRef<{ thread: string; send: ReplySend } | null>(
    null,
  );
  function retryableReply(thread: string, id: string, risk = false) {
    const context = state.value.context;
    const send = registeredSends.value[thread]?.find(
      (item) => item.attempt.id === id,
    );
    const attempt =
      send?.attempt ?? replyAttempts(thread).find((item) => item.id === id);
    return (
      !!attempt &&
      (send ? !send.successor : legacyFailedReply(attempt)) &&
      !replyAction.value &&
      !replySendActive.has(thread) &&
      !!context &&
      isOrdinaryReply(context) &&
      context.replyTarget!.threadId === thread &&
      !replyBlocked.value &&
      !state.value.publishing &&
      !state.value.preparing &&
      !state.value.composing &&
      (["not-sent", "rejected"].includes(attempt.status) ||
        (risk && attempt.status === "uncertain" && attempt.checked)) &&
      captureOperation()?.writing.account.id ===
        attempt.publication.submission.writing.account.id
    );
  }
  async function retryReply(thread: string, id: string, accepted?: ReplySend) {
    if (!retryableReply(thread, id, !!accepted)) return;
    let original = registeredSends.value[thread]?.find(
      (item) => item.attempt.id === id,
    );
    if (accepted && canonical(original) !== canonical(accepted)) {
      state.value = {
        ...state.value,
        message:
          "The original reply status changed. Check it again before accepting duplicate risk.",
      };
      return;
    }
    const context = state.value.context as PublicWritingContext;
    const activation = captureOperation();
    replyAction.value = id;
    state.value = { ...state.value, preparing: true, publication: null };
    try {
      if (!original) {
        const legacy = replyAttempts(thread).find((item) => item.id === id);
        const saved = await changed();
        const captured =
          saved &&
          legacy &&
          (await replyHost?.captureLegacyReply?.(thread, legacy));
        original = captured
          ? ((await replyHost?.enrollLegacyReply?.(captured)) ?? undefined)
          : undefined;
        observeReplySends();
        if (!original || !activation?.current()) {
          state.value = {
            ...state.value,
            preparing: false,
            message:
              "The historical failure could not be acknowledged unchanged. Check its original status; no retry was sent and your newer draft is retained.",
          };
          return;
        }
      }
      const prepared = await client.prepareThreadPublication(
        original.attempt.publication.submission,
      );
      accountObserved(client.account);
      observe(client.account);
      state.value = { ...state.value, preparing: false };
      if (
        !activation?.current() ||
        prepared.kind !== "ready" ||
        prepared.publication.submission.writing.account.id !==
          original.attempt.publication.submission.writing.account.id
      ) {
        state.value = {
          ...state.value,
          message:
            "The original reply could not be prepared under its original account. Your newer draft is retained; nothing was retried.",
        };
        return;
      }
      state.value = { ...state.value, publishing: true };
      await publishReply(
        context,
        {
          id: crypto.randomUUID(),
          publication: prepared.publication,
          status: "pending",
          checked: false,
          candidateURL: null,
          result: null,
          message: "The original reply is Sending. Newer writing is retained.",
        },
        original,
      );
    } finally {
      replyAction.value = null;
    }
  }
  async function checkReplyStatus(thread: string, id: string, url?: string) {
    if (replyAction.value) return;
    const registered = registeredSends.value[thread]?.find(
      (send) => send.attempt.id === id,
    );
    const attempt =
      registered?.attempt ??
      replyAttempts(thread).find((item) => item.id === id);
    if (!attempt) return;
    replyAction.value = id;
    try {
      const captured = !registered
        ? await replyHost?.captureLegacyReply?.(thread, attempt)
        : null;
      const fallback = attempt.publication.replyBefore?.pageURL;
      const originalThread = fallback ? new URL(fallback) : null;
      originalThread?.searchParams.delete("tsdmapp");
      const result = await client.checkThreadResult(
        attempt,
        url || attempt.candidateURL || originalThread?.href,
      );
      accountObserved(client.account);
      observe(client.account);
      const acknowledged = registered
        ? await replyHost?.observeReplySend?.(thread, registered, result)
        : captured
          ? await replyHost?.enrollLegacyReply?.(captured, result)
          : null;
      if (!acknowledged) {
        updateOwnedReplyAttempt(thread, result);
        unsavedSendResults.value = {
          ...unsavedSendResults.value,
          [id]: result,
        };
      } else {
        const local = { ...unsavedSendResults.value };
        delete local[id];
        unsavedSendResults.value = local;
      }
      observeReplySends();
      await changed();
      if (!acknowledged)
        state.value = {
          ...state.value,
          message:
            "This status observation is retained in this tab but could not be durably acknowledged. Check the original status again before retrying.",
        };
    } finally {
      replyAction.value = null;
    }
  }
  function updateOwnedReplyAttempt(thread: string, attempt: ThreadAttempt) {
    const current = state.value.context;
    if (
      current &&
      isOrdinaryReply(current) &&
      current.replyTarget!.threadId === thread
    ) {
      state.value = {
        ...state.value,
        context: {
          ...current,
          attempts: [
            ...(current.attempts ?? []).filter(
              (item) => item.id !== attempt.id,
            ),
            attempt,
          ],
        },
      };
    } else {
      const retained = retainedReplies.value[thread];
      if (retained)
        retainedReplies.value = {
          ...retainedReplies.value,
          [thread]: {
            ...retained,
            attempts: [
              ...(retained.attempts ?? []).filter(
                (item) => item.id !== attempt.id,
              ),
              attempt,
            ],
          },
        };
    }
  }
  async function checkResult(id: string, url?: string) {
    const owned = Object.entries(registeredSends.value).find(([, sends]) =>
      sends.some((send) => send.attempt.id === id),
    );
    if (owned) return checkReplyStatus(owned[0], id, url);
    if (replyBlocked.value) return;
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
    if (
      !context ||
      context.action === "private-message" ||
      state.value.findingMention
    )
      return;
    const operation = captureOperation(context);
    if (!operation) return;
    const request = ++mentionSequence;
    state.value = {
      ...state.value,
      findingMention: true,
      mentionPeople: [],
      message: "",
    };
    const found = await client.findMention(
      submission(operation.writing).writing,
      query,
    );
    if (request !== mentionSequence || state.value.context?.id !== context.id)
      return;
    accountObserved(found.account);
    observe(found.account, found.kind === "people");
    state.value = {
      ...state.value,
      findingMention: false,
      mentionPeople:
        found.kind === "people" && operation.current() ? [...found.people] : [],
      mentionGeneration: found.generation,
      message: found.kind === "people" ? "" : found.message,
    };
  }
  function insertMention(id: string) {
    if (replyBlocked.value) return;
    const context = state.value.context,
      person = state.value.mentionPeople.find((p) => p.id === id);
    if (
      !context ||
      !person ||
      state.value.composing ||
      client.generation !== state.value.mentionGeneration ||
      client.account.kind !== "member" ||
      client.account.id !== captureOperation(context)?.writing.account.id
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
  let observedAccountVerified = false;
  let observedGeneration = -1;
  function observe(account: Account, verified = true) {
    const changedEvidence =
      !verified ||
      !observedAccountVerified ||
      observedGeneration !== client.generation ||
      canonical(state.value.accountObservation) !== canonical(account);
    observedAccountVerified = verified;
    observedGeneration = client.generation;
    if (changedEvidence) {
      ++mentionSequence;
      state.value = {
        ...state.value,
        mentionPeople: [],
        mentionGeneration: -1,
        findingMention: false,
      };
    }
    const privateReview = state.value.privateReview;
    if (
      privateReview &&
      !state.value.privateReviewConsumed &&
      (!verified ||
        account.kind !== "member" ||
        account.id !== privateReview.submission.writing.account.id ||
        client.generation !== privateReview.generation)
    )
      state.value = { ...state.value, privateReview: null };
    const publication = state.value.publication;
    state.value = {
      ...state.value,
      publication:
        publication &&
        verified &&
        account.kind === "member" &&
        account.id === publication.submission.writing.account.id &&
        client.generation === publication.generation
          ? publication
          : null,
    };
    state.value = {
      ...state.value,
      accountObservation: account,
      accountVerified:
        verified &&
        account.kind === "member" &&
        (state.value.context && isOrdinaryReply(state.value.context)
          ? client.account.kind === "member" && client.account.id === account.id
          : account.id === state.value.context?.account.id),
    };
    if (
      state.value.copy &&
      (account.kind !== "member" ||
        account.id !== state.value.copy.prepared.account.id ||
        client.generation !== state.value.copy.generation)
    )
      state.value = { ...state.value, copy: null };
    void revalidateAttachments();
  }
  async function check(copyText = false) {
    if (replyBlocked.value) return;
    if (state.value.context && isOrdinaryReply(state.value.context))
      copyText = false;
    if (state.value.context?.action === "private-message")
      return reviewPrivate();
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
    if (isOrdinaryReply(original))
      replyFormFailure.value = result.kind === "prepared" ? null : original.id;
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
    await revalidateAttachments(true);
  }
  function confirmCopy() {
    if (replyBlocked.value) return;
    if (deferViewChange(confirmCopy)) return;
    const candidate = state.value.copy,
      original = state.value.context;
    if (
      !candidate ||
      !original ||
      original.action === "private-message" ||
      Boolean(isOrdinaryReply(original)) ||
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
      validationIssues: [],
      context: {
        ...candidate.prepared,
        title: original.title,
        source: original.source,
        ...(original.editorUnresolved ? { editorUnresolved: true } : {}),
        uploadedReferences: [],
        id: crypto.randomUUID(),
        revision: 1,
        selection: { ...original.selection },
        ...(original.privateAttempts?.length
          ? { privateAttempts: original.privateAttempts }
          : {}),
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
  function recoverContext(
    context: WritingContext | null,
  ): WritingContext | null {
    if (context?.privateAttempts)
      context = {
        ...context,
        privateAttempts: context.privateAttempts.map((a) =>
          a.status === "pending"
            ? {
                ...a,
                status: "uncertain",
                checked: false,
                message:
                  "Pending private message restored as uncertain. Nothing was replayed; check the original attempt.",
              }
            : a,
        ),
      };
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
    return context;
  }
  return {
    observeReplySends,
    replyAttempts,
    contextAttemptHistory,
    registeredSends: readonly(registeredSends),
    replyBlocked,
    replyFormCheckNeeded,
    replyPublicationBlocked,
    replySendBlocked,
    editorGeneration,
    replySlot: (threadId: string) => {
      const active = state.value.context;
      return active &&
        isOrdinaryReply(active) &&
        active.replyTarget!.threadId === threadId
        ? active
        : (retainedReplies.value[threadId] ?? null);
    },
    canChooseReply: (threadId: string) => {
      const active = state.value.context;
      return (
        !active ||
        !isOrdinaryReply(active) ||
        active.replyTarget!.threadId !== threadId ||
        (canDeactivate() && !state.value.composing)
      );
    },
    applyReplyUpdates: (updates: ReplyUpdate[], handoff = false) => {
      const accepted: ReplyUpdate[] = [];
      for (const update of updates) {
        const active = state.value.context;
        const isActive =
          !!active &&
          isOrdinaryReply(active) &&
          active.replyTarget!.threadId === update.threadId;
        const current = isActive
          ? active
          : (retainedReplies.value[update.threadId] ?? null);
        if (
          canonical(current) !== canonical(update.before) ||
          (isActive && (!canDeactivate() || state.value.composing))
        )
          continue;
        // A live observation is not a restarted operation. Preserve the owner's
        // exact pending/history state; only document recovery normalizes it.
        const next = handoff
          ? (recoverContext(update.context) as PublicWritingContext | null)
          : update.context;
        if (isActive) {
          const pendingReplyMode =
            !handoff && registeredSends.value[update.threadId]?.length
              ? editorSession?.state.mode
              : undefined;
          ++sequence;
          replyFormFailure.value = null;
          editorGeneration.value++;
          editorSession?.dispose();
          editorSession = null;
          editorContext = "";
          for (const upload of current?.uploads ?? [])
            uploadBytes.delete(upload.key);
          state.value = {
            ...state.value,
            context: next,
            message: "",
            mentionPeople: [],
            mentionGeneration: -1,
            visible: next !== null,
            preparing: false,
            publication: null,
            copy: null,
            acknowledged: 0,
            accountVerified: false,
          };
          observe(state.value.accountObservation, observedAccountVerified);
          if (pendingReplyMode && next) editor().setMode(pendingReplyMode);
        } else {
          const retained = { ...retainedReplies.value };
          if (next) retained[update.threadId] = next;
          else delete retained[update.threadId];
          retainedReplies.value = retained;
        }
        accepted.push(update);
      }
      return accepted;
    },
    pauseConflictedReplies: (threads: string[], unsettled: string[] = []) => {
      const publicationWasBlocked = replyPublicationBlocked.value;
      retainedUnsettledReplies.value = unsettled;
      if (replyPublicationBlocked.value && !publicationWasBlocked) {
        ++sequence;
        state.value = { ...state.value, preparing: false, publication: null };
      }
      const wasBlocked = replyBlocked.value;
      conflictedReplies.value = threads;
      if (replyBlocked.value && !wasBlocked) {
        ++sequence;
        ++mentionSequence;
        state.value = {
          ...state.value,
          preparing: false,
          publication: null,
          copy: null,
          fundedDraftReview: null,
          message: "",
        };
      }
    },
    canSelectThread,
    selectThread,
    localReplyThreads,
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
      ++sequence;
      state.value = { ...state.value, editReplacement: null, preparing: false };
    },
    replaceWithEdit: () => {
      const target = state.value.editReplacement;
      if (target) void prepareEdit(target.threadURL, target.postId, true);
    },
    preparePrivate,
    sendPrivate,
    checkPrivate,
    cancelPrivateReplacement: () => {
      ++sequence;
      state.value = {
        ...state.value,
        privateReplacement: null,
        preparing: false,
      };
    },
    replaceWithPrivate: () => {
      const target = state.value.privateReplacement;
      if (target) void preparePrivate(target.url, target.account, true);
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
    sendReply,
    cancelPublicationReview: () => {
      if (state.value.publishing || state.value.composing) return;
      state.value = { ...state.value, publication: null, privateReview: null };
    },
    resumeDraft,
    checkDraft,
    canResendDraft,
    warnDraftResend,
    confirmDraftResend,
    cancelDraftResend: () => {
      state.value = { ...state.value, draftResend: null };
    },
    saveDraft,
    confirmFundedDraft,
    cancelFundedDraft: () => {
      state.value = { ...state.value, fundedDraftReview: null };
    },
    publishDraft,
    publishReviewedDraft,
    publish,
    checkResult,
    retryReply,
    editableReply,
    editFailedReply,
    retryableReply,
    replyAction: readonly(replyAction),
    checkableReplyAttachment,
    checkReplyAttachment,
    replyAttachmentResults: readonly(replyAttachmentResults),
    checkReplyStatus,
    replyRisk: readonly(replyRisk),
    warnReplyRisk: (thread: string, id: string) => {
      if (!retryableReply(thread, id, true)) return;
      const send = registeredSends.value[thread]!.find(
        (item) => item.attempt.id === id,
      )!;
      replyRisk.value = { thread, send: JSON.parse(JSON.stringify(send)) };
    },
    cancelReplyRisk: () => {
      replyRisk.value = null;
    },
    confirmReplyRisk: () => {
      const risk = replyRisk.value;
      replyRisk.value = null;
      if (risk) void retryReply(risk.thread, risk.send.attempt.id, risk.send);
    },
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
      if (id) {
        if (state.value.context && isOrdinaryReply(state.value.context))
          void sendReply(id);
        else void reviewPublication(id);
      }
    },
    cancelResend: () => {
      state.value = { ...state.value, resend: null };
    },
    confirmCopy,
    cancelCopy: () => {
      state.value = { ...state.value, copy: null };
    },
    snapshot: () => state.value.context,
    retainedSnapshot: () => Object.values(retainedReplies.value),
    restore: (
      context: WritingContext | null,
      retained: PublicWritingContext[] = [],
    ) => {
      state.value = {
        ...state.value,
        privateReview: null,
        privateReviewConsumed: false,
        privateReplacement: null,
      };
      replyFormFailure.value = null;
      uploadBytes.clear();
      const all = [context, ...retained];
      const pending = all.some(
        (item) =>
          item?.attempts?.some((attempt) => attempt.status === "pending") ||
          item?.draftAttempts?.some(
            (attempt) => attempt.status === "pending",
          ) ||
          item?.privateAttempts?.some(
            (attempt) => attempt.status === "pending",
          ),
      );
      context = recoverContext(context);
      retainedReplies.value = Object.fromEntries(
        retained.map((item) => {
          const recovered = recoverContext(item);
          if (!recovered || !isOrdinaryReply(recovered))
            throw new Error("Invalid retained reply.");
          return [recovered.replyTarget!.threadId, recovered];
        }),
      );
      selectedReplyThread = context?.replyTarget?.threadId ?? null;
      state.value = {
        ...state.value,
        context,
        validationIssues: [],
        accountObservation: { kind: "unknown" },
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
      return pending;
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
      const c = captureOperation()?.writing,
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
      const operation = captureOperation();
      const result = await client.downloadAttachment({
        threadURL: u.storedPost.threadURL,
        postId: u.storedPost.postId,
        attachmentId: u.serverId,
        account: c.account,
      });
      accountObserved(client.account);
      observe(client.account);
      if (!operation?.current()) return;
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
      if (!operation?.current()) return;
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
      if (replyBlocked.value) return;
      const c = captureOperation()?.writing,
        u = c?.uploads?.find((v) => v.key === key);
      if (
        !c ||
        !u?.serverId ||
        state.value.publishing ||
        !state.value.accountVerified ||
        (isOrdinaryReply(c) &&
          (u.ownerId !== c.account.id ||
            (!checkOnly && attachmentUnavailable(key)))) ||
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
      if (!acknowledged || replyBlocked.value) {
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
        effectGuard(),
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
      if (replyBlocked.value) return;
      const c = state.value.context,
        u = c?.uploads?.find((v) => v.key === key);
      if (
        !c ||
        c.action === "private-message" ||
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
      return context && context.action !== "private-message"
        ? unresolvedWritingAttachments(context)
        : [];
    }),
    state: readonly(state),
    currentActor,
    attachmentUnavailable,
    beginAttachmentReattachment,
    removeUnavailableAttachment,
    attachmentBusy: computed(
      () =>
        state.value.context?.uploads?.some((u) =>
          ["uploading", "removing"].includes(u.status),
        ) ?? false,
    ),
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
          editReplacement: null,
          draftReplacement: null,
          preparing: false,
        };
      };
      if (!deferViewChange(show)) show();
    },
    hide: () => {
      const hide = () => {
        ++sequence;
        state.value = { ...state.value, visible: false, preparing: false };
      };
      if (!deferViewChange(hide)) hide();
    },
    discardAndPrepare: () => {
      const draft = state.value.draftReplacement;
      if (draft) void resumeDraft(draft.row, draft.account, true);
      else {
        const replacement = state.value.replacement;
        if (replacement)
          void prepare(
            replacement.boardId,
            true,
            replacement.replyTarget,
            replacement.redPacket,
          );
      }
    },
  };
}

export function isOrdinaryReply(
  context: WritingContext,
): context is PublicWritingContext {
  return (
    ["reply", "quick-quote"].includes(context.action) &&
    !!context.replyTarget &&
    !context.draft &&
    !context.editTarget &&
    !context.redPacket
  );
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
// Read snapshots preserve native edit-form controls as evidence only. This
// allowance is never used for active writing or an immutable command submission.
function validReadSnapshotFields(value: Record<string, unknown>): boolean {
  if (
    !["reply", "quick-quote"].includes(String(value.action)) ||
    value.draft !== undefined ||
    value.editTarget !== undefined ||
    !Array.isArray(value.uploadedReferences) ||
    !value.uploadedReferences.every(
      (id) => string(id) && /^[1-9]\d*$/.test(id),
    ) ||
    new Set(value.uploadedReferences).size !==
      value.uploadedReferences.length ||
    !validAttachmentFields(value.attachmentFields, true)
  )
    return false;
  const fields = value.attachmentFields;
  if (fields === undefined) return true;
  if (!Array.isArray(fields)) return false;
  const names = new Set<string>();
  return fields.every((field) => {
    if (!object(field) || !string(field.name) || names.has(field.name))
      return false;
    names.add(field.name);
    const match = /^(?:attachnew|attachupdate)\[([1-9]\d*)\]/.exec(field.name);
    return (
      !!match &&
      value.uploadedReferences instanceof Array &&
      value.uploadedReferences.includes(match[1]) &&
      (!field.name.startsWith("attachupdate[") ||
        (field.value === "" &&
          fields.some(
            (other) =>
              object(other) &&
              string(other.name) &&
              other.name.startsWith(`attachnew[${match[1]}][`),
          )))
    );
  });
}
export function isWritingContext(value: unknown): value is WritingContext {
  if (
    object(value) &&
    value.privateAttempts !== undefined &&
    (!Array.isArray(value.privateAttempts) ||
      !value.privateAttempts.every(isPrivateAttempt))
  )
    return false;
  if (object(value) && value.action === "private-message") {
    const allowed = [
      "action",
      "account",
      "recipient",
      "source",
      "maxLength",
      "id",
      "revision",
      "selection",
      "attempts",
      "draftAttempts",
      "privateAttempts",
    ];
    if (
      Object.keys(value).some((k) => !allowed.includes(k)) ||
      !string(value.id) ||
      !integer(value.revision) ||
      value.revision < 1 ||
      !string(value.source) ||
      !object(value.account) ||
      value.account.kind !== "member" ||
      !string(value.account.id) ||
      !/^[1-9]\d*$/.test(value.account.id) ||
      !string(value.account.name) ||
      Object.keys(value.account).some(
        (k) => !["kind", "id", "name"].includes(k),
      ) ||
      !object(value.recipient) ||
      !string(value.recipient.id) ||
      !/^[1-9]\d*$/.test(value.recipient.id) ||
      value.recipient.id === value.account.id ||
      !string(value.recipient.name) ||
      !string(value.recipient.url) ||
      Object.keys(value.recipient).some(
        (k) => !["id", "name", "url"].includes(k),
      ) ||
      !(
        value.maxLength === null ||
        (integer(value.maxLength) && value.maxLength > 0)
      ) ||
      !object(value.selection) ||
      !integer(value.selection.start) ||
      !integer(value.selection.end) ||
      value.selection.start < 0 ||
      value.selection.end < value.selection.start ||
      value.selection.end > value.source.length ||
      !["forward", "backward", "none"].includes(
        String(value.selection.direction),
      ) ||
      Object.keys(value.selection).some(
        (k) => !["start", "end", "direction"].includes(k),
      )
    )
      return false;
    try {
      const url = new URL(value.recipient.url);
      if (
        url.origin !== "https://www.tsdm39.com" ||
        url.pathname !== "/home.php" ||
        url.searchParams.get("mod") !== "space" ||
        url.searchParams.get("do") !== "pm" ||
        url.searchParams.get("subop") !== "view" ||
        url.searchParams.get("touid") !== value.recipient.id ||
        [...url.searchParams.keys()].some(
          (k) =>
            !["mod", "do", "subop", "touid", "page", "daterange"].includes(k),
        )
      )
        return false;
    } catch {
      return false;
    }
    return validHistoricalAttempts(value);
  }
  return validateWritingContext(value);
}
function validateWritingContext(
  value: unknown,
  readSnapshot = false,
): value is WritingContext {
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
    (value.redPacket !== undefined &&
      (!object(value.redPacket) ||
        !Array.isArray(value.redPacket.hints) ||
        !value.redPacket.hints.every(string) ||
        value.action !== "new-thread")) ||
    (value.existingRedPacket !== undefined &&
      (value.existingRedPacket !== true ||
        (value.action !== "edit-post" && !value.draft))) ||
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
          (u.ownerId === undefined ||
            u.ownerId === null ||
            (string(u.ownerId) && /^[1-9]\d*$/.test(u.ownerId))) &&
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
    !(readSnapshot
      ? validReadSnapshotFields(value)
      : validAttachmentFields(
          value.attachmentFields,
          value.action === "edit-post" || value.draft !== undefined,
        ))
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
        existingRedPacket: undefined,
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
    [o.minimum, o.maximum, o.step].every(
      (v) => v === undefined || (string(v) && /^\d+$/.test(v)),
    ) &&
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
  if (
    value.draftSaveAvailable !== undefined &&
    typeof value.draftSaveAvailable !== "boolean"
  )
    return false;
  if (value.draft !== undefined && !isDraftIdentity(value.draft)) return false;
  if (!validHistoricalAttempts(value)) return false;
  return (
    (value.category === null || option(value.category)) &&
    Array.isArray(value.options) &&
    value.options.every(option) &&
    (value.unappliedPacketOptions === undefined ||
      (Array.isArray(value.unappliedPacketOptions) &&
        value.unappliedPacketOptions.every(
          (o) => option(o) && o.name.startsWith("hb_"),
        ))) &&
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

function validHistoricalAttempts(value: Record<string, unknown>): boolean {
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
          !validPacketObservation(attempt.redPacket) ||
          (attempt.fundingReviewed !== undefined &&
            attempt.fundingReviewed !== true) ||
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
            (attempt.observation.packetMarker !== undefined &&
              attempt.observation.packetMarker !== true) ||
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
        return validateWritingContext({
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
    value.attempts === undefined ||
    (Array.isArray(value.attempts) && value.attempts.every(isAttempt))
  );
}

function validPacketObservation(value: unknown): boolean {
  return !(
    value !== undefined &&
    (!object(value) ||
      ![
        "open",
        "claimed",
        "done",
        "withdrawn",
        "expired",
        "closed",
        "unknown",
        "absent",
      ].includes(String(value.state)) ||
      !Array.isArray(value.conditions) ||
      !value.conditions.every(string) ||
      value.credit !== "unknown" ||
      (value.ledger !== undefined &&
        (!object(value.ledger) ||
          !["observed", "unavailable"].includes(String(value.ledger.state)) ||
          !Array.isArray(value.ledger.rows) ||
          !value.ledger.rows.every(
            (row) =>
              object(row) &&
              ["HBS", "HBR", "HBG"].includes(String(row.operation)) &&
              string(row.change) &&
              string(row.details) &&
              string(row.time),
          ))))
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
    !validPacketObservation(value.redPacket) ||
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
  if (
    !isWritingContext(submittedWriting) ||
    submittedWriting.action === "private-message"
  )
    return false;
  const snapshot = (candidate: unknown) =>
    object(candidate) &&
    candidate.action === submittedWriting.action &&
    validateWritingContext(
      {
        ...candidate,
        id: "observed",
        revision: 1,
        selection: { start: 0, end: 0, direction: "none" },
        attempts: undefined,
      },
      true,
    ) &&
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
