import {
  attr,
  children,
  controlDisabled,
  descendants,
  documentFrom,
  hasClass,
  label,
  safeURL,
} from "./html.js";
import { accountFrom, decodeThread } from "./read-thread.js";
import type {
  Account,
  ForumTransport,
  ReportForm,
  ReportTarget,
  ReportPreparation,
  ReportIntent,
  ReportResult,
} from "./types.js";

// This is the observed inert generator, not executable code. Only the bounded
// literal array may vary; unfamiliar generator semantics require native handling.
const generator =
  "var reasonstring = '';\nfor (i=0; i<reasons.length; i++) {\nreasonstring += '<label><input type=\"radio\" name=\"report_select\" class=\"pr\" onclick=\"' + (i < reasons.length -1 ? '$(\\'report_message\\').innerHTML=this.value;' : '') + '$(\\'report_other\\').style.display=\\'' + (i < reasons.length -1 ? 'none' : '') + '\\';$(\\'report_msg\\').style.display=\\'' + (i < reasons.length -1 ? 'none' : '') + '\\'\" value=\"' + reasons[i] + '\"> ' + reasons[i] + '</label><br />';\n}\n$('report_reasons').innerHTML = reasonstring;";
function reasonsFrom(source: string) {
  const match =
    /^\s*var reasons = \[('[^'"&\\<>\r\n]{1,200}'(?:,\s*'[^'"&\\<>\r\n]{1,200}'){1,19})\];\s*([\s\S]*)$/.exec(
      source,
    );
  if (!match || match[2]!.trim() !== generator)
    throw Error(
      "Reporting is unavailable: the native reason generator is unsupported.",
    );
  const reasons = [...match[1]!.matchAll(/'([^']+)'/g)].map((m) => m[1]!);
  if (new Set(reasons).size !== reasons.length)
    throw Error("The report reasons are ambiguous.");
  return reasons;
}
export function createReport(config: {
  origin: string;
  transport: ForumTransport;
  generation: () => number;
  observe: (account: Account) => void;
}) {
  let sequence = 0;
  const prepared = new Map<string, ReportForm>();
  const inFlight = new Set<string>(),
    unsettled = new Set<string>();
  const key = (target: ReportTarget) =>
    `${target.accountId}:${target.threadId}:${target.postId}`;
  const same = (a: unknown, b: unknown) =>
    JSON.stringify(a) === JSON.stringify(b);
  async function freshTarget(target: ReportTarget) {
    const u = new URL(target.threadURL),
      action = new URL(target.url);
    if (
      u.origin !== config.origin ||
      action.origin !== config.origin ||
      u.searchParams.get("tid") !== target.threadId ||
      action.searchParams.get("fid") !== target.boardId
    )
      throw Error("The report target is invalid.");
    u.searchParams.set("tsdmapp", "json");
    const read = decodeThread(
      await config.transport.request(u.href, { fresh: true }),
      target.threadURL,
    );
    config.observe(read.account);
    if (
      read.kind !== "thread" ||
      read.account.kind !== "member" ||
      read.account.id !== target.accountId ||
      !read.thread.posts.some(
        (p) => p.id === target.postId && p.reportURL === target.url,
      )
    )
      throw Error(
        "The account, post or report permission changed. Nothing was sent.",
      );
  }
  async function formFor(target: ReportTarget) {
    const u = new URL(target.url),
      handle = `miscreport${target.postId}`;
    u.searchParams.set("infloat", "yes");
    u.searchParams.set("handlekey", handle);
    u.searchParams.set("inajax", "1");
    u.searchParams.set("ajaxtarget", `fwin_content_${handle}`);
    u.searchParams.set("tsdmapp", "json");
    const response = await config.transport.request(u.href, { fresh: true }),
      returned = new URL(response.url);
    if (
      returned.origin !== u.origin ||
      returned.pathname !== "/misc.php" ||
      ["mod", "rtype", "rid", "tid", "fid"].some(
        (k) => returned.searchParams.get(k) !== u.searchParams.get(k),
      )
    )
      throw Error("The report response returned a different target.");
    if (response.status !== 200 || !/json/i.test(response.contentType))
      throw Error("The report form response is unsupported.");
    const data = JSON.parse(response.body);
    if (
      data.ok !== 1 ||
      data.type !== "result" ||
      data.schema !== 13 ||
      data.kind !== "page" ||
      !Number.isSafeInteger(data.uid) ||
      data.uid < 0 ||
      typeof data.formhash !== "string" ||
      !data.formhash ||
      typeof data.document !== "string"
    )
      throw Error("The structured report authority is unsupported.");
    const actor: Account = data.uid
      ? { kind: "member", id: String(data.uid), name: `Member ${data.uid}` }
      : { kind: "guest" };
    config.observe(actor);
    if (actor.kind !== "member" || actor.id !== target.accountId)
      throw Error("The account changed on the report form. Nothing was sent.");
    const doc = documentFrom(data.document),
      errors = descendants(
        doc,
        (n) => hasClass(n, "alert_error") || attr(n, "id") === "messagetext",
      )
        .map(label)
        .join(" ");
    if (errors) throw Error(errors);
    const header = accountFrom(doc, response.url);
    if (
      header.kind !== "unknown" &&
      (header.kind !== "member" || header.id !== target.accountId)
    )
      throw Error("The report account evidence conflicts.");
    const forms = descendants(doc, (n) => n.tagName === "form");
    const form = forms[0];
    if (
      forms.length !== 1 ||
      !form ||
      attr(form, "id") !== `form_${handle}` ||
      attr(form, "method").toLowerCase() !== "post" ||
      attr(form, "onsubmit") !==
        `if(!$('report_message').value) return false;ajaxpost(this.id, 'form_${handle}');`
    )
      throw Error("Reporting is unavailable: the native form is unsupported.");
    const action = safeURL(attr(form, "action"), response.url);
    if (action !== `${config.origin}/misc.php?mod=report`)
      throw Error("The report form returned a different action.");
    const controls = descendants(form, (n) =>
      ["input", "textarea", "select", "button"].includes(n.tagName),
    );
    const fields: Record<string, string> = {};
    const hidden = [
      "referer",
      "reportsubmit",
      "rtype",
      "rid",
      "fid",
      "url",
      "inajax",
      "handlekey",
      "formhash",
    ];
    for (const n of controls) {
      const name = attr(n, "name");
      if (controlDisabled(n))
        throw Error("The report form has disabled controls.");
      if (!name) {
        if (
          n.tagName !== "button" ||
          attr(n, "id") !== "report_submit" ||
          attr(n, "type") !== "submit" ||
          attr(n, "value") !== "true"
        )
          throw Error("The report submit control is unsupported.");
        continue;
      }
      if (Object.hasOwn(fields, name))
        throw Error("The report controls are ambiguous.");
      if (name === "message") {
        if (
          n.tagName !== "textarea" ||
          attr(n, "id") !== "report_message" ||
          n.attrs.some((a) =>
            ["maxlength", "required", "pattern"].includes(a.name),
          )
        )
          throw Error("The report content control is unsupported.");
      } else if (
        !hidden.includes(name) ||
        n.tagName !== "input" ||
        attr(n, "type") !== "hidden"
      )
        throw Error("The report form contains unsupported controls.");
      fields[name] = attr(n, "value");
    }
    if (
      hidden.some((k) => !Object.hasOwn(fields, k)) ||
      !Object.hasOwn(fields, "message") ||
      controls.length !== 11 ||
      fields.formhash !== data.formhash ||
      fields.reportsubmit !== "true" ||
      fields.rtype !== "post" ||
      fields.rid !== target.postId ||
      fields.fid !== target.boardId ||
      fields.inajax !== "1" ||
      fields.handlekey !== handle
    )
      throw Error("The report form authority or target does not match.");
    for (const id of ["report_reasons", "report_other", "report_msg"])
      if (descendants(form, (n) => attr(n, "id") === id).length !== 1)
        throw Error("The report choices are incomplete.");
    const scripts = descendants(doc, (n) => n.tagName === "script").map((n) =>
      children(n)
        .map((c) => ("value" in c ? c.value : ""))
        .join(""),
    );
    const generators = scripts.filter((s) =>
      /report_reasons|var reasons\s*=/.test(s),
    );
    if (generators.length !== 1)
      throw Error("The report reasons are ambiguous.");
    const reasons = reasonsFrom(generators[0]!);
    const counter = descendants(form, (n) => attr(n, "id") === "checklen"),
      message = controls.find((n) => attr(n, "name") === "message")!;
    if (
      counter.length !== 1 ||
      label(counter[0]) !== "200" ||
      attr(message, "onkeyup") !== "dstrLenCalc(this, 'checklen');"
    )
      throw Error("The native report content limit is unsupported.");
    return { url: action, fields, reasons };
  }
  return {
    async prepare(target: ReportTarget): Promise<ReportPreparation> {
      target = { ...target };
      try {
        if (inFlight.has(key(target)))
          throw Error("This report is already in progress.");
        if (unsettled.has(key(target)))
          throw Error(
            "The previous report result is uncertain. It will not be retried; use the native forum to investigate before reporting again.",
          );
        await freshTarget(target);
        const generation = config.generation(),
          native = await formFor(target);
        if (config.generation() !== generation)
          throw Error("The account changed while opening report.");
        for (const [id, old] of prepared)
          if (same(old.target, target)) prepared.delete(id);
        const form: ReportForm = {
          id: `report-${++sequence}`,
          target,
          reasons: native.reasons,
          maximum: 200,
          generation,
        };
        prepared.set(form.id, JSON.parse(JSON.stringify(form)));
        return { kind: "ready", form };
      } catch (error) {
        return {
          kind: "unavailable",
          message:
            error instanceof Error
              ? error.message
              : "Reporting is unavailable.",
        };
      }
    },
    async submit(
      offered: ReportForm,
      intent: ReportIntent,
    ): Promise<ReportResult> {
      const form: ReportForm = JSON.parse(JSON.stringify(offered)),
        submitted: ReportIntent = JSON.parse(JSON.stringify(intent));
      const result = (
        kind: ReportResult["kind"],
        message: string,
      ): ReportResult => ({
        kind,
        message,
        target: { ...form.target },
        intent: { ...submitted },
      });
      if (
        !same(prepared.get(form.id), form) ||
        inFlight.has(key(form.target)) ||
        unsettled.has(key(form.target))
      )
        return result(
          "not-sent",
          "This report approval is stale or already used. Nothing was sent.",
        );
      prepared.delete(form.id);
      inFlight.add(key(form.target));
      let sent = false;
      try {
        if (
          typeof submitted.message !== "string" ||
          !submitted.message.trim() ||
          Array.from(submitted.message).length > form.maximum ||
          !form.reasons.includes(submitted.reason) ||
          (submitted.reason !== form.reasons.at(-1) &&
            submitted.message !== submitted.reason)
        )
          throw Error(
            "Choose supported report content within the current limit. Nothing was sent.",
          );
        if (config.generation() !== form.generation)
          throw Error("The account changed. Reopen report; nothing was sent.");
        await freshTarget(form.target);
        const current = await formFor(form.target);
        if (!same(current.reasons, form.reasons))
          throw Error(
            "The report choices changed. Reopen report; nothing was sent.",
          );
        await freshTarget(form.target);
        if (config.generation() !== form.generation)
          throw Error("The account changed. Nothing was sent.");
        const body = new URLSearchParams(current.fields);
        body.set("message", submitted.message);
        body.set("report_select", submitted.reason);
        unsettled.add(key(form.target));
        sent = true;
        const response = await config.transport.request(current.url, {
          method: "POST",
          body: body.toString(),
          fresh: true,
        });
        // A plain native error is a refusal, not proof of a stored report. Ambiguous,
        // redirected, structured or success-looking responses remain uncertain.
        if (
          response.status === 200 &&
          response.url === current.url &&
          /^text\/html/i.test(response.contentType)
        ) {
          const doc = documentFrom(response.body),
            errors = descendants(doc, (n) => hasClass(n, "alert_error")),
            success = descendants(doc, (n) => hasClass(n, "alert_right"));
          if (
            errors.length === 1 &&
            label(errors[0]) &&
            success.length === 0 &&
            descendants(
              doc,
              (n) => n.tagName === "form" || n.tagName === "script",
            ).length === 0
          ) {
            unsettled.delete(key(form.target));
            return result("rejected", `Report rejected: ${label(errors[0])}`);
          }
        }
        return result(
          "uncertain",
          "Report result uncertain. Independent report status is unavailable. The forum may have received it; it will not be retried.",
        );
      } catch (error) {
        return result(
          sent ? "uncertain" : "not-sent",
          sent
            ? "Report result uncertain. Independent report status is unavailable. The forum may have received it; it will not be retried."
            : error instanceof Error
              ? error.message
              : "Report was not sent.",
        );
      } finally {
        inFlight.delete(key(form.target));
      }
    },
  };
}
