import { readonly, shallowRef } from "vue";
import type {
  Account,
  ForumClient,
  ReadResult,
  ThreadHistory,
} from "../forum-client";
import type { ViewPosition } from "./navigation";

type ThreadResult = Extract<ReadResult, { kind: "thread" }>;
export type HistoryDirection = "earlier" | "later";
export interface HistoryBoundary {
  status: "unloaded" | "end" | "unknown" | "loading" | "failed";
  url: string | null;
  failure: ReadResult | null;
}
const actor = (account: Account) =>
  account.kind === "member" ? `member:${account.id}` : account.kind;
export function threadContext(urlValue: string, account: string) {
  const url = new URL(urlValue);
  return [
    url.origin,
    url.searchParams.get("tid") ?? "",
    url.searchParams.get("authorid") ?? "",
    url.searchParams.get("ordertype") ?? "0",
    account,
  ].join("|");
}
function readingContext(result: ThreadResult) {
  return threadContext(result.thread.url, actor(result.account));
}
function boundary(
  history: ThreadHistory | undefined,
  direction: HistoryDirection,
): HistoryBoundary {
  const link = history?.[direction];
  return {
    status: link
      ? "unloaded"
      : history?.[direction === "earlier" ? "beginning" : "end"]
        ? "end"
        : "unknown",
    url: link?.url ?? null,
    failure: null,
  };
}
/** Transient loaded pages; the recovery owner continues to serialize only its entry. */
export function createThreadHistory(
  client: ForumClient,
  options: {
    busy(): boolean;
    active(): boolean;
    capture(): ViewPosition | null;
    restore(position: ViewPosition | null): Promise<void>;
    followLatest(): Promise<void>;
    nearLatest(): boolean;
    observe(account: Account): void;
  },
) {
  const state = shallowRef<{
    result: ThreadResult | null;
    earlier: HistoryBoundary;
    later: HistoryBoundary;
    latest: string | null;
    newestURL: string | null;
    arrivals: string[];
    checking: boolean;
    checkedAt: number | null;
    refreshFailure: ReadResult | null;
    automatic: boolean;
    paused: boolean;
    retryMinutes: number;
  }>({
    result: null,
    earlier: boundary(undefined, "earlier"),
    later: boundary(undefined, "later"),
    latest: null,
    newestURL: null,
    arrivals: [],
    checking: false,
    checkedAt: null,
    refreshFailure: null,
    automatic: false,
    paused: false,
    retryMinutes: 0,
  });
  const cadence = 120_000;
  let nextCheck = 0;
  let retryAfter = 0;
  let failures = 0;
  let epoch = 0;
  let pending = false;
  let key = "";
  let pages = new Set<string>();
  let postPages = new Map<string, string>();
  let membership = new Map<string, { url: string; ids: Set<string> }>();
  let seen = new Set<string>();
  let original: ThreadResult | null = null;
  let position: ViewPosition | null = null;
  type RetainedRange = {
    original: ThreadResult;
    state: typeof state.value;
    pages: Set<string>;
    postPages: Map<string, string>;
    position: ViewPosition | null;
    membership: typeof membership;
    seen: Set<string>;
    retryAfter: number;
    failures: number;
  };
  const ranges = new Map<string, RetainedRange>();
  const contexts = new Map<string, RetainedRange>();
  let activeRange: RetainedRange | null = null;
  function remember(nextPosition: ViewPosition | null) {
    position = nextPosition;
    const result = state.value.result;
    if (result && original) {
      const snapshot: RetainedRange = {
        original,
        state: {
          ...state.value,
          checking: false,
          automatic: false,
          paused: false,
          earlier:
            state.value.earlier.status === "loading"
              ? { ...state.value.earlier, status: "unloaded" }
              : state.value.earlier,
          later:
            state.value.later.status === "loading"
              ? { ...state.value.later, status: "unloaded" }
              : state.value.later,
        },
        pages,
        postPages,
        position,
        membership,
        seen,
        retryAfter,
        failures,
      };
      // Explicit history entries own a range. Ordinary returns alias that same
      // object, so later loads remain shared without replacing another entry.
      activeRange = activeRange
        ? Object.assign(activeRange, snapshot)
        : snapshot;
      ranges.set(key, activeRange);
      contexts.set(readingContext(result), activeRange);
    }
  }
  function activate(
    result: ReadResult | null,
    nextKey: string,
    retain = false,
  ) {
    if (
      retain &&
      result?.kind === "thread" &&
      key === nextKey &&
      state.value.result
    )
      return true;
    epoch++;
    nextCheck = 0;
    retryAfter = 0;
    failures = 0;
    key = nextKey;
    const ordinary =
      result?.kind === "thread" ? contexts.get(readingContext(result)) : null;
    const saved =
      result?.kind === "thread" && retain
        ? (ranges.get(nextKey) ??
          (ordinary?.original === result ? ordinary : null))
        : null;
    if (saved) {
      activeRange = saved;
      ranges.set(nextKey, saved);
      original = saved.original;
      state.value = {
        ...saved.state,
        checking: false,
        automatic: false,
        paused: false,
      };
      pages = saved.pages;
      postPages = saved.postPages;
      position = saved.position;
      membership = saved.membership;
      seen = saved.seen;
      retryAfter = saved.retryAfter;
      failures = saved.failures;
      return false;
    }
    activeRange = null;
    original = result?.kind === "thread" ? result : null;
    position = null;
    if (result?.kind === "thread" && !retain) {
      ranges.delete(nextKey);
      contexts.delete(readingContext(result));
    }
    membership = new Map(
      result?.kind === "thread"
        ? [
            [
              result.thread.pages.current,
              {
                url: result.thread.url,
                ids: new Set(result.thread.posts.map((post) => post.id)),
              },
            ],
          ]
        : [],
    );
    seen = new Set(
      result?.kind === "thread"
        ? result.thread.posts.map((post) => post.id)
        : [],
    );
    postPages = new Map(
      result?.kind === "thread"
        ? result.thread.posts.map((post) => [post.id, result.thread.url])
        : [],
    );
    pages = new Set(
      result?.kind === "thread" ? [result.thread.pages.current] : [],
    );
    state.value = {
      newestURL: result?.kind === "thread" ? result.thread.url : null,
      arrivals: [],
      checking: false,
      checkedAt: null,
      refreshFailure: null,
      automatic: false,
      paused: false,
      retryMinutes: 0,
      result:
        result?.kind === "thread"
          ? {
              ...result,
              thread: {
                ...result.thread,
                posts:
                  result.thread.history?.order === "descending"
                    ? [...result.thread.posts].reverse()
                    : result.thread.posts,
              },
            }
          : null,
      earlier: boundary(
        result?.kind === "thread" ? result.thread.history : undefined,
        "earlier",
      ),
      later: boundary(
        result?.kind === "thread" ? result.thread.history : undefined,
        "later",
      ),
      latest:
        result?.kind === "thread"
          ? (result.thread.history?.latest?.url ?? null)
          : null,
    };
  }
  function cancelPending() {
    epoch++;
  }
  async function load(direction: HistoryDirection, automatic = false) {
    const prior = state.value.result;
    const edge = state.value[direction];
    if (
      !prior ||
      !edge.url ||
      pending ||
      options.busy() ||
      (automatic && edge.status !== "unloaded") ||
      !["unloaded", "failed"].includes(edge.status)
    )
      return;
    pending = true;
    const current = epoch;
    const currentKey = key;
    state.value = {
      ...state.value,
      [direction]: { ...edge, status: "loading", failure: null },
    };
    const result = await client.readPage(edge.url);
    pending = false;
    if (current !== epoch || currentKey !== key || options.busy()) {
      if (currentKey === key && state.value[direction].status === "loading")
        state.value = {
          ...state.value,
          [direction]: { ...edge, status: "unloaded" },
        };
      return;
    }
    options.observe(result.account);
    if (current !== epoch || currentKey !== key) return;
    if (result.kind === "stale") {
      state.value = {
        ...state.value,
        [direction]: { ...edge, status: "unloaded" },
      };
      return;
    }
    const requestedPage = new URL(edge.url).searchParams.get("page") ?? "1";
    if (
      result.kind !== "thread" ||
      readingContext(result) !== readingContext(prior) ||
      result.thread.pages.current !== requestedPage ||
      pages.has(result.thread.pages.current)
    ) {
      const failure: ReadResult =
        result.kind !== "thread"
          ? result
          : {
              kind: "invalid",
              account: result.account,
              generation: result.generation,
              sourceURL: edge.url,
              message:
                "The returned history did not match this thread, account, filter or adjacent page.",
            };
      state.value = {
        ...state.value,
        [direction]: { ...edge, status: "failed", failure },
      };
      return;
    }
    const position = options.capture();
    pages.add(result.thread.pages.current);
    membership.set(result.thread.pages.current, {
      url: result.thread.url,
      ids: new Set(result.thread.posts.map((post) => post.id)),
    });
    for (const post of result.thread.posts) seen.add(post.id);
    const incoming =
      result.thread.history?.order === "descending"
        ? [...result.thread.posts].reverse()
        : result.thread.posts;
    const ordered =
      direction === "earlier"
        ? [...incoming, ...prior.thread.posts]
        : [...prior.thread.posts, ...incoming];
    const posts = [...new Map(ordered.map((post) => [post.id, post])).values()];
    for (const post of incoming)
      if (direction === "later" || !postPages.has(post.id))
        postPages.set(post.id, result.thread.url);
    state.value = {
      ...state.value,
      result: { ...prior, thread: { ...prior.thread, posts } },
      [direction]: boundary(result.thread.history, direction),
      latest: result.thread.history?.latest?.url ?? state.value.latest,
      newestURL:
        direction === "later" ? result.thread.url : state.value.newestURL,
    };
    await options.restore(position);
  }
  function qualified() {
    return (
      state.value.later.status === "end" &&
      state.value.result?.thread.history?.order === "ascending"
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
    const minutes = Math.max(0, Math.ceil((retryAfter - now) / 60_000));
    const paused =
      !visible ||
      !options.active() ||
      options.busy() ||
      pending ||
      !qualified();
    // Hidden tabs can suspend timers. Returning starts a full interval, never a backlog.
    if (state.value.paused && !paused) nextCheck = now + cadence;
    if (state.value.retryMinutes !== minutes || state.value.paused !== paused)
      state.value = { ...state.value, retryMinutes: minutes, paused };
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
  async function refresh() {
    const prior = state.value.result;
    const url = state.value.newestURL;
    if (!prior || !url || pending || options.busy() || Date.now() < retryAfter)
      return;
    pending = true;
    const current = epoch;
    const currentKey = key;
    const wasLatest = state.value.later.status === "end";
    state.value = { ...state.value, checking: true, refreshFailure: null };
    const result = await client.readPage(url, { fresh: true });
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
      result.kind !== "thread" ||
      readingContext(result) !== readingContext(prior) ||
      result.thread.pages.current !==
        (new URL(url).searchParams.get("page") ?? "1")
    ) {
      failures++;
      retryAfter = Date.now() + Math.min(30, 2 ** failures) * 60_000;
      state.value = {
        ...state.value,
        checking: false,
        retryMinutes: Math.min(30, 2 ** failures),
        refreshFailure:
          result.kind !== "thread"
            ? result
            : {
                kind: "invalid",
                account: result.account,
                generation: result.generation,
                sourceURL: url,
                message:
                  "The returned refresh did not match this thread, account, filter or page.",
              },
      };
      return;
    }
    failures = 0;
    retryAfter = 0;
    nextCheck = Date.now() + cadence;
    const position = options.capture();
    const incoming =
      result.thread.history?.order === "descending"
        ? [...result.thread.posts].reverse()
        : result.thread.posts;
    const later = boundary(result.thread.history, "later");
    const follow = wasLatest && later.status === "end" && options.nearLatest();
    const discovered = wasLatest
      ? incoming.filter((post) => !seen.has(post.id)).map((post) => post.id)
      : [];
    membership.set(result.thread.pages.current, {
      url: result.thread.url,
      ids: new Set(incoming.map((post) => post.id)),
    });
    for (const post of incoming) seen.add(post.id);
    const retained = new Set(
      [...membership.values()].flatMap((page) => [...page.ids]),
    );
    const posts = [
      ...new Map(
        [
          ...prior.thread.posts.filter((post) => retained.has(post.id)),
          ...incoming,
        ].map((post) => [post.id, post]),
      ).values(),
    ];
    postPages = new Map();
    for (const page of membership.values())
      for (const id of page.ids) postPages.set(id, page.url);
    for (const post of incoming) postPages.set(post.id, result.thread.url);
    const refreshedThread = {
      ...prior.thread,
      title: result.thread.title,
      posts,
    };
    // Bounds are observations, not permanent properties of a loaded range.
    // A shrinking thread that no longer contains its entry page fails closed.
    if (
      result.thread.pageJump &&
      result.thread.pageJump.total >= Number(prior.thread.pages.current)
    )
      refreshedThread.pageJump = result.thread.pageJump;
    else delete refreshedThread.pageJump;
    state.value = {
      ...state.value,
      checking: false,
      checkedAt: Date.now(),
      retryMinutes: 0,
      result: {
        ...prior,
        thread: refreshedThread,
      },
      later,
      latest: result.thread.history?.latest?.url ?? state.value.latest,
      newestURL: result.thread.url,
      arrivals: follow
        ? []
        : [...new Set([...state.value.arrivals, ...discovered])].filter((id) =>
            retained.has(id),
          ),
    };
    if (follow && discovered.length) await options.followLatest();
    else await options.restore(position);
  }
  async function revealArrivals() {
    state.value = { ...state.value, arrivals: [] };
    await options.followLatest();
  }
  function target(postId: string) {
    const result = state.value.result;
    if (result)
      state.value = {
        ...state.value,
        result: { ...result, thread: { ...result.thread, target: postId } },
      };
  }
  return {
    state: readonly(state),
    activate,
    cancelPending,
    load,
    refresh,
    setAutomatic,
    tick,
    revealArrivals,
    target,
    sourceFor: (postId: string) => postPages.get(postId) ?? null,
    remember,
    rememberedPosition: () => position,
    find: (url: string, account: string) =>
      contexts.get(threadContext(url, account))?.original ?? null,
    invalidateAccount(account: string) {
      for (const cache of [ranges, contexts])
        for (const [identity, saved] of cache)
          if (actor(saved.original.account) !== account) cache.delete(identity);
    },
  };
}
