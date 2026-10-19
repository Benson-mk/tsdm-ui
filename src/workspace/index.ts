import type { DownloadHost, PreparedFile } from "../hosts/download";
import { createWriting } from "./writing";
import { shallowRef, readonly, nextTick, watch } from "vue";
import { createPreferences, type PreferenceHost } from "./preferences";
import {
  describeDestination,
  type Account,
  type ForumClient,
  type ReadResult,
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
  ["thread", "board", "directory", "search"].includes(result.kind);
export function createWorkspace(
  client: ForumClient,
  destination: string,
  host: NavigationHost,
  preferenceHost: PreferenceHost,
  downloads?: DownloadHost,
) {
  const preferences = createPreferences(preferenceHost);
  const writing = createWriting(
    client,
    () => {
      record.writing = writing.snapshot();
      void persist();
    },
    (account) => {
      if (observeAccount(account)) void persist();
    },
  );
  const state = shallowRef<WorkspaceState>({
    section: "boards",
    loading: false,
    result: null,
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
    const result = state.value.result;
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
      threadURL: result.thread.url,
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
  let saveSequence = 0;
  const entryFor = (key: string) =>
    Object.hasOwn(record.entries, key) ? record.entries[key] : undefined;
  let view: ViewAdapter | null = null;
  let knownAccount: string | null = null;
  function capture() {
    const entry = entryFor(state.value.key);
    if (entry && view) entry.position = view.capture();
  }
  async function persist() {
    const current = ++saveSequence;
    const context = record.writing;
    const saved = await host.save(record);
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
      if (origin.result?.kind !== "thread") return origin.result;
      key = origin.originKey;
    }
    return null;
  }
  function show(entry: NavigationEntry, restored = false) {
    const mismatch =
      knownAccount !== null &&
      entry.account !== null &&
      entry.account !== knownAccount;
    state.value = {
      ...state.value,
      section:
        entry.section ??
        (routeFor(entry.destination)?.kind === "search" ||
        entry.result?.kind === "search" ||
        originContext(entry)?.kind === "search"
          ? "search"
          : "boards"),
      key: entry.key,
      destination: entry.destination,
      result: mismatch ? null : entry.result,
      failure: null,
      loading: false,
      selection: entry.selection,
      missing:
        mismatch ||
        (!entry.result && (!entry.section || entry.section === "boards")),
      stale: restored && entry.result !== null,
      restored,
      canBack: entry.originKey !== null,
      documentNavigation: null,
      origin: originContext(entry),
    };
    void nextTick().then(() =>
      view?.restore(
        entry.position,
        entry.result?.kind === "thread" ? entry.result.thread.target : null,
        entry.selection,
      ),
    );
  }
  function newEntry(url: string, originKey: string | null): NavigationEntry {
    const entry: NavigationEntry = {
      key: crypto.randomUUID(),
      section:
        routeFor(url)?.kind === "search" ||
        (state.value.section === "search" &&
          ["thread", "redirect"].includes(routeFor(url)?.kind ?? ""))
          ? "search"
          : "boards",
      destination: url,
      originKey,
      selection: null,
      position: null,
      result: null,
      account: null,
      documentNavigations: 0,
    };
    record.entries[entry.key] = entry;
    return entry;
  }
  function observeAccount(account: Account) {
    let invalidated = false;
    const observed = accountKey(account);
    if (observed) {
      knownAccount = observed;
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
          invalidated = true;
        }
    }
    return invalidated;
  }
  async function read(entry: NavigationEntry, submitted?: Promise<ReadResult>) {
    const current = ++sequence;
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
        loading: false,
        missing: false,
        failure: null,
        stale: false,
        restored: false,
        destination: entry.destination,
      };
      void nextTick().then(() =>
        view?.restore(
          entry.position,
          result.kind === "thread" ? result.thread.target : null,
          entry.selection,
        ),
      );
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
  }
  async function openThread(url: string, selection: string | null = null) {
    if (
      writing.deferViewChange(() => {
        void openThread(url, selection);
      })
    )
      return;
    clearDownload();
    const current = state.value.result;
    const requested = routeFor(url);
    if (
      current?.kind === "thread" &&
      requested?.kind === "thread" &&
      requested.url.searchParams.get("tid") === current.thread.id &&
      requested.url.hash &&
      requested.url.pathname + requested.url.search ===
        new URL(state.value.destination).pathname +
          new URL(state.value.destination).search
    ) {
      updateAnchor(requested.url.hash);
      return;
    }
    writing.hide();
    capture();
    const previous = entryFor(state.value.key);
    if (previous && selection) previous.selection = selection;
    const entry = newEntry(url, previous?.key ?? null);
    host.push(entry.key);
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
    };
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
    if (entry) show(entry, true);
    else
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
      };
    void persist();
  }
  async function start() {
    const recovered = await host.load();
    state.value = { ...state.value, recoveryProblem: host.recoveryProblem() };
    if (recovered) {
      record = recovered;
      writing.restore(recovered.writing);
    }
    // Initial document traversal must not save an empty provisional record.
    // Read the current key after loading; earlier history events need no replay.
    host.onPop(restoreHistory);
    const key = host.entryKey();
    if (key) {
      const entry = entryFor(key);
      if (entry) show(entry, true);
      else state.value = { ...state.value, key, missing: true, restored: true };
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
    await read(entry);
  }
  async function refresh() {
    if (!["boards", "search"].includes(state.value.section)) return;
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
    writing.hide();
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
    openSection,
    writing,
    resetRecovery: () => {
      host.resetRecovery();
      state.value = { ...state.value, recoveryProblem: null };
      void persist();
    },
    state: readonly(state),
    download: readonly(download),
    prepareDownload,
    saveDownload,
    continueWithoutRecovery: () => {
      if (state.value.documentNavigation)
        host.navigateDocument(state.value.documentNavigation);
    },
    start,
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
