import { createBoardChecks } from "./board-checks";
import { createPrivateHistory, privateContext } from "./private-history";
import { createThreadHistory, threadContext } from "./thread-history";
import type { DownloadHost, PreparedFile } from "../hosts/download";
import { createWriting } from "./writing";
import { shallowRef, readonly, nextTick, watch } from "vue";
import { createPreferences, type PreferenceHost } from "./preferences";
import {
  describeDestination,
  type Account,
  type ForumClient,
  type ReadResult,
  type DraftListResult,
} from "../forum-client";
import type {
  NavigationEntry,
  NavigationHost,
  NavigationRecord,
  ViewAdapter,
  Section,
} from "./navigation";
export interface WorkspaceState {
  section: Section;
  loading: boolean;
  result: ReadResult | null;
  reading: Extract<ReadResult, { kind: "thread" }> | null;
  privateReading: Extract<ReadResult, { kind: "private-conversation" }> | null;
  failure: ReadResult | null;
  destination: string;
  key: string;
  selection: string | null;
  stale: boolean;
  missing: boolean;
  restored: boolean;
  recoveryAvailable: boolean | null;
  canBack: boolean;
  origin: ReadResult | null;
  documentNavigation: string | null;
  recoveryProblem: {
    kind: "incompatible" | "refused";
    raw: string | null;
  } | null;
}
const routeFor = (value: string) => {
  const route = describeDestination(value);
  return route ? { ...route, url: new URL(route.url) } : null;
};
const accountKey = (account: Account) =>
  account.kind === "member"
    ? `member:${account.id}`
    : account.kind === "guest"
      ? "guest"
      : null;
const success = (result: ReadResult) =>
  [
    "thread",
    "board",
    "directory",
    "search",
    "notices",
    "messages",
    "private-conversation",
    "favorites",
  ].includes(result.kind);
