import { shallowRef, readonly, nextTick } from "vue";
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
  ["thread", "board", "directory"].includes(result.kind);
export function createWorkspace(
  client: ForumClient,
  destination: string,
  host: NavigationHost,
  preferenceHost: PreferenceHost,
) {
  const preferences = createPreferences(preferenceHost);
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
  });
  let sequence = 0;
  let record: NavigationRecord = { schema: 1, entries: {}, pending: null };
  const entryFor = (key: string) =>
    Object.hasOwn(record.entries, key) ? record.entries[key] : undefined;
  let view: ViewAdapter | null = null;
  let knownAccount: string | null = null;
  function capture() {
    const entry = entryFor(state.value.key);
    if (entry && view) entry.position = view.capture();
  }
  async function persist() {
    const saved = await host.save(record);
    state.value = { ...state.value, recoveryAvailable: saved };
    return saved;
  }
  function show(entry: NavigationEntry, restored = false) {
    const mismatch =
      knownAccount !== null &&
      entry.account !== null &&
      entry.account !== knownAccount;
    state.value = {
      ...state.value,
      section: entry.section ?? "boards",
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
      origin: entry.originKey
        ? (entryFor(entry.originKey)?.result ?? null)
        : null,
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
      section: "boards",
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
  async function read(entry: NavigationEntry) {
    const current = ++sequence;
    state.value = {
      ...state.value,
      loading: true,
      stale: state.value.result !== null,
      failure: null,
      missing: false,
    };
    const result = await client.readPage(entry.destination);
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
    const observed = accountKey(result.account);
    if (observed) {
      knownAccount = observed;
      if (
        state.value.result &&
        accountKey(state.value.result.account) !== observed
      )
        state.value = { ...state.value, result: null, restored: false };
      if (
        state.value.origin &&
        accountKey(state.value.origin.account) !== observed
      )
        state.value = { ...state.value, origin: null };
      for (const other of Object.values(record.entries))
        if (other.account && other.account !== observed) other.result = null;
    }
    if (success(result)) {
      if (result.kind === "thread")
        result.thread.target =
          /^#pid([1-9]\d*)$/.exec(new URL(entry.destination).hash)?.[1] ??
          result.thread.target;
      entry.result = result;
      entry.account = observed;
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
    capture();
    const previous = entryFor(state.value.key);
    if (previous && selection) previous.selection = selection;
    const entry = newEntry(url, previous?.key ?? null);
    host.push(entry.key);
    show(entry);
    void persist();
    await read(entry);
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
    if (recovered) record = recovered;
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
    const entry = newEntry(destination, null);
    host.replace(entry.key);
    show(entry);
    await read(entry);
  }
  async function refresh() {
    if (state.value.section !== "boards") return;
    let entry = entryFor(state.value.key);
    if (!entry) {
      entry = newEntry(`${new URL(destination).origin}/forum.php`, null);
      host.replace(entry.key);
      show(entry);
    }
    capture();
    await read(entry);
  }
  return {
    preferences,
    openSection: (section: Section) => {
      if (section === "boards")
        return openThread(`${new URL(destination).origin}/forum.php`);
      if (state.value.section === section) return;
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
    },
    state: readonly(state),
    continueWithoutRecovery: () => {
      if (state.value.documentNavigation)
        host.navigateDocument(state.value.documentNavigation);
    },
    start,
    openThread,
    refresh,
    updateAnchor,
    back: () => host.back(),
    setViewAdapter: (adapter: ViewAdapter) => {
      view = adapter;
    },
    supports: (url: string) => routeFor(url) !== null,
  };
}
export type Workspace = ReturnType<typeof createWorkspace>;
