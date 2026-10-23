import {
  attr,
  byId,
  children,
  controlDisabled,
  descendants,
  documentFrom,
  label,
  safeURL,
  text,
  type Element,
  type Node,
} from "./html.js";
import {
  editAttachmentControls,
  editAttachmentFields,
} from "./edit-attachments.js";
import { accountFrom } from "./read-thread.js";
import type {
  Account,
  HostResponse,
  PrepareWritingResult,
  ReplyTarget,
  WritingOption,
} from "./types.js";
type Decoded = PrepareWritingResult extends infer R
  ? R extends PrepareWritingResult
    ? Omit<R, "generation">
    : never
  : never;
const optionLabels: Record<string, string> = {
  usesig: "Signature",
  parseurloff: "Disable URL recognition",
  smileyoff: "Disable emoticons",
  bbcodeoff: "Disable BBCode",
  htmlon: "HTML",
  imgcontent: "Render content as image",
  price: "Thread price",
  readperm: "Read permission",
  hiddenreplies: "Replies visible only to author",
  ordertype: "Reverse reply order",
  allownoticeauthor: "Receive reply notifications",
  addfeed: "Publish activity",
  adddynamic: "Share with followers",
  adddynamic_doing: "Ask followers to share",
  tags: "Tags",
};
const has = (node: Element, name: string) =>
  node.attrs.some((a) => a.name === name);
