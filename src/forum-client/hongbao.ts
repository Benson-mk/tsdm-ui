import { findMention, type MentionConfig } from "./mentions.js";
import {
  attr,
  children,
  descendants,
  documentFrom,
  hasClass,
  label,
  safeURL,
} from "./html.js";
import { accountFrom } from "./read-thread.js";
import type { Account, RedPacketLedger } from "./types.js";
import type {
  ForumTransport,
  PreparedWriting,
  RedPacketObservation,
} from "./types.js";

/** Form-provided syntax/limits only. Backend validation may be stricter. */
export function validRedPacket(writing: PreparedWriting): boolean {
  if (!writing.redPacket) return true;
  const fields = writing.options.filter((o) => o.name.startsWith("hb_"));
  const value = (name: string) =>
    fields.find((o) => o.name === name)?.value ?? "";
  if (fields.length !== 8 || new Set(fields.map((o) => o.name)).size !== 8)
    return false;
  for (const field of fields) {
    if (
      field.disabled ||
      (field.maxLength !== null && field.value.length > field.maxLength)
    )
      return false;
    if (
      field.kind === "select" &&
      !field.choices.some((c) => c.value === field.value && !c.disabled)
    )
      return false;
    if (["hb_total", "hb_shares"].includes(field.name)) {
      if (
        !/^\d+$/.test(field.value) ||
        !Number.isSafeInteger(Number(field.value))
      )
        return false;
      const n = Number(field.value),
        min = Number(field.minimum),
        step = Number(field.step);
      if (
        !Number.isSafeInteger(min) ||
        min < 1 ||
        !Number.isSafeInteger(step) ||
        step < 1 ||
        n < min ||
        (n - min) % step !== 0
      )
        return false;
      if (
        field.maximum !== undefined &&
        (!Number.isSafeInteger(Number(field.maximum)) ||
          n > Number(field.maximum))
      )
        return false;
    }
  }
  const perShare = writing.redPacket.hints
    .map((h) => /每份至少\s*(\d+)/.exec(h)?.[1])
    .filter(Boolean);
  if (perShare.length !== 1 || !Number.isSafeInteger(Number(perShare[0])))
    return false;
  return (
    Number(value("hb_total")) >=
    Number(value("hb_shares")) * Number(perShare[0])
  );
}

/** Read-only status. Presence flags do not prove exact secret/recipient preservation or funding. */
export async function observeRedPacket(
  transport: ForumTransport,
  origin: string,
  threadId: string,
): Promise<RedPacketObservation> {
  const unknown: RedPacketObservation = {
    state: "unknown",
    conditions: [],
    credit: "unknown",
  };
  const url = new URL("/plugin.php", origin);
  url.searchParams.set("id", "hongbao:open");
  url.searchParams.set("tid", threadId);
  try {
    const response = await transport.request(url.href, { fresh: true });
    if (
      response.status !== 200 ||
      new URL(response.url).origin !== origin ||
      !/^application\/json(?:;|$)/i.test(response.contentType)
    )
      return unknown;
    const data: unknown = JSON.parse(response.body);
    if (!data || typeof data !== "object" || !("ok" in data)) return unknown;
    if (data.ok === false && "error" in data && data.error === "這裡沒有紅包")
      return { ...unknown, state: "absent" };
    if (
      data.ok !== true ||
      !("tid" in data) ||
      String(data.tid) !== threadId ||
      !("state" in data) ||
      typeof data.state !== "string" ||
      ![
        "open",
        "claimed",
        "done",
        "withdrawn",
        "expired",
        "closed",
        "unknown",
      ].includes(data.state)
    )
      return unknown;
    const conditions: string[] = [];
    for (const [field, caption] of [
      ["cond", "Reply required"],
      ["haspw", "Passphrase present"],
      ["appoint", "Designated recipients present"],
    ]) {
      if (!(field! in data)) return unknown;
      const v = Reflect.get(data, field!);
      if (v !== 0 && v !== 1) return unknown;
      conditions.push(`${caption}: ${v === 1 ? "yes" : "no"}`);
    }
    if (
      !("splitmode" in data) ||
      ![1, 2].includes(Number(data.splitmode)) ||
      !("bless" in data) ||
      typeof data.bless !== "string"
    )
      return unknown;
    conditions.push(
      `Split: ${Number(data.splitmode) === 1 ? "random" : "equal"}`,
      `Greeting: ${data.bless}`,
    );
    return { state: data.state, conditions, credit: "unknown" };
  } catch {
    return unknown;
  }
}

