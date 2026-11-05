import {
  attr,
  descendants,
  documentFrom,
  controlDisabled,
  byId,
  hasClass,
  children,
  element,
  safeURL,
  type Node,
} from "./html.js";
import { decodePrivateConversation } from "./private-conversation.js";
import { routeFor } from "./routes.js";
import type {
  Account,
  ForumTransport,
  PreparedPrivateWriting,
  PrivateSubmission,
  PrivateWritingPreparation,
  PrivateReviewPreparation,
  PrivateReview,
  PrivateAttempt,
  WritingValidationIssue,
} from "./types.js";

class PrivateFieldError extends Error {
  constructor(
    message: string,
    readonly issue: WritingValidationIssue,
  ) {
    super(message);
  }
}

/** Tokens are transient form observations and never part of a writing/review snapshot. */
export function createPrivateWriting(options: {
  origin: string;
  transport: ForumTransport;
  account: () => Account;
  generation: () => number;
  observe: (account: Account) => void;
}) {
  const approvals = new Map<string, string>();
  let preparationSequence = 0;
  async function load(destination: string, expected: Account) {
    const route = routeFor(destination);
    if (
      route?.kind !== "private-conversation" ||
      route.url.origin !== options.origin ||
      expected.kind !== "member"
    )
      throw new Error(
        "Choose a current one-to-one private conversation while signed in.",
      );
    const started = options.generation();
    route.url.searchParams.set("tsdmapp", "json");
    const response = await options.transport.request(route.url.href, {
      fresh: true,
    });
    if (started !== options.generation())
      throw new Error("The account changed during preparation. Review again.");
    const decoded = decodePrivateConversation(response, destination);
    options.observe(decoded.account);
    if (
      decoded.kind !== "private-conversation" ||
      decoded.account.kind !== "member" ||
      decoded.account.id !== expected.id
    )
      throw new Error(
        "The current sender or private recipient could not be confirmed. Your text is retained.",
      );
    let source = response.body;
    if (/json/i.test(response.contentType) || /^\s*\{/.test(source)) {
      const data = JSON.parse(source);
      source = (typeof data.head === "string" ? data.head : "") + data.document;
    }
    const doc = documentFrom(source);
    const forms = descendants(
      doc,
      (n) => n.tagName === "form" && attr(n, "id") === "pmform",
    );
    const fail = () => {
      throw new Error(
        "The current private-message form is not supported. Keep your text and continue in the native forum.",
      );
    };
    if (forms.length !== 1) return fail();
    const form = forms[0]!;
    const action = new URL(attr(form, "action"), response.url);
    if (
      attr(form, "method").toLowerCase() !== "post" ||
      action.origin !== options.origin ||
      action.pathname !== "/home.php" ||
      action.hash ||
      action.username ||
      action.password
    )
      return fail();
    const fixed: Record<string, string> = {
      mod: "spacecp",
      ac: "pm",
      op: "send",
      daterange: "0",
      handlekey: "pmsend",
      pmsubmit: "yes",
    };
    if (
      Object.entries(fixed).some(
        ([k, v]) =>
          action.searchParams.getAll(k).length !== 1 ||
          action.searchParams.get(k) !== v,
      ) ||
      !/^[1-9]\d*$/.test(action.searchParams.get("pmid") ?? "") ||
      action.searchParams.getAll("pmid").length !== 1 ||
      [...action.searchParams.keys()].some((k) => !(k in fixed) && k !== "pmid")
    )
      return fail();
    if (
      !decoded.conversation.messages.some(
        (message) => message.id === action.searchParams.get("pmid"),
      )
    )
      return fail();
    const controls = descendants(form, (n) =>
      ["input", "textarea", "select", "button"].includes(n.tagName),
    );
    if (
      descendants(doc, (n) => attr(n, "form") === "pmform").length ||
      controls.some((n) => attr(n, "form") || controlDisabled(n))
    )
      return fail();
    const single = (name: string) =>
      controls.filter((n) => attr(n, "name") === name);
    const token = single("formhash"),
      recipient = single("topmuid"),
      message = single("message"),
      submit = single("pmsubmit");
    if (
      token.length !== 1 ||
      recipient.length !== 1 ||
      message.length !== 1 ||
      submit.length !== 1 ||
      controls.some(
        (n) =>
          !["formhash", "topmuid", "message", "pmsubmit"].includes(
            attr(n, "name"),
          ),
      ) ||
      token[0]!.tagName !== "input" ||
      attr(token[0]!, "type") !== "hidden" ||
      attr(recipient[0]!, "type") !== "hidden" ||
      recipient[0]!.tagName !== "input" ||
      message[0]!.tagName !== "textarea" ||
      !attr(token[0]!, "value") ||
      attr(recipient[0]!, "value") !== decoded.conversation.peerId ||
      message[0]!.attrs.some((a) => a.name === "readonly")
    )
      return fail();
    const limit = attr(message[0]!, "maxlength");
    if (
      limit &&
      (!/^[1-9]\d*$/.test(limit) || !Number.isSafeInteger(Number(limit)))
    )
      return fail();
    return {
      prepared: {
        action: "private-message",
        account: decoded.account,
        recipient: {
          id: decoded.conversation.peerId,
          name: decoded.conversation.peerName,
          url: destination,
        },
        source: "",
        maxLength: limit ? Number(limit) : null,
      } satisfies PreparedPrivateWriting,
      token: attr(token[0]!, "value"),
      action: action.href,
      conversation: decoded.conversation,
      exactText: new Map(
        decoded.conversation.messages.map((message) => [
          message.id,
          privatePlainText(doc, message.id, response.url),
        ]),
      ),
    };
  }
  const refused = (error: unknown) => ({
    kind: "refused" as const,
    message:
      error instanceof Error
        ? error.message
        : "The private-message form could not be reached. Your text is retained.",
    account: options.account(),
    generation: options.generation(),
  });
  function actorMatches(review: PrivateReview) {
    const account = options.account();
    return (
      account.kind === "member" &&
      account.id === review.submission.writing.account.id &&
      options.generation() === review.generation
    );
  }
  async function check(attempt: PrivateAttempt): Promise<PrivateAttempt> {
    const pending = structuredClone(attempt);
    if (isPrivateAttempt(pending) && pending.status === "not-sent")
      return pending;
    const uncertain = (message: string): PrivateAttempt => ({
      ...pending,
      status: "uncertain",
      checked: true,
      message,
      result: null,
    });
    if (!isPrivateAttempt(pending) || !pending.before.length)
      return uncertain(
        "The original pre-send history is unavailable. Continue in the native forum; nothing was resent.",
      );
    try {
      const writing = pending.submission.writing;
      const form = await load(writing.recipient.url, writing.account);
      if (!form.conversation.beginning || !form.conversation.end)
        return uncertain(
          "The current history is incomplete. The outcome remains uncertain; nothing was resent.",
        );
      const matches = form.conversation.messages.filter(
        (m) =>
          !pending.before.includes(m.id) &&
          m.senderId === writing.account.id &&
          form.exactText.get(m.id) === writing.source,
      );
      if (matches.length !== 1)
        return uncertain(
          "The stored sender, recipient and exact text could not be uniquely confirmed. Check the original attempt deliberately; do not resend automatically.",
        );
      const message = matches[0]!;
      return {
        ...pending,
        status: "confirmed",
        checked: true,
        message:
          "Stored private message independently verified. Delivery and read status are unknown.",
        result: {
          messageId: message.id,
          url: message.url,
          senderId: message.senderId,
          recipientId: form.conversation.peerId,
          source: writing.source,
        },
      };
    } catch {
      return uncertain(
        "Independent result checking could not confirm the private message. Your original attempt and current text are retained; nothing was resent.",
      );
    }
  }
  return {
    check,
    async send(
      review: PrivateReview,
      attempt: PrivateAttempt,
      retain: (pending: PrivateAttempt) => Promise<boolean>,
    ): Promise<PrivateAttempt> {
      const sequence = preparationSequence;
      let pending = structuredClone(attempt);
      const denied = (message: string): PrivateAttempt => ({
        ...pending,
        status: "not-sent",
        checked: false,
        message,
        result: null,
      });
      const key = review?.id,
        approved = approvals.get(key);
      approvals.delete(key);
      if (
        !isPrivateAttempt(pending) ||
        pending.status !== "pending" ||
        !approved ||
        approved !== JSON.stringify(review) ||
        JSON.stringify(pending.submission) !==
          JSON.stringify(review.submission) ||
        !actorMatches(review)
      )
        return denied(
          "Private message was not sent: review approval is missing, used or stale.",
        );
      let form: Awaited<ReturnType<typeof load>>;
      try {
        const writing = pending.submission.writing;
        form = await load(writing.recipient.url, writing.account);
        if (
          sequence !== preparationSequence ||
          !actorMatches(review) ||
          form.prepared.recipient.id !== writing.recipient.id ||
          form.prepared.maxLength !== writing.maxLength ||
          !form.conversation.beginning ||
          !form.conversation.end
        )
          return denied(
            "Private message was not sent because the current sender, recipient, restrictions or complete history changed. Review again.",
          );
        pending = {
          ...pending,
          before: form.conversation.messages.map((m) => m.id),
        };
        if (
          !(await retain(structuredClone(pending))) ||
          sequence !== preparationSequence ||
          !actorMatches(review)
        )
          return denied(
            "Private message was not sent because recovery or the account changed. Your text is retained.",
          );
      } catch {
        return denied(
          "Private message was not sent because the current form could not be verified. Keep your text and continue in the native forum.",
        );
      }
      try {
        const action = new URL(form.action);
        action.searchParams.set("inajax", "1");
        await options.transport.request(action.href, {
          method: "POST",
          body: new URLSearchParams([
            [
              "message",
              pending.submission.writing.source.replaceAll("\n", "\r\n"),
            ],
            ["formhash", form.token],
            ["topmuid", form.prepared.recipient.id],
          ]).toString(),
        });
      } catch {
        /* A lost response is not evidence that the command failed. */
      }
      return check({ ...pending, status: "uncertain" });
    },
    async prepare(
      destination: string,
      expected: Account,
    ): Promise<PrivateWritingPreparation> {
      const sequence = ++preparationSequence;
      approvals.clear();
      try {
        const form = await load(destination, expected);
        if (sequence !== preparationSequence)
          throw new Error(
            "Writing changed during review. Review the current text again.",
          );
        return {
          kind: "prepared",
          prepared: form.prepared,
          account: options.account(),
          generation: options.generation(),
        };
      } catch (error) {
        return refused(error);
      }
    },
    async review(input: PrivateSubmission): Promise<PrivateReviewPreparation> {
      const sequence = ++preparationSequence;
      approvals.clear();
      try {
        const submission = structuredClone(input);
        if (!isPreparedPrivateWriting(submission.writing))
          throw new Error(
            "The private writing contains unsupported fields or a different recipient.",
          );
        if (/\[(?:\/?[a-z][^\]\r\n]*|\*)\]/i.test(submission.writing.source))
          throw new Error(
            "Private formatting syntax has not been qualified. Keep the exact text and continue in the native forum.",
          );
        if (!submission.writing.source.trim())
          throw new PrivateFieldError(
            "Enter private message text before review.",
            { field: "source", code: "required" },
          );
        if (
          submission.writing.source.includes("\r") ||
          submission.writing.source.includes(String.fromCharCode(0))
        )
          throw new Error(
            "Use plain text and line breaks. Unsupported control characters must be removed before review.",
          );
        const form = await load(
          submission.writing.recipient.url,
          submission.writing.account,
        );
        if (sequence !== preparationSequence)
          throw new Error(
            "Writing changed during review. Review the current text again.",
          );
        if (form.prepared.recipient.id !== submission.writing.recipient.id)
          throw new Error(
            "The recipient changed. Keep your text and review the current form.",
          );
        if (
          form.prepared.maxLength !== null &&
          submission.writing.source.length > form.prepared.maxLength
        )
          throw new PrivateFieldError(
            "The private message exceeds the current text limit.",
            {
              field: "source",
              code: "too-long",
              limit: form.prepared.maxLength,
            },
          );
        if (!form.conversation.beginning || !form.conversation.end)
          throw new Error(
            "The complete current private history is required for reliable result checking. Continue in the native forum.",
          );
        submission.writing.maxLength = form.prepared.maxLength;
        const review: PrivateReview = {
          id: crypto.randomUUID(),
          generation: options.generation(),
          submission,
        };
        approvals.set(review.id, JSON.stringify(review));
        return {
          kind: "ready",
          review,
          account: options.account(),
          generation: options.generation(),
        };
      } catch (error) {
        return {
          ...refused(error),
          ...(error instanceof PrivateFieldError ? { issue: error.issue } : {}),
        };
      }
    },
  };
}