function controlLabel(doc: Node, node: Element, fallback: string) {
  const attached = descendants(
    doc,
    (n) =>
      n.tagName === "label" &&
      attr(n, "for") === attr(node, "id") &&
      Boolean(attr(node, "id")),
  )[0];
  const parent = node.parentNode;
  const owner =
    attached ??
    (parent && "tagName" in parent && parent.tagName === "label"
      ? parent
      : undefined);
  return (
    (owner
      ? children(owner)
          .filter(
            (n) =>
              !("tagName" in n) ||
              !["input", "select", "textarea"].includes(n.tagName),
          )
          .map(text)
          .join("")
          .trim()
      : "") || fallback
  );
}
export function decodeWriting(
  response: HostResponse,
  requested: string,
  boardId: string,
  edit?: { threadId: string; postId: string },
  reply?: ReplyTarget,
): Decoded {
  let account: Account = { kind: "unknown" };
  const fail = (
    kind: "invalid" | "login" | "permission" | "challenge" | "limited",
    message: string,
  ): Decoded => ({ kind, message, account, sourceURL: requested });
  const actual = safeURL(response.url, requested);
  if (
    !actual ||
    new URL(actual).origin !== new URL(requested).origin ||
    !/^(?:text\/html|application\/(?:json|[^;]+\+json))(?:;|$)/i.test(
      response.contentType,
    )
  )
    return fail(
      "invalid",
      "The forum returned an unsupported preparation response.",
    );
  let source = response.body;
  if (/json/i.test(response.contentType) || /^\s*\{/.test(source)) {
    try {
      const payload: unknown = JSON.parse(source);
      if (
        !payload ||
        typeof payload !== "object" ||
        !("document" in payload) ||
        typeof payload.document !== "string"
      )
        throw Error();
      source =
        ("head" in payload && typeof payload.head === "string"
          ? payload.head
          : "") + payload.document;
    } catch {
      return fail("invalid", "The forum returned invalid preparation data.");
    }
  }
  const doc = documentFrom(source);
  account = accountFrom(doc, actual);
  const message = label(byId(doc, "messagetext") ?? byId(doc, "main_message"));
  if (
    byId(doc, "challenge-form") ||
    byId(doc, "cf-challenge-running") ||
    /Just a moment|Checking your browser|安全验证/i.test(
      label(descendants(doc, (n) => n.tagName === "title")[0]),
    )
  )
    return fail(
      "challenge",
      "Complete native verification, then prepare again.",
    );
  if (
    response.status === 401 ||
    account.kind === "guest" ||
    /未登录|未登錄|先登录|先登錄/.test(message)
  )
    return fail(
      "login",
      "Sign in through the native forum, then prepare again. A form token does not establish an account.",
    );
  if (response.status === 403 || /权限|權限|用户组|用戶組|無權/.test(message))
    return fail(
      "permission",
      "The current account cannot prepare this new thread.",
    );
  if (response.status === 429)
    return fail(
      "limited",
      "The forum is limiting requests. Try again explicitly later.",
    );
  if (
    response.status < 200 ||
    response.status >= 300 ||
    message ||
    account.kind !== "member"
  )
    return fail(
      "invalid",
      "A current member account and complete native form are required.",
    );
  const forms = descendants(
    doc,
    (n) => n.tagName === "form" && attr(n, "id") === "postform",
  );
  const form = forms.length === 1 ? forms[0] : undefined;
  const action = form && safeURL(attr(form, "action"), actual);
  if (!form || !action || attr(form, "method").toLowerCase() !== "post")
    return fail(
      "invalid",
      "The current native new-thread form is unavailable.",
    );
  const target = new URL(action);
  if (
    target.origin !== new URL(requested).origin ||
    target.pathname !== "/forum.php" ||
    target.searchParams.get("mod") !== "post" ||
    target.searchParams.get("action") !==
      (edit ? "edit" : reply ? "reply" : "newthread") ||
    (!edit && target.searchParams.get("fid") !== boardId) ||
    (reply &&
      !edit &&
      (target.searchParams.getAll("tid").length !== 1 ||
        target.searchParams.get("tid") !== reply.threadId)) ||
    (edit &&
      ["fid", "tid", "pid"].some((key) => {
        const expected =
          key === "fid" ? boardId : key === "tid" ? edit.threadId : edit.postId;
        const values = [
          ...target.searchParams.getAll(key),
          ...descendants(form, (node) => attr(node, "name") === key).map(
            (node) => attr(node, "value"),
          ),
        ];
        return values.length !== 1 || values[0] !== expected;
      })) ||
    ["mod", "action", ...(!edit ? ["fid"] : [])].some(
      (k) => target.searchParams.getAll(k).length !== 1,
    ) ||
    (target.searchParams.has("special") &&
      target.searchParams.get("special") !== "0")
  )
    return fail(
      "invalid",
      "The returned form targets a different action or board.",
    );
  const controls = descendants(form, (n) =>
    ["input", "select", "textarea"].includes(n.tagName),
  );
  const attachments = edit ? editAttachmentControls(doc, form) : [];
  if (!attachments)
    return fail(
      "invalid",
      "Existing attachment controls are unavailable or cannot be preserved safely.",
    );
  for (const attachment of attachments)
    if (!controls.includes(attachment)) controls.push(attachment);
  const named = (name: string) =>
    controls.filter((n) => attr(n, "name") === name);
  if (
    (edit ? named("subject").length > 1 : named("subject").length !== 1) ||
    named("message").length !== 1 ||
    named("message")[0]?.tagName !== "textarea" ||
    ["subject", "message", "typeid", ...Object.keys(optionLabels)].some(
      (name) => named(name).length > 1,
    )
  )
    return fail(
      "invalid",
      "The native form does not provide unambiguous complete source and options.",
    );
  if (reply && !edit) {
    const privateNames = [
      "reppid",
      "reppost",
      "noticeauthor",
      "noticeauthormsg",
      "noticetrimstr",
    ];
    if (
      privateNames.some(
        (name) =>
          named(name).length > 1 ||
          named(name).some(
            (n) =>
              n.tagName !== "input" ||
              attr(n, "type") !== "hidden" ||
              controlDisabled(n),
          ),
      )
    )
      return fail(
        "invalid",
        "The reply target controls are ambiguous or unsupported.",
      );
    if (reply.postId) {
      if (
        !["reppid", "reppost"].every(
          (name) =>
            named(name).length === 1 &&
            attr(named(name)[0]!, "value") === reply.postId,
        ) ||
        !["noticeauthor", "noticeauthormsg"].every(
          (name) => named(name).length === 1 && attr(named(name)[0]!, "value"),
        ) ||
        named("noticetrimstr").length !== 1 ||
        attr(named("noticetrimstr")[0]!, "value") !== ""
      )
        return fail(
          "invalid",
          "The native addressed target did not match the selected post.",
        );
    } else if (
      named("reppid").length ||
      named("reppost").length ||
      privateNames.some((name) =>
        named(name).some((n) => attr(n, "value") !== ""),
      )
    )
      return fail(
        "invalid",
        "An ordinary reply unexpectedly contains an addressed target.",
      );
  }
  function option(node: Element, fallback: string): WritingOption {
    const choices =
      node.tagName === "select"
        ? descendants(node, (n) => n.tagName === "option").map((n) => ({
            value: has(n, "value") ? attr(n, "value") : text(n),
            label: label(n) || "No category",
            disabled: controlDisabled(n),
          }))
        : [];
    const selected =
      node.tagName === "select"
        ? descendants(
            node,
            (n) => n.tagName === "option" && has(n, "selected"),
          )[0]
        : undefined;
    return {
      name: attr(node, "name"),
      label: controlLabel(doc, node, fallback),
      kind:
        node.tagName === "select"
          ? "select"
          : attr(node, "type") === "checkbox"
            ? "checkbox"
            : "text",
      value:
        node.tagName === "select"
          ? selected
            ? has(selected, "value")
              ? attr(selected, "value")
              : text(selected)
            : (choices[0]?.value ?? "")
          : attr(node, "value"),
      checked: has(node, "checked"),
      disabled: controlDisabled(node),
      choices,
      maxLength: /^\d+$/.test(attr(node, "maxlength"))
        ? Number(attr(node, "maxlength"))
        : null,
    };
  }
  const options = controls
    .filter((n) => Object.hasOwn(optionLabels, attr(n, "name")))
    .map((n) => option(n, optionLabels[attr(n, "name")]!));
  const category = named("typeid")[0];
  const board = descendants(
    byId(doc, "pt") ?? doc,
    (n) => n.tagName === "a",
  ).find((n) => {
    const value = safeURL(attr(n, "href"), actual);
    if (!value) return false;
    const u = new URL(value);
    return (
      u.origin === target.origin &&
      u.searchParams.get("mod") === "forumdisplay" &&
      u.searchParams.get("fid") === boardId
    );
  });
  const references = [
    ...new Set(
      controls
        .map((n) => /^attachnew\[([1-9]\d*)\]/.exec(attr(n, "name"))?.[1])
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  return {
    kind: "prepared",
    account,
    sourceURL: requested,
    prepared: {
      action: reply ? (reply.postId ? "quick-quote" : "reply") : "new-thread",
      ...(reply ? { replyTarget: reply } : {}),
      draftSaveAvailable:
        !reply &&
        named("save").length === 1 &&
        attr(named("save")[0]!, "type") === "hidden" &&
        attr(named("save")[0]!, "id") === "postsave" &&
        !controlDisabled(named("save")[0]!) &&
        descendants(
          form,
          (n) =>
            n.tagName === "button" &&
            attr(n, "type") === "button" &&
            !controlDisabled(n) &&
            /postsave.*value\s*=\s*1/.test(attr(n, "onclick")),
        ).length === 1,
      board: {
        id: boardId,
        label: label(board) || `Board ${boardId}`,
        url: `${target.origin}/forum.php?mod=forumdisplay&fid=${boardId}`,
      },
      account,
      title: named("subject")[0] ? attr(named("subject")[0]!, "value") : "",
      ...(edit && !named("subject").length ? { titleAvailable: false } : {}),
      source: text(named("message")[0]),
      category: category ? option(category, "Category") : null,
      options,
      uploadedReferences: references,
      attachmentFields: edit
        ? editAttachmentFields(attachments)
        : controls
            .filter((n) =>
              /^attachnew\[[1-9]\d*\]\[[a-z_]+\]$/.test(attr(n, "name")),
            )
            .map((n) => ({
              name: attr(n, "name"),
              value: n.tagName === "textarea" ? text(n) : attr(n, "value"),
              disabled: controlDisabled(n),
            })),
    },
  };
}

/** Source IDs without a known uploaded reference; this does not establish server ownership. */
export function unresolvedWritingAttachments(writing: {
  source: string;
  uploadedReferences: readonly string[];
}): string[] {
  return [
    ...new Set(
      [
        ...writing.source.matchAll(
          /\[attach(?:img)?\]\s*([1-9]\d*)\s*\[\/attach(?:img)?\]/gi,
        ),
      ].map((match) => match[1]!),
    ),
  ].filter((id) => !writing.uploadedReferences.includes(id));
}
