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
function readingContext(result: ThreadResult) {
  const url = new URL(result.thread.url);
  return [
    url.origin,
    result.thread.id,
    url.searchParams.get("authorid") ?? "",
    url.searchParams.get("ordertype") ?? "0",
    actor(result.account),
  ].join("|");
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
    capture(): ViewPosition | null;
    restore(position: ViewPosition | null): Promise<void>;
    observe(account: Account): void;
  },
) {
  const state = shallowRef<{
    result: ThreadResult | null;
    earlier: HistoryBoundary;
    later: HistoryBoundary;
    latest: string | null;
  }>({
    result: null,
    earlier: boundary(undefined, "earlier"),
    later: boundary(undefined, "later"),
    latest: null,
  });
  let epoch = 0;
  let pending = false;
  let key = "";
  let pages = new Set<string>();
  let postPages = new Map<string, string>();
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
    key = nextKey;
    postPages = new Map(
      result?.kind === "thread"
        ? result.thread.posts.map((post) => [post.id, result.thread.url])
        : [],
    );
    pages = new Set(
      result?.kind === "thread" ? [result.thread.pages.current] : [],
    );
    state.value = {
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
    };
    await options.restore(position);
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
    target,
    sourceFor: (postId: string) => postPages.get(postId) ?? null,
  };
}