/** This is a strict source observation, independent of the reader sanitizer. */
function privatePlainText(doc: Node, id: string, url: string): string | null {
  const row = byId(doc, `pmlist_${id}`);
  const body =
    row && descendants(row, (n) => n.tagName === "dd" && hasClass(n, "ptm"))[0];
  if (!body) return null;
  const nodes = children(body),
    begin = nodes.findIndex((n) => element(n) && n.tagName === "br"),
    end = nodes.findIndex((n, i) => i > begin && hasClass(n, "xg1"));
  if (begin < 0 || end < 0) return null;
  let result = "",
    afterBreak = true;
  for (const node of nodes.slice(begin + 1, end)) {
    if ("value" in node) {
      let text = node.value;
      if (afterBreak && text.startsWith("\n")) text = text.slice(1);
      result += text;
      if (text) afterBreak = false;
    } else if (element(node) && node.tagName === "br" && !node.attrs.length) {
      result += "\n";
      afterBreak = true;
    } else if (
      element(node) &&
      node.tagName === "a" &&
      node.attrs.every((a) => ["href", "target", "rel"].includes(a.name)) &&
      children(node).every((n) => "value" in n)
    ) {
      const text = children(node)
        .map((n) => ("value" in n ? n.value : ""))
        .join("");
      if (safeURL(text, url) !== safeURL(attr(node, "href"), url)) return null;
      result += text;
      afterBreak = false;
    } else return null;
  }
  return result.endsWith("\n") ? result.slice(0, -1) : null;
}
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const keys = (value: Record<string, unknown>, allowed: string[]) =>
  Object.keys(value).every((k) => allowed.includes(k));
