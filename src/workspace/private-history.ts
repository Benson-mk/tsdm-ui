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
};
const actor = (account: Account) =>
  account.kind === "member" ? account.id : account.kind;
export function createPrivateHistory(
  client: ForumClient,
  options: {
    busy(): boolean;
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
  });
  const retained = new Map<string, PrivateResult>();
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
    const same = !!result && nextKey === key && !!state.value.result;
    cancelPending();
    key = nextKey;
    if (!result) {
      state.value = {
        result: null,
        loading: null,
        failure: null,
        failedDirection: null,
      };
      return false;
    }
    const cached = retain ? retained.get(key) : null;
    const chosen =
      cached &&
      actor(cached.account) === actor(result.account) &&
      cached.conversation.peerId === result.conversation.peerId
        ? cached
        : result;
    retained.set(key, chosen);
    state.value = {
      result: chosen,
      loading: null,
      failure: null,
      failedDirection: null,
    };
    return same;
  }
  function clear() {
    retained.clear();
    activate(null, "");
  }
  async function load(direction: Direction) {
    const prior = state.value.result,
      url = prior?.conversation[direction]?.url;
    if (!prior || !url || pending || options.busy()) return;
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
    const complete = messages.length === result.conversation.totalCount;
    const merged: PrivateResult = {
      ...prior,
      conversation: {
        ...prior.conversation,
        messages,
        targetMissing: prior.conversation.target
          ? !messages.some(
              (message) => message.id === prior.conversation.target,
            )
          : prior.conversation.targetMissing,
        totalCount: result.conversation.totalCount,
        [direction]: result.conversation[direction],
        pages: {
          ...prior.conversation.pages,
          links: [
            ...new Map(
              [
                ...prior.conversation.pages.links,
                ...result.conversation.pages.links,
              ].map((link) => [link.url, link]),
            ).values(),
          ],
        },
        beginning: complete || prior.conversation.beginning,
        end: complete || prior.conversation.end,
      },
    };
    retained.set(key, merged);
    state.value = {
      result: merged,
      loading: null,
      failure: null,
      failedDirection: null,
    };
    await options.restore(position);
  }
  function target(id: string) {
    const prior = state.value.result;
    if (!prior) return;
    const result = {
      ...prior,
      conversation: { ...prior.conversation, target: id, targetMissing: false },
    };
    retained.set(key, result);
    state.value = { ...state.value, result };
  }
  return {
    state: readonly(state),
    activate,
    cancelPending,
    clear,
    load,
    target,
  };
}
