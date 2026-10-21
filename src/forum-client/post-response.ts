import { attr, children, descendants, documentFrom } from "./html.js";
import type { HostResponse } from "./types.js";
/** A bounded grammar for native literal callbacks. Script bytes are never evaluated. */
export function postCallback(response: HostResponse): {
  success: boolean;
  values: string[];
  fields: Record<string, string>;
} | null {
  if (
    response.status !== 200 ||
    response.redirect === "followed" ||
    !/^(?:text|application)\/xml(?:;|$)/i.test(response.contentType) ||
    response.body.length > 262144 ||
    /<!DOCTYPE|<!ENTITY/i.test(response.body)
  )
    return null;
  const envelope =
    /^\s*(?:<\?xml[^?]*\?>\s*)?<root>\s*<!\[CDATA\[([\s\S]*)\]\]>\s*<\/root>\s*$/.exec(
      response.body,
    );
  if (
    !envelope ||
    envelope[1]!.includes("]]>") ||
    envelope[1]!.includes("<![CDATA[")
  )
    return null;
  const doc = documentFrom(envelope[1]!),
    scripts = descendants(doc, (node) => node.tagName === "script");
  if (
    scripts.length !== 1 ||
    scripts[0]!.attrs.some((a) => !["type", "reload"].includes(a.name)) ||
    (attr(scripts[0]!, "type") &&
      attr(scripts[0]!, "type") !== "text/javascript")
  )
    return null;
  const source = children(scripts[0]!)
    .map((node) => ("value" in node ? node.value : ""))
    .join("");
  let offset = 0;
  const space = () => {
    while (/\s/.test(source[offset] ?? "") && offset < source.length) offset++;
  };
  const take = (literal: string) => {
    space();
    if (!source.startsWith(literal, offset)) throw Error();
    offset += literal.length;
  };
  const identifier = () => {
    space();
    const match = /^[A-Za-z_$][\w$]*/.exec(source.slice(offset));
    if (!match) throw Error();
    offset += match[0].length;
    return match[0];
  };
  const string = () => {
    space();
    const quote = source[offset++];
    if (quote !== "'" && quote !== '"') throw Error();
    let value = "";
    while (offset < source.length) {
      const char = source[offset++];
      if (char === quote) return value;
      if (!char || /[\r\n\u2028\u2029]/.test(char)) throw Error();
      if (char !== "\\") {
        value += char;
        continue;
      }
      const escape = source[offset++];
      const simple: Record<string, string> = {
        n: "\n",
        r: "\r",
        t: "\t",
        b: "\b",
        f: "\f",
        v: "\v",
        "\\": "\\",
        "'": "'",
        '"': '"',
        "/": "/",
      };
      if (escape && Object.hasOwn(simple, escape)) value += simple[escape];
      else if (escape === "x" || escape === "u") {
        const count = escape === "x" ? 2 : 4,
          hex = source.slice(offset, offset + count);
        if (hex.length !== count || !/^[0-9a-f]+$/i.test(hex)) throw Error();
        value += String.fromCharCode(Number.parseInt(hex, 16));
        offset += count;
      } else throw Error();
    }
    throw Error();
  };
  try {
    let guarded = "";
    space();
    if (source.startsWith("if", offset)) {
      take("if");
      take("(");
      if (identifier() !== "typeof") return null;
      guarded = identifier();
      space();
      take(source.startsWith("===", offset) ? "===" : "==");
      if (string() !== "function") return null;
      take(")");
      take("{");
    }
    const name = identifier();
    if (
      !["succeedhandle_post", "errorhandle_post", "succeedhandle_"].includes(
        name,
      ) ||
      (name === "succeedhandle_" && guarded !== name) ||
      (guarded && guarded !== name)
    )
      return null;
    const success = name !== "errorhandle_post";
    take("(");
    const values = [string()];
    take(",");
    if (success) {
      values.push(string());
      take(",");
    }
    take("{");
    const fields: Record<string, string> = Object.create(null);
    space();
    if (source[offset] !== "}") {
      for (let count = 0; ; count++) {
        if (count > 100) return null;
        const key = string();
        if (Object.hasOwn(fields, key)) return null;
        take(":");
        fields[key] = string();
        space();
        if (source[offset] !== ",") break;
        take(",");
      }
    }
    take("}");
    take(")");
    space();
    if (source[offset] === ";") take(";");
    if (guarded) {
      take("}");
      space();
      if (source[offset] === ";") take(";");
    }
    space();
    return offset === source.length ? { success, values, fields } : null;
  } catch {
    return null;
  }
}