const id = (value: unknown): value is string =>
  typeof value === "string" && /^[1-9]\d*$/.test(value);
export function isPreparedPrivateWriting(
  value: unknown,
): value is PreparedPrivateWriting {
  if (
    !object(value) ||
    !keys(value, ["action", "account", "recipient", "source", "maxLength"]) ||
    value.action !== "private-message" ||
    typeof value.source !== "string" ||
    !(
      value.maxLength === null ||
      (Number.isSafeInteger(value.maxLength) && Number(value.maxLength) > 0)
    ) ||
    !object(value.account) ||
    !keys(value.account, ["kind", "id", "name"]) ||
    value.account.kind !== "member" ||
    !id(value.account.id) ||
    typeof value.account.name !== "string" ||
    !object(value.recipient) ||
    !keys(value.recipient, ["id", "name", "url"]) ||
    !id(value.recipient.id) ||
    value.recipient.id === value.account.id ||
    typeof value.recipient.name !== "string" ||
    typeof value.recipient.url !== "string"
  )
    return false;
  const route = routeFor(value.recipient.url);
  return (
    route?.kind === "private-conversation" &&
    route.url.searchParams.get("touid") === value.recipient.id &&
    !route.url.hash &&
    [...route.url.searchParams.keys()].every((k) =>
      ["mod", "do", "subop", "touid", "page", "daterange"].includes(k),
    )
  );
}
export function isPrivateAttempt(value: unknown): value is PrivateAttempt {
  if (
    !object(value) ||
    !keys(value, [
      "id",
      "submission",
      "before",
      "status",
      "checked",
      "message",
      "result",
    ]) ||
    typeof value.id !== "string" ||
    !value.id ||
    !object(value.submission) ||
    !keys(value.submission, ["contextId", "revision", "writing"]) ||
    typeof value.submission.contextId !== "string" ||
    !Number.isSafeInteger(value.submission.revision) ||
    Number(value.submission.revision) < 1 ||
    !isPreparedPrivateWriting(value.submission.writing) ||
    !Array.isArray(value.before) ||
    !value.before.every(id) ||
    new Set(value.before).size !== value.before.length ||
    !["pending", "not-sent", "uncertain", "confirmed"].includes(
      String(value.status),
    ) ||
    typeof value.checked !== "boolean" ||
    typeof value.message !== "string"
  )
    return false;
  if (value.status !== "confirmed") return value.result === null;
  const result = value.result,
    writing = value.submission.writing;
  if (
    !object(result) ||
    !keys(result, ["messageId", "url", "senderId", "recipientId", "source"]) ||
    !id(result.messageId) ||
    value.before.includes(result.messageId) ||
    result.senderId !== writing.account.id ||
    result.recipientId !== writing.recipient.id ||
    result.source !== writing.source ||
    typeof result.url !== "string"
  )
    return false;
  const route = routeFor(result.url);
  return (
    route?.kind === "private-conversation" &&
    route.url.origin === new URL(writing.recipient.url).origin &&
    route.url.searchParams.get("touid") === writing.recipient.id &&
    route.url.hash === `#pmlist_${result.messageId}`
  );
}
