import { readonly, shallowRef } from "vue";
import type { Account, ForumClient, ReadResult } from "../forum-client";
type BoardResult = Extract<ReadResult, { kind: "board" }>;
const actor = (account: Account) =>
  account.kind === "member" ? `member:${account.id}` : account.kind;
function context(value: string) {
  const url = new URL(value);
  url.hash = "";
  url.searchParams.delete("page");
  url.searchParams.sort();
  return url.href;
}
/** One visible board observation; staged rows are never navigation snapshots. */
export function createBoardChecks(
  client: ForumClient,
  options: {
    busy(): boolean;
    owned(): boolean;
    observe(account: Account): void;
    reveal(result: BoardResult, apply: () => void): void;
  },
) {
  const state = shallowRef({
    checking: false,
    checkedAt: null as number | null,
    arrivals: [] as string[],
    failure: null as ReadResult | null,
    baseline: false,
    automatic: false,
    paused: false,
    retryMinutes: 0,
  });
  let original: BoardResult | null = null;
  let staged: BoardResult | null = null;
  let seen = new Set<string>();
  let established = false;
  let epoch = 0;
  let pending = false;
  let visible = false;
  let nextCheck = 0;
  let retryAfter = 0;
  let failures = 0;
  const cadence = 120_000;
  function activate(result: BoardResult | null) {
    if (result === original) return;
    epoch++;
    original = result;
    staged = null;
    nextCheck = Date.now() + cadence;
    retryAfter = 0;
    failures = 0;
    seen = new Set(result?.board.threads.map((row) => row.id));
    established = result?.board.pages.current === "1";
    state.value = {
      ...state.value,
      checking: false,
      checkedAt: null,
      arrivals: [],
      failure: null,
      baseline: false,
      retryMinutes: 0,
    };
  }
  function target() {
    if (!original || original.account.kind === "unknown") return null;
    const board = original.board;
    if (!board.threads.length && !board.empty) return null;
    if (board.pages.current === "1") return board.url;
    return (
      board.pages.links.find(
        (link) =>
          (new URL(link.url).searchParams.get("page") ?? "1") === "1" &&
          context(link.url) === context(board.url),
      )?.url ?? null
    );
  }
  async function check(automatic = false) {
    const prior = original,
      url = target();
    if (
      !prior ||
      !url ||
      pending ||
      options.busy() ||
      options.owned() ||
      Date.now() < retryAfter
    )
      return;
    const current = epoch;
    pending = true;
    state.value = { ...state.value, checking: true, failure: null };
    const result = await client.readPage(url, { fresh: true });
    pending = false;
    if (current !== epoch || options.busy() || (automatic && !visible)) {
      if (current === epoch) state.value = { ...state.value, checking: false };
      return;
    }
    options.observe(result.account);
    if (current !== epoch) return;
    if (result.kind === "stale") {
      state.value = { ...state.value, checking: false };
      return;
    }
    if (
      result.kind !== "board" ||
      actor(prior.account) !== actor(result.account) ||
      context(result.board.url) !== context(prior.board.url) ||
      result.board.pages.current !== "1"
    ) {
      failures++;
      retryAfter = Date.now() + Math.min(30, 2 ** failures) * 60_000;
      state.value = {
        ...state.value,
        checking: false,
        retryMinutes: Math.min(30, 2 ** failures),
        failure:
          result.kind === "board"
            ? {
                kind: "invalid",
                account: result.account,
                generation: result.generation,
                sourceURL: url,
                message:
                  "The returned check did not match this board, account, filter, order or first page.",
              }
            : result,
      };
      return;
    }
    failures = 0;
    retryAfter = 0;
    nextCheck = Date.now() + cadence;
    staged = {
      ...result,
      board: {
        ...result.board,
        threads: [
          ...new Map(result.board.threads.map((row) => [row.id, row])).values(),
        ],
      },
    };
    const ids = new Set(staged.board.threads.map((row) => row.id));
    const added = established
      ? staged.board.threads
          .filter((row) => !seen.has(row.id))
          .map((row) => row.id)
      : [];
    state.value = {
      ...state.value,
      checking: false,
      checkedAt: Date.now(),
      retryMinutes: 0,
      baseline: !established,
      arrivals: [...new Set([...state.value.arrivals, ...added])].filter((id) =>
        ids.has(id),
      ),
    };
    established = true;
    for (const id of ids) seen.add(id);
  }
  function reveal() {
    const result = staged,
      current = epoch;
    if (!result || !state.value.arrivals.length || pending || options.busy())
      return;
    options.reveal(result, () => {
      if (current !== epoch) return;
      original = result;
      state.value = { ...state.value, arrivals: [], baseline: false };
    });
  }
  function observeAccount(account: Account) {
    if (!original || actor(original.account) === actor(account)) return;
    staged = null;
    established = false;
    seen = new Set(original.board.threads.map((row) => row.id));
    state.value = {
      ...state.value,
      arrivals: [],
      baseline: false,
      failure: {
        kind: "invalid",
        account,
        generation: original.generation,
        sourceURL: original.board.url,
        message:
          "The forum account changed or could not be confirmed. Check this board deliberately before resuming automatic checks.",
      },
    };
  }
  function setAutomatic(enabled: boolean) {
    state.value = { ...state.value, automatic: enabled, paused: false };
    nextCheck = Date.now() + cadence;
  }
  function tick(isVisible: boolean) {
    visible = isVisible;
    const now = Date.now();
    const paused = !visible || options.busy() || !target();
    const retryMinutes = Math.max(0, Math.ceil((retryAfter - now) / 60_000));
    if (state.value.paused && !paused) nextCheck = now + cadence;
    if (
      state.value.paused !== paused ||
      state.value.retryMinutes !== retryMinutes
    )
      state.value = { ...state.value, paused, retryMinutes };
    if (paused) {
      nextCheck = now + cadence;
      return;
    }
    // Another visible reader owns this request turn. Keep the due deadline;
    // resetting it here would starve boards behind a two-minute thread check.
    if (
      !state.value.automatic ||
      state.value.failure ||
      pending ||
      options.owned()
    )
      return;
    if (now >= nextCheck) {
      nextCheck = now + cadence;
      void check(true);
    }
  }
  return {
    state: readonly(state),
    activate,
    check,
    reveal,
    tick,
    setAutomatic,
    observeAccount,
    canCheck: () => !!target(),
    busy: () => pending,
    cancelPending: () => {
      epoch++;
      state.value = { ...state.value, checking: false };
    },
  };
}
