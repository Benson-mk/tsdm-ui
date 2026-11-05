import { shallowRef, readonly } from "vue";
import type { Account, ForumClient, ReadResult } from "../forum-client";
import type { ViewPosition } from "./navigation";
type PrivateResult = Extract<ReadResult, { kind: "private-conversation" }>;
type Direction = "earlier" | "later";
type State = {
  result: PrivateResult | null;
  loading: Direction | null;
  failure: ReadResult | null;
  failedDirection: Direction | null;
  checking: boolean;
  checkedAt: number | null;
  refreshFailure: ReadResult | null;
  arrivals: string[];
  automatic: boolean;
  paused: boolean;
  retryMinutes: number;
};
const actor = (account: Account) =>
  account.kind === "member" ? account.id : account.kind;
export function privateContext(value: string, account: string) {
  const url = new URL(value);
  return [
    url.origin,
    account,
    url.searchParams.get("touid"),
    url.searchParams.get("daterange") ?? "0",
  ].join("|");
}
function pageURL(result: PrivateResult) {
  const url = new URL(result.conversation.url);
  url.searchParams.set("page", result.conversation.pages.current);
  url.hash = "";
  return url.href;
}
export function createPrivateHistory(
  client: ForumClient,
  options: {
    busy(): boolean;
    active(): boolean;
    nearLatest(): boolean;
    followLatest(): Promise<void>;
    capture(): ViewPosition | null;
    restore(position: ViewPosition | null): Promise<void>;
    observe(account: Account): void;
  },
) {
  const state = shallowRef<State>({
    result: null,
    loading: null,
    failure: null,
    failedDirection: null,
    checking: false,
    checkedAt: null,
    refreshFailure: null,
    arrivals: [],
    automatic: false,
    paused: false,
    retryMinutes: 0,
  });
  type Range = {
    original: PrivateResult;
    result: PrivateResult;
    position: ViewPosition | null;
    sources: Map<string, string>;
    pages: Map<string, PrivateResult>;
    seen: Set<string>;
    arrivals: string[];
    checkedAt: number | null;
    refreshFailure: ReadResult | null;
    retryAfter: number;
    failures: number;
  };
  const retained = new Map<string, Range>();
  const contexts = new Map<string, Range>();
  let range: Range | null = null;
  function remember(position: ViewPosition | null) {
    if (!range || !state.value.result) return;
    range.result = state.value.result;
    range.position = position;
    range.arrivals = state.value.arrivals;
    range.checkedAt = state.value.checkedAt;
    range.refreshFailure = state.value.refreshFailure;
  }
  const cadence = 120_000;
  let nextCheck = 0;
  let key = "",
    epoch = 0,
    pending = false;
  function cancelPending() {
    epoch++;
    if (state.value.loading) state.value = { ...state.value, loading: null };
  }
  function activate(
    result: PrivateResult | null,
    nextKey: string,
    retain = true,
  ) {
    if (retain && result && nextKey === key && state.value.result) return true;
    cancelPending();
    key = nextKey;
    nextCheck = 0;
    if (!result) {
      range = null;
      state.value = {
        result: null,
        checking: false,
        checkedAt: null,
        refreshFailure: null,
        arrivals: [],
        automatic: false,
        paused: false,
        retryMinutes: 0,
        loading: null,
        failure: null,
        failedDirection: null,
      };
      return false;
    }
    const identity = privateContext(
      result.conversation.url,
      `member:${actor(result.account)}`,
    );
    const ordinary = contexts.get(identity);
    const saved = retain
      ? (retained.get(key) ?? (ordinary?.original === result ? ordinary : null))
      : null;
    range =
      saved &&
      actor(saved.result.account) === actor(result.account) &&
      saved.result.conversation.peerId === result.conversation.peerId
        ? saved
        : {
            original: result,
            result,
            position: null,
            pages: new Map([[result.conversation.pages.current, result]]),
            seen: new Set(result.conversation.messages.map((m) => m.id)),
            arrivals: [],
            checkedAt: null,
            refreshFailure: null,
            retryAfter: 0,
            failures: 0,
            sources: new Map(
              result.conversation.messages.map((m) => [m.id, pageURL(result)]),
            ),
          };
    range.result = reconcile(range.result, range.result);
    retained.set(key, range);
    contexts.set(identity, range);
    state.value = {
      result: range.result,
      checking: false,
      checkedAt: range.checkedAt,
      refreshFailure: range.refreshFailure,
      automatic: false,
      paused: false,
      retryMinutes: Math.max(
        0,
        Math.ceil((range.retryAfter - Date.now()) / 60_000),
      ),
      arrivals: range.arrivals,
      loading: null,
      failure: null,
      failedDirection: null,
    };
    return false;
  }
  function clear() {
    retained.clear();
    contexts.clear();
    activate(null, "");
  }
  async function load(direction: Direction, automatic = false) {
    const prior = state.value.result,
      url = prior?.conversation[direction]?.url;
    if (
      !prior ||
      !url ||
      pending ||
      options.busy() ||
      (automatic && state.value.failedDirection === direction)
    )
      return;
    pending = true;
    const current = epoch,
      currentKey = key;
    state.value = {
      ...state.value,
      loading: direction,
      failure: null,
      failedDirection: null,
    };
    const result = await client.readPrivateConversation(
      url,
      prior.conversation,
      prior.account,
    );
    pending = false;
    if (current !== epoch || currentKey !== key || options.busy()) return;
    options.observe(result.account);
    if (current !== epoch || currentKey !== key) return;
    if (result.kind === "stale") {
      state.value = { ...state.value, loading: null };
      return;
    }
    if (
      result.kind !== "private-conversation" ||
      actor(result.account) !== actor(prior.account) ||
      result.conversation.peerId !== prior.conversation.peerId
    ) {
      state.value = {
        ...state.value,
        loading: null,
        failure: result,
        failedDirection: direction,
      };
      return;
    }
    const position = options.capture();
    const incoming = result.conversation.messages;
    const ordered =
      direction === "earlier"
        ? [...incoming, ...prior.conversation.messages]
        : [...prior.conversation.messages, ...incoming];
    const messages = [
      ...new Map(ordered.map((message) => [message.id, message])).values(),
    ];
    if (messages.length === prior.conversation.messages.length) {
      state.value = {
        ...state.value,
        loading: null,
        failure: {
          kind: "invalid",
          account: result.account,
          generation: result.generation,
          sourceURL: url,
          message:
            "The private history returned no additional messages. Retry only deliberately.",
        },
        failedDirection: direction,
      };
      return;
    }
    range!.pages.set(result.conversation.pages.current, result);
    for (const message of incoming) range!.seen.add(message.id);
    const merged = reconcile(prior, result);
    state.value = {
      ...state.value,
      result: merged,
      loading: null,
      failure: null,
      failedDirection: null,
    };
    await options.restore(position);
  }
  function reconcile(
    prior: PrivateResult,
    observed: PrivateResult,
  ): PrivateResult {
    const ordered = [...range!.pages.values()].sort(
      (a, b) =>
        Number(a.conversation.pages.current) -
        Number(b.conversation.pages.current),
    );
    const values = new Map<
      string,
      PrivateResult["conversation"]["messages"][number]
    >();
    range!.sources.clear();
    for (const page of ordered)
      for (const message of page.conversation.messages) {
        values.set(message.id, message);
        range!.sources.set(message.id, pageURL(page));
      }
    // Later loaded pages retain the overlapping copy when prepending history.
    // Refresh replaces the newest page, so its observations already win above.
    const messages = [...values.values()];
    const first = ordered[0]!.conversation,
      last = ordered.at(-1)!.conversation;
    const complete =
      messages.length === observed.conversation.totalCount &&
      !first.earlier &&
      !last.later &&
      ordered.every(
        (p, i) =>
          !i ||
          Number(p.conversation.pages.current) ===
            Number(ordered[i - 1]!.conversation.pages.current) + 1,
      );
    const result: PrivateResult = {
      ...prior,
      conversation: {
        ...prior.conversation,
        messages,
        totalCount: observed.conversation.totalCount,
        earlier: first.earlier,
        later: last.later,
        beginning: complete,
        end: complete,
        targetMissing: prior.conversation.target
          ? !values.has(prior.conversation.target)
          : prior.conversation.targetMissing,
        pages: {
          ...prior.conversation.pages,
          links: [
            ...new Map(
              ordered
                .flatMap((p) => p.conversation.pages.links)
                .map((l) => [l.url, l]),
            ).values(),
          ],
        },
      },
    };
    range!.result = result;
    return result;
  }
  async function refresh() {
    const prior = state.value.result;
    const latest =
      range &&
      [...range.pages.values()]
        .sort(
          (a, b) =>
            Number(a.conversation.pages.current) -
            Number(b.conversation.pages.current),
        )
        .at(-1);
    if (
      !prior ||
      !latest ||
      pending ||
      options.busy() ||
      Date.now() < (range?.retryAfter ?? 0)
    )
      return;
    const url =
        prior.conversation.pages.links.find(
          (link) =>
            new URL(link.url).searchParams.get("page") ===
            latest.conversation.pages.current,
        )?.url ?? latest.conversation.url,
      current = epoch,
      currentKey = key;
    const wasLatest = prior.conversation.end && !prior.conversation.later;
    pending = true;
    state.value = { ...state.value, checking: true, refreshFailure: null };
    const result = await client.readPrivateConversation(
      url,
      prior.conversation,
      prior.account,
    );
    pending = false;
    if (current !== epoch || currentKey !== key || options.busy()) {
      if (currentKey === key) state.value = { ...state.value, checking: false };
      return;
    }
    options.observe(result.account);
    if (current !== epoch || currentKey !== key) return;
    if (result.kind === "stale") {
      state.value = { ...state.value, checking: false };
      return;
    }
    if (
      result.kind !== "private-conversation" ||
      actor(result.account) !== actor(prior.account) ||
      result.conversation.peerId !== prior.conversation.peerId ||
      result.conversation.pages.current !== latest.conversation.pages.current
    ) {
      range!.failures++;
      const minutes = Math.min(30, 2 ** range!.failures);
      range!.retryAfter = Date.now() + minutes * 60_000;
      const failure: ReadResult =
        result.kind === "private-conversation"
          ? {
              kind: "invalid",
              account: result.account,
              generation: result.generation,
              sourceURL: url,
              message:
                "The refreshed private history no longer matches the observed page. Read the returned destination deliberately.",
            }
          : result;
      range!.refreshFailure = failure;
      state.value = {
        ...state.value,
        checking: false,
        refreshFailure: failure,
        retryMinutes: minutes,
      };
      return;
    }
    range!.failures = 0;
    range!.retryAfter = 0;
    range!.refreshFailure = null;
    nextCheck = Date.now() + cadence;
    const position = options.capture();
    const discovered = wasLatest
      ? result.conversation.messages
          .filter((m) => !range!.seen.has(m.id))
          .map((m) => m.id)
      : [];
    range!.pages.set(result.conversation.pages.current, result);
    for (const message of result.conversation.messages)
      range!.seen.add(message.id);
    const nearLatest = options.nearLatest();
    const merged = reconcile(prior, result);
    const follow =
      wasLatest &&
      merged.conversation.end &&
      !merged.conversation.later &&
      nearLatest;
    state.value = {
      ...state.value,
      result: merged,
      checking: false,
      checkedAt: Date.now(),
      retryMinutes: 0,
      arrivals: follow
        ? []
        : [...new Set([...state.value.arrivals, ...discovered])].filter((id) =>
            merged.conversation.messages.some((m) => m.id === id),
          ),
    };
    if (follow && discovered.length) await options.followLatest();
    else await options.restore(position);
  }
  function qualified() {
    return (
      !!state.value.result?.conversation.end &&
      !state.value.result.conversation.later
    );
  }
  function setAutomatic(enabled: boolean) {
    state.value = {
      ...state.value,
      automatic: enabled && qualified(),
      paused: false,
    };
    nextCheck = Date.now() + cadence;
  }
  function tick(visible: boolean) {
    const now = Date.now();
    const retryMinutes = Math.max(
      0,
      Math.ceil(((range?.retryAfter ?? 0) - now) / 60_000),
    );
    const paused =
      !visible ||
      !options.active() ||
      options.busy() ||
      pending ||
      !qualified();
    if (state.value.paused && !paused) nextCheck = now + cadence;
    if (
      state.value.paused !== paused ||
      state.value.retryMinutes !== retryMinutes
    )
      state.value = { ...state.value, paused, retryMinutes };
    if (!state.value.automatic || state.value.refreshFailure) return;
    if (paused) {
      nextCheck = now + cadence;
      return;
    }
    if (now >= nextCheck) {
      nextCheck = now + cadence;
      void refresh();
    }
  }
  async function revealArrivals() {
    state.value = { ...state.value, arrivals: [] };
    await options.followLatest();
  }
  function target(id: string) {
    const prior = state.value.result;
    if (!prior) return;
    const result = {
      ...prior,
      conversation: { ...prior.conversation, target: id, targetMissing: false },
    };
    if (range) range.result = result;
    state.value = { ...state.value, result };
  }
  return {
    state: readonly(state),
    activate,
    cancelPending,
    clear,
    load,
    refresh,
    revealArrivals,
    setAutomatic,
    tick,
    target,
    remember,
    sourceFor: (id: string) => range?.sources.get(id) ?? null,
    rememberedPosition: () => range?.position ?? null,
    find: (url: string, account: string) =>
      contexts.get(privateContext(url, account))?.original ?? null,
  };
}
