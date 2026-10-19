import {
  attr,
  byId,
  children,
  descendants,
  documentFrom,
  hasClass,
  label,
  safeURL,
  type Element,
  type Node,
} from "./html.js";
import { accountFrom } from "./read-thread.js";
import { cleanURL, routeFor } from "./routes.js";
import type {
  Account,
  HostResponse,
  ReadResult,
  SearchCriteria,
  SearchField,
  SearchForm,
  SearchRow,
} from "./types.js";
type Decoded = ReadResult extends infer R
  ? R extends ReadResult
    ? Omit<R, "generation">
    : never
  : never;
const namedLabels: Record<string, string> = {
  srchtxt: "Keywords",
  srchuname: "Author",
  srchfrom: "Time range",
  before: "Time relation",
  orderby: "Order",
  ascdesc: "Direction",
  "srchfid[]": "Boards",
  srchfilter: "Search scope",
  "special[]": "Thread types",
  seltableid: "Search index",
};
const has = (node: Element, name: string) =>
  node.attrs.some((a) => a.name === name);
function disabled(node: Element): boolean {
  if (has(node, "disabled")) return true;
  let parent = node.parentNode;
  while (parent && "tagName" in parent) {
    if (
      ["fieldset", "optgroup"].includes(parent.tagName) &&
      has(parent, "disabled")
    )
      return true;
    parent = parent.parentNode;
  }
  return false;
}
const selected = (node: Element) =>
  has(node, "selected") || has(node, "checked");
function hidden(node: Element): boolean {
  let current: Node | null = node;
  while (current && "tagName" in current) {
    if (
      has(current, "hidden") ||
      /(?:^|;)\s*display\s*:\s*none\s*(?:;|$)/i.test(attr(current, "style"))
    )
      return true;
    current = current.parentNode;
  }
  return false;
}
function fieldLabel(
  node: Element,
  doc: Node,
): Pick<SearchField, "label" | "labelFromForum"> {
  const linked = descendants(
    doc,
    (n) =>
      n.tagName === "label" &&
      attr(n, "for") === attr(node, "id") &&
      Boolean(attr(node, "id")),
  )[0];
  return {
    label: linked
      ? label(linked)
      : (namedLabels[attr(node, "name")] ?? attr(node, "name")),
    labelFromForum: Boolean(linked),
  };
}
function failure(
  requested: string,
  message: string,
  account: Account = { kind: "unknown" },
  nativeText?: string | null,
): Decoded {
  return {
    kind: "invalid",
    message,
    account,
    sourceURL: requested,
    ...(nativeText !== undefined ? { nativeText } : {}),
  };
}
/** Current native search HTML omits UID links but declares its actor in the
 * direct head bootstrap. Interpret only its observed literal declaration; never
 * execute scripts or search result bodies for UID-shaped text. */