export function createWorkspace(
  client: ForumClient,
  destination: string,
  host: NavigationHost,
  preferenceHost: PreferenceHost,
  downloads?: DownloadHost,
) {
  const preferences = createPreferences(preferenceHost);
  // Latest accepted account observation, distinct from retained public results.
  // Null means no fresh observation yet (e.g. restored page-session state).
  const accountObservation = shallowRef<string | null>(null);
  const drafts = shallowRef<{
    loading: boolean;
    result: DraftListResult | null;
  }>({ loading: false, result: null });
  let draftSequence = 0;
  async function loadDrafts(url?: string) {
    if (drafts.value.loading) return;
    const prior = drafts.value.result;
    let entry: NavigationEntry | undefined;
    if (state.value.section === "drafts") {
      capture();
      entry = newEntry(
        `${new URL(destination).origin}/forum.php`,
        state.value.key || null,
      );
      entry.section = "drafts";
      host.push(entry.key);
      show(entry);
    }
    const current = ++draftSequence;
    drafts.value = { ...drafts.value, loading: true };
    const result = await client.readDrafts(
      url,
      url && prior?.kind === "drafts" ? prior.drafts : undefined,
      url ? prior?.account : undefined,
    );
    observeAccount(result.account);
    writing.observe(result.account);
    if (current === draftSequence) {
      drafts.value = { loading: false, result };
      if (entry && result.kind === "drafts") {
        entry.drafts = result;
        entry.account = accountKey(result.account);
      }
      void persist();
    }
  }

  const writing = createWriting(
    client,
    () => {
      record.writing = writing.snapshot();
      return persist();
    },
    (account) => {
      if (observeAccount(account)) void persist();
    },
    async (url, contextId) => {
      await loadDrafts();
      await openThread(url, null, contextId);
    },
  );
  const state = shallowRef<WorkspaceState>({
    section: "boards",
    loading: false,
    result: null,
    reading: null,
    privateReading: null,
    failure: null,
    destination,
    key: "",
    selection: null,
    stale: false,
    missing: false,
    restored: false,
    recoveryAvailable: null,
    canBack: false,
    origin: null,
    documentNavigation: null,
    recoveryProblem: null,
  });
  const download = shallowRef<{
    status: "checking" | "ready" | "requested" | "failure";
    name: string;
    message: string;
    postId: string;
    attachmentId: string;
  } | null>(null);
  let prepared: PreparedFile | null = null;
  let downloadSequence = 0;
  function clearDownload() {
    downloadSequence++;
    client.cancelDownload();
    prepared?.dispose();
    prepared = null;
    download.value = null;
  }
  watch(
    () => writing.state.value.visible,
    (visible) => {
      if (visible) clearDownload();
    },
    { flush: "sync" },
  );
  async function prepareDownload(postId: string, attachmentId: string) {
    if (download.value?.status === "checking") return;
    const result = threadHistory.state.value.result ?? state.value.reading;
    if (result?.kind !== "thread") return;
    const attachment = result.thread.posts
      .find((post) => post.id === postId)
      ?.attachments?.find((item) => item.id === attachmentId);
    if (!attachment) return;
    clearDownload();
    const ticket = downloadSequence;
    const identity = { postId, attachmentId };
    download.value = {
      ...identity,
      status: "checking",
      name: attachment.name,
      message: "Checking current attachment access and receiving file…",
    };
    const accountGeneration = client.generation;
    const received = await client.downloadAttachment({
      threadURL: threadHistory.sourceFor(postId) ?? result.thread.url,
      postId,
      attachmentId,
      account: result.account,
    });
    if (client.generation !== accountGeneration) {
      observeAccount(client.account);
      writing.observe(client.account);
      void persist();
    }
    if (ticket !== downloadSequence) return;
    if (received.kind !== "file") {
      download.value = {
        ...identity,
        status: "failure",
        name: attachment.name,
        message: received.message,
      };
      return;
    }
    try {
      if (!downloads) throw new Error("No download host");
      prepared = downloads.prepare(
        received.bytes,
        received.name,
        received.contentType,
      );
      download.value = {
        ...identity,
        status: "ready",
        name: received.name,
        message: "File ready to save",
      };
    } catch {
      download.value = {
        ...identity,
        status: "failure",
        name: attachment.name,
        message: "Browser file preparation failed. No save was requested.",
      };
    }
  }
  function saveDownload() {
    if (!prepared || !download.value) return;
    try {
      prepared.save();
      download.value = {
        ...download.value,
        status: "requested",
        message:
          "Browser save requested. Check your browser Downloads for completion; this workspace cannot confirm whether the file was saved or cancelled.",
      };
    } catch {
      download.value = {
        ...download.value,
        status: "failure",
        message: "Browser save could not start. File delivery is unconfirmed.",
      };
    }
  }
  let sequence = 0;
  let record: NavigationRecord = {
    schema: 2,
    entries: {},
    pending: null,
    writing: null,
  };
  const favorite = shallowRef<{
    busy: boolean;
    prepared: import("../forum-client").FavoriteCommand | null;
    attempts: import("../forum-client").FavoriteAttempt[];
    message: string;
  }>({ busy: false, prepared: null, attempts: [], message: "" });
  async function prepareFavorite(
    action: "add" | "remove",
    kind: import("../forum-client").FavoriteKind,
    targetId: string,
    recordId: string | null = null,
    previousAttemptId?: string,
  ) {
    if (favorite.value.busy) return;
    const unresolved = favorite.value.attempts.find(
      (item) =>
        item.status === "uncertain" &&
        item.command.intent.kind === kind &&
        item.command.intent.targetId === targetId,
    );
    if (
      unresolved &&
      (!previousAttemptId ||
        !favorite.value.attempts.some(
          (item) =>
            item.id === previousAttemptId &&
            item.checked &&
            item.status === "uncertain",
        ))
    ) {
      favorite.value = {
        ...favorite.value,
        message:
          "Check the original uncertain favorite result before considering a warned new attempt.",
      };
      return;
    }
    favorite.value = {
      ...favorite.value,
      busy: true,
      prepared: null,
      message: "Preparing current favorite action…",
    };
    const account = client.account;
    if (account.kind !== "member") {
      favorite.value = {
        ...favorite.value,
        busy: false,
        message: "A current member account is required.",
      };
      return;
    }
    const result = await client.prepareFavorite(
      { action, kind, targetId, recordId, accountId: account.id },
      previousAttemptId,
    );
    observeAccount(client.account);
    writing.observe(client.account);
    favorite.value = {
      ...favorite.value,
      busy: false,
      prepared: result.kind === "ready" ? result.command : null,
      message:
        result.kind === "ready"
          ? `${previousAttemptId ? "A new attempt may repeat favorite effects. The original outcome stays uncertain. " : ""}Review ${action} ${kind === "forum" ? "board" : "thread"} ${targetId}, account ${account.id}${recordId ? `, favorite record ${recordId}` : ""}. This changes your favorite record.`
          : result.message,
    };
  }
  async function sendFavorite() {
    const command = favorite.value.prepared;
    if (!command || favorite.value.busy) return;
    const attempt: import("../forum-client").FavoriteAttempt = {
      id: crypto.randomUUID(),
      command,
      status: "pending",
      checked: false,
      message: "Favorite action pending…",
      pages: null,
    };
    favorite.value = {
      ...favorite.value,
      busy: true,
      prepared: null,
      attempts: [...favorite.value.attempts, attempt],
      message: attempt.message,
    };
    if (!(await persist())) {
      finishFavorite({
        ...attempt,
        status: "not-sent",
        message:
          "The pending favorite attempt could not be saved for recovery. Nothing was sent.",
      });
      return;
    }
    const result = await client.changeFavorite(attempt);
    finishFavorite(result);
  }
  function finishFavorite(attempt: import("../forum-client").FavoriteAttempt) {
    observeAccount(client.account);
    writing.observe(client.account);
    favorite.value = {
      ...favorite.value,
      busy: false,
      attempts: favorite.value.attempts.map((old) =>
        old.id === attempt.id ? attempt : old,
      ),
      message: attempt.message,
    };
    if (attempt.status === "confirmed" && attempt.pages) {
      for (const entry of Object.values(record.entries))
        if (
          entry.result?.kind === "favorites" &&
          entry.result.favorites.kind === attempt.command.intent.kind &&
          entry.account === `member:${attempt.command.intent.accountId}`
        ) {
          const prior = entry.result.favorites;
          const current =
            attempt.pages.find(
              (p) => p.pages.current === prior.pages.current,
            ) ?? attempt.pages[0];
          if (current) entry.result = { ...entry.result, favorites: current };
        }
      const entry = entryFor(state.value.key);
      if (entry?.result?.kind === "favorites")
        state.value = { ...state.value, result: entry.result, stale: false };
    }
    void persist();
  }
  async function checkFavorite(id: string) {
    const attempt = favorite.value.attempts.find((item) => item.id === id);
    if (!attempt || favorite.value.busy) return;
    favorite.value = {
      ...favorite.value,
      busy: true,
      message: "Checking favorite result…",
    };
    finishFavorite(await client.checkFavoriteResult(attempt));
  }
  let saveSequence = 0;
  const entryFor = (key: string) =>
    Object.hasOwn(record.entries, key) ? record.entries[key] : undefined;
  let view: ViewAdapter | null = null;
  let knownAccount: string | null = null;
  function visibleBoard() {
    if (!["boards", "saved"].includes(state.value.section)) return null;
    const result =
      state.value.result?.kind === "board"
        ? state.value.result
        : state.value.result?.kind !== "directory" &&
            state.value.origin?.kind === "board"
          ? state.value.origin
          : null;
    return result;
  }
  const automaticChecks = shallowRef(false);
  const boardChecks = createBoardChecks(client, {
    busy: () =>
      state.value.loading ||
      writing.state.value.composing ||
      writing.state.value.preparing ||
      writing.state.value.publishing ||
      writing.state.value.findingMention ||
      drafts.value.loading ||
      favorite.value.busy ||
      download.value?.status === "checking",
    owned: () =>
      threadHistory.busy() ||
      privateHistory.state.value.checking ||
      threadHistory.state.value.earlier.status === "loading" ||
      threadHistory.state.value.later.status === "loading",
    observe: (account) => {
      observeAccount(account);
      writing.observe(account);
    },
    reveal: (result, apply) => {
      const prior = visibleBoard();
      const show = () => {
        if (!prior || visibleBoard() !== prior) return;
        const readingPosition = view?.captureReading();
        apply();
        for (const entry of Object.values(record.entries)) {
          if (entry.result === prior) {
            entry.result = result;
            entry.destination = result.board.url;
            if (entry.position)
              entry.position = { ...entry.position, resultsScrollTop: 0 };
          }
        }
        state.value = {
          ...state.value,
          result: state.value.result === prior ? result : state.value.result,
          origin: state.value.origin === prior ? result : state.value.origin,
          destination:
            state.value.result === prior
              ? result.board.url
              : state.value.destination,
        };
        void nextTick().then(() => {
          if (readingPosition) view?.restoreReading(readingPosition);
        });
        void persist();
      };
      if (!writing.deferViewChange(show)) show();
    },
  });
  watch(visibleBoard, (result) => boardChecks.activate(result), {
    flush: "sync",
  });
  const threadHistory = createThreadHistory(client, {
    owned: () => boardChecks.busy(),
    openNewest: async (url) => {
      await openThread(url);
    },
    active: () => !!state.value.reading && !state.value.privateReading,
    busy: () =>
      state.value.loading ||
      writing.state.value.composing ||
      writing.state.value.preparing ||
      writing.state.value.publishing ||
      writing.state.value.findingMention ||
      drafts.value.loading ||
      favorite.value.busy ||
      download.value?.status === "checking",
    capture: () => view?.captureReading() ?? null,
    restore: async (position) => {
      await nextTick();
      if (position) view?.restoreReading(position);
    },
    nearLatest: () => view?.nearLatest() ?? false,
    followLatest: async () => {
      await nextTick();
      view?.followLatest();
    },
    observe: (account) => {
      observeAccount(account);
      writing.observe(account);
    },
  });
  const privateHistory = createPrivateHistory(client, {
    active: () =>
      state.value.result?.kind === "private-conversation" &&
      !writing.state.value.visible &&
      !writing.state.value.context?.privateAttempts?.some((attempt) =>
        ["pending", "uncertain"].includes(attempt.status),
      ),
    nearLatest: () => view?.nearLatest() ?? false,
    followLatest: async () => {
      await nextTick();
      view?.followLatest();
    },
    busy: () =>
      state.value.loading ||
      writing.state.value.composing ||
      (!!writing.state.value.privateReview &&
        !writing.state.value.privateReviewConsumed) ||
      boardChecks.busy() ||
      threadHistory.state.value.checking ||
      threadHistory.state.value.earlier.status === "loading" ||
      threadHistory.state.value.later.status === "loading" ||
      writing.state.value.preparing ||
      writing.state.value.publishing ||
      writing.state.value.findingMention ||
      drafts.value.loading ||
      favorite.value.busy ||
      download.value?.status === "checking",
    capture: () => view?.captureReading() ?? null,
    restore: async (position) => {
      await nextTick();
      if (position) view?.restoreReading(position);
    },
    observe: (account) => {
      observeAccount(account);
      writing.observe(account);
    },
  });
  watch(
    () => threadHistory.state.value.result?.thread.url,
    () => {
      // Explicit reader navigation historically restores checks off. A board
      // beside the same retained reader does not change this source identity.
      setAutomaticChecks(false);
    },
  );
  function setAutomaticChecks(enabled: boolean) {
    automaticChecks.value = enabled;
    threadHistory.setAutomatic(enabled);
    boardChecks.setAutomatic(enabled);
  }
  watch(
    () => [
      writing.state.value.preparing,
      writing.state.value.publishing,
      writing.state.value.findingMention,
      drafts.value.loading,
      favorite.value.busy,
      download.value?.status,
    ],
    () => {
      if (
        writing.state.value.preparing ||
        writing.state.value.publishing ||
        writing.state.value.findingMention ||
        drafts.value.loading ||
        favorite.value.busy ||
        download.value?.status === "checking"
      ) {
        boardChecks.cancelPending();
        threadHistory.cancelPending();
        privateHistory.cancelPending();
      }
    },
    { flush: "sync" },
  );

  watch(
    [
      () => writing.state.value.composing,
      () => writing.state.value.context?.revision,
      () => writing.state.value.privateReview,
    ],
    () => privateHistory.cancelPending(),
    { flush: "sync" },
  );

  function capture() {
    const entry = entryFor(state.value.key);
    if (entry && view) {
      entry.position = view.capture();
      const position = view.captureReading();
      threadHistory.remember(position);
      privateHistory.remember(position);
      const privateResult = privateHistory.state.value.result;
      const readingEntry = ["thread", "private-conversation"].includes(
        entry.result?.kind ?? "",
      )
        ? entry
        : entry.readingKey
          ? entryFor(entry.readingKey)
          : null;
      const current = privateResult ?? threadHistory.state.value.result;
      const url = position.anchor
        ? privateResult
          ? privateHistory.sourceFor(position.anchor.slice(7))
          : threadHistory.sourceFor(position.anchor.slice(3))
        : null;
      const account = current ? accountKey(current.account) : null;
      if (
        readingEntry &&
        url &&
        account &&
        /^(?:pid|pmlist_)[1-9]\d*$/.test(position.anchor ?? "") &&
        ![...new URL(url).searchParams.keys()].some((name) =>
          /^(?:formhash|token|auth|password|sid)$/i.test(name),
        )
      )
        readingEntry.readingMarker = {
          url,
          account,
          position,
          savedAt: Date.now(),
        };
    }
  }
  async function persist() {
    if (
      record.writing?.action === "private-message" ||
      record.writing?.privateAttempts?.length
    )
      record.schema = 3;
    record.favoriteAttempts = JSON.parse(
      JSON.stringify(favorite.value.attempts),
    );
    const current = ++saveSequence;
    const context = record.writing;
    // Private peer previews belong to this document, not page-session recovery.
    // Keep the safe destination and existing writing in the single record owner.
    const saved = await host.save({
      ...record,
      entries: Object.fromEntries(
        Object.entries(record.entries).map(([key, entry]) => [
          key,
          ["messages", "private-conversation"].includes(
            entry.result?.kind ?? "",
          )
            ? { ...entry, result: null }
            : entry,
        ]),
      ),
    });
    if (current === saveSequence) {
      state.value = { ...state.value, recoveryAvailable: saved };
      writing.acknowledge(context?.id ?? null, context?.revision ?? 0, saved);
    }
    return saved;
  }
  function originContext(entry: NavigationEntry): ReadResult | null {
    const visited = new Set<string>();
    let key = entry.originKey;
    while (key && !visited.has(key)) {
      visited.add(key);
      const origin = entryFor(key);
      if (!origin) return null;
      if (
        !["thread", "private-conversation"].includes(origin.result?.kind ?? "")
      )
        return origin.result;
      key = origin.originKey;
    }
    return null;
  }
  function readingFor(entry: NavigationEntry) {
    const result =
      entry.result?.kind === "thread"
        ? entry.result
        : entry.readingKey
          ? entryFor(entry.readingKey)?.result
          : null;
    return result?.kind === "thread" &&
      (knownAccount === null || accountKey(result.account) === knownAccount)
      ? result
      : null;
  }
  function privateFor(entry: NavigationEntry) {
    const result =
      entry.result?.kind === "private-conversation"
        ? entry.result
        : entry.readingKey
          ? entryFor(entry.readingKey)?.result
          : null;
    return result?.kind === "private-conversation" &&
      (knownAccount === null || accountKey(result.account) === knownAccount)
      ? result
      : null;
  }
  function show(entry: NavigationEntry, restored = false) {
    const mismatch =
      knownAccount !== null &&
      entry.account !== null &&
      entry.account !== knownAccount;
    const retained = threadHistory.activate(
      mismatch ? null : readingFor(entry),
      entry.result?.kind === "thread" ? entry.key : (entry.readingKey ?? ""),
      true,
    );
    const retainedPrivate = privateHistory.activate(
      mismatch ? null : privateFor(entry),
      entry.result?.kind === "private-conversation"
        ? entry.key
        : (entry.readingKey ?? ""),
    );
    const readingPosition =
      retained || retainedPrivate
        ? view?.captureReading()
        : (privateHistory.rememberedPosition() ??
          threadHistory.rememberedPosition() ??
          (entry.result?.kind === "thread"
            ? entry.readingMarker?.position
            : entry.readingKey
              ? entryFor(entry.readingKey)?.readingMarker?.position
              : null));
    ++draftSequence;
    drafts.value = {
      loading: false,
      result:
        entry.section === "drafts"
          ? mismatch
            ? null
            : (entry.drafts ?? null)
          : drafts.value.result,
    };

    state.value = {
      ...state.value,
      section:
        entry.section ??
        (routeFor(entry.destination)?.kind === "search" ||
        entry.result?.kind === "search" ||
        originContext(entry)?.kind === "search"
          ? "search"
          : entry.result?.kind === "notices" ||
              originContext(entry)?.kind === "notices"
            ? "notices"
            : "boards"),
      key: entry.key,
      destination: entry.destination,
      result: mismatch ? null : entry.result,
      reading: mismatch ? null : readingFor(entry),
      privateReading: mismatch ? null : privateFor(entry),
      failure: null,
      loading: false,
      selection: entry.selection,
      missing:
        mismatch ||
        (!entry.result &&
          (!entry.section ||
            entry.section === "boards" ||
            routeFor(entry.destination)?.kind === "notices")),
      stale: restored && (entry.result !== null || Boolean(entry.drafts)),
      restored,
      canBack: entry.originKey !== null,
      documentNavigation: null,
      origin: originContext(entry),
    };
    void nextTick().then(() => {
      view?.restore(
        entry.position,
        entry.result?.kind === "thread"
          ? entry.result.thread.target
          : entry.result?.kind === "private-conversation"
            ? entry.result.conversation.target
            : null,
        entry.selection,
      );
      if (readingPosition) view?.restoreReading(readingPosition);
    });
  }
  function newEntry(url: string, originKey: string | null): NavigationEntry {
    const previous = originKey ? entryFor(originKey) : undefined;
    const browsingList = [
      "board",
      "directory",
      "search",
      "favorites",
      "notices",
      "messages",
    ].includes(routeFor(url)?.kind ?? "");
    const choosingThread = [
      "thread",
      "redirect",
      "private-conversation",
    ].includes(routeFor(url)?.kind ?? "");
    const previousReadingKey = ["thread", "private-conversation"].includes(
      previous?.result?.kind ?? "",
    )
      ? previous?.key
      : previous?.readingKey;
    const entry: NavigationEntry = {
      readingKey: browsingList ? (previousReadingKey ?? null) : null,
      key: crypto.randomUUID(),
      section:
        routeFor(url)?.kind === "favorites" ||
        (state.value.section === "saved" &&
          ["board", "thread", "redirect"].includes(routeFor(url)?.kind ?? ""))
          ? "saved"
          : routeFor(url)?.kind === "search" ||
              (state.value.section === "search" &&
                ["thread", "redirect"].includes(routeFor(url)?.kind ?? ""))
            ? "search"
            : routeFor(url)?.kind === "notices" ||
                (state.value.section === "notices" &&
                  ["thread", "redirect"].includes(routeFor(url)?.kind ?? ""))
              ? "notices"
              : "boards",
      destination: url,
      originKey: originKey && entryFor(originKey) ? originKey : null,
      selection: null,
      position:
        previous && (browsingList || choosingThread)
          ? {
              anchor: null,
              offset: 0,
              scrollTop: 0,
              readingScrollTop: browsingList
                ? (previous.position?.readingScrollTop ?? 0)
                : 0,
              resultsScrollTop: choosingThread
                ? (previous.position?.resultsScrollTop ?? 0)
                : 0,
            }
          : null,
      result: null,
      account: null,
      documentNavigations: 0,
    };
    record.entries[entry.key] = entry;
    return entry;
  }
  function observeAccount(account: Account) {
    boardChecks.observeAccount(account);
    let invalidated = false;
    const observed = accountKey(account);
    accountObservation.value = observed ?? "unknown";
    for (const entry of Object.values(record.entries))
      if (
        entry.drafts &&
        (!observed || accountKey(entry.drafts.account) !== observed)
      ) {
        entry.drafts = null;
        invalidated = true;
      }
    if (
      drafts.value.result &&
      (!observed || accountKey(drafts.value.result.account) !== observed)
    ) {
      draftSequence++;
      drafts.value = { loading: false, result: null };
    }
    if (account.kind === "unknown") {
      for (const entry of Object.values(record.entries))
        if (
          entry.result &&
          ["notices", "messages", "private-conversation", "favorites"].includes(
            entry.result.kind,
          )
        ) {
          entry.result = null;
          invalidated = true;
        }
      if (
        state.value.result &&
        ["notices", "messages", "private-conversation", "favorites"].includes(
          state.value.result.kind,
        )
      )
        state.value = {
          ...state.value,
          result: null,
          restored: false,
          missing: true,
        };
      if (
        state.value.origin &&
        ["notices", "messages", "private-conversation", "favorites"].includes(
          state.value.origin.kind,
        )
      )
        state.value = { ...state.value, origin: null };
    }
    if (
      state.value.privateReading &&
      (!observed || accountKey(state.value.privateReading.account) !== observed)
    ) {
      privateHistory.clear();
      state.value = { ...state.value, privateReading: null };
    }
    if (observed) {
      threadHistory.invalidateAccount(observed);
      if (
        threadHistory.state.value.result &&
        accountKey(threadHistory.state.value.result.account) !== observed
      )
        threadHistory.activate(null, state.value.key);
      knownAccount = observed;
      if (
        state.value.reading &&
        accountKey(state.value.reading.account) !== observed
      )
        state.value = { ...state.value, reading: null };
      if (
        state.value.result &&
        accountKey(state.value.result.account) !== observed
      )
        state.value = {
          ...state.value,
          result: null,
          restored: false,
          missing: true,
        };
      if (
        state.value.origin &&
        accountKey(state.value.origin.account) !== observed
      )
        state.value = { ...state.value, origin: null };
      for (const other of Object.values(record.entries))
        if (other.result && other.account && other.account !== observed) {
          other.result = null;
          delete other.readingMarker;
          invalidated = true;
        }
    }
    return invalidated;
  }
  async function read(
    entry: NavigationEntry,
    submitted?: Promise<ReadResult>,
    restoreRemembered = false,
  ) {
    const current = ++sequence;
    threadHistory.cancelPending();
    privateHistory.cancelPending();
    state.value = {
      ...state.value,
      loading: true,
      stale: state.value.result !== null,
      failure: null,
      missing: false,
    };
    const result = await (submitted ?? client.readPage(entry.destination));
    if (current !== sequence || result.kind === "stale") return;
    if (result.kind === "document-navigation") {
      if (entry.documentNavigations >= 1) {
        const failure: ReadResult = {
          kind: "invalid",
          message:
            "The exact destination could not be resolved after navigation. Continue in the native forum.",
          account: result.account,
          generation: result.generation,
          sourceURL: entry.destination,
        };
        state.value = {
          ...state.value,
          result: failure,
          failure,
          loading: false,
          missing: false,
        };
        record.pending = null;
        void persist();
        return;
      }
      entry.documentNavigations++;
      entry.destination = result.destination;
      record.pending = { entryKey: entry.key, destination: entry.destination };
      state.value = { ...state.value, loading: false };
      if (await persist()) host.navigateDocument(entry.destination);
      else
        state.value = { ...state.value, documentNavigation: entry.destination };
      return;
    }
    const previousSearch =
      state.value.result?.kind === "search" ? state.value.result : null;
    const observed = accountKey(result.account);
    writing.observe(result.account, result.kind !== "network");
    observeAccount(result.account);
    if (
      previousSearch &&
      observed &&
      accountKey(previousSearch.account) !== observed &&
      !success(result)
    ) {
      const retained: ReadResult = {
        ...previousSearch,
        account: result.account,
        generation: result.generation,
        search: { ...previousSearch.search, effective: null, results: null },
      };
      entry.result = retained;
      entry.account = observed;
      state.value = {
        ...state.value,
        result: retained,
        restored: false,
        missing: false,
      };
    }
    if (success(result)) {
      if (result.kind === "thread")
        result.thread.target =
          /^#pid([1-9]\d*)$/.exec(new URL(entry.destination).hash)?.[1] ??
          result.thread.target;
      entry.result = result;
      const retained = threadHistory.activate(
        readingFor(entry),
        result.kind === "thread" ? entry.key : (entry.readingKey ?? ""),
        result.kind !== "thread",
      );
      const retainedPrivate = privateHistory.activate(
        privateFor(entry),
        result.kind === "private-conversation"
          ? entry.key
          : (entry.readingKey ?? ""),
        result.kind !== "private-conversation",
      );
      const readingPosition =
        retained || retainedPrivate
          ? view?.captureReading()
          : (privateHistory.rememberedPosition() ??
            threadHistory.rememberedPosition());

      entry.account = observed;
      if (result.kind === "search" && result.search.results)
        entry.destination = result.search.results.url;
      if (result.kind === "thread") {
        const actual = new URL(result.thread.url);
        const requested = new URL(entry.destination);
        if (requested.hash === "#lastpost" && result.thread.target)
          actual.hash = `pid${result.thread.target}`;
        else if (requested.hash) actual.hash = requested.hash;
        entry.destination = actual.href;
      }
      state.value = {
        ...state.value,
        result,
        reading: readingFor(entry),
        privateReading: privateFor(entry),
        loading: false,
        missing: false,
        failure: null,
        stale: false,
        restored: false,
        destination: entry.destination,
      };
      void nextTick().then(() => {
        view?.restore(
          entry.position,
          result.kind === "thread"
            ? result.thread.target
            : result.kind === "private-conversation"
              ? result.conversation.target
              : null,
          entry.selection,
        );
        if (readingPosition) view?.restoreReading(readingPosition);
      });
    } else {
      state.value = {
        ...state.value,
        loading: false,
        failure: result,
        result: state.value.result ?? result,
        stale: state.value.result !== null,
      };
    }
    void persist();
    if (restoreRemembered && result.kind === "thread" && observed) {
      const context = threadContext(result.thread.url, observed);
      const marker = Object.values(record.entries)
        .filter((other) => other !== entry)
        .map((other) => other.readingMarker)
        .filter(
          (marker) =>
            marker && threadContext(marker.url, marker.account) === context,
        )
        .sort((a, b) => b!.savedAt - a!.savedAt)[0];
      if (marker) {
        entry.readingMarker = marker;
        await reconstructReading(entry);
      }
    }
  }
  const pendingThread = shallowRef<{
    url: string;
    selection: string | null;
    contextId: string;
  } | null>(null);
  async function openThread(
    url: string,
    selection: string | null = null,
    retainedContextId?: string,
  ) {
    if (
      writing.deferViewChange(() => {
        void openThread(url, selection, retainedContextId);
      })
    )
      return;
    if (routeFor(url)?.kind === "messages") return loadMessages(url);
    if (routeFor(url)?.kind === "notices") return loadNotices(url);
    const current = state.value.result;
    const requested = routeFor(url);
    const context = writing.state.value.context;
    const requestedThread =
      requested?.url.searchParams.get("ptid") ??
      requested?.url.searchParams.get("tid");
    if (
      context &&
      context.id !== retainedContextId &&
      (((requested?.kind === "thread" || requested?.kind === "redirect") &&
        requestedThread !== state.value.reading?.thread.id) ||
        (requested?.kind === "private-conversation" &&
          requested.url.searchParams.get("touid") !==
            state.value.privateReading?.conversation.peerId))
    ) {
      pendingThread.value = { url, selection, contextId: context.id };
      return;
    }
    pendingThread.value = null;
    if (requested?.kind === "private-conversation")
      return openPrivateConversation(url, selection);
    clearDownload();
    if (
      current?.kind === "thread" &&
      requested?.kind === "thread" &&
      requested.url.searchParams.get("tid") === current.thread.id &&
      requested.url.hash &&
      requested.url.pathname + requested.url.search ===
        new URL(state.value.destination).pathname +
          new URL(state.value.destination).search
    ) {
      writing.hide();
      updateAnchor(requested.url.hash);
      return;
    }
    if (["thread", "redirect"].includes(requested?.kind ?? "")) writing.hide();
    capture();
    const previous = entryFor(state.value.key);
    if (previous && selection) previous.selection = selection;
    const entry = newEntry(url, previous?.key ?? null);
    entry.selection = selection;
    host.push(entry.key);
    const explicitTarget =
      requested?.kind === "thread" &&
      (requested.url.searchParams.has("page") ||
        requested.url.searchParams.has("pid") ||
        !!requested.url.hash);
    const retainedThread =
      requested?.kind === "thread" && !explicitTarget && knownAccount
        ? threadHistory.find(url, knownAccount)
        : null;
    if (retainedThread) {
      entry.result = retainedThread;
      entry.account = knownAccount;
      show(entry);
      void persist();
      return;
    }
    const searchContext =
      current?.kind === "search" ? current : state.value.origin;
    const searchPage =
      requested?.kind === "search" &&
      requested.url.searchParams.has("searchid") &&
      searchContext?.kind === "search"
        ? searchContext
        : null;
    if (searchPage) {
      entry.result = searchPage;
      entry.account = accountKey(searchPage.account);
    }
    show(entry);
    void persist();
    await read(
      entry,
      searchPage
        ? client.readSearchPage(url, searchPage.search, searchPage.account)
        : undefined,
      requested?.kind === "thread" && !explicitTarget,
    );
  }
  async function openPrivateConversation(
    url: string,
    selection: string | null = null,
  ) {
    if (
      writing.deferViewChange(() => {
        void openPrivateConversation(url, selection);
      })
    )
      return;
    const target = /^#pmlist_([1-9]\d*)$/.exec(new URL(url).hash)?.[1];
    const active = privateHistory.state.value.result;
    if (
      target &&
      active?.conversation.messages.some(
        (message) => message.id === target && message.url === url,
      )
    ) {
      writing.hide();
      const entry = entryFor(state.value.key);
      if (!entry) return;
      const readingEntry =
        entry.result?.kind === "private-conversation"
          ? entry
          : entry.readingKey
            ? entryFor(entry.readingKey)
            : null;
      if (readingEntry?.result?.kind !== "private-conversation") return;
      readingEntry.destination = url;
      privateHistory.target(target);
      readingEntry.result = {
        ...readingEntry.result,
        conversation: { ...readingEntry.result.conversation, target },
      };
      state.value = {
        ...state.value,
        destination: entry.destination,
        result: entry.result,
        privateReading: privateFor(entry),
      };
      host.replace(entry.key);
      void persist();
      void nextTick().then(() => view?.restore(null, target, entry.selection));
      return;
    }
    clearDownload();
    writing.hide();
    capture();
    const previous = entryFor(state.value.key);
    if (previous && selection) previous.selection = selection;
    const requested = new URL(url);
    const ordinary =
      !requested.searchParams.has("page") &&
      (!requested.hash || (selection !== null && requested.hash === "#last"));
    const passiveCurrent =
      !previous?.result &&
      !!previous?.readingMarker &&
      previous.destination === url;
    const marker =
      ordinary || passiveCurrent
        ? (Object.values(record.entries)
            .map((other) => other.readingMarker)
            .filter(
              (marker) =>
                marker &&
                routeFor(marker.url)?.kind === "private-conversation" &&
                (!knownAccount || marker.account === knownAccount) &&
                privateContext(marker.url, marker.account) ===
                  privateContext(url, marker.account),
            )
            .sort((a, b) => b!.savedAt - a!.savedAt)[0] ?? null)
        : null;
    const entry = newEntry(url, previous?.key ?? null);
    if (marker) {
      entry.readingMarker = marker;
      entry.account = marker.account;
    }
    entry.section = "messages";
    entry.selection = selection;
    host.push(entry.key);
    const retained =
      ordinary && knownAccount ? privateHistory.find(url, knownAccount) : null;
    if (retained) {
      entry.result = retained;
      entry.account = knownAccount;
      show(entry);
      void persist();
      return;
    }
    show(entry);
    void persist();
    const loadURL = marker ? new URL(marker.url) : new URL(url);
    if (marker) loadURL.hash = marker.position.anchor ?? "";
    await read(entry, client.readPrivateConversation(loadURL.href));
    const loaded = privateHistory.state.value.result;
    if (
      marker &&
      loaded &&
      accountKey(loaded.account) === marker.account &&
      loaded.conversation.messages.some(
        (m) => `pmlist_${m.id}` === marker.position.anchor,
      )
    ) {
      privateHistory.remember(marker.position);
      await nextTick();
      view?.restoreReading(marker.position);
    }
  }
  async function loadMessages(url?: string) {
    if (state.value.loading) return;
    if (
      writing.deferViewChange(() => {
        void loadMessages(url);
      })
    )
      return;
    const current =
      state.value.result?.kind === "messages"
        ? state.value.result
        : state.value.origin?.kind === "messages"
          ? state.value.origin
          : null;
    const destinationURL =
      url ??
      current?.messages.url ??
      (routeFor(state.value.destination)?.kind === "messages"
        ? state.value.destination
        : `${new URL(destination).origin}/home.php?mod=space&do=pm`);
    clearDownload();
    writing.hide();
    capture();
    const entry = newEntry(destinationURL, state.value.key || null);
    entry.section = "messages";
    if (current) {
      entry.result = current;
      entry.account = accountKey(current.account);
    }
    host.push(entry.key);
    show(entry);
    await read(
      entry,
      client.readMessages(destinationURL, current?.messages, current?.account),
    );
  }
  async function loadNotices(url?: string) {
    if (state.value.loading) return;
    if (
      writing.deferViewChange(() => {
        void loadNotices(url);
      })
    )
      return;
    const current =
      state.value.result?.kind === "notices"
        ? state.value.result
        : state.value.origin?.kind === "notices"
          ? state.value.origin
          : null;
    const destinationURL =
      url ??
      current?.notices.url ??
      (routeFor(state.value.destination)?.kind === "notices"
        ? state.value.destination
        : `${new URL(destination).origin}/home.php?mod=space&do=notice`);
    clearDownload();
    capture();
    const entry = newEntry(destinationURL, state.value.key || null);
    entry.section = "notices";
    if (current) {
      entry.result = current;
      entry.account = accountKey(current.account);
    }
    host.push(entry.key);
    show(entry);
    await read(
      entry,
      client.readNotices(destinationURL, current?.notices, current?.account),
    );
  }
  function updateAnchor(hash: string) {
    if (!/^#pid[1-9]\d*$/.test(hash)) return;
    const entry = entryFor(state.value.key);
    if (!entry) return;
    const url = new URL(entry.destination);
    url.hash = hash;
    entry.destination = url.href;
    if (entry.result?.kind === "thread")
      entry.result = {
        ...entry.result,
        thread: { ...entry.result.thread, target: hash.slice(4) },
      };
    state.value = {
      ...state.value,
      destination: entry.destination,
      result: entry.result,
      reading: readingFor(entry),
      privateReading: privateFor(entry),
    };
    threadHistory.target(hash.slice(4));
    void nextTick().then(() =>
      view?.restore(null, hash.slice(4), entry.selection),
    );
    host.replace(entry.key);
    void persist();
  }
  function restoreHistory(key: string | null) {
    if (writing.deferViewChange(() => restoreHistory(key))) return;
    clearDownload();
    ++sequence;
    capture();
    const entry = key ? entryFor(key) : null;
    if (entry) {
      show(entry, true);
      void reconstructReading(entry);
    } else
      state.value = {
        ...state.value,
        section: "boards",
        key: key ?? "",
        loading: false,
        result: null,
        failure: null,
        missing: true,
        restored: true,
        stale: false,
        canBack: false,
        origin: null,
        reading: null,
        privateReading: null,
      };
    void persist();
  }
  async function reconstructReading(entry: NavigationEntry) {
    const readingEntry =
      entry.result?.kind === "thread"
        ? entry
        : entry.readingKey
          ? entryFor(entry.readingKey)
          : null;
    const marker = readingEntry?.readingMarker;
    if (!readingEntry || !marker || readingEntry.result?.kind !== "thread")
      return;
    if (
      threadHistory.state.value.result?.thread.posts.some(
        (post) => `pid${post.id}` === marker.position.anchor,
      )
    ) {
      if (threadHistory.rememberedPosition()) return;
      await nextTick();
      view?.restoreReading(marker.position);
      return;
    }
    const expected = threadContext(marker.url, marker.account);
    const current = ++sequence;
    threadHistory.cancelPending();
    state.value = { ...state.value, loading: true };
    const result = await client.readPage(marker.url);
    if (current !== sequence || result.kind === "stale") return;
    writing.observe(result.account, result.kind !== "network");
    observeAccount(result.account);
    if (
      result.kind !== "thread" ||
      threadContext(result.thread.url, accountKey(result.account) ?? "") !==
        expected
    ) {
      state.value = {
        ...state.value,
        loading: false,
        failure:
          result.kind === "thread"
            ? {
                kind: "invalid",
                account: result.account,
                generation: result.generation,
                sourceURL: marker.url,
                message:
                  "The remembered reading position no longer matches this account, thread or filter. Use the returned page or continue in the native forum.",
              }
            : result,
      };
      void persist();
      return;
    }
    const postId = marker.position.anchor!.slice(3);
    result.thread.target = postId;
    readingEntry.result = result;
    const actual = new URL(result.thread.url);
    actual.hash = `pid${postId}`;
    readingEntry.destination = actual.href;
    threadHistory.activate(result, readingEntry.key);
    if (result.thread.posts.some((post) => post.id === postId))
      threadHistory.remember(marker.position);
    show(entry, true);
    await nextTick();
    if (result.thread.posts.some((post) => post.id === postId))
      view?.restoreReading(marker.position);
    else delete readingEntry.readingMarker;
    void persist();
  }
  async function start() {
    const recovered = await host.load();
    state.value = { ...state.value, recoveryProblem: host.recoveryProblem() };
    if (recovered) {
      record = recovered;
      writing.restore(recovered.writing);
      const attempts = (recovered.favoriteAttempts ?? []).map((attempt) =>
        attempt.status === "pending"
          ? {
              ...attempt,
              status: "uncertain" as const,
              message:
                "The tab recovered a pending favorite action. Its outcome is uncertain; no action was replayed.",
            }
          : attempt,
      );
      favorite.value = {
        busy: false,
        prepared: null,
        attempts,
        message: attempts.at(-1)?.message ?? "",
      };
    }
    // Initial document traversal must not save an empty provisional record.
    // Read the current key after loading; earlier history events need no replay.
    host.onPop(restoreHistory);
    const key = host.entryKey();
    if (key) {
      const entry = entryFor(key);
      if (entry) {
        show(entry, true);
        await reconstructReading(entry);
      } else
        state.value = { ...state.value, key, missing: true, restored: true };
      return;
    }
    const pending = record.pending;
    if (pending && entryFor(pending.entryKey)) {
      const entry = entryFor(pending.entryKey)!;
      const requested = routeFor(pending.destination),
        actual = routeFor(destination);
      const expected =
        requested?.url.searchParams.get("ptid") ??
        requested?.url.searchParams.get("tid");
      if (
        actual?.kind === "thread" &&
        (!expected || actual.url.searchParams.get("tid") === expected)
      ) {
        const pid = requested?.url.searchParams.get("pid");
        if (pid) actual.url.hash = `pid${pid}`;
        entry.destination = actual.url.href;
        record.pending = null;
        host.replace(entry.key);
        show(entry);
        await read(entry);
        return;
      }
      record.pending = null;
      const failure: ReadResult = {
        kind: "invalid",
        message:
          "The forum redirect returned a different thread. The requested destination is preserved for native recovery.",
        account: { kind: "unknown" },
        generation: client.generation,
        sourceURL: pending.destination,
      };
      entry.result = failure;
      host.replace(entry.key);
      show(entry);
      void persist();
      return;
    }
    const initial = new URL(destination);
    if (
      ["messages", "private-conversation"].includes(
        routeFor(destination)?.kind ?? "",
      )
    ) {
      const entry = newEntry(destination, null);
      entry.section = "messages";
      host.replace(entry.key);
      show(entry);
      void persist();
      return;
    }
    if (routeFor(destination)?.kind === "notices") {
      const entry = newEntry(destination, null);
      entry.section = "notices";
      entry.result = {
        kind: "invalid",
        account: { kind: "unknown" },
        generation: client.generation,
        sourceURL: entry.destination,
        message:
          "This native notice request may have marked notices read before the workspace started. No notice request has been repeated. Load notices only deliberately.",
      };
      host.replace(entry.key);
      show(entry);
      void persist();
      return;
    }
    if (
      initial.pathname === "/search.php" &&
      (initial.searchParams.has("searchid") ||
        initial.searchParams.has("searchsubmit") ||
        initial.searchParams.has("srchtxt") ||
        initial.searchParams.has("srchuname"))
    ) {
      const entry = newEntry(
        routeFor(destination)?.url.href ??
          `${initial.origin}/search.php?mod=forum&adv=yes`,
        null,
      );
      entry.result = {
        kind: "invalid",
        account: { kind: "unknown" },
        generation: client.generation,
        sourceURL: entry.destination,
        message:
          "This native search request may have used credits or quota before the workspace started. No search has been repeated. Open Search to prepare a deliberate new search.",
      };
      host.replace(entry.key);
      show(entry);
      void persist();
      return;
    }
    const entry = newEntry(destination, null);
    host.replace(entry.key);
    show(entry);
    await read(
      entry,
      undefined,
      routeFor(destination)?.kind === "thread" &&
        !initial.searchParams.has("page") &&
        !initial.searchParams.has("pid") &&
        !initial.hash,
    );
  }
  async function refresh() {
    if (
      state.value.result?.kind === "thread" &&
      threadHistory.state.value.result?.thread.history
    )
      return threadHistory.refresh();
    if (state.value.section === "messages") return loadMessages();
    if (
      state.value.section === "notices" &&
      state.value.result?.kind !== "thread"
    )
      return loadNotices();
    if (!["boards", "search", "notices", "saved"].includes(state.value.section))
      return;
    clearDownload();
    let entry = entryFor(state.value.key);
    if (!entry) {
      entry = newEntry(`${new URL(destination).origin}/forum.php`, null);
      host.replace(entry.key);
      show(entry);
    }
    if (routeFor(entry.destination)?.kind === "search")
      entry.destination = `${new URL(destination).origin}/search.php?mod=forum&adv=yes`;
    capture();
    await read(entry);
  }
  function openSection(section: Section): void | Promise<void> {
    if (
      writing.deferViewChange(() => {
        void openSection(section);
      })
    )
      return;
    if (section === "boards")
      return openThread(`${new URL(destination).origin}/forum.php`);
    if (
      state.value.section === section &&
      (section !== "search" ||
        state.value.result?.kind === "search" ||
        state.value.result?.kind === "thread")
    )
      return;
    if (section === "search")
      return openThread(
        `${new URL(destination).origin}/search.php?mod=forum&adv=yes`,
      );
    clearDownload();
    ++sequence;
    capture();
    const entry = newEntry(
      `${new URL(destination).origin}/forum.php`,
      state.value.key || null,
    );
    entry.section = section;
    host.push(entry.key);
    show(entry);
    void persist();
  }
  return {
    preferences,
    saveReadingPosition: () => {
      if (
        state.value.loading ||
        !view ||
        (!threadHistory.state.value.result &&
          !privateHistory.state.value.result)
      )
        return;
      capture();
      void persist();
    },
    threadHistory,
    boardChecks,
    automaticChecks: readonly(automaticChecks),
    setAutomaticChecks,
    canCheck: () => threadHistory.canCheck() || boardChecks.canCheck(),
    privateHistory,
    drafts: readonly(drafts),
    loadDrafts,
    resumeDraft: (threadId: string) => {
      const choose = () => {
        const result = drafts.value.result;
        const row =
          result?.kind === "drafts"
            ? result.drafts.rows.find((row) => row.threadId === threadId)
            : null;
        const entry = entryFor(state.value.key);
        if (!row || !result || !entry || state.value.section !== "drafts")
          return;
        capture();
        entry.selection = threadId;
        state.value = { ...state.value, selection: threadId };
        void persist();
        void writing.resumeDraft(row, result.account);
      };
      if (!writing.deferViewChange(choose)) choose();
    },
    favorite: readonly(favorite),
    prepareFavorite,
    sendFavorite,
    checkFavorite,
    resendFavorite: (id: string) => {
      const old = favorite.value.attempts.find(
        (item) => item.id === id && item.checked && item.status === "uncertain",
      );
      if (!old) return;
      const intent = old.command.intent;
      return prepareFavorite(
        intent.action,
        intent.kind,
        intent.targetId,
        intent.recordId,
        id,
      );
    },
    openSection,
    loadNotices,
    loadMessages,
    writing,
    resetRecovery: () => {
      host.resetRecovery();
      state.value = { ...state.value, recoveryProblem: null };
      void persist();
    },
    state: readonly(state),
    accountObservation: readonly(accountObservation),
    download: readonly(download),
    prepareDownload,
    saveDownload,
    continueWithoutRecovery: () => {
      if (state.value.documentNavigation)
        host.navigateDocument(state.value.documentNavigation);
    },
    start,
    pendingThread: readonly(pendingThread),
    cancelThreadChange: () => {
      pendingThread.value = null;
      writing.show();
    },
    retainWritingAndRead: () => {
      const pending = pendingThread.value;
      if (pending)
        void openThread(pending.url, pending.selection, pending.contextId);
    },
    openThread,
    refresh,
    updateAnchor,
    back: () => {
      if (!writing.deferViewChange(() => host.back())) host.back();
    },
    setViewAdapter: (adapter: ViewAdapter) => {
      view = adapter;
    },
    submitSearch: async (effective = false) => {
      const entry = entryFor(state.value.key);
      if (state.value.loading || entry?.result?.kind !== "search") return;
      const { search, account } = entry.result;
      const criteria = structuredClone(
        effective && search.effective ? search.effective : search.edited,
      );
      capture();
      const next = newEntry(search.form.url, entry.key);
      next.result = entry.result;
      next.account = entry.account;
      host.push(next.key);
      show(next);
      await read(next, client.search(criteria, search.form, account));
    },
    editSearch: (name: string, values: string[]) => {
      const entry = entryFor(state.value.key);
      if (entry?.result?.kind !== "search") return;
      const search = entry.result.search;
      entry.result = {
        ...entry.result,
        search: { ...search, edited: { ...search.edited, [name]: values } },
      };
      state.value = { ...state.value, result: entry.result };
      void persist();
    },
    supports: (url: string) => routeFor(url) !== null,
  };
}
export type Workspace = ReturnType<typeof createWorkspace>;
