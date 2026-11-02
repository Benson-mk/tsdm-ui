import {
  attr,
  controlDisabled,
  descendants,
  documentFrom,
  safeURL,
  type Node,
} from "./html.js";
import { decodeThread } from "./read-thread.js";
import { decodeBoard } from "./read-board.js";
import { decodeFavorites } from "./favorites.js";
import type {
  Account,
  FavoriteAttempt,
  FavoriteCommand,
  FavoriteIntent,
  FavoritePreparation,
  Favorites,
  ForumTransport,
  HostResponse,
} from "./types.js";
const reason = (error: unknown) =>
  error instanceof TypeError
    ? "The forum could not be reached. Retry or continue in the native forum."
    : error instanceof Error && error.message
      ? error.message
      : "The favorite list is unavailable.";
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const actor = (account: Account) =>
  account.kind === "member" ? account.id : null;
const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
function document(response: HostResponse): Node {
  let source = response.body;
  if (/json/i.test(response.contentType)) {
    const value: unknown = JSON.parse(source);
    if (
      !value ||
      typeof value !== "object" ||
      !("document" in value) ||
      typeof value.document !== "string"
    )
      throw Error();
    source =
      ("head" in value && typeof value.head === "string" ? value.head : "") +
      value.document;
  } else if (/xml/i.test(response.contentType)) {
    const match =
      /^\s*(?:<\?xml[^?]*\?>\s*)?<root>\s*<!\[CDATA\[([\s\S]*)\]\]>\s*<\/root>\s*$/.exec(
        source,
      );
    if (!match || /<!DOCTYPE|<!ENTITY/.test(source)) throw Error();
    source = match[1]!;
  }
  return documentFrom(source);
}
export function createFavoriteCommands(config: {
  origin: string;
  transport: ForumTransport;
  account: () => Account;
  generation: () => number;
  observe: (account: Account) => void;
}) {
  const outcomes = new Map<string, FavoriteAttempt>();
  type Authorization = {
    previousAttemptId: string | undefined;
    unresolvedIds: string[];
  };
  const prepared = new Map<
      string,
      { command: FavoriteCommand; authorization: Authorization }
    >(),
    used = new Set<string>(),
    pending = new Set<string>();
  const listURL = (kind: string) =>
    `${config.origin}/home.php?mod=space&do=favorite&type=${kind}`;
  const targetURL = (intent: FavoriteIntent) =>
    `${config.origin}/forum.php?mod=${intent.kind === "forum" ? `forumdisplay&fid=${intent.targetId}` : `viewthread&tid=${intent.targetId}`}`;
  const lock = (intent: FavoriteIntent) =>
    `${intent.accountId}:${intent.kind}:${intent.targetId}`;
  const unresolved = (intent: FavoriteIntent) =>
    [...outcomes.values()].filter(
      (attempt) =>
        attempt.status === "uncertain" &&
        lock(attempt.command.intent) === lock(intent),
    );
  function authorized(intent: FavoriteIntent, authorization: Authorization) {
    const unknown = unresolved(intent);
    return (
      unknown.every(
        (attempt) =>
          attempt.checked && authorization.unresolvedIds.includes(attempt.id),
      ) &&
      (!unknown.length ||
        unknown.some(
          (attempt) =>
            attempt.id === authorization.previousAttemptId &&
            same(attempt.command.intent, intent),
        ))
    );
  }
  const valid = (intent: FavoriteIntent) =>
    ["thread", "forum"].includes(intent.kind) &&
    ["add", "remove"].includes(intent.action) &&
    /^[1-9]\d*$/.test(intent.targetId) &&
    /^[1-9]\d*$/.test(intent.accountId) &&
    (intent.action === "add"
      ? intent.recordId === null
      : /^[1-9]\d*$/.test(intent.recordId ?? ""));
  async function scan(intent: FavoriteIntent): Promise<Favorites[]> {
    const urls = [listURL(intent.kind)],
      visited = new Set<string>(),
      pages: Favorites[] = [];
    let generation = config.generation();
    const initiallyUnknown = config.account().kind === "unknown";
    while (urls.length) {
      const url = urls.shift()!;
      if (visited.has(url)) continue;
      visited.add(url);
      if (visited.size > 100)
        throw Error(
          "Complete result checking exceeded 100 returned pages. No absence is confirmed.",
        );
      const request = new URL(url);
      request.searchParams.set("tsdmapp", "json");
      const response = await config.transport.request(request.href, {
        fresh: true,
      });
      if (config.generation() !== generation)
        throw Error("The account changed during favorite readback.");
      const decoded = decodeFavorites(response, url);
      config.observe(decoded.account);
      if (
        initiallyUnknown &&
        pages.length === 0 &&
        actor(decoded.account) === intent.accountId
      )
        generation = config.generation();
      if (
        config.generation() !== generation ||
        actor(decoded.account) !== intent.accountId
      )
        throw Error("The favorite account changed or could not be confirmed.");
      if (decoded.kind !== "favorites")
        throw Error(
          "message" in decoded
            ? decoded.message
            : "The favorite list is unavailable.",
        );
      pages.push(decoded.favorites);
      for (const link of decoded.favorites.pages.links)
        if (!visited.has(link.url)) urls.push(link.url);
    }
    return pages;
  }
  function presence(intent: FavoriteIntent, pages: Favorites[]) {
    const rows = pages.flatMap((p) => p.records),
      target = rows.filter((r) => r.targetId === intent.targetId),
      record = intent.recordId && rows.find((r) => r.id === intent.recordId);
    if (record && record.targetId !== intent.targetId)
      throw Error("Favorite record identity no longer matches its target.");
    return intent.action === "add"
      ? target.length > 0
      : !record && target.length === 0;
  }
  async function requestFor(
    command: FavoriteCommand,
  ): Promise<{ url: string; method?: "POST"; body?: string }> {
    const intent = command.intent,
      generation = config.generation();
    if (intent.action === "add") {
      const url = new URL(targetURL(intent));
      url.searchParams.set("tsdmapp", "json");
      const response = await config.transport.request(url.href, {
        fresh: true,
      });
      if (config.generation() !== generation)
        throw Error("The account changed before favorite preparation.");
      const decoded =
        intent.kind === "forum"
          ? decodeBoard(response, targetURL(intent))
          : decodeThread(response, targetURL(intent));
      config.observe(decoded.account);
      if (
        actor(decoded.account) !== intent.accountId ||
        config.generation() !== generation ||
        !["board", "thread"].includes(decoded.kind)
      )
        throw Error(
          "The current favorite target/account could not be confirmed.",
        );
      const doc = document(response),
        controls = descendants(
          doc,
          (n) =>
            attr(n, "id") ===
            (intent.kind === "forum" ? "a_favorite" : "k_favorite"),
        );
      if (controls.length !== 1)
        throw Error("A current native favorite control is not available.");
      let parent: Node | null = controls[0]!;
      while (parent) {
        if (
          /^(?:postmessage_|quote)/.test(attr(parent, "id")) ||
          ["hidden", "inert", "disabled"].some(
            (key) =>
              "attrs" in parent! && parent!.attrs.some((a) => a.name === key),
          )
        )
          throw Error("The favorite control is not an active native control.");
        parent = "parentNode" in parent ? parent.parentNode : null;
      }
      const href = safeURL(attr(controls[0]!, "href"), response.url);
      if (!href) throw Error("The native favorite destination is unavailable.");
      const offered = new URL(href),
        q = offered.searchParams;
      if (
        offered.origin !== config.origin ||
        offered.pathname !== "/home.php" ||
        q.get("mod") !== "spacecp" ||
        q.get("ac") !== "favorite" ||
        q.get("type") !== intent.kind ||
        q.get("id") !== intent.targetId ||
        !q.get("formhash") ||
        [...q.keys()].some(
          (k) =>
            !["mod", "ac", "type", "id", "formhash", "handlekey"].includes(k) ||
            q.getAll(k).length !== 1,
        )
      )
        throw Error("The current native favorite action is unsupported.");
      offered.searchParams.set("inajax", "1");
      offered.searchParams.set("infloat", "yes");
      offered.searchParams.set("handlekey", q.get("handlekey") ?? "k_favorite");
      return { url: offered.href };
    }
    const url = new URL("/home.php", config.origin);
    for (const [key, value] of Object.entries({
      mod: "spacecp",
      ac: "favorite",
      op: "delete",
      favid: intent.recordId!,
      infloat: "yes",
      handlekey: `a_delete_${intent.recordId}`,
      inajax: "1",
    }))
      url.searchParams.set(key, value);
    const response = await config.transport.request(url.href, { fresh: true });
    if (
      config.generation() !== generation ||
      response.status !== 200 ||
      response.redirect === "followed"
    )
      throw Error("The current favorite removal form is unavailable.");
    const doc = document(response),
      forms = descendants(doc, (n) => n.tagName === "form");
    if (forms.length !== 1)
      throw Error("The current favorite removal form is unavailable.");
    const form = forms[0]!,
      href = safeURL(attr(form, "action"), response.url);
    if (
      !href ||
      attr(form, "method").toLowerCase() !== "post" ||
      attr(form, "target") ||
      (attr(form, "enctype") &&
        attr(form, "enctype") !== "application/x-www-form-urlencoded")
    )
      throw Error("Unsupported favorite removal form.");
    const action = new URL(href),
      q = action.searchParams;
    if (
      action.origin !== config.origin ||
      action.pathname !== "/home.php" ||
      q.get("mod") !== "spacecp" ||
      q.get("ac") !== "favorite" ||
      q.get("op") !== "delete" ||
      q.get("favid") !== intent.recordId ||
      [...q.keys()].some(
        (k) =>
          !["mod", "ac", "op", "favid", "type"].includes(k) ||
          q.getAll(k).length !== 1,
      )
    )
      throw Error("The removal form does not identify this favorite record.");
    const controls = descendants(form, (n) =>
        ["input", "textarea", "select", "button"].includes(n.tagName),
      ),
      pairs: [string, string][] = [];
    for (const n of controls) {
      const name = attr(n, "name"),
        type = attr(n, "type");
      if (
        attr(n, "form") ||
        n.attrs.some((a) => a.name.startsWith("form")) ||
        controlDisabled(n)
      )
        throw Error("The removal form contains unsupported controls.");
      if (type === "submit" || n.tagName === "button") continue;
      if (
        !["referer", "deletesubmit", "formhash", "handlekey"].includes(name) ||
        type !== "hidden" ||
        pairs.some(([key]) => key === name)
      )
        throw Error("The removal form contains unsupported controls.");
      pairs.push([name, attr(n, "value")]);
    }
    const data = new URLSearchParams(pairs);
    if (
      !data.get("formhash") ||
      data.get("deletesubmit") !== "true" ||
      data.get("handlekey") !== `a_delete_${intent.recordId}`
    )
      throw Error("The removal form is incomplete.");
    action.searchParams.set("inajax", "1");
    return { url: action.href, method: "POST", body: data.toString() };
  }
  async function verify(attempt: FavoriteAttempt): Promise<FavoriteAttempt> {
    attempt = clone(attempt);
    try {
      if (!valid(attempt.command.intent))
        throw Error("The original favorite attempt is invalid.");
      const pages = await scan(attempt.command.intent),
        matched = presence(attempt.command.intent, pages);
      if (!matched)
        throw Error(
          "The desired favorite presence/absence is not established. No action was resent.",
        );
      return {
        ...attempt,
        status: "confirmed",
        checked: true,
        message:
          attempt.command.intent.action === "add"
            ? "Confirmed favorite present."
            : "Confirmed favorite absent.",
        pages,
      };
    } catch (error) {
      return {
        ...attempt,
        status: attempt.status === "confirmed" ? "confirmed" : "uncertain",
        checked: true,
        message:
          attempt.status === "confirmed"
            ? `Previous confirmation retained. This recheck is inconclusive. ${reason(error)}`
            : `Favorite result is uncertain. ${reason(error)}`,
      };
    }
  }
  async function check(attempt: FavoriteAttempt): Promise<FavoriteAttempt> {
    const result = await verify(attempt);
    outcomes.set(result.id, clone(result));
    return result;
  }
  return {
    async prepare(
      intent: FavoriteIntent,
      previousAttemptId?: string,
    ): Promise<FavoritePreparation> {
      intent = clone(intent);
      const authorization: Authorization = {
        previousAttemptId,
        unresolvedIds: unresolved(intent).map((attempt) => attempt.id),
      };
      if (!authorized(intent, authorization))
        return {
          kind: "unavailable",
          message:
            "Check the original uncertain attempt and explicitly authorize a new attempt first.",
        };
      if (!valid(intent) || actor(config.account()) !== intent.accountId)
        return {
          kind: "unavailable",
          message: "A current member and valid favorite target are required.",
        };
      try {
        const pages = await scan(intent),
          command: FavoriteCommand = {
            id: crypto.randomUUID(),
            generation: config.generation(),
            intent,
          };
        if (presence(intent, pages))
          return {
            kind: "already",
            message:
              intent.action === "add" ? "Already saved." : "Already absent.",
            pages,
          };
        if (
          intent.action === "remove" &&
          !pages
            .flatMap((p) => p.records)
            .some((r) => r.id === intent.recordId && r.removable)
        )
          throw Error("The favorite cannot currently be removed.");
        await requestFor(command);
        if (
          command.generation !== config.generation() ||
          actor(config.account()) !== intent.accountId
        )
          throw Error("The account changed during preparation.");
        if (!authorized(intent, authorization))
          throw Error(
            "Check the original uncertain attempt and explicitly authorize a new attempt first.",
          );
        prepared.set(command.id, { command: clone(command), authorization });
        return { kind: "ready", command };
      } catch (error) {
        return { kind: "unavailable", message: reason(error) };
      }
    },
    async execute(attempt: FavoriteAttempt): Promise<FavoriteAttempt> {
      attempt = clone(attempt);
      const command = attempt.command,
        known = prepared.get(command.id),
        key = lock(command.intent);
      const refuse = (message: string): FavoriteAttempt => ({
        ...attempt,
        status: "not-sent",
        message,
      });
      if (
        !known ||
        !same(known.command, command) ||
        !authorized(command.intent, known.authorization) ||
        attempt.status !== "pending" ||
        used.has(attempt.id) ||
        pending.has(key) ||
        config.generation() !== command.generation ||
        actor(config.account()) !== command.intent.accountId
      )
        return refuse(
          "This favorite preparation/account is stale or already active. Nothing was sent.",
        );
      used.add(attempt.id);
      pending.add(key);
      prepared.delete(command.id);
      let sent = false;
      try {
        const pages = await scan(command.intent);
        if (presence(command.intent, pages))
          return {
            ...attempt,
            status: "confirmed",
            checked: true,
            pages,
            message:
              command.intent.action === "add"
                ? "Already saved."
                : "Already absent.",
          };
        const request = await requestFor(command);
        if (
          config.generation() !== command.generation ||
          actor(config.account()) !== command.intent.accountId
        )
          return refuse("The account changed before send. Nothing was sent.");
        if (!authorized(command.intent, known.authorization))
          return refuse(
            "This favorite preparation/account is stale or already active. Nothing was sent.",
          );
        outcomes.set(attempt.id, { ...attempt, status: "uncertain" });
        sent = true;
        await config.transport.request(request.url, {
          fresh: true,
          ...(request.method
            ? { method: request.method, body: request.body }
            : {}),
        });
        if (config.generation() !== command.generation)
          return {
            ...attempt,
            status: "uncertain",
            message:
              "The account changed while the favorite action was in flight. Possible effects remain uncertain.",
          };
        return await check({ ...attempt, status: "uncertain" });
      } catch (error) {
        if (sent) outcomes.set(attempt.id, { ...attempt, status: "uncertain" });
        return sent
          ? {
              ...attempt,
              status: "uncertain",
              message:
                "The response was lost. The favorite may have changed; check result before considering a new attempt.",
            }
          : refuse(`Favorite preflight failed before send. ${reason(error)}`);
      } finally {
        pending.delete(key);
      }
    },
    check,
  };
}