function nativeSearchAccount(doc: Node, base: string): Account | null {
  const head = descendants(doc, (node) => node.tagName === "head")[0];
  if (!head) return null;
  const bootstraps = children(head)
    .filter(
      (node) =>
        "tagName" in node && node.tagName === "script" && !has(node, "src"),
    )
    .map((node) =>
      children(node)
        .map((child) => ("value" in child ? child.value : ""))
        .join(""),
    )
    .filter((source) => /^\s*var\s+STYLEID\s*=/.test(source));
  if (!bootstraps.length) return null;
  const unknown: Account = { kind: "unknown" };
  if (bootstraps.length !== 1) return unknown;
  const source = bootstraps[0]!.replace(/^\s*var\s+/, "");
  const literal =
    /\s*([A-Za-z_$][\w$]*)\s*=\s*(?:'([^'\\\r\n]*)'|"([^"\\\r\n]*)")\s*([,;])/gy;
  const fields = new Map<string, string>();
  let end: number;
  while (true) {
    const match = literal.exec(source);
    if (!match || fields.has(match[1]!)) return unknown;
    fields.set(match[1]!, match[2] ?? match[3]!);
    end = literal.lastIndex;
    if (match[4] === ";") break;
  }
  if (
    source.slice(end).trim() ||
    [...fields.keys()].slice(0, 6).join(",") !==
      "STYLEID,STATICURL,IMGDIR,VERHASH,charset,discuz_uid"
  )
    return unknown;
  const uid = fields.get("discuz_uid") ?? "";
  if (
    !/^(?:0|[1-9]\d*)$/.test(uid) ||
    !Number.isSafeInteger(Number(uid)) ||
    fields.get("SITEURL") !== `${new URL(base).origin}/`
  )
    return unknown;
  return uid === "0"
    ? { kind: "guest" }
    : { kind: "member", id: uid, name: `Member ${uid}` };
}
function responseDocument(
  response: HostResponse,
  requested: string,
): { doc: Node; account: Account } | null {
  try {
    if (
      new URL(response.url).origin !== new URL(requested).origin ||
      !/^(?:text\/html|application\/(?:json|[^;]+\+json))(?:;|$)/i.test(
        response.contentType,
      )
    )
      return null;
    let source = response.body;
    let envelopeAccount: Account | null = null;
    if (/json/i.test(response.contentType) || /^\s*\{/.test(source)) {
      const payload: unknown = JSON.parse(source);
      if (
        !payload ||
        typeof payload !== "object" ||
        !("document" in payload) ||
        typeof payload.document !== "string"
      )
        return null;
      if (
        "uid" in payload &&
        typeof payload.uid === "number" &&
        Number.isSafeInteger(payload.uid) &&
        payload.uid >= 0
      )
        envelopeAccount =
          payload.uid === 0
            ? { kind: "guest" }
            : {
                kind: "member",
                id: String(payload.uid),
                name: `Member ${payload.uid}`,
              };
      source = `${"head" in payload && typeof payload.head === "string" ? payload.head : ""}${payload.document}`;
    }
    const doc = documentFrom(source);
    const headerAccount = accountFrom(doc, response.url);
    const nativeAccount = nativeSearchAccount(doc, response.url);
    const observed = [headerAccount, envelopeAccount, nativeAccount].filter(
      (value): value is Account => value !== null && value.kind !== "unknown",
    );
    const preferred = observed[0] ?? { kind: "unknown" };
    const conflict =
      nativeAccount?.kind === "unknown" ||
      observed.some(
        (value) =>
          value.kind !== preferred.kind ||
          (value.kind === "member" &&
            preferred.kind === "member" &&
            value.id !== preferred.id),
      );
    return { doc, account: conflict ? { kind: "unknown" } : preferred };
  } catch {
    return null;
  }
}
function searchFailure(
  doc: Node,
  response: HostResponse,
  requested: string,
  account: Account,
): Decoded | null {
  const message = label(byId(doc, "messagetext") ?? byId(doc, "main_message"));
  const title = label(descendants(doc, (n) => n.tagName === "title")[0]);
  const fail = (
    kind:
      | "login"
      | "permission"
      | "challenge"
      | "throttle"
      | "cost"
      | "expired"
      | "invalid",
    explanation: string,
    nativeText?: string | null,
  ): Decoded => ({
    kind,
    message: explanation,
    account,
    sourceURL: requested,
    ...(nativeText !== undefined ? { nativeText } : {}),
  });
  if (
    byId(doc, "challenge-form") ||
    byId(doc, "cf-challenge-running") ||
    /Just a moment|Checking your browser|安全验证|驗證您的瀏覽器/i.test(title)
  )
    return fail(
      "challenge",
      "Native verification is required before another deliberate search.",
    );
  if (
    response.status === 401 ||
    account.kind === "guest" ||
    /未登录|未登錄|先登录|先登錄|登录后|登入後/.test(message)
  )
    return fail(
      "login",
      "Sign in through the native forum before another deliberate search.",
    );
  if (/过期|過期|失效|expired/i.test(message))
    return fail(
      "expired",
      "Search results expired. Your criteria are retained; rerun explicitly if you accept possible credits or quota use.",
    );
  if (
    /积分|積分|金币|金幣|天使币|天使幣|花费|花費|credits?|cost/i.test(message)
  )
    return fail("cost", `Search cost restriction: ${message}`, message);
  if (
    response.status === 429 ||
    /秒内|秒內|频繁|頻繁|间隔|間隔|稍后|稍後|throttl|frequency|rate limit/i.test(
      message,
    )
  )
    return fail(
      "throttle",
      `Search frequency restriction: ${message || "The forum is limiting requests. Retry explicitly later."}`,
      message || null,
    );
  if (response.status === 403 || /权限|權限|用户组|用戶組|無權/.test(message))
    return fail(
      "permission",
      `Search permission denied: ${message || "The current account cannot search."}`,
      message || null,
    );
  if (response.status < 200 || response.status >= 300 || message)
    return fail(
      "invalid",
      `The search response could not be interpreted: ${message || "Unexpected HTTP response."}`,
      message || null,
    );
  return null;
}
function formFrom(
  doc: Node,
  requested: string,
): { form: SearchForm; node: Element } | null {
  const forms = descendants(
    doc,
    (n) =>
      n.tagName === "form" &&
      descendants(n, (c) => attr(c, "name") === "srchuname").length > 0,
  );
  if (forms.length !== 1) return null;
  const form = forms[0]!;
  const action = safeURL(attr(form, "action"), requested);
  if (
    !action ||
    new URL(action).origin !== new URL(requested).origin ||
    new URL(action).pathname !== "/search.php" ||
    new URL(action).searchParams.get("mod") !== "forum" ||
    attr(form, "method").toLowerCase() !== "post" ||
    [...new URL(action).searchParams].some(
      ([name, value]) => name !== "mod" || value !== "forum",
    ) ||
    (attr(form, "enctype") !== "" &&
      attr(form, "enctype").toLowerCase() !==
        "application/x-www-form-urlencoded")
  )
    return null;
  const controls = descendants(form, (n) =>
    ["input", "select", "textarea", "button"].includes(n.tagName),
  );
  const activeControls = controls.filter((node) => !disabled(node));
  for (const name of ["formhash", "searchsubmit"]) {
    const values = activeControls.filter((node) => attr(node, "name") === name);
    if (
      values.length !== 1 ||
      attr(values[0]!, "type") !== "hidden" ||
      !attr(values[0]!, "value") ||
      (name === "searchsubmit" && attr(values[0]!, "value") !== "yes")
    )
      return null;
  }
  const seen = new Map<string, string>();
  for (const node of activeControls) {
    if (
      ["formaction", "formmethod", "formenctype"].some((name) =>
        has(node, name),
      )
    )
      return null;
    const name = attr(node, "name"),
      type = attr(node, "type") || "text";
    if (
      !name ||
      node.tagName === "button" ||
      ["submit", "button"].includes(type)
    )
      continue;
    if (
      node.tagName === "textarea" ||
      (node.tagName === "input" &&
        !["text", "hidden", "radio", "checkbox"].includes(type))
    )
      return null;
    const shape = node.tagName === "select" ? "select" : type;
    const previous = seen.get(name);
    if (
      previous &&
      (!["radio", "checkbox"].includes(shape) || previous !== shape)
    )
      return null;
    seen.set(name, shape);
  }
  const fields: SearchField[] = [];
  for (const node of descendants(form, (n) =>
    ["input", "select", "textarea"].includes(n.tagName),
  )) {
    const name = attr(node, "name"),
      type = attr(node, "type") || "text";
    if (!name || ["submit", "button"].includes(type)) continue;
    if (
      type === "hidden" &&
      ["formhash", "searchsubmit", "seltableid"].includes(name)
    )
      continue;
    if (name === "seltableid" && hidden(node)) continue;
    if (!Object.hasOwn(namedLabels, name) && !disabled(node)) return null;
    if (
      disabled(node) &&
      fields.some((field) => field.name === name && !field.disabled)
    )
      continue;
    const choices = ["checkbox", "radio"].includes(type),
      existing = choices && fields.find((field) => field.name === name);
    const choice = {
      value: attr(node, "value"),
      label: label(node.parentNode ?? node) || attr(node, "value"),
      disabled: disabled(node),
    };
    if (existing) {
      existing.options.push(choice);
      if (selected(node) && !disabled(node))
        existing.values.push(attr(node, "value"));
      continue;
    }
    const options =
      node.tagName === "select"
        ? descendants(node, (n) => n.tagName === "option").map((option) => ({
            value: has(option, "value") ? attr(option, "value") : label(option),
            label: label(option),
            disabled: disabled(option),
            selected: selected(option),
          }))
        : [];
    const values =
      node.tagName === "select"
        ? options.filter((o) => o.selected && !o.disabled).map((o) => o.value)
        : choices
          ? selected(node) && !disabled(node)
            ? [attr(node, "value")]
            : []
          : [attr(node, "value")];
    const multiple = type === "checkbox" || has(node, "multiple");
    if (node.tagName === "select" && !multiple && !values.length) {
      const first = options.find((o) => !o.disabled);
      if (first) values.push(first.value);
    }
    fields.push({
      name,
      ...fieldLabel(node, doc),
      kind: node.tagName === "select" ? "select" : choices ? "choices" : "text",
      multiple,
      disabled: disabled(node),
      readOnly: has(node, "readonly"),
      maxLength: /^\d+$/.test(attr(node, "maxlength"))
        ? Number(attr(node, "maxlength"))
        : null,
      options: choices
        ? [choice]
        : options.map(({ value, label, disabled }) => ({
            value,
            label,
            disabled,
          })),
      values,
    });
  }
  const restrictions = descendants(
    form,
    (n) => hasClass(n, "search-restrictions") || hasClass(n, "xg1"),
  )
    .map(label)
    .filter(Boolean);
  return {
    form: { url: cleanURL(requested), fields, restrictions },
    node: form,
  };
}
export function decodeSearchForm(
  response: HostResponse,
  requested: string,
): Decoded {
  const document = responseDocument(response, requested);
  if (!document)
    return failure(
      requested,
      "The search form response could not be displayed reliably.",
    );
  const { doc, account } = document;
  const blocked = searchFailure(doc, response, requested, account);
  if (blocked) return blocked;
  const parsed = formFrom(doc, requested);
  if (!parsed)
    return failure(
      requested,
      "The current advanced search form is unavailable. Continue in the native forum.",
      account,
    );
  return {
    kind: "search",
    account,
    sourceURL: cleanURL(requested),
    search: {
      form: parsed.form,
      edited: Object.fromEntries(
        parsed.form.fields
          .filter((f) => !f.disabled)
          .map((f) => [f.name, f.values]),
      ),
      effective: null,
      submitted: null,
      results: null,
    },
  };
}
export function prepareSearchRequest(
  response: HostResponse,
  requested: string,
  criteria: SearchCriteria,
):
  | Decoded
  | {
      kind: "prepared";
      form: SearchForm;
      account: Account;
      url: string;
      body: string;
    } {
  const decoded = decodeSearchForm(response, requested);
  if (decoded.kind !== "search") return decoded;
  const { doc } = responseDocument(response, requested)!,
    parsed = formFrom(doc, requested)!;
  const reject = (message: string, nativeText?: string | null) =>
    failure(requested, message, decoded.account, nativeText);
  if (!criteria.srchtxt?.[0]?.trim() && !criteria.srchuname?.[0]?.trim())
    return reject("Enter keywords or an author before searching.");
  const active = parsed.form.fields.filter((f) => !f.disabled);
  if (
    Object.keys(criteria).some(
      (name) => !active.some((f) => f.name === name),
    ) ||
    active.some((field) => !Object.hasOwn(criteria, field.name))
  )
    return reject(
      "Search controls changed. Refresh the form and review your criteria.",
    );
  for (const field of active) {
    const values = criteria[field.name] ?? field.values;
    if (
      (field.readOnly &&
        JSON.stringify(values) !== JSON.stringify(field.values)) ||
      (!field.multiple && values.length > 1) ||
      new Set(values).size !== values.length ||
      (field.kind === "text"
        ? values.length !== 1 ||
          (field.maxLength !== null && values[0]!.length > field.maxLength)
        : values.some(
            (value) =>
              !field.options.some((o) => !o.disabled && o.value === value),
          ))
    )
      return reject(
        `The current ${field.label} restriction does not allow this value. Review your criteria.`,
        field.labelFromForum === false ? null : field.label,
      );
  }
  const pairs: [string, string][] = [];
  for (const node of descendants(parsed.node, (n) =>
    ["input", "select"].includes(n.tagName),
  )) {
    const name = attr(node, "name"),
      type = attr(node, "type") || "text";
    if (!name || disabled(node) || ["button", "submit"].includes(type))
      continue;
    if (type === "hidden") {
      pairs.push([name, attr(node, "value")]);
      continue;
    }
    const values =
      name === "seltableid" && hidden(node)
        ? descendants(
            node,
            (n) => n.tagName === "option" && selected(n) && !disabled(n),
          ).map((n) => attr(n, "value"))
        : (criteria[name] ?? active.find((f) => f.name === name)?.values ?? []);
    if (node.tagName === "select")
      for (const option of descendants(node, (n) => n.tagName === "option")) {
        const value = has(option, "value")
          ? attr(option, "value")
          : label(option);
        if (!disabled(option) && values.includes(value))
          pairs.push([name, value]);
      }
    else if (["checkbox", "radio"].includes(type)) {
      if (values.includes(attr(node, "value")))
        pairs.push([name, attr(node, "value")]);
    } else pairs.push([name, values[0] ?? ""]);
  }
  const url = new URL(attr(parsed.node, "action"), requested);
  url.searchParams.set("tsdmapp", "json");
  return {
    kind: "prepared",
    form: parsed.form,
    account: decoded.account,
    url: url.href,
    body: new URLSearchParams(pairs).toString(),
  };
}
export function decodeSearchResults(
  response: HostResponse,
  requested: string,
  form: SearchForm,
  criteria: SearchCriteria,
): Decoded {
  const document = responseDocument(response, requested);
  if (!document)
    return failure(
      requested,
      "The search result could not be displayed reliably. The request may still have used credits or quota.",
    );
  const { doc, account } = document;
  const blocked = searchFailure(doc, response, requested, account);
  if (blocked) return blocked;
  const reject = (message: string) => failure(requested, message, account);
  const resultLinks = [
    response.url,
    ...descendants(doc, (n) => n.tagName === "a")
      .map((n) => safeURL(attr(n, "href"), response.url))
      .filter((u): u is string => u !== null),
  ]
    .map((u) => routeFor(u))
    .filter(
      (r) =>
        r?.kind === "search" &&
        r.url.origin === new URL(requested).origin &&
        r.url.searchParams.has("searchid"),
    );
  const canonical = resultLinks[0];
  if (!canonical)
    return reject(
      "The forum did not return a usable search identity. It will not be searched again automatically.",
    );
  const id = canonical.url.searchParams.get("searchid")!,
    container = byId(doc, "threadlist");
  const nodes = container
    ? descendants(container, (n) => n.tagName === "li")
    : [];
  const rows = nodes.map((node): SearchRow | null => {
    const heading = descendants(node, (n) => n.tagName === "h3")[0];
    const subject =
      heading && descendants(heading, (n) => n.tagName === "a")[0];
    const raw = subject && safeURL(attr(subject, "href"), response.url),
      route = raw && routeFor(raw);
    const links = descendants(node, (n) => n.tagName === "a");
    const author = links.find((n) => {
      const u = safeURL(attr(n, "href"), response.url);
      return (
        u &&
        new URL(u).pathname === "/home.php" &&
        new URL(u).searchParams.get("mod") === "space" &&
        /^[1-9]\d*$/.test(new URL(u).searchParams.get("uid") ?? "")
      );
    });
    const board = links.find((n) => {
      const u = safeURL(attr(n, "href"), response.url);
      return u && routeFor(u)?.kind === "board";
    });
    const paragraphs = children(node).filter(
      (n): n is Element => "tagName" in n && n.tagName === "p",
    );
    if (
      !hasClass(node, "pbw") ||
      !subject ||
      !route ||
      route.kind !== "thread" ||
      route.url.origin !== new URL(requested).origin ||
      !author ||
      !board ||
      !label(subject)
    )
      return null;
    const metadata = paragraphs.at(-1),
      date = metadata && descendants(metadata, (n) => n.tagName === "span")[0];
    return {
      id: route.url.searchParams.get("tid")!,
      url: route.url.href,
      label: label(subject),
      author: {
        label: label(author),
        url: safeURL(attr(author, "href"), response.url)!,
      },
      board: {
        label: label(board),
        url: safeURL(attr(board, "href"), response.url)!,
      },
      date: label(date),
      snippet: label(paragraphs[1]),
      stats: label(paragraphs[0]),
    };
  });
  const heading = descendants(doc, (n) => hasClass(n, "sttl"))[0],
    summary = label(
      heading && descendants(heading, (n) => n.tagName === "em")[0],
    );
  const empty = descendants(doc, (n) => hasClass(n, "emp"))
    .map(label)
    .some((value) =>
      /没有找到匹配结果|沒有找到匹配結果|no (?:matching|results)/i.test(value),
    );
  const zero =
    /(?:内容|內容|主题|主題)\s*0\s*个|0\s+(?:results|matches)/i.test(summary) &&
    empty &&
    nodes.length === 0;
  if ((!rows.length && !zero) || rows.some((r) => !r))
    return reject(
      "The search contains unrecognized or incomplete results. It has not been treated as zero matches.",
    );
  const pager = descendants(doc, (n) => hasClass(n, "pg"))[0];
  const pageLinks = pager
    ? descendants(pager, (n) => n.tagName === "a").map((n) => ({
        label: label(n),
        url: safeURL(attr(n, "href"), response.url) ?? "",
      }))
    : [];
  if (
    pageLinks.some((link) => {
      const r = routeFor(link.url);
      return (
        r?.kind !== "search" ||
        r.url.origin !== new URL(requested).origin ||
        r.url.searchParams.get("searchid") !== id
      );
    })
  )
    return reject("The search contains an unsupported result-page link.");
  const effective = { ...criteria };
  for (const name of ["orderby", "ascdesc"]) {
    const value = canonical.url.searchParams.get(name);
    if (value !== null) effective[name] = [value];
  }
  const url = cleanURL(response.url).includes("searchid=")
    ? cleanURL(response.url)
    : canonical.url.href;
  return {
    kind: "search",
    account,
    sourceURL: url,
    search: {
      form,
      edited: criteria,
      effective,
      submitted: criteria,
      results: {
        id,
        url,
        summary,
        rows: rows.filter((r) => r !== null),
        pages: {
          current:
            label(
              pager && descendants(pager, (n) => n.tagName === "strong")[0],
            ) || "1",
          links: pageLinks,
        },
      },
    },
  };
}
