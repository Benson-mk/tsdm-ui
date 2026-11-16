import {
  attr,
  children,
  controlDisabled,
  descendants,
  documentFrom,
  hasClass,
  label,
  safeURL,
  type Node,
} from "./html.js";
import { accountFrom, decodeThread } from "./read-thread.js";
import type {
  Account,
  ForumTransport,
  HostResponse,
  RatingForm,
  RatingPreparation,
  RatingTarget,
  RatingIntent,
  RatingResult,
} from "./types.js";

function returned(
  response: HostResponse,
  target: RatingTarget,
  action: string,
) {
  const u = new URL(response.url),
    requested = new URL(target.url);
  if (
    u.origin !== requested.origin ||
    u.pathname !== "/forum.php" ||
    u.searchParams.get("mod") !== "misc" ||
    u.searchParams.get("action") !== action ||
    u.searchParams.get("tid") !== target.threadId ||
    u.searchParams.get("pid") !== target.postId
  )
    throw Error("The rating response returned a different target.");
}
function document(response: HostResponse): Node {
  let source = response.body;
  if (/json/i.test(response.contentType)) {
    const data = JSON.parse(source);
    if (typeof data.document !== "string")
      throw Error("The rating response is unsupported.");
    source = (typeof data.head === "string" ? data.head : "") + data.document;
  } else if (/xml/i.test(response.contentType)) {
    const match =
      /^\s*(?:<\?xml[^?]*\?>\s*)?<root>\s*<!\[CDATA\[([\s\S]*)\]\]>\s*<\/root>\s*$/.exec(
        source,
      );
    if (!match || /<!DOCTYPE|<!ENTITY/.test(source))
      throw Error("The rating response is unsupported.");
    source = match[1]!;
  } else if (!/^text\/html/i.test(response.contentType))
    throw Error("The rating response is unsupported.");
  return documentFrom(source);
}
function parseForm(response: HostResponse, target: RatingTarget) {
  returned(response, target, "rate");
  const doc = document(response),
    error = descendants(
      doc,
      (n) => hasClass(n, "alert_error") || attr(n, "id") === "messagetext",
    )
      .map(label)
      .join(" ");
  if (response.status !== 200 || error)
    throw Error(error || "The forum refused this rating form.");
  const forms = descendants(
    doc,
    (n) => n.tagName === "form" && attr(n, "id") === "rateform",
  );
  const form = forms[0];
  if (
    forms.length !== 1 ||
    !form ||
    attr(form, "method").toLowerCase() !== "post"
  )
    throw Error("Rating is unavailable: the current form is unsupported.");
  const url = safeURL(attr(form, "action"), response.url),
    u = url && new URL(url),
    source = new URL(target.url);
  if (
    !u ||
    u.origin !== source.origin ||
    u.pathname !== "/forum.php" ||
    u.searchParams.get("mod") !== "misc" ||
    u.searchParams.get("action") !== "rate" ||
    u.searchParams.get("ratesubmit") !== "yes" ||
    u.searchParams.get("infloat") !== "yes" ||
    [...u.searchParams.keys()].length !== 4 ||
    [...u.searchParams.keys()].some(
      (key) => !["mod", "action", "ratesubmit", "infloat"].includes(key),
    )
  )
    throw Error("The rating form returned a different action.");
  const controls = descendants(form, (n) =>
    ["input", "textarea", "select", "button"].includes(n.tagName),
  );
  const fields: Record<string, string> = {};
  for (const n of controls) {
    const name = attr(n, "name");
    if (!name) continue;
    if (
      controlDisabled(n) ||
      Object.hasOwn(fields, name) ||
      !/^(?:formhash|tid|pid|referer|handlekey|reason|sendreasonpm|ratesubmit|score\d+)$/.test(
        name,
      )
    )
      throw Error(
        "Rating is unavailable: unfamiliar or disabled form controls.",
      );
    fields[name] =
      attr(n, "type") === "checkbox" && !n.attrs.some((a) => a.name === "value")
        ? "on"
        : attr(n, "value");
  }
  for (const name of ["formhash", "tid", "pid", "referer", "handlekey"]) {
    const control = controls.find((n) => attr(n, "name") === name);
    if (
      !control ||
      control.tagName !== "input" ||
      attr(control, "type") !== "hidden"
    )
      throw Error("The rating form authority controls are unsupported.");
  }
  for (const name of ["formhash", "tid", "pid"])
    if (!fields[name]) throw Error("The rating form is incomplete.");
  if (!Object.hasOwn(fields, "referer") || !Object.hasOwn(fields, "handlekey"))
    throw Error("The rating form is incomplete.");
  if (fields.tid !== target.threadId || fields.pid !== target.postId)
    throw Error("The rating form returned a different post.");
  const scores: RatingForm["scores"] = [];
  for (const row of descendants(form, (n) => n.tagName === "tr")) {
    const inputs = descendants(
      row,
      (n) => n.tagName === "input" && /^score\d+$/.test(attr(n, "name")),
    );
    if (!inputs.length) continue;
    const cells = children(row).filter(
        (n) => "tagName" in n && n.tagName === "td",
      ),
      match = /^(-?\d+)\s*[~～至]\s*(-?\d+)$/.exec(label(cells[2]));
    if (
      inputs.length !== 1 ||
      !["", "text"].includes(attr(inputs[0]!, "type")) ||
      attr(inputs[0]!, "value") !== "0" ||
      cells.length !== 4 ||
      !match ||
      !/^\d+$/.test(label(cells[3]))
    )
      throw Error("The rating limits could not be established.");
    const minimum = Number(match[1]),
      maximum = Number(match[2]),
      remaining = Number(label(cells[3]));
    if (
      ![minimum, maximum, remaining].every(Number.isSafeInteger) ||
      minimum > 0 ||
      maximum < 0 ||
      minimum > maximum ||
      !label(cells[0])
    )
      throw Error("The rating limits are unsupported.");
    scores.push({
      name: attr(inputs[0]!, "name"),
      label: label(cells[0]),
      minimum,
      maximum,
      remaining,
    });
  }
  const notify = controls.find((n) => attr(n, "name") === "sendreasonpm"),
    reason = controls.find((n) => attr(n, "name") === "reason"),
    submit = controls.find((n) => attr(n, "name") === "ratesubmit");
  if (
    !scores.length ||
    scores.length !==
      Object.keys(fields).filter((n) => /^score\d+$/.test(n)).length ||
    !reason ||
    reason.tagName !== "input" ||
    !["", "text"].includes(attr(reason, "type")) ||
    reason.attrs.some((a) =>
      ["maxlength", "required", "pattern"].includes(a.name),
    ) ||
    !notify ||
    attr(notify, "type") !== "checkbox" ||
    fields.sendreasonpm !== "on" ||
    !submit ||
    attr(submit, "type") !== "submit" ||
    fields.ratesubmit !== "true"
  )
    throw Error("The rating choices are incomplete.");
  return {
    url: u.href,
    fields,
    scores,
    reasons: descendants(form, (n) => attr(n, "id") === "reasonselect").flatMap(
      (list) => descendants(list, (n) => n.tagName === "li").map(label),
    ),
    notify: notify.attrs.some((a) => a.name === "checked"),
    notice: label(descendants(form, (n) => hasClass(n, "alert_info"))[0]),
  };
}
export function createRating(config: {
  origin: string;
  transport: ForumTransport;
  account: () => Account;
  generation: () => number;
  observe: (account: Account) => void;
}) {
  let sequence = 0;
  const prepared = new Map<string, RatingForm>();
  const used = new Set<string>(),
    unsettled = new Set<string>(),
    inFlight = new Set<string>();
  const key = (target: RatingTarget) =>
    `${target.accountId}:${target.threadId}:${target.postId}`;
  const same = (a: unknown, b: unknown) =>
    JSON.stringify(a) === JSON.stringify(b);
  async function log(target: RatingTarget) {
    const u = new URL(target.url);
    u.searchParams.set("action", "viewratings");
    u.searchParams.set("infloat", "yes");
    u.searchParams.set("handlekey", "viewratings");
    u.searchParams.set("inajax", "1");
    u.searchParams.set("ajaxtarget", "fwin_content_viewratings");
    u.searchParams.set("tsdmapp", "json");
    const response = await config.transport.request(u.href, { fresh: true });
    returned(response, target, "viewratings");
    if (response.status !== 200) throw Error("Rating log is unavailable.");
    if (/json/i.test(response.contentType)) {
      const data: unknown = JSON.parse(response.body);
      if (data && typeof data === "object" && "uid" in data) {
        if (
          typeof data.uid !== "number" ||
          !Number.isSafeInteger(data.uid) ||
          data.uid < 0 ||
          !("schema" in data) ||
          data.schema !== 13 ||
          !("type" in data) ||
          data.type !== "result"
        )
          throw Error("The structured rating log is unsupported.");
        config.observe(
          data.uid
            ? {
                kind: "member",
                id: String(data.uid),
                name: `Member ${data.uid}`,
              }
            : { kind: "guest" },
        );
        if (String(data.uid) !== target.accountId)
          throw Error("The account changed while checking the rating log.");
        if (
          "ok" in data &&
          data.ok === 0 &&
          "kind" in data &&
          data.kind === "handle" &&
          "message_key" in data &&
          data.message_key === "thread_rate_log_nonexistence"
        )
          return [];
        if (
          !("ok" in data) ||
          data.ok !== 1 ||
          !("kind" in data) ||
          data.kind !== "page"
        )
          throw Error("The forum did not return a qualified rating log.");
      }
    }
    const doc = document(response),
      tables = descendants(
        doc,
        (n) => n.tagName === "table" && hasClass(n, "list"),
      );
    if (tables.length !== 1) {
      if (
        /errorhandle_viewratings\('抱歉，指定帖子在近一年内没有评分记录'/.test(
          response.body,
        )
      )
        return [];
      throw Error("The rating log could not be established.");
    }
    if (descendants(doc, (n) => hasClass(n, "pg")).length)
      throw Error(
        "The rating log is paginated and cannot confirm this action.",
      );
    return descendants(tables[0]!, (n) => n.tagName === "tr").flatMap(
      (row, index) => {
        const cells = children(row).filter(
          (n) => "tagName" in n && n.tagName === "td",
        );
        if (!cells.length) return [];
        if (
          index === 0 &&
          cells.length === 4 &&
          label(cells[0]) === "积分" &&
          label(cells[2]) === "时间" &&
          descendants(row, (n) => n.tagName === "a").length === 0
        )
          return [];
        const score = /^(.+?)\s+([+-]?\d+)$/.exec(label(cells[0]));
        const links = cells[1]
          ? descendants(cells[1], (n) => n.tagName === "a")
          : [];
        const profile =
            links.length === 1
              ? safeURL(attr(links[0]!, "href"), response.url)
              : null,
          u = profile ? new URL(profile) : null,
          uid = u?.searchParams.get("uid");
        if (
          cells.length !== 4 ||
          !score ||
          !u ||
          u.origin !== new URL(target.url).origin ||
          u.pathname !== "/home.php" ||
          u.searchParams.get("mod") !== "space" ||
          !uid ||
          !/^\d+$/.test(uid) ||
          !label(cells[2])
        )
          throw Error("The rating log contains an unsupported record.");
        return [
          {
            label: score[1]!,
            value: Number(score[2]),
            actor: uid,
            time: label(cells[2]),
            reason: label(cells[3]),
          },
        ];
      },
    );
  }

  async function freshTarget(target: RatingTarget) {
    const request = new URL(target.threadURL);
    if (
      request.origin !== config.origin ||
      new URL(target.url).origin !== config.origin ||
      request.searchParams.get("tid") !== target.threadId
    )
      throw Error("The rating target is invalid.");
    request.searchParams.set("tsdmapp", "json");
    const result = decodeThread(
      await config.transport.request(request.href, { fresh: true }),
      target.threadURL,
    );
    config.observe(result.account);
    if (
      result.kind !== "thread" ||
      result.account.kind !== "member" ||
      result.account.id !== target.accountId ||
      !result.thread.posts.some(
        (p) => p.id === target.postId && p.rateURL === target.url,
      )
    )
      throw Error(
        "The account, post or rating permission changed. Nothing was sent.",
      );
  }
  async function formFor(target: RatingTarget) {
    const u = new URL(target.url);
    u.searchParams.set("infloat", "yes");
    u.searchParams.set("handlekey", "rate");
    u.searchParams.set("inajax", "1");
    u.searchParams.set("ajaxtarget", "fwin_content_rate");
    u.searchParams.set("tsdmapp", "json");
    const response = await config.transport.request(u.href, { fresh: true });
    returned(response, target, "rate");
    const doc = document(response),
      header = accountFrom(doc, response.url);
    let observed = header;
    let envelopeHash: string | null = null;
    if (/json/i.test(response.contentType)) {
      const data: unknown = JSON.parse(response.body);
      if (data && typeof data === "object" && "uid" in data) {
        if (
          typeof data.uid !== "number" ||
          !Number.isSafeInteger(data.uid) ||
          data.uid < 0 ||
          !("ok" in data) ||
          data.ok !== 1 ||
          !("schema" in data) ||
          data.schema !== 13 ||
          !("kind" in data) ||
          data.kind !== "page" ||
          !("type" in data) ||
          data.type !== "result" ||
          !("formhash" in data) ||
          typeof data.formhash !== "string" ||
          !data.formhash
        )
          throw Error("The structured rating authority is unsupported.");
        observed =
          data.uid === 0
            ? { kind: "guest" }
            : {
                kind: "member",
                id: String(data.uid),
                name: `Member ${data.uid}`,
              };
        if (
          header.kind !== "unknown" &&
          (header.kind !== "member" ||
            observed.kind !== "member" ||
            header.id !== observed.id)
        )
          throw Error("The rating account evidence conflicts.");
        envelopeHash = data.formhash;
      }
    }
    if (observed.kind !== "member" || observed.id !== target.accountId) {
      config.observe(observed);
      throw Error(
        "The account changed or could not be verified on the rating form. Nothing was sent.",
      );
    }
    config.observe(observed);
    const native = parseForm(response, target);
    if (envelopeHash !== null && native.fields.formhash !== envelopeHash)
      throw Error(
        "The rating form authority does not match the current account envelope.",
      );
    return native;
  }
  return {
    async prepare(target: RatingTarget): Promise<RatingPreparation> {
      target = { ...target };
      try {
        if (inFlight.has(key(target)))
          throw Error("This post already has a rating in progress.");
        if (unsettled.has(key(target)))
          throw Error(
            "The previous rating result is uncertain. Check the native rating log before another rating; it will not be retried.",
          );
        await freshTarget(target);
        const generation = config.generation(),
          native = await formFor(target);
        if (config.generation() !== generation)
          throw Error("The account changed while opening rating.");
        for (const [id, old] of prepared)
          if (key(old.target) === key(target)) prepared.delete(id);
        const form: RatingForm = {
          id: `rating-${++sequence}`,
          target: { ...target },
          scores: native.scores,
          reasons: native.reasons,
          notify: native.notify,
          notice: native.notice,
          generation,
        };
        prepared.set(form.id, JSON.parse(JSON.stringify(form)));
        return { kind: "ready", form };
      } catch (error) {
        return {
          kind: "unavailable",
          message:
            error instanceof Error ? error.message : "Rating is unavailable.",
        };
      }
    },
    async submit(
      offered: RatingForm,
      intent: RatingIntent,
    ): Promise<RatingResult> {
      const form: RatingForm = JSON.parse(JSON.stringify(offered));
      const submitted: RatingIntent = JSON.parse(JSON.stringify(intent));
      const result = (
        kind: RatingResult["kind"],
        message: string,
      ): RatingResult => ({
        kind,
        message,
        intent: JSON.parse(JSON.stringify(submitted)),
        target: { ...form.target },
      });
      if (
        inFlight.has(key(form.target)) ||
        used.has(form.id) ||
        !same(prepared.get(form.id), form) ||
        unsettled.has(key(form.target))
      )
        return result(
          "not-sent",
          "This rating approval is stale or already used. Nothing was sent.",
        );
      used.add(form.id);
      prepared.delete(form.id);
      inFlight.add(key(form.target));
      let sent = false;
      try {
        if (
          !same(
            Object.keys(submitted.scores).sort(),
            form.scores.map((s) => s.name).sort(),
          ) ||
          typeof submitted.reason !== "string" ||
          typeof submitted.notify !== "boolean" ||
          !form.scores.some((s) => submitted.scores[s.name] !== 0) ||
          form.scores.some((s) => {
            const n = submitted.scores[s.name]!;
            return (
              !Number.isSafeInteger(n) ||
              n < s.minimum ||
              n > s.maximum ||
              Math.abs(n) > s.remaining
            );
          })
        )
          throw Error(
            "Choose a nonzero whole-number rating within the current range and daily allowance. Nothing was sent.",
          );
        if (config.generation() !== form.generation)
          throw Error("The account changed. Reopen rating; nothing was sent.");
        await freshTarget(form.target);
        const current = await formFor(form.target);
        if (
          !same(current.scores, form.scores) ||
          !same(current.reasons, form.reasons) ||
          current.notify !== form.notify ||
          current.notice !== form.notice
        )
          throw Error(
            "The rating choices or allowance changed. Reopen rating; nothing was sent.",
          );
        const before = await log(form.target);
        await freshTarget(form.target);
        if (config.generation() !== form.generation)
          throw Error("The account changed. Nothing was sent.");
        const body = new URLSearchParams(current.fields);
        for (const score of form.scores)
          body.set(score.name, String(submitted.scores[score.name]));
        body.set("reason", submitted.reason);
        if (!submitted.notify) body.delete("sendreasonpm");
        unsettled.add(key(form.target));
        sent = true;
        const response = await config.transport.request(current.url, {
          method: "POST",
          body: body.toString(),
        });
        const postURL = new URL(response.url),
          expectedURL = new URL(current.url);
        if (
          postURL.origin !== expectedURL.origin ||
          postURL.pathname !== expectedURL.pathname ||
          postURL.searchParams.get("action") !== "rate"
        )
          throw Error("The rating response returned an unfamiliar action.");
        const doc = document(response),
          rejection =
            descendants(doc, (n) => hasClass(n, "alert_error"))
              .map(label)
              .join(" ") ||
            /errorhandle_rate\('([^']+)'/.exec(response.body)?.[1];
        if (rejection) {
          unsettled.delete(key(form.target));
          return result("rejected", `Rating rejected: ${rejection}`);
        }
        if (response.status !== 200)
          throw Error("The rating response was not confirmed.");
        const after = await log(form.target),
          remaining = [...after];
        for (const old of before) {
          const index = remaining.findIndex((row) => same(row, old));
          if (index < 0) throw Error("Rating history changed ambiguously.");
          remaining.splice(index, 1);
        }
        const expected = form.scores.filter(
          (s) => submitted.scores[s.name] !== 0,
        );
        if (
          remaining.length !== expected.length ||
          !expected.every(
            (s) =>
              remaining.filter(
                (row) =>
                  row.actor === form.target.accountId &&
                  row.label === s.label &&
                  row.value === submitted.scores[s.name] &&
                  row.reason === submitted.reason.trim(),
              ).length === 1,
          )
        )
          throw Error(
            "The exact new rating could not be independently confirmed.",
          );
        unsettled.delete(key(form.target));
        return result(
          "confirmed",
          "Rating confirmed by a fresh forum rating log.",
        );
      } catch (error) {
        return result(
          sent ? "uncertain" : "not-sent",
          sent
            ? "Rating result uncertain. The forum may have applied it. Check the native rating log; this rating will not be retried."
            : error instanceof Error
              ? error.message
              : "Rating was not sent.",
        );
      } finally {
        inFlight.delete(key(form.target));
      }
    },
  };
}
