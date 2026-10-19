import { computed, readonly, shallowRef } from "vue";
import {
  unresolvedWritingAttachments,
  type Account,
  type ForumClient,
  type PreparedWriting,
} from "../forum-client";
export interface WritingContext extends PreparedWriting {
  id: string;
  revision: number;
  selection: {
    start: number;
    end: number;
    direction: "forward" | "backward" | "none";
  };
}
export function createWriting(
  client: ForumClient,
  changed: () => void,
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
      };
      changed();
    }
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
    if (!original) return;
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
    if (!candidate || !original || candidate.originalId !== original.id) return;
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
    confirmCopy,
    cancelCopy: () => {
      state.value = { ...state.value, copy: null };
    },
    snapshot: () => state.value.context,
    restore: (context: WritingContext | null) => {
      state.value = {
        ...state.value,
        context,
        visible: context !== null,
        acknowledged: context?.revision ?? 0,
        recoveryAvailable: true,
        accountVerified: false,
        copy: null,
      };
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
  return (
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
