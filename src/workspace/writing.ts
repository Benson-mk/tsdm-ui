import { computed, readonly, shallowRef } from "vue";
import { isThreadVerification } from "../forum-client/thread-verification";
import {
  unresolvedWritingAttachments,
  type Account,
  type ForumClient,
  type PreparedWriting,
  type ThreadAttempt,
  type ThreadPublication,
} from "../forum-client";
export interface WritingContext extends PreparedWriting {
  id: string;
  revision: number;
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
) {
  const state = shallowRef<{
    context: WritingContext | null;
    visible: boolean;
    preparing: boolean;
    message: string;
    replacement: string | null;
    acknowledged: number;
    recoveryAvailable: boolean | null;
    accountVerified: boolean;
    composing: boolean;
    compositionDeferred: boolean;
    publication: ThreadPublication | null;
    publishing: boolean;
    resend: string | null;
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
    acknowledged: 0,
    recoveryAvailable: null,
    accountVerified: false,
    copy: null,
    composing: false,
    compositionDeferred: false,
    publication: null,
    publishing: false,
    resend: null,
  });
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
  async function prepare(boardId: string, replace = false) {
    if (
      deferViewChange(() => {
        void prepare(boardId, replace);
      })
    )
      return;
    const existing = state.value.context;
    if (state.value.publishing && (replace || existing?.board.id !== boardId)) {
      state.value = {
        ...state.value,
        message:
          "Publication or result checking is pending. Keep this context until it settles.",
      };
      return;
    }
    if (existing && !replace) {
      if (existing.board.id === boardId) {
        state.value = { ...state.value, visible: true, replacement: null };
        return;
      }
      state.value = { ...state.value, replacement: boardId };
      return;
    }
    const current = ++sequence;
    state.value = { ...state.value, preparing: true, message: "" };
    const result = await client.prepareNewThread(boardId);
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
      },
      preparing: false,
      visible: true,
      replacement: null,
      message: "",
      acknowledged: 0,
      accountVerified: true,
      copy: null,
    };
    changed();
  }
  function edit(
    patch: Partial<
      Pick<
        WritingContext,
        "title" | "source" | "category" | "options" | "selection"
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
      ...content
    } = context;
    void [_selection, _attempts];
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
        attempts: [
          ...(context.attempts ?? []).filter((item) => item.id !== attempt.id),
          attempt,
        ],
      },
    };
  }
  async function reviewPublication(resendId?: string) {
    const context = state.value.context;
    if (
      !context ||
      state.value.preparing ||
      state.value.publishing ||
      state.value.composing
    )
      return;
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
    const result = await client.prepareThreadPublication(submission(context));
    accountObserved(result.account);
    observe(result.account, result.kind === "ready");
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
    else result = await client.publishThread(attempt);
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
    const result = await client.checkThreadResult(attempt, url);
    accountObserved(client.account);
    observe(client.account);
    updateAttempt(result);
    state.value = { ...state.value, publishing: false };
    await changed();
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
    const result = await client.prepareNewThread(original.board.id);
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
        uploadedReferences: [],
        id: crypto.randomUUID(),
        revision: 1,
        selection: { ...original.selection },
        ...(original.attempts?.length ? { attempts: original.attempts } : {}),
      },
      copy: null,
      acknowledged: 0,
      accountVerified: true,
    };
    changed();
  }
  return {
    deferViewChange,
    startComposition: () => {
      state.value = { ...state.value, composing: true };
    },
    endComposition,
    observe,
    check,
    reviewPublication,
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
        recoveryAvailable: true,
        accountVerified: false,
        copy: null,
        publication: null,
        publishing: false,
        resend: null,
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
    unresolvedAttachments: computed(() => {
      const context = state.value.context;
      return context ? unresolvedWritingAttachments(context) : [];
    }),
    state: readonly(state),
    prepare,
    edit,
    show: () => {
      const show = () => {
        ++sequence;
        state.value = {
          ...state.value,
          visible: true,
          replacement: null,
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
      const boardId = state.value.replacement;
      if (boardId) void prepare(boardId, true);
    },
  };
}

const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const string = (value: unknown): value is string => typeof value === "string";
const integer = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
export function isWritingContext(value: unknown): value is WritingContext {
  if (
    !object(value) ||
    !string(value.id) ||
    !integer(value.revision) ||
    value.revision < 1 ||
    value.action !== "new-thread" ||
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
    !string(value.title) ||
    !string(value.source)
  )
    return false;
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
