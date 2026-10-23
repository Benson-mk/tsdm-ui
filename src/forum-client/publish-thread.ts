import { mentionsCurrent } from "./mentions.js";
import {
  attr,
  byId,
  controlDisabled,
  descendants,
  documentFrom,
  safeURL,
  text,
  type Element,
  type Node,
} from "./html.js";
import {
  editAttachmentControls,
  editAttachmentFields,
} from "./edit-attachments.js";
import { postCallback } from "./post-response.js";
import { decodeWriting } from "./prepare-writing.js";
import { decodeThread } from "./read-thread.js";
import {
  verifyStoredWriting,
  verifyStoredReply,
} from "./thread-verification.js";
import type {
  Account,
  ForumTransport,
  HostResponse,
  PreparedWriting,
  PublicationPreparationResult,
  ThreadAttempt,
  ThreadPublication,
  ThreadSubmission,
  WritingOption,
  ReplyBefore,
} from "./types.js";
const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
const member = (account: Account) =>
  account.kind === "member" ? account.id : null;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const has = (node: Element, name: string) =>
  node.attrs.some((a) => a.name === name);
function document(response: HostResponse): Node {
  let source = response.body;
  if (/json/i.test(response.contentType) || /^\s*\{/.test(source)) {
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
  }
  return documentFrom(source);
}
function options(writing: PreparedWriting): WritingOption[] {
  return [...(writing.category ? [writing.category] : []), ...writing.options];
}
export function compatible(
  original: PreparedWriting,
  current: PreparedWriting,
): boolean {
  return (
    options(original).length === options(current).length &&
    options(current).every((fresh) => {
      const previous = options(original).find((o) => o.name === fresh.name);
      if (
        !previous ||
        previous.kind !== fresh.kind ||
        previous.disabled !== fresh.disabled ||
        !same(previous.choices, fresh.choices) ||
        previous.maxLength !== fresh.maxLength
      )
        return false;
      if (fresh.disabled)
        return (
          previous.value === fresh.value && previous.checked === fresh.checked
        );
      return (
        fresh.kind !== "select" ||
        fresh.choices.some(
          (choice) => choice.value === previous.value && !choice.disabled,
        )
      );
    })
  );
}
export function successful(
  response: HostResponse,
  writing: PreparedWriting,
): { url: string; body: string } | null {
  const doc = document(response),
    form = byId(doc, "postform");
  if (!form) return null;
  const target = safeURL(attr(form, "action"), response.url);
  if (!target) return null;
  const controls = descendants(form, (n) =>
    ["input", "textarea", "select", "button"].includes(n.tagName),
  );
  const attachmentControls =
    writing.action === "edit-post" ? editAttachmentControls(doc, form) : [];
  if (!attachmentControls) return null;
  for (const attachment of attachmentControls)
    if (!controls.includes(attachment)) controls.push(attachment);
  if (
    descendants(doc, (n) => attr(n, "form") === "postform").length ||
    controls.some((n) => attr(n, "form"))
  )
    return null;
  const tokens = controls.filter((n) => attr(n, "name") === "formhash");
  if (
    tokens.length !== 1 ||
    controlDisabled(tokens[0]!) ||
    !attr(tokens[0]!, "value") ||
    controls.some(
      (n) =>
        ["subject", "message"].includes(attr(n, "name")) && controlDisabled(n),
    )
  )
    return null;
  const pairs: [string, string][] = [];
  const submitName =
    writing.action === "edit-post"
      ? "editsubmit"
      : writing.replyTarget
        ? "replysubmit"
        : "topicsubmit";
  const submitters = controls.filter(
    (n) =>
      attr(n, "name") === submitName &&
      !controlDisabled(n) &&
      ((n.tagName === "button" && ["", "submit"].includes(attr(n, "type"))) ||
        (n.tagName === "input" && attr(n, "type") === "submit")),
  );
  if (
    submitters.length > 1 ||
    submitters.some((n) => !["yes", "true"].includes(attr(n, "value"))) ||
    (!submitters.length &&
      new URL(target).searchParams.get(submitName) !== "yes")
  )
    return null;
  if (submitters.length)
    pairs.push([submitName, attr(submitters[0]!, "value")]);
  const inactiveRush = [
    "rushreplyfrom",
    "rushreplyto",
    "rewardfloor",
    "replylimit",
    "stopfloor",
    "creditlimit",
  ];
  if (
    controls.some(
      (node) => attr(node, "name") === "rushreply" && has(node, "checked"),
    ) ||
    controls.some(
      (node) =>
        inactiveRush.includes(attr(node, "name")) && attr(node, "value") !== "",
    )
  )
    return null;
  for (const node of controls) {
    const name = attr(node, "name"),
      type = attr(node, "type").toLowerCase();
    if (
      !name ||
      controlDisabled(node) ||
      node.tagName === "button" ||
      ["submit", "button", "reset", "image"].includes(type)
    )
      continue;
    if (type === "file") {
      if (attr(node, "value")) return null;
      continue;
    }
    if (
      (["special", "save"].includes(name) &&
        !["", "0"].includes(attr(node, "value"))) ||
      (writing.action === "edit-post" &&
        name === "delattachop" &&
        attr(node, "value") !== "0")
    )
      return null;
    const supplied = options(writing).find((o) => o.name === name);
    if (
      ["checkbox", "radio"].includes(type) &&
      !(supplied ? supplied.checked : has(node, "checked"))
    )
      continue;
    const value =
      name === "subject"
        ? writing.title
        : name === "message"
          ? writing.source
          : supplied
            ? supplied.value
            : attachmentControls.includes(node)
              ? editAttachmentFields([node])[0]!.value
              : node.tagName === "textarea"
                ? text(node)
                : node.tagName === "select"
                  ? attr(
                      descendants(
                        node,
                        (n) => n.tagName === "option" && has(n, "selected"),
                      )[0] ??
                        descendants(node, (n) => n.tagName === "option")[0] ??
                        node,
                      "value",
                    )
                  : attr(node, "value");
    if (
      (has(node, "required") && !value.trim()) ||
      (/^\d+$/.test(attr(node, "maxlength")) &&
        value.length > Number(attr(node, "maxlength")))
    )
      return null;
    // Unknown interactive controls need an interpretation before they can be sent.
    if (
      !supplied &&
      ![
        "subject",
        "message",
        "checkbox",
        "rushreply",
        ...inactiveRush,
      ].includes(name) &&
      !(
        [
          "formhash",
          "posttime",
          "wysiwyg",
          "save",
          ...(writing.replyTarget
            ? [
                "reppid",
                "reppost",
                "noticeauthor",
                "noticeauthormsg",
                "noticetrimstr",
                "handlekey",
              ]
            : []),
        ].includes(name) && type === "hidden"
      ) &&
      !attachmentControls.includes(node) &&
      !(
        writing.action === "edit-post" &&
        type === "hidden" &&
        (["fid", "tid", "pid", "page", "wysiwyg", "delattachop"].includes(
          name,
        ) ||
          /^attachnew\[[1-9]\d*\]\[(?:description|readperm|price)\]$/.test(
            name,
          ))
      )
    )
      return null;
    pairs.push([name, value]);
  }
  const url = new URL(target);
  url.searchParams.set("inajax", "1");
  url.searchParams.delete("tsdmapp");
  return { url: url.href, body: new URLSearchParams(pairs).toString() };
}
function candidate(value: string, origin: string): string | null {
  const safe = safeURL(value, origin);
  if (!safe) return null;
  const url = new URL(safe);
  if (
    url.origin !== origin ||
    url.pathname !== "/forum.php" ||
    url.searchParams.get("mod") !== "viewthread" ||
    !/^[1-9]\d*$/.test(url.searchParams.get("tid") ?? "") ||
    [...url.searchParams.keys()].some(
      (key) =>
        !["mod", "tid", "pid", "page", "extra"].includes(key) ||
        url.searchParams.getAll(key).length !== 1,
    )
  )
    return null;
  const postId =
    url.searchParams.get("pid") || /^#pid([1-9]\d*)$/.exec(url.hash)?.[1];
  if (
    (url.searchParams.has("pid") &&
      !/^[1-9]\d*$/.test(url.searchParams.get("pid")!)) ||
    (url.searchParams.has("page") &&
      !/^[1-9]\d*$/.test(url.searchParams.get("page")!))
  )
    return null;
  if (
    url.hash &&
    (!/^#pid[1-9]\d*$/.test(url.hash) ||
      (postId && url.hash !== `#pid${postId}`))
  )
    return null;
  url.searchParams.delete("pid");
  url.hash = postId ? `pid${postId}` : "";
  return url.href;
}
/** Parse a literal callback as data; no forum script is executed. */
export function outcome(
  response: HostResponse,
  origin: string,
): {
  kind: "candidate" | "rejected" | "moderation" | "unknown";
  url?: string;
  message: string;
} {
  const call = postCallback(response),
    source = call?.values.join(" ") ?? "";
  const moderation = /审核|審核|moderation/i;
  if (call?.success && moderation.test(source))
    return {
      kind: "moderation",
      message:
        "The forum reports pending moderation. Public stored source has not been confirmed.",
    };
  // A callback destination is a hint only; independent readback decides success.
  if (call?.success) {
    const url = candidate(call.values[0]!, origin);
    if (url)
      return {
        kind: "candidate",
        url,
        message: "The response supplied a candidate. Checking independently…",
      };
  }
  if (
    call &&
    !call.success &&
    /subject_(?:empty|invalid|toolong)|message_(?:empty|toolong)|post_(?:flood|smilies|url|validation)|标题不能为空|標題不能為空|内容不能为空|內容不能為空|验证失败|驗證失敗/.test(
      source,
    )
  )
    return {
      kind: "rejected",
      message:
        "The forum explicitly refused validation. Nothing is confirmed published.",
    };
  return {
    kind: "unknown",
    message:
      "The publication outcome is uncertain. Check the original attempt before considering another send.",
  };
}
export function createThreadPublisher(config: {
  origin: string;
  transport: ForumTransport;
  account: () => Account;
  generation: () => number;
  observe: (account: Account) => void;
}) {
  const forms = new Map<
    string,
    { publication: ThreadPublication; request: { url: string; body: string } }
  >();
  const reviews = new Map<string, string>();
  const used = new Set<string>(),
    pending = new Set<string>();
  async function replyBefore(
    writing: PreparedWriting,
  ): Promise<ReplyBefore | null> {
    if (!writing.replyTarget) return null;
    const generation = config.generation(),
      url = new URL("/forum.php", config.origin);
    for (const [key, value] of Object.entries({
      mod: "viewthread",
      tid: writing.replyTarget.threadId,
      tsdmapp: "json",
    }))
      url.searchParams.set(key, value);
    const response = await config.transport.request(url.href, { fresh: true });
    if (config.generation() !== generation) throw Error("stale");
    const page = decodeThread(response, url.href);
    config.observe(page.account);
    if (
      config.generation() !== generation ||
      member(page.account) !== writing.account.id ||
      page.kind !== "thread" ||
      !page.thread.parent ||
      new URL(page.thread.parent.url).searchParams.get("fid") !==
        writing.board.id
    )
      throw Error("invalid");
    const owned: ReplyBefore["owned"] = [];
    for (const post of page.thread.posts.filter(
      (post) => post.authorId === writing.account.id,
    )) {
      const edit = new URL("/forum.php", config.origin);
      for (const [key, value] of Object.entries({
        mod: "post",
        action: "edit",
        fid: writing.board.id,
        tid: writing.replyTarget.threadId,
        pid: post.id,
        tsdmapp: "json",
      }))
        edit.searchParams.set(key, value);
      const source = await config.transport.request(edit.href, { fresh: true });
      if (config.generation() !== generation) throw Error("stale");
      const decoded = decodeWriting(
        source,
        edit.href,
        writing.board.id,
        { threadId: writing.replyTarget.threadId, postId: post.id },
        writing.replyTarget,
      );
      config.observe(decoded.account);
      if (
        config.generation() !== generation ||
        member(decoded.account) !== writing.account.id ||
        decoded.kind !== "prepared"
      )
        throw Error("invalid");
      owned.push({ postId: post.id, writing: decoded.prepared });
    }
    return {
      pageURL: url.href,
      postIds: page.thread.posts.map((post) => post.id),
      owned,
    };
  }
  async function verify(
    attempt: ThreadAttempt,
    destination: string,
  ): Promise<ThreadAttempt> {
    const uncertain = (message: string): ThreadAttempt =>
      attempt.status === "confirmed" && attempt.result
        ? {
            ...attempt,
            checked: true,
            message: `Previous stored confirmation retained. This recheck did not verify the current result. ${message}`,
          }
        : {
            ...attempt,
            status: "uncertain",
            checked: true,
            message,
            result: null,
          };
    const url = candidate(destination, config.origin),
      submitted = attempt.publication.submission,
      writing = submitted.writing;
    if (
      !url ||
      (writing.replyTarget &&
        new URL(url).searchParams.get("tid") !== writing.replyTarget.threadId)
    )
      return uncertain(
        "No supported candidate thread URL is available. Enter its thread URL to check this original attempt.",
      );
    const startGeneration = config.generation();
    try {
      const response = await config.transport.request(url, { fresh: true });
      if (config.generation() !== startGeneration)
        return uncertain(
          "The account changed during result checking. Original writing and possible effects are retained.",
        );
      const decoded = decodeThread(response, url);
      config.observe(decoded.account);
      if (member(decoded.account) !== writing.account.id)
        return uncertain(
          "The account changed during result checking. Original writing and possible effects are retained.",
        );
      if (decoded.kind !== "thread" || decoded.thread.posts.length < 1)
        return uncertain(
          "The candidate thread could not be independently read. Publication remains uncertain.",
        );
      const thread = decoded.thread,
        opening = writing.replyTarget
          ? thread.posts.filter(
              (post) =>
                post.id ===
                (new URL(url).searchParams.get("pid") ||
                  new URL(url).hash.slice(4)),
            )
          : thread.posts.filter((post) => /^1\s*#?$/.test(post.floor));
      if (
        opening.length !== 1 ||
        (!writing.replyTarget && opening[0] !== thread.posts[0]) ||
        opening[0]!.authorId !== writing.account.id ||
        (!writing.replyTarget && thread.title !== writing.title) ||
        !thread.parent ||
        new URL(thread.parent.url).searchParams.get("fid") !== writing.board.id
      )
        return uncertain(
          "Candidate actor, board, title or opening-post identity did not match the submitted revision.",
        );
      const post = opening[0]!,
        editURL = new URL("/forum.php", config.origin);
      for (const [key, value] of Object.entries({
        mod: "post",
        action: "edit",
        fid: writing.board.id,
        tid: thread.id,
        pid: post.id,
        tsdmapp: "json",
      }))
        editURL.searchParams.set(key, value);
      const beforeSource = config.generation();
      const source = await config.transport.request(editURL.href, {
        fresh: true,
      });
      if (config.generation() !== beforeSource)
        return uncertain(
          "The account changed during stored-source readback. Possible publication remains uncertain.",
        );
      const observed = decodeWriting(
        source,
        editURL.href,
        writing.board.id,
        {
          threadId: thread.id,
          postId: post.id,
        },
        writing.replyTarget,
      );
      config.observe(observed.account);
      if (
        config.generation() !== beforeSource ||
        member(observed.account) !== writing.account.id
      )
        return uncertain(
          "The account changed during stored-source readback. Possible publication remains uncertain.",
        );
      let supplement = null;
      if (writing.replyTarget && observed.kind === "prepared") {
        const before =
          attempt.publication.replyBefore?.owned.find(
            (prior) => prior.postId === post.id,
          )?.writing ?? null;
        attempt = {
          ...attempt,
          replyComparison: {
            postId: post.id,
            before,
            observed: clone(observed.prepared),
          },
        };
        supplement = verifyStoredReply(writing, before, observed.prepared);
        if (before && !supplement)
          return uncertain(
            "The returned post existed before sending. Complete before and observed source are retained for comparison; a merged result has not been confirmed.",
          );
      }
      const verification =
        observed.kind === "prepared"
          ? (supplement ?? verifyStoredWriting(writing, observed.prepared))
          : null;
      if (!verification)
        return uncertain(
          "Complete stored source or offered options did not match, or were unavailable. No confirmation is claimed.",
        );
      return {
        ...attempt,
        status: "confirmed",
        checked: true,
        candidateURL: url,
        message: `Confirmed stored ${writing.replyTarget ? "reply in thread" : "thread"} ${thread.id}, post ${post.id}, submitted revision ${submitted.revision}.`,
        result: {
          threadId: thread.id,
          postId: post.id,
          url: `${url.split("#")[0]}#pid${post.id}`,
          verification,
        },
      };
    } catch {
      return uncertain(
        "Independent stored-result readback failed. Publication remains uncertain; no send was repeated.",
      );
    }
  }
  return {
    async prepare(
      submission: ThreadSubmission,
    ): Promise<PublicationPreparationResult> {
      const fail = (
        message: string,
        kind: "validation" | "stale" | "network" = "validation",
      ): PublicationPreparationResult => ({
        kind,
        message,
        account: config.account(),
        generation: config.generation(),
      });
      if (
        !submission.contextId ||
        !Number.isSafeInteger(submission.revision) ||
        submission.revision < 1 ||
        !["new-thread", "reply", "quick-quote"].includes(
          submission.writing.action,
        ) ||
        (submission.writing.action === "new-thread" &&
          Boolean(submission.writing.replyTarget)) ||
        (submission.writing.action === "reply" &&
          submission.writing.replyTarget?.postId !== null) ||
        (submission.writing.action === "quick-quote" &&
          !/^[1-9]\d*$/.test(submission.writing.replyTarget?.postId ?? "")) ||
        (submission.writing.action !== "new-thread" &&
          (!submission.writing.replyTarget ||
            !/^[1-9]\d*$/.test(submission.writing.replyTarget.threadId))) ||
        !/^[1-9]\d*$/.test(submission.writing.board.id) ||
        (submission.writing.action === "new-thread" &&
          !submission.writing.title.trim()) ||
        !submission.writing.source.trim() ||
        /[\r\n]/.test(submission.writing.title)
      )
        return fail(
          "A title, complete source and valid ordinary new-thread revision are required.",
        );
      submission = clone(submission);
      const id = crypto.randomUUID();
      reviews.set(submission.contextId, id);
      for (const [key, form] of forms)
        if (form.publication.submission.contextId === submission.contextId)
          forms.delete(key);
      const writing = clone(submission.writing),
        url = new URL("/forum.php", config.origin);
      for (const [key, value] of Object.entries({
        mod: "post",
        action: writing.replyTarget ? "reply" : "newthread",
        ...(writing.replyTarget
          ? {
              tid: writing.replyTarget.threadId,
              ...(writing.replyTarget.postId
                ? { reppost: writing.replyTarget.postId }
                : {}),
            }
          : {}),
        fid: writing.board.id,
        tsdmapp: "json",
      }))
        url.searchParams.set(key, value);
      const generation = config.generation();
      try {
        const response = await config.transport.request(url.href, {
          fresh: true,
        });
        if (
          config.generation() !== generation ||
          reviews.get(submission.contextId) !== id
        )
          return fail(
            "The account changed or expired during preparation. Original writing remains paused.",
            "stale",
          );
        const decoded = decodeWriting(
          response,
          url.href,
          writing.board.id,
          undefined,
          writing.replyTarget,
        );
        config.observe(decoded.account);
        if (member(decoded.account) !== writing.account.id)
          return fail(
            "The account changed or expired during preparation. Original writing remains paused.",
            "stale",
          );
        if (decoded.kind !== "prepared") return fail(decoded.message);
        if (!(await mentionsCurrent(config, writing)))
          return fail(
            "A selected mention identity changed or could not be revalidated. Resolve the person again.",
          );

        if (!compatible(writing, decoded.prepared))
          return fail(
            "The current native options changed or are unavailable. Review the current form before publication; no values were reset.",
          );
        const request = successful(response, writing);
        if (!request)
          return fail(
            "The current native successful controls or required values are unsupported. Nothing was sent.",
          );
        const beforeGeneration = config.generation();
        const before = await replyBefore(writing);
        if (
          config.generation() !== beforeGeneration ||
          reviews.get(submission.contextId) !== id
        )
          return fail(
            "The account or preparation changed during prior-source observation.",
            "stale",
          );
        const publication: ThreadPublication = {
          id,
          generation: config.generation(),
          submission: clone(submission),
          ...(before ? { replyBefore: before } : {}),
        };
        forms.set(publication.id, { publication: clone(publication), request });
        return {
          kind: "ready",
          publication,
          account: config.account(),
          generation: config.generation(),
        };
      } catch {
        return fail(
          "Fresh publication preparation failed. Your writing remains here.",
          "network",
        );
      }
    },
    async publish(attempt: ThreadAttempt): Promise<ThreadAttempt> {
      attempt = clone(attempt);
      const known = forms.get(attempt.publication.id),
        contextId = attempt.publication.submission.contextId;
      const notSent = (message: string): ThreadAttempt => ({
        ...attempt,
        status: "not-sent",
        message,
      });
      if (
        !known ||
        !same(known.publication, attempt.publication) ||
        attempt.status !== "pending" ||
        !attempt.id ||
        used.has(attempt.id) ||
        pending.has(contextId) ||
        config.generation() !== known.publication.generation ||
        member(config.account()) !==
          known.publication.submission.writing.account.id
      )
        return notSent(
          "This preparation, account or attempt is stale or already active. Nothing was sent.",
        );
      used.add(attempt.id);
      pending.add(contextId);
      forms.delete(attempt.publication.id);
      let sent = false;
      try {
        const writing = known.publication.submission.writing;
        const checkURL = new URL("/forum.php", config.origin);
        for (const [key, value] of Object.entries({
          mod: "post",
          action: writing.replyTarget ? "reply" : "newthread",
          ...(writing.replyTarget
            ? {
                tid: writing.replyTarget.threadId,
                ...(writing.replyTarget.postId
                  ? { reppost: writing.replyTarget.postId }
                  : {}),
              }
            : {}),
          fid: writing.board.id,
          tsdmapp: "json",
        }))
          checkURL.searchParams.set(key, value);
        if (!(await mentionsCurrent(config, writing)))
          return notSent(
            "A selected mention identity changed before send. Nothing was sent.",
          );
        const current = await config.transport.request(checkURL.href, {
          fresh: true,
        });
        if (config.generation() !== known.publication.generation)
          return notSent(
            "The account changed or expired before send. Original writing remains retained and paused.",
          );
        const checked = decodeWriting(
          current,
          checkURL.href,
          writing.board.id,
          undefined,
          writing.replyTarget,
        );
        config.observe(checked.account);
        if (
          config.generation() !== known.publication.generation ||
          member(checked.account) !== writing.account.id
        )
          return notSent(
            "The account changed or expired before send. Original writing remains retained and paused.",
          );
        if (
          checked.kind !== "prepared" ||
          !compatible(writing, checked.prepared)
        )
          return notSent(
            "The current form changed before send. Nothing was sent; review again.",
          );
        const request = successful(current, writing);
        if (!request)
          return notSent(
            "The current successful controls changed before send. Nothing was sent.",
          );
        if (writing.replyTarget) {
          const before = await replyBefore(writing);
          if (!same(before, known.publication.replyBefore))
            return notSent(
              "A previously observed post changed before send. Review the current reply again; nothing was sent.",
            );
          if (config.generation() !== known.publication.generation)
            return notSent(
              "The account changed before send. Nothing was sent.",
            );
        }
        sent = true;
        const response = await config.transport.request(request.url, {
          method: "POST",
          body: request.body,
          fresh: true,
        });
        if (
          config.generation() !== known.publication.generation ||
          member(config.account()) !==
            known.publication.submission.writing.account.id
        )
          return {
            ...attempt,
            status: "uncertain",
            message:
              "The account changed while publication was in flight. It may have been accepted; no rollback or atomic account isolation is guaranteed.",
          };
        const result = outcome(response, config.origin);
        if (result.kind === "candidate")
          return await verify(
            { ...attempt, candidateURL: result.url!, status: "uncertain" },
            result.url!,
          );
        return {
          ...attempt,
          status: result.kind === "unknown" ? "uncertain" : result.kind,
          message: result.message,
        };
      } catch {
        return sent
          ? {
              ...attempt,
              status: "uncertain",
              message:
                "The response was lost. The forum may have accepted this attempt. Check result; no send was repeated.",
            }
          : notSent(
              "Fresh preflight failed before publication was sent. Your writing is retained; review again deliberately.",
            );
      } finally {
        pending.delete(contextId);
      }
    },
    check: (attempt: ThreadAttempt, url?: string) =>
      verify(clone(attempt), url || attempt.candidateURL || ""),
  };
}