/** Returned credit rows lack packet identity. Never turn them into an attributed debit/refund. */
export async function observePacketLedger(
  transport: ForumTransport,
  origin: string,
  accountId: string,
): Promise<{ ledger: RedPacketLedger; account: Account }> {
  const unavailable: RedPacketLedger = { state: "unavailable", rows: [] };
  const url = new URL("/home.php?mod=spacecp&ac=credit&op=log", origin);
  try {
    const response = await transport.request(url.href, { fresh: true });
    if (
      response.status !== 200 ||
      new URL(response.url).origin !== origin ||
      !/^text\/html(?:;|$)/i.test(response.contentType)
    )
      return { ledger: unavailable, account: { kind: "unknown" } };
    const doc = documentFrom(response.body),
      account = accountFrom(doc, response.url);
    if (account.kind !== "member" || account.id !== accountId)
      return { ledger: unavailable, account };
    const tables = descendants(
      doc,
      (n) => n.tagName === "table" && hasClass(n, "dt"),
    );
    const table = tables.find((n) => {
      const h = descendants(n, (c) => c.tagName === "th").map(label);
      return (
        h.length === 5 &&
        /操作/.test(h[0]!) &&
        /积分变更|積分變更/.test(h[1]!) &&
        /变更时间|變更時間/.test(h[4]!)
      );
    });
    if (!table) return { ledger: unavailable, account };
    const rows: RedPacketLedger["rows"] = [];
    for (const row of descendants(table, (n) => n.tagName === "tr")) {
      const cells = children(row).filter(
        (n) => "tagName" in n && n.tagName === "td",
      );
      if (cells.length !== 5) continue;
      const a = descendants(cells[0]!, (n) => n.tagName === "a")[0];
      const href = a && safeURL(attr(a, "href"), url.href);
      if (!href) continue;
      const target = new URL(href),
        operation = target.searchParams.get("optype");
      if (
        target.origin !== origin ||
        target.pathname !== "/home.php" ||
        target.searchParams.get("mod") !== "spacecp" ||
        target.searchParams.get("ac") !== "credit" ||
        target.searchParams.get("op") !== "log" ||
        !["HBS", "HBR", "HBG"].includes(operation ?? "")
      )
        continue;
      if (operation !== "HBS" && operation !== "HBR" && operation !== "HBG")
        continue;
      rows.push({
        operation,
        change: label(cells[1]),
        details: label(cells[3]),
        time: label(cells[4]),
      });
    }
    return { ledger: { state: "observed", rows }, account };
  } catch {
    return { ledger: unavailable, account: { kind: "unknown" } };
  }
}

export async function recipientsCurrent(
  config: MentionConfig,
  writing: PreparedWriting,
): Promise<boolean> {
  if (!writing.redPacket) return true;
  const input =
    writing.options.find((o) => o.name === "hb_appoint")?.value ?? "";
  if (!input.trim()) return true;
  const names = input.split(",").map((n) => n.trim());
  if (
    names.some((n) => !n || /[\r\n]/.test(n)) ||
    new Set(names).size !== names.length
  )
    return false;
  for (const name of names) {
    const found = await findMention(config, writing, name);
    if (
      found.kind !== "people" ||
      found.people.filter((p) => p.name === name).length !== 1
    )
      return false;
  }
  return true;
}
