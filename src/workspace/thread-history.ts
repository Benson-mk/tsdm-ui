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
    owned(): boolean;
    active(): boolean;
    capture(): ViewPosition | null;
    restore(position: ViewPosition | null): Promise<void>;
    followLatest(): Promise<void>;
    nearLatest(): boolean;
    observe(account: Account): void;
    openNewest(url: string): Promise<void>;
  },
) {
  const state = shallowRef<{
    result: ThreadResult | null;
    earlier: HistoryBoundary;
    later: HistoryBoundary;
    latest: string | null;
    newestURL: string | null;
    baselineEstablished: boolean;
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
    baselineEstablished: false,
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
  let newestObservation: ThreadResult | null = null;
  let newestSeen: Set<string> | null = null;
  let stagedNewest: ThreadResult | null = null;
  let visible = true;
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
    newestObservation: ThreadResult | null;
    newestSeen: Set<string> | null;
    stagedNewest: ThreadResult | null;
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
        newestObservation,
        newestSeen,
        stagedNewest,
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
      newestObservation = saved.newestObservation;
      newestSeen = saved.newestSeen;
      stagedNewest = saved.stagedNewest;
      return false;
    }
    activeRange = null;
    original = result?.kind === "thread" ? result : null;
    position = null;
    newestObservation =
      result?.kind === "thread" && result.thread.history?.end ? result : null;
    newestSeen = newestObservation
      ? new Set(newestObservation.thread.posts.map((post) => post.id))
      : null;
    stagedNewest = null;
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
      baselineEstablished: false,
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
  function sourceOrdered(
    posts: ThreadResult["thread"]["posts"],
    result: ThreadResult,
  ) {
    if (result.thread.history?.order !== "descending") return posts;
    const byId = new Map(posts.map((post) => [post.id, post]));
    const ids = [
      ...new Set(
        [...membership.entries()]
          .sort(([a], [b]) => Number(a) - Number(b))
          .flatMap(([, page]) => [...page.ids]),
      ),
    ];
    // Internal ranges stay chronological; reversing once at the layout retains
    // the native page order and source-pinned prefix without duplicating IDs.
    return ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : [])).reverse();
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
      options.owned() ||
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
      result: {
        ...prior,
        thread: { ...prior.thread, posts: sourceOrdered(posts, prior) },
      },
      [direction]: boundary(result.thread.history, direction),
      latest: result.thread.history?.latest?.url ?? state.value.latest,
      newestURL:
        direction === "later" ? result.thread.url : state.value.newestURL,
    };
    await options.restore(position);
  }
  function newestTarget(result = newestObservation ?? state.value.result) {
    if (!result?.thread.history) return null;
    if (result.thread.history.end) return result.thread.url;
    if (result.thread.pageJump) {
      const url = new URL(result.thread.pageJump.url);
      url.searchParams.set(
        "page",
        result.thread.history.order === "descending"
          ? "1"
          : String(result.thread.pageJump.total),
      );
      return url.href;
    }
    return result.thread.history.latest?.url ?? null;
  }
  function qualified() {
    return !!newestTarget();
  }
  function failedCheck(result: ReadResult, url: string) {
    failures++;
    retryAfter = Date.now() + Math.min(30, 2 ** failures) * 60_000;
    state.value = {
      ...state.value,
      checking: false,
      retryMinutes: Math.min(30, 2 ** failures),
      refreshFailure:
        result.kind === "thread"
          ? {
              kind: "invalid",
              account: result.account,
              generation: result.generation,
              sourceURL: url,
              message:
                "The returned check did not prove this thread's newest boundary. Refresh the thread before retrying.",
            }
          : result,
    };
  }
  async function checkNewest(automatic = false) {
    const prior = state.value.result;
    const target = newestTarget();
    if (
      !prior ||
      !target ||
      pending ||
      options.owned() ||
      options.busy() ||
      Date.now() < retryAfter
    )
      return;
    if (
      state.value.later.status === "end" &&
      new URL(target).searchParams.get("page") ===
        new URL(state.value.newestURL!).searchParams.get("page")
    )
      return refresh(automatic);
    pending = true;
    const current = epoch,
      currentKey = key;
    state.value = { ...state.value, checking: true, refreshFailure: null };
    let url = target;
    let result = await client.readPage(url, { fresh: true });
    const currentContext = () =>
      current === epoch &&
      currentKey === key &&
      !options.busy() &&
      (!automatic || (visible && options.active()));
    const matches = () =>
      result.kind === "thread" &&
      readingContext(result) === readingContext(prior) &&
      result.thread.pages.current ===
        (new URL(url).searchParams.get("page") ?? "1");
    if (currentContext()) options.observe(result.account);
    // A newly grown last page can offer a newer supported target. Follow once,
    // under the same pending owner; continuous growth is retried deliberately.
    if (
      currentContext() &&
      matches() &&
      result.kind === "thread" &&
      !result.thread.history?.end
    ) {
      const next = newestTarget(result);
      if (next && next !== url) {
        url = next;
        result = await client.readPage(url, { fresh: true });
        if (currentContext()) options.observe(result.account);
      }
    }
    pending = false;
    if (!currentContext() || result.kind === "stale") {
      if (currentKey === key) state.value = { ...state.value, checking: false };
      return;
    }
    if (!matches() || result.kind !== "thread" || !result.thread.history?.end) {
      failedCheck(result, url);
      return;
    }
    const baseline = newestSeen === null;
    const discovered = baseline
      ? []
      : result.thread.posts
          .filter((post) => !newestSeen!.has(post.id) && !seen.has(post.id))
          .map((post) => post.id);
    newestSeen ??= new Set();
    for (const post of result.thread.posts) newestSeen.add(post.id);
    newestObservation = result;
    stagedNewest = result;
    failures = 0;
    retryAfter = 0;
    nextCheck = Date.now() + cadence;
    const ids = new Set(result.thread.posts.map((post) => post.id));
    state.value = {
      ...state.value,
      checking: false,
      checkedAt: Date.now(),
      retryMinutes: 0,
      baselineEstablished: baseline,
      arrivals: [...new Set([...state.value.arrivals, ...discovered])].filter(
        (id) => ids.has(id),
      ),
    };
  }
  function setAutomatic(enabled: boolean) {
    state.value = {
      ...state.value,
      automatic: enabled && qualified(),
      paused: false,
    };
    nextCheck = Date.now() + cadence;
  }
  function tick(isVisible: boolean) {
    visible = isVisible;
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
    if (options.owned()) return;
    if (now >= nextCheck) {
      nextCheck = now + cadence;
      void checkNewest(true);
    }
  }
  async function refresh(automatic = false) {
    const prior = state.value.result;
    const url = state.value.newestURL;
    if (
      !prior ||
      !url ||
      pending ||
      options.owned() ||
      options.busy() ||
      Date.now() < retryAfter
    )
      return;
    pending = true;
    const current = epoch;
    const currentKey = key;
    const wasLatest = state.value.later.status === "end";
    state.value = { ...state.value, checking: true, refreshFailure: null };
    const result = await client.readPage(url, { fresh: true });
    pending = false;
    if (
      current !== epoch ||
      currentKey !== key ||
      options.busy() ||
      (automatic && (!visible || !options.active()))
    ) {
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
    if (result.thread.history?.end) {
      newestObservation = result;
      newestSeen ??= new Set();
      for (const post of result.thread.posts) newestSeen.add(post.id);
    }
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
      ids: new Set(result.thread.posts.map((post) => post.id)),
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
      posts: sourceOrdered(posts, prior),
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
      baselineEstablished: false,
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
        : [...new Set([...state.value.arrivals, ...discovered])].filter(
            (id) =>
              retained.has(id) ||
              !!stagedNewest?.thread.posts.some((post) => post.id === id),
          ),
    };
    if (follow && discovered.length) await options.followLatest();
    else await options.restore(position);
  }
  async function revealArrivals() {
    if (stagedNewest && state.value.arrivals.length) {
      const url = new URL(stagedNewest.thread.url);
      const first = stagedNewest.thread.posts.find((post) =>
        state.value.arrivals.includes(post.id),
      );
      if (first) url.hash = `pid${first.id}`;
      await options.openNewest(url.href);
      return;
    }
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
    busy: () => pending,
    activate,
    cancelPending,
    load,
    refresh,
    checkNewest,
    canCheck: qualified,
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
