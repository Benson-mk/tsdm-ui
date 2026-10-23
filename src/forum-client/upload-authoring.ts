import {
  attr,
  children,
  descendants,
  documentFrom,
  text,
  type Node,
} from "./html.js";
import { decodeWriting } from "./prepare-writing.js";
import type {
  ForumTransport,
  HostResponse,
  PreparedWriting,
  UploadFile,
  UploadCancellation,
  UploadResult,
} from "./types.js";

/** Read literal native configuration as inert data; no remote program executes. */
function stripComments(source: string): string {
  let out = "",
    quote = "",
    escape = false;
  for (let i = 0; i < source.length; i++) {
    const c = source[i]!;
    if (quote) {
      out += c;
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === quote) quote = "";
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      out += c;
      continue;
    }
    if (source.slice(i, i + 2) === "//") {
      while (i < source.length && !/[\r\n]/.test(source[i]!)) i++;
      out += "\n";
      continue;
    }
    if (source.slice(i, i + 2) === "/*") {
      const end = source.indexOf("*/", i + 2);
      if (end < 0) throw Error();
      i = end + 1;
      out += " ";
      continue;
    }
    out += c;
  }
  return out;
}
function objectFields(source: string): Map<string, string> | null {
  source = stripComments(source);
  const out = new Map<string, string>();
  let start = 0;
  let quote = "";
  let escape = false;
  const stack: string[] = [];
  const add = (end: number) => {
    const part = source.slice(start, end).trim();
    if (!part) return true;
    const m =
      /^(?:([A-Za-z_$][\w$]*)|'([^'\\]*)'|"([^"\\]*)")\s*:([\s\S]+)$/.exec(
        part,
      );
    if (!m) return false;
    const key = m[1] ?? m[2] ?? m[3]!;
    if (out.has(key) || out.size > 80) return false;
    out.set(key, m[4]!.trim());
    return true;
  };
  for (let i = 0; i < source.length; i++) {
    const c = source[i]!;
    if (quote) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === quote) quote = "";
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      continue;
    }
    if (
      c === "`" ||
      source.slice(i, i + 2) === "/*" ||
      source.slice(i, i + 2) === "//"
    )
      return null;
    if ("{[(".includes(c)) {
      stack.push(c);
      if (stack.length > 16) return null;
    } else if ("}])".includes(c)) {
      if (stack.pop() !== { "}": "{", "]": "[", ")": "(" }[c]) return null;
    } else if (c === "," && !stack.length) {
      if (!add(i)) return null;
      start = i + 1;
    }
  }
  return !quote && !stack.length && add(source.length) ? out : null;
}
function literal(v: string | undefined): string | null {
  const m = /^(['"])([^\\\r\n]*)\1$/.exec(v ?? "");
  return m && !m[2]!.includes(m[1]!) ? m[2]! : null;
}
function number(v: string | undefined): number | null {
  return /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(v ?? "") &&
    Number.isFinite(Number(v))
    ? Number(v)
    : null;
}
function nested(v: string | undefined) {
  return v?.startsWith("{") && v.endsWith("}")
    ? objectFields(v.slice(1, -1))
    : null;
}
function source(response: HostResponse): string {
  if (/json/i.test(response.contentType)) {
    const v: unknown = JSON.parse(response.body);
    if (
      !v ||
      typeof v !== "object" ||
      !("document" in v) ||
      typeof v.document !== "string"
    )
      throw Error();
    return (
      ("head" in v && typeof v.head === "string" ? v.head : "") + v.document
    );
  }
  return response.body;
}
function raw(node: Node): string {
  return "value" in node ? node.value : children(node).map(raw).join("");
}
function profile(response: HostResponse, w: PreparedWriting) {
  const doc = documentFrom(source(response));
  const configs: Map<string, string>[] = [];
  for (const script of descendants(
    doc,
    (n) => n.tagName === "script" && !attr(n, "src"),
  )) {
    const s = stripComments(raw(script));
    if (s.length > 100000) return null;
    const re = /\bvar\s+upload\s*=\s*new\s+SWFUpload\s*\(\s*\{/g;
    while (re.exec(s)) {
      let quote = "",
        escape = false,
        depth = 1,
        end = re.lastIndex;
      for (; end < s.length; end++) {
        const c = s[end]!;
        if (quote) {
          if (escape) escape = false;
          else if (c === "\\") escape = true;
          else if (c === quote) quote = "";
          continue;
        }
        if (c === '"' || c === "'") {
          quote = c;
          continue;
        }
        if (c === "{") depth++;
        if (c === "}" && !--depth) break;
      }
      if (depth || !/^\s*\)/.test(s.slice(end + 1))) return null;
      const fields = objectFields(s.slice(re.lastIndex, end));
      if (!fields) return null;
      configs.push(fields);
      re.lastIndex = end + 1;
    }
  }
  if (configs.length !== 1) return null;
  const c = configs[0]!,
    params = nested(c.get("post_params")),
    custom = nested(c.get("custom_settings"));
  if (
    !params ||
    !custom ||
    literal(params.get("uid")) !== w.account.id ||
    params.size !== 2 ||
    literal(custom.get("uploadSource")) !== "forum" ||
    literal(custom.get("uploadType")) !== "attach"
  )
    return null;
  // Nonzero legacy queue/session limits need separate qualification.
  for (const key of ["file_upload_limit", "file_queue_limit"]) {
    if (c.has(key) && number(c.get(key)) !== 0) return null;
  }
  const hash = literal(params.get("hash")),
    path = literal(c.get("upload_url")),
    types = literal(c.get("file_types")),
    size = number(literal(c.get("file_size_limit")) ?? undefined);
  if (
    !hash ||
    !path ||
    !types ||
    size === null ||
    !(/^(?:\*\.[a-z0-9]+)(?:;\*\.[a-z0-9]+)*$/i.test(types) || types === "*.*")
  )
    return null;
  const url = new URL(path, response.url),
    origin = new URL(response.url).origin;
  if (
    url.origin !== origin ||
    url.pathname !== "/misc.php" ||
    url.hash ||
    url.username ||
    url.password ||
    url.searchParams.size !== 4 ||
    url.searchParams.get("mod") !== "swfupload" ||
    url.searchParams.get("action") !== "swfupload" ||
    url.searchParams.get("operation") !== "upload" ||
    url.searchParams.get("fid") !== w.board.id
  )
    return null;
  const quota = (key: string) =>
    custom.has(key) ? number(custom.get(key)) : undefined;
  const daily = quota("maxSizePerDay"),
    count = quota("maxAttachNum");
  if (daily === null || count === null) return null;
  const limits = nested(custom.get("filterType"));
  if (custom.has("filterType") && !limits) return null;
  const extensionLimits = new Map<string, number>();
  for (const [key, value] of limits ?? []) {
    const n = number(value);
    if (n === null || !/^\w+$/.test(key)) return null;
    extensionLimits.set(key.toLowerCase(), n);
  }
  return {
    url: url.href,
    hash,
    types: types.toLowerCase().split(";"),
    maxBytes: size === 0 ? undefined : size * 1024,
    daily,
    count,
    extensionLimits,
  };
}
function formURL(
  w: PreparedWriting,
  origin: string,
  representation: "json" | "native" = "json",
) {
  const u = new URL("/forum.php", origin);
  for (const [k, v] of Object.entries({
    mod: "post",
    action: w.editTarget ? "edit" : w.replyTarget ? "reply" : "newthread",
    fid: w.board.id,
    ...(representation === "json" ? { tsdmapp: "json" } : {}),
    ...(w.editTarget
      ? { tid: w.editTarget.threadId, pid: w.editTarget.postId }
      : w.replyTarget
        ? {
            tid: w.replyTarget.threadId,
            ...(w.replyTarget.postId ? { reppost: w.replyTarget.postId } : {}),
          }
        : {}),
  }))
    u.searchParams.set(k, v);
  return u.href;
}
export async function listedUpload(
  transport: ForumTransport,
  w: PreparedWriting,
  id: string,
  origin: string,
) {
  if (!/^[1-9]\d*$/.test(id)) return null;
  const url = new URL("/forum.php", origin);
  for (const [k, v] of Object.entries({
    mod: "ajax",
    action: "attachlist",
    aids: id,
    fid: w.board.id,
    inajax: "1",
    ajaxtarget: "attachlist",
  }))
    url.searchParams.set(k, v);
  const response = await transport.request(url.href, { fresh: true });
  if (
    response.status !== 200 ||
    response.url !== url.href ||
    response.redirect === "followed" ||
    !/^(?:text|application)\/xml(?:;|$)/i.test(response.contentType)
  )
    return null;
  const wrapped =
    /^\s*(?:<\?xml[^>]*>\s*)?<root>\s*<!\[CDATA\[([\s\S]*)\]\]>\s*<\/root>\s*$/.exec(
      response.body,
    );
  if (!wrapped) return null;
  const doc = documentFrom(wrapped[1]!),
    controls = descendants(doc, (n) =>
      ["input", "select", "textarea"].includes(n.tagName),
    );
  const instructions = descendants(doc, (n) =>
    attr(n, "onclick").includes("insertAttach"),
  );
  if (instructions.length !== 1) return null;
  const instruction =
    /^\s*insertAttach(img)?Tag\(\s*(['"])([1-9]\d*)\2\s*\)\s*;?\s*([\s\S]*)$/.exec(
      attr(instructions[0]!, "onclick"),
    );
  if (!instruction || instruction[3] !== id) return null;
  const tail = instruction[4]!.trim();
  if (
    tail &&
    !new RegExp(
      "^hideMenu\\(\\s*(['\"])attach_preview_" +
        id +
        "_menu\\1\\s*\\)\\s*;\\s*doane\\(event\\)\\s*;?$",
    ).test(tail)
  )
    return null;
  const referenceKind: "attach" | "attachimg" = instruction[1]
    ? "attachimg"
    : "attach";
  const fields: { name: string; value: string; disabled: boolean }[] = [];
  for (const node of controls) {
    const name = attr(node, "name");
    if (
      !new RegExp(
        "^attachnew\\[" + id + "\\]\\[(description|readperm|price)\\]$",
      ).test(name) ||
      fields.some((f) => f.name === name) ||
      attr(node, "form") ||
      node.attrs.some((a) => a.name === "disabled")
    )
      return null;
    const choices = descendants(node, (n) => n.tagName === "option"),
      selected =
        choices.find((n) => n.attrs.some((a) => a.name === "selected")) ??
        choices[0];
    fields.push({
      name,
      value: selected
        ? selected.attrs.some((a) => a.name === "value")
          ? attr(selected, "value")
          : text(selected)
        : node.tagName === "textarea"
          ? text(node)
          : attr(node, "value"),
      disabled: false,
    });
  }
  return fields.length === 3 &&
    ["description", "readperm", "price"].every((k) =>
      fields.some((f) => f.name === `attachnew[${id}][${k}]`),
    )
    ? { fields, referenceKind }
    : null;
}
export async function validateUploadFields(
  transport: ForumTransport,
  w: PreparedWriting,
  response: HostResponse,
) {
  const pending = (w.uploads ?? []).filter(
    (u) => u.status !== "associated" && u.status !== "removed",
  );
  if (pending.some((u) => u.status !== "uploaded" || !u.serverId)) return null;
  const fields = [];
  for (const u of pending) {
    const found = await listedUpload(
      transport,
      w,
      u.serverId!,
      new URL(response.url).origin,
    );
    if (
      !found ||
      found.referenceKind !== u.referenceKind ||
      JSON.stringify(found.fields) !== JSON.stringify(u.fields)
    )
      return null;
    fields.push(...found.fields);
  }
  return fields;
}
export function createUploadAuthoring(config: {
  origin: string;
  transport: ForumTransport;
  generation: () => number;
  observe: (account: import("./types.js").Account) => void;
}) {
  return async (
    w: PreparedWriting,
    file: UploadFile,
    progress: (loaded: number) => void,
    signal: UploadCancellation,
  ): Promise<UploadResult> => {
    let sent = false;
    const fail = (message: string): UploadResult => ({
      kind: sent ? "uncertain" : "not-sent",
      message,
    });
    if (w.draft)
      return fail(
        "New attachment authoring is not available for forum drafts yet.",
      );
    if (!config.transport.upload) return fail("This host cannot upload files.");
    const bytes = new Uint8Array(file.bytes);
    if (
      !file.name ||
      [...file.name].some(
        (c) => c.charCodeAt(0) < 32 || c === "/" || c === "\\",
      ) ||
      !bytes.length
    )
      return fail("Choose a nonempty file with an ordinary filename.");
    const generation = config.generation();
    try {
      // The JSON projection omits the initializer and rounds daily quota.
      // Read the current native form for exact policy and authorization together.
      const url = formURL(w, config.origin, "native"),
        response = await config.transport.request(url, { fresh: true }),
        decoded = decodeWriting(
          response,
          url,
          w.board.id,
          w.editTarget,
          w.replyTarget,
        );
      config.observe(decoded.account);
      if (
        signal.aborted ||
        generation !== config.generation() ||
        decoded.kind !== "prepared" ||
        decoded.account.kind !== "member" ||
        decoded.account.id !== w.account.id
      )
        return fail(
          "The original account, permission or current form is unavailable. Nothing was uploaded.",
        );
      const p = profile(response, w);
      if (!p)
        return fail(
          "Current upload limits or authorization are unavailable. Nothing was uploaded.",
        );
      const extension = /\.([^.]+)$/.exec(file.name)?.[1]?.toLowerCase();
      if (
        !extension ||
        (!p.types.includes("*.*") && !p.types.includes("*." + extension))
      )
        return fail("The current form does not permit this file type.");
      const extensionLimit = p.extensionLimits.get(extension);
      if (
        (p.maxBytes !== undefined && bytes.length > p.maxBytes) ||
        (extensionLimit && bytes.length > extensionLimit)
      )
        return fail("The file exceeds the current size limit.");
      if (
        (p.count !== undefined && p.count < 1) ||
        (p.daily !== undefined && bytes.length >= p.daily)
      )
        return fail(
          "The current attachment count or daily quota is exhausted.",
        );
      if (signal.aborted) return fail("Upload cancelled before sending.");
      sent = true;
      const r = await config.transport.upload(
        p.url,
        [
          { name: "uid", value: w.account.id },
          { name: "hash", value: p.hash },
          { name: "filetype", value: file.type },
          { name: "size", value: String(bytes.length) },
        ],
        { ...file, bytes },
        progress,
        signal,
      );
      if (signal.aborted || generation !== config.generation())
        return fail(
          "Upload may have reached the forum. Nothing will be retried automatically.",
        );
      if (
        r.url !== p.url ||
        r.redirect === "followed" ||
        r.status !== 200 ||
        !/^(?:text\/plain|text\/html)(?:;|$)/i.test(r.contentType)
      )
        return fail(
          "Upload outcome is uncertain. Check the native attachment list before considering another upload.",
        );
      if (/^(?:0|-[1-9]\d*)$/.test(r.body))
        return { kind: "rejected", message: "The forum refused this upload." };
      if (!/^[1-9]\d{0,15}$/.test(r.body))
        return fail("Upload outcome is uncertain. No automatic retry.");
      if (w.uploadedReferences.includes(r.body))
        return {
          kind: "uncertain",
          id: r.body,
          message:
            "The forum returned an existing attachment ID. A new independent upload was not established.",
        };
      const listed = await listedUpload(
        config.transport,
        w,
        r.body,
        config.origin,
      );
      if (!listed || generation !== config.generation())
        return {
          kind: "uncertain",
          id: r.body,
          message:
            "Upload accepted, but current attachment controls could not be verified. The upload is not confirmed associated.",
        };
      const after = await config.transport.request(url, { fresh: true }),
        current = decodeWriting(
          after,
          url,
          w.board.id,
          w.editTarget,
          w.replyTarget,
        );
      config.observe(current.account);
      if (
        signal.aborted ||
        generation !== config.generation() ||
        current.kind !== "prepared" ||
        current.account.kind !== "member" ||
        current.account.id !== w.account.id
      )
        return {
          kind: "uncertain",
          id: r.body,
          message:
            "Account changed after upload. The original account may own this file; it was not adopted into current writing.",
        };
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      const sha256 = Array.from(new Uint8Array(digest), (b) =>
        b.toString(16).padStart(2, "0"),
      ).join("");
      return { kind: "uploaded", id: r.body, ...listed, sha256 };
    } catch {
      return fail(
        "Upload interrupted. It may already be stored; no upload was repeated.",
      );
    }
  };
}

/** Native appendAttachDel acts immediately; a subsequent post Save is separate. */
export function createAttachmentRemoval(config: {
  origin: string;
  transport: ForumTransport;
  generation: () => number;
  observe: (account: import("./types.js").Account) => void;
}) {
  const used = new Set<string>();
  return async (
    w: PreparedWriting,
    id: string,
    checkOnly = false,
  ): Promise<import("./types.js").AttachmentRemovalResult> => {
    let sent = false;
    const unknown = (
      message: string,
    ): import("./types.js").AttachmentRemovalResult => ({
      kind: sent || checkOnly ? "uncertain" : "not-sent",
      message,
    });
    if (w.draft)
      return {
        kind: "not-sent",
        message: "Server file removal for forum drafts is not available yet.",
      };
    const key = w.account.id + ":" + id;
    if (
      !/^[1-9]\d*$/.test(id) ||
      !w.uploads?.some((u) => u.serverId === id) ||
      (!checkOnly && used.has(key))
    )
      return unknown(
        "This removal is unavailable or already attempted. Check its original result.",
      );
    const generation = config.generation();
    try {
      const url = formURL(w, config.origin),
        r = await config.transport.request(url, { fresh: true }),
        d = decodeWriting(r, url, w.board.id, w.editTarget, w.replyTarget);
      config.observe(d.account);
      if (
        generation !== config.generation() ||
        d.kind !== "prepared" ||
        d.account.kind !== "member" ||
        d.account.id !== w.account.id
      )
        return unknown(
          "Original account or current removal permission is unavailable.",
        );
      if (!checkOnly) {
        if (
          !d.prepared.uploadedReferences.includes(id) &&
          !(await listedUpload(config.transport, w, id, config.origin))
        )
          return unknown(
            "The current attachment could not be established. Nothing was removed.",
          );
        if (generation !== config.generation())
          return unknown(
            "The account changed before removal. Nothing was removed.",
          );
        const doc = documentFrom(source(r)),
          forms = descendants(
            doc,
            (n) => n.tagName === "form" && attr(n, "id") === "postform",
          );
        if (forms.length !== 1)
          return unknown("Current removal form is unavailable.");
        const tokens = descendants(
          forms[0]!,
          (n) => attr(n, "name") === "formhash",
        );
        if (tokens.length !== 1 || !attr(tokens[0]!, "value"))
          return unknown("Current removal token is unavailable.");
        const remove = new URL("/forum.php", config.origin);
        for (const [k, v] of Object.entries({
          mod: "ajax",
          action: "deleteattach",
          inajax: "yes",
          formhash: attr(tokens[0]!, "value"),
          tid: w.editTarget?.threadId ?? "0",
          pid: w.editTarget?.postId ?? "0",
          "aids[]": id,
        }))
          remove.searchParams.set(k, v);
        used.add(key);
        sent = true;
        try {
          await config.transport.request(remove.href, { fresh: true });
        } catch {
          /* Original operation remains uncertain until independent reads. */
        }
      }
      const after = await config.transport.request(url, { fresh: true }),
        latest = decodeWriting(
          after,
          url,
          w.board.id,
          w.editTarget,
          w.replyTarget,
        );
      config.observe(latest.account);
      if (
        generation !== config.generation() ||
        latest.kind !== "prepared" ||
        latest.account.kind !== "member" ||
        latest.account.id !== w.account.id ||
        latest.prepared.uploadedReferences.includes(id)
      )
        return unknown("Removal is uncertain. No removal was repeated.");
      const list = new URL("/forum.php", config.origin);
      for (const [k, v] of Object.entries({
        mod: "ajax",
        action: "attachlist",
        aids: id,
        fid: w.board.id,
        inajax: "1",
        ajaxtarget: "attachlist",
      }))
        list.searchParams.set(k, v);
      const result = await config.transport.request(list.href, { fresh: true });
      if (
        generation !== config.generation() ||
        result.url !== list.href ||
        result.status !== 200 ||
        result.redirect === "followed" ||
        !/^(?:text|application)\/xml(?:;|$)/i.test(result.contentType) ||
        !/^\s*(?:<\?xml[^>]*>\s*)?<root>\s*<!\[CDATA\[\s*\]\]>\s*<\/root>\s*$/.test(
          result.body,
        )
      )
        return unknown(
          "Removal is uncertain: current attachment absence could not be verified.",
        );
      return {
        kind: "removed",
        message:
          "Server file removal verified. Source references are separate; remove any remaining tag before saving.",
        latest: latest.prepared,
      };
    } catch {
      return unknown("Removal check was interrupted. No removal was repeated.");
    }
  };
}
