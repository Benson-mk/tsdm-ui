import { mentionsCurrent } from "./mentions.js";
import {
  attr,
  byId,
  children,
  descendants,
  documentFrom,
  hasClass,
  label,
  safeURL,
  text,
  type Element,
  type Node,
} from "./html.js";
import { decodeWriting } from "./prepare-writing.js";
import { compatible, successful } from "./publish-thread.js";
import { decodeThread } from "./read-thread.js";
import { decodeDraftList, draftListPath } from "./drafts.js";
import { postCallback } from "./post-response.js";
import { verifyStoredWriting } from "./thread-verification.js";
import type {
  Account,
  DraftAttempt,
  DraftRow,
  ForumTransport,
  HostResponse,
  PreparedWriting,
  PrepareWritingResult,
} from "./types.js";
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const member = (value: Account) => (value.kind === "member" ? value.id : null);
function document(response: HostResponse) {
  let source = response.body;
  if (/json/i.test(response.contentType) || /^\s*\{/.test(source)) {
    const payload = JSON.parse(source);
    source = (payload.head ?? "") + payload.document;
  }
  return documentFrom(source);
}
function version(writing: PreparedWriting) {
  return JSON.stringify([
    writing.title,
    writing.source,
    writing.category && [
      writing.category.name,
      writing.category.value,
      writing.category.checked,
    ],
    writing.options.map((o) => [o.name, o.value, o.checked]),
    writing.uploadedReferences,
    writing.attachmentFields ?? [],
  ]);
}
function ancestor(node: Node, predicate: (node: Element) => boolean): boolean {
  for (
    let current: Node | null = node;
    current;
    current = "parentNode" in current ? current.parentNode : null
  )
    if ("tagName" in current && predicate(current)) return true;
  return false;
}
function inertArea(node: Node): boolean {
  return ancestor(
    node,
    (n) =>
      hasClass(n, "pcb") ||
      hasClass(n, "pcbs") ||
      hasClass(n, "sign") ||
      hasClass(n, "signature") ||
      /^postmessage_|^signature/.test(attr(n, "id")),
  );
}
function draftMarkers(doc: Node): Element[] {
  const list = byId(doc, "postlist"),
    title = list && byId(list, "thread_subject");
  if (
    !list ||
    !title ||
    (title.parentNode &&
      "tagName" in title.parentNode &&
      title.parentNode.tagName !== "h1") ||
    inertArea(title)
  )
    return [];
  return descendants(
    list,
    (n) =>
      n.tagName === "span" &&
      hasClass(n, "xg1") &&
      !inertArea(n) &&
      !ancestor(n, (n) => /^post_[1-9]\d*$/.test(attr(n, "id"))) &&
      children(n)
        .filter((n) => !("tagName" in n))
        .map(text)
        .join("")
        .trim() === "(草稿)" &&
      (n.parentNode === title.parentNode ||
        (!!n.parentNode &&
          ["plc", "ptm", "pbn", "vwthd"].every((c) =>
            hasClass(n.parentNode!, c),
          ))),
  );
}
function publishLinks(
  doc: Node,
  postId: string,
  threadId: string,
  origin: string,
): Element[] {
  const post = byId(doc, `post_${postId}`);
  if (!post) return [];
  return descendants(
    post,
    (n) =>
      n.tagName === "a" &&
      hasClass(n, "psave") &&
      !inertArea(n) &&
      ((ancestor(n, (n) => hasClass(n, "pob")) &&
        ancestor(n, (n) => hasClass(n, "po"))) ||
        (ancestor(n, (n) => attr(n, "id") === "fj") &&
          ancestor(n, (n) => hasClass(n, "pi")))) &&
      (() => {
        const value = safeURL(attr(n, "href"), origin);
        if (!value) return false;
        const url = new URL(value);
        return (
          url.origin === origin &&
          url.pathname === "/forum.php" &&
          !url.hash &&
          url.searchParams.get("mod") === "misc" &&
          url.searchParams.get("action") === "pubsave" &&
          url.searchParams.get("tid") === threadId &&
          [...url.searchParams.keys()].every(
            (k) =>
              ["mod", "action", "tid"].includes(k) &&
              url.searchParams.getAll(k).length === 1,
          )
        );
      })(),
  );
}
export function createDraftOperations(config: {
  origin: string;
  transport: ForumTransport;
  account: () => Account;
  generation: () => number;
  observe: (account: Account) => void;
}) {
  const used = new Set<string>(),
    pending = new Set<string>();
  const preparations = new Map<string, DraftAttempt>();
  const latestPreparations = new Map<string, number>();
  let preparationSequence = 0;

  const failure = (
    message: string,
    kind: "invalid" | "network" | "stale" = "invalid",
  ): PrepareWritingResult => ({
    kind,
    message,
    account: config.account(),
    generation: config.generation(),
    sourceURL: new URL(draftListPath, config.origin).href,
  });
  async function listRows(expected: Account): Promise<DraftRow[]> {
    const queue = [new URL(draftListPath, config.origin).href],
      seen = new Set<string>(),
      rows: DraftRow[] = [];
    while (queue.length) {
      const url = queue.shift()!;
      if (seen.has(url)) continue;
      seen.add(url);
      const response = await config.transport.request(url, { fresh: true }),
        decoded = decodeDraftList(response, url);
      config.observe(decoded.account);
      if (
        member(decoded.account) !== member(expected) ||
        decoded.kind !== "drafts"
      )
        throw Error("Draft list unavailable");
      rows.push(...decoded.drafts.rows);
      for (const link of decoded.drafts.pages.links)
        if (!seen.has(link.url)) queue.push(link.url);
    }
    return rows;
  }
  async function listed(row: DraftRow, expected: Account) {
    return (await listRows(expected)).some(
      (r) => r.threadId === row.threadId && r.boardId === row.boardId,
    );
  }
  async function observe(
    row: DraftRow,
    expected: Account,
  ): Promise<PrepareWritingResult> {
    const initialAccount = config.account();
    let generation = config.generation();
    try {
      if (
        !member(expected) ||
        !/^[1-9]\d*$/.test(row.threadId) ||
        !/^[1-9]\d*$/.test(row.boardId) ||
        !(await listed(row, expected))
      )
        return failure(
          "The same draft is no longer listed for the expected account.",
        );
      if (
        initialAccount.kind === "unknown" &&
        config.generation() === generation + 1 &&
        member(config.account()) === member(expected)
      )
        generation = config.generation();
      if (generation !== config.generation())
        return failure(
          "The account changed during draft preparation.",
          "stale",
        );
      const url = new URL(
        `/forum.php?mod=viewthread&tid=${row.threadId}`,
        config.origin,
      ).href;
      const response = await config.transport.request(url, { fresh: true }),
        decoded = decodeThread(response, url);
      config.observe(decoded.account);
      if (
        generation !== config.generation() ||
        member(decoded.account) !== member(expected)
      )
        return failure(
          "The account changed during draft preparation.",
          "stale",
        );
      if (
        decoded.kind !== "thread" ||
        decoded.thread.id !== row.threadId ||
        !decoded.thread.parent ||
        new URL(decoded.thread.parent.url).searchParams.get("fid") !==
          row.boardId
      )
        return failure(
          "The draft board or thread could not be independently verified.",
        );
      const openings = decoded.thread.posts.filter((p) =>
        /^1\s*#?$/.test(p.floor),
      );
      if (openings.length !== 1 || openings[0]?.authorId !== member(expected))
        return failure("The draft opening-post owner is unverified.");
      const postId = openings[0]!.id,
        doc = document(response);
      if (
        draftMarkers(doc).length !== 1 ||
        !publishLinks(doc, postId, row.threadId, config.origin).length
      )
        return failure(
          "The thread is not independently confirmed as an unpublished draft.",
        );
      const editURL = new URL(
        `/forum.php?mod=post&action=edit&fid=${row.boardId}&tid=${row.threadId}&pid=${postId}`,
        config.origin,
      ).href;
      const source = await config.transport.request(editURL, { fresh: true }),
        prepared = decodeWriting(source, editURL, row.boardId, {
          threadId: row.threadId,
          postId,
        });
      config.observe(prepared.account);
      if (
        generation !== config.generation() ||
        member(prepared.account) !== member(expected)
      )
        return failure(
          "The account changed during saved-source readback.",
          "stale",
        );
      if (prepared.kind !== "prepared")
        return { ...prepared, generation: config.generation() };
      return {
        ...prepared,
        generation: config.generation(),
        prepared: {
          ...prepared.prepared,
          draft: {
            threadId: row.threadId,
            postId,
            url,
            version: version(prepared.prepared),
          },
        },
      };
    } catch {
      return failure(
        "The draft could not be independently read. Existing writing is retained.",
        "network",
      );
    }
  }
  async function check(
    attempt: DraftAttempt,
    row?: DraftRow,
  ): Promise<DraftAttempt> {
    if (attempt.operation === "publish") return checkPublication(attempt);
    const writing = attempt.submission.writing;
    const known = writing.draft ?? attempt.result;
    row ??= known
      ? {
          threadId: known.threadId,
          boardId: writing.board.id,
          title: writing.title,
          url: known.url,
        }
      : undefined;
    if (!row) {
      // A current list observation cannot attribute an unknown new save.
      // Even an empty list leaves the original outcome unknown.
      try {
        await listRows(writing.account);
      } catch {
        /* Keep the unknown result. */
      }
      return {
        ...attempt,
        status: "uncertain",
        message:
          "The save may have succeeded. Select the actual draft from Drafts to check this original attempt; no save was repeated.",
        result: null,
      };
    }
    if (
      (known &&
        (row.threadId !== known.threadId ||
          row.boardId !== writing.board.id)) ||
      (!writing.draft &&
        (!attempt.priorDraftIds ||
          attempt.priorDraftIds.includes(row.threadId)))
    )
      return {
        ...attempt,
        status: "uncertain",
        message:
          "This record predates this save, differs from its original target, or the pre-send list was not retained. It cannot confirm this original attempt. No save was repeated.",
        result: null,
      };
    const result = await observe(row, writing.account);
    if (
      result.kind !== "prepared" ||
      !result.prepared.draft ||
      !verifyStoredWriting(writing, result.prepared) ||
      JSON.stringify(writing.uploadedReferences) !==
        JSON.stringify(result.prepared.uploadedReferences) ||
      JSON.stringify(writing.attachmentFields ?? []) !==
        JSON.stringify(result.prepared.attachmentFields ?? [])
    )
      return {
        ...attempt,
        status: "uncertain",
        message:
          "The same draft's complete saved revision could not be confirmed. No save was repeated.",
        result: null,
      };
    return {
      ...attempt,
      status: "confirmed",
      message: `Confirmed forum draft ${row.threadId}, submitted revision ${attempt.submission.revision}. Later changes remain unsaved.`,
      result: result.prepared.draft,
    };
  }
  async function checkPublication(
    attempt: DraftAttempt,
  ): Promise<DraftAttempt> {
    const writing = attempt.submission.writing,
      draft = writing.draft;
    const uncertain = (message: string): DraftAttempt => ({
      ...attempt,
      status: "uncertain",
      message,
      result: null,
    });
    if (
      !draft ||
      ![draft.threadId, draft.postId, writing.board.id].every((value) =>
        /^[1-9]\d*$/.test(value),
      )
    )
      return uncertain(
        "The original draft publication identity is unavailable.",
      );
    const threadURL = new URL(
      `/forum.php?mod=viewthread&tid=${draft.threadId}`,
      config.origin,
    ).href;
    const row = {
        threadId: draft.threadId,
        boardId: writing.board.id,
        title: writing.title,
        url: threadURL,
      },
      generation = config.generation();
    try {
      if (await listed(row, writing.account)) {
        const remaining = await observe(row, writing.account);
        return remaining.kind === "prepared"
          ? {
              ...attempt,
              status: "remaining-draft",
              message:
                "The record is still an unpublished forum draft. Publication is not confirmed; no action was repeated.",
              result: remaining.prepared.draft ?? null,
            }
          : uncertain(
              "The draft remains listed but its current state is unverified.",
            );
      }
      const response = await config.transport.request(threadURL, {
          fresh: true,
        }),
        decoded = decodeThread(response, threadURL);
      config.observe(decoded.account);
      if (
        config.generation() !== generation ||
        member(decoded.account) !== writing.account.id ||
        decoded.kind !== "thread"
      )
        return uncertain(
          "The actual published thread could not be independently read for the original account.",
        );
      const opening = decoded.thread.posts.filter((p) =>
        /^1\s*#?$/.test(p.floor),
      );
      const doc = document(response);
      if (
        decoded.thread.id !== draft.threadId ||
        opening.length !== 1 ||
        opening[0]?.id !== draft.postId ||
        opening[0]?.authorId !== writing.account.id ||
        decoded.thread.title !== writing.title ||
        !decoded.thread.parent ||
        new URL(decoded.thread.parent.url).searchParams.get("fid") !==
          writing.board.id ||
        draftMarkers(doc).length ||
        descendants(
          byId(doc, `post_${draft.postId}`) ?? doc,
          (n) => n.tagName === "a" && hasClass(n, "psave") && !inertArea(n),
        ).length
      )
        return uncertain(
          "The resulting thread identity, author or published state did not match the original draft.",
        );
      const nativeState = descendants(
        byId(doc, "postlist") ?? doc,
        (node) =>
          !inertArea(node) &&
          (["modact", "locked", "fico-lock", "attach_nopermission"].some(
            (name) => hasClass(node, name),
          ) ||
            attr(node, "id") === "messagetext"),
      );
      if (nativeState.some((node) => /审核|審核|moderation/i.test(label(node))))
        return {
          ...attempt,
          status: "moderation",
          message:
            "The forum reports moderation. Public thread publication has not been confirmed.",
          result: null,
        };
      if (nativeState.length)
        return uncertain(
          "The resulting thread has native state restrictions. Public thread publication has not been confirmed.",
        );
      const editURL = new URL(
        `/forum.php?mod=post&action=edit&fid=${writing.board.id}&tid=${draft.threadId}&pid=${draft.postId}`,
        config.origin,
      ).href;
      const source = await config.transport.request(editURL, { fresh: true }),
        prepared = decodeWriting(source, editURL, writing.board.id, {
          threadId: draft.threadId,
          postId: draft.postId,
        });
      config.observe(prepared.account);
      if (
        config.generation() !== generation ||
        member(prepared.account) !== writing.account.id ||
        prepared.kind !== "prepared" ||
        !verifyStoredWriting(writing, prepared.prepared) ||
        JSON.stringify(writing.attachmentFields ?? []) !==
          JSON.stringify(prepared.prepared.attachmentFields ?? [])
      )
        return uncertain(
          "The complete published source or account could not be confirmed. No publication was repeated.",
        );
      return {
        ...attempt,
        status: "published",
        message: `Confirmed publication of forum draft ${draft.threadId}, post ${draft.postId}. The draft list no longer contains this record.`,
        result: { ...draft, url: threadURL },
        publishedURL: `${threadURL}#pid${draft.postId}`,
      };
    } catch {
      return uncertain(
        "Publication may have succeeded, but independent draft and stored-source readback failed. No action was repeated.",
      );
    }
  }
  async function publish(input: DraftAttempt): Promise<DraftAttempt> {
    const attempt = clone(input),
      writing = attempt.submission.writing,
      draft = writing.draft;
    const notSent = (message: string): DraftAttempt => ({
      ...attempt,
      status: "not-sent",
      message,
      result: null,
    });
    if (
      !draft ||
      attempt.operation !== "publish" ||
      attempt.status !== "pending" ||
      !attempt.id ||
      used.has(attempt.id) ||
      pending.has(attempt.submission.contextId) ||
      config.generation() !== attempt.generation ||
      member(config.account()) !== writing.account.id
    )
      return notSent(
        "This draft publication is stale or already active. Nothing was sent.",
      );
    used.add(attempt.id);
    pending.add(attempt.submission.contextId);
    let sent = false;
    try {
      if (!(await mentionsCurrent(config, writing)))
        return notSent(
          "A selected mention identity changed before send. Nothing was sent.",
        );
      if (
        config.generation() !== attempt.generation ||
        member(config.account()) !== writing.account.id
      )
        return notSent(
          "The saved draft or account changed before publication. Current writing is retained.",
        );
      const prepared = await observe(
        {
          threadId: draft.threadId,
          boardId: writing.board.id,
          title: writing.title,
          url: draft.url,
        },
        writing.account,
      );
      if (
        prepared.kind !== "prepared" ||
        prepared.prepared.draft?.version !== draft.version ||
        !verifyStoredWriting(writing, prepared.prepared) ||
        JSON.stringify(writing.attachmentFields ?? []) !==
          JSON.stringify(prepared.prepared.attachmentFields ?? []) ||
        config.generation() !== attempt.generation
      )
        return notSent(
          "The saved draft or account changed before publication. Current writing is retained.",
        );
      const editURL = new URL(
        `/forum.php?mod=post&action=edit&fid=${writing.board.id}&tid=${draft.threadId}&pid=${draft.postId}`,
        config.origin,
      ).href;
      const current = await config.transport.request(editURL, { fresh: true }),
        decoded = decodeWriting(current, editURL, writing.board.id, {
          threadId: draft.threadId,
          postId: draft.postId,
        });
      config.observe(decoded.account);
      if (
        config.generation() !== attempt.generation ||
        member(decoded.account) !== writing.account.id ||
        decoded.kind !== "prepared" ||
        version(decoded.prepared) !== draft.version
      )
        return notSent(
          "The current saved draft changed before publication. Nothing was sent.",
        );
      const request = successful(current, writing, "publish");
      if (!request)
        return notSent(
          "The current native draft publication controls are unsupported. Nothing was sent.",
        );
      sent = true;
      const response = await config.transport.request(request.url, {
        method: "POST",
        body: request.body,
      });
      const call = postCallback(response);
      if (config.generation() !== attempt.generation)
        return {
          ...attempt,
          status: "uncertain",
          message:
            "The account changed during draft publication. Possible effects are retained.",
          result: null,
        };
      if (call?.success && /审核|審核|moderation/i.test(call.values.join(" ")))
        return {
          ...attempt,
          status: "moderation",
          message:
            "The forum reports moderation. Public thread publication has not been confirmed.",
          result: null,
        };
      return checkPublication(attempt);
    } catch {
      return sent
        ? {
            ...attempt,
            status: "uncertain",
            message:
              "Draft publication may have succeeded. Check the original attempt before another deliberate action.",
            result: null,
          }
        : notSent(
            "Fresh draft publication preparation failed. Nothing was sent.",
          );
    } finally {
      pending.delete(attempt.submission.contextId);
    }
  }
  async function prepareSave(input: DraftAttempt): Promise<DraftAttempt> {
    const attempt = clone(input),
      writing = attempt.submission.writing;
    const refused = (): DraftAttempt => ({
      ...attempt,
      status: "not-sent",
      message:
        "Fresh draft-save preparation failed or the account changed. Nothing was sent.",
      result: null,
    });
    if (
      attempt.operation === "publish" ||
      attempt.status !== "pending" ||
      !attempt.id ||
      used.has(attempt.id) ||
      pending.has(attempt.submission.contextId) ||
      config.generation() !== attempt.generation ||
      member(config.account()) !== writing.account.id
    )
      return refused();
    const preparation = ++preparationSequence;
    latestPreparations.set(attempt.submission.contextId, preparation);
    for (const [id, older] of preparations)
      if (older.submission.contextId === attempt.submission.contextId)
        preparations.delete(id);
    try {
      if (!writing.draft)
        attempt.priorDraftIds = [
          ...new Set(
            (await listRows(writing.account)).map((row) => row.threadId),
          ),
        ];
      if (
        latestPreparations.get(attempt.submission.contextId) !== preparation ||
        used.has(attempt.id) ||
        config.generation() !== attempt.generation ||
        member(config.account()) !== writing.account.id
      )
        return refused();
      preparations.set(attempt.id, clone(attempt));
      return attempt;
    } catch {
      return refused();
    }
  }
  async function save(input: DraftAttempt): Promise<DraftAttempt> {
    const attempt = clone(input),
      submission = attempt.submission,
      writing = submission.writing;
    const notSent = (message: string): DraftAttempt => ({
      ...attempt,
      status: "not-sent",
      message,
      result: null,
    });
    if (
      attempt.operation === "publish" ||
      JSON.stringify(preparations.get(attempt.id)) !==
        JSON.stringify(attempt) ||
      attempt.status !== "pending" ||
      !attempt.id ||
      used.has(attempt.id) ||
      pending.has(submission.contextId) ||
      !submission.contextId ||
      submission.revision < 1 ||
      writing.action !== "new-thread" ||
      config.generation() !== attempt.generation ||
      member(config.account()) !== writing.account.id
    )
      return notSent(
        "This draft attempt is stale or already active. Nothing was sent.",
      );
    used.add(attempt.id);
    preparations.delete(attempt.id);
    pending.add(submission.contextId);
    let sent = false;
    try {
      if (!(await mentionsCurrent(config, writing)))
        return notSent(
          "A selected mention identity changed before send. Nothing was sent.",
        );
      if (
        config.generation() !== attempt.generation ||
        member(config.account()) !== writing.account.id
      )
        return notSent(
          "The account changed before draft saving. Nothing was sent.",
        );
      let url = new URL(
        `/forum.php?mod=post&action=newthread&fid=${writing.board.id}`,
        config.origin,
      ).href;
      if (writing.draft) {
        const result = await observe(
          {
            threadId: writing.draft.threadId,
            boardId: writing.board.id,
            title: writing.title,
            url: writing.draft.url,
          },
          writing.account,
        );
        if (
          result.kind !== "prepared" ||
          result.prepared.draft?.version !== writing.draft.version
        )
          return notSent(
            "The remote draft changed or is no longer available. Resume its current revision before saving; your local writing is retained.",
          );
        url = new URL(
          `/forum.php?mod=post&action=edit&fid=${writing.board.id}&tid=${writing.draft.threadId}&pid=${writing.draft.postId}`,
          config.origin,
        ).href;
      }
      const response = await config.transport.request(url, { fresh: true }),
        prepared = decodeWriting(
          response,
          url,
          writing.board.id,
          writing.draft
            ? { threadId: writing.draft.threadId, postId: writing.draft.postId }
            : undefined,
        );
      config.observe(prepared.account);
      if (
        config.generation() !== attempt.generation ||
        member(prepared.account) !== writing.account.id
      )
        return notSent(
          "The account changed before draft saving. Nothing was sent.",
        );
      if (
        prepared.kind !== "prepared" ||
        !prepared.prepared.draftSaveAvailable ||
        !compatible(
          writing.draft
            ? {
                ...writing,
                options: writing.options.filter(
                  (option) =>
                    !["addfeed", "adddynamic", "adddynamic_doing"].includes(
                      option.name,
                    ) ||
                    prepared.prepared.options.some(
                      (current) => current.name === option.name,
                    ),
                ),
              }
            : writing,
          prepared.prepared,
        ) ||
        (writing.draft && version(prepared.prepared) !== writing.draft.version)
      )
        return notSent(
          "The current draft form changed. Your writing is retained; nothing was sent.",
        );
      if (
        JSON.stringify(writing.uploadedReferences) !==
          JSON.stringify(prepared.prepared.uploadedReferences) ||
        JSON.stringify(writing.attachmentFields ?? []) !==
          JSON.stringify(prepared.prepared.attachmentFields ?? [])
      )
        return notSent(
          "The current attachment references changed before saving. Nothing was sent; original source and metadata are retained.",
        );
      const request = successful(response, writing, "save");
      if (!request)
        return notSent(
          "The current native draft-save controls are unsupported. Nothing was sent.",
        );
      sent = true;
      const result = await config.transport.request(request.url, {
        method: "POST",
        body: request.body,
      });
      if (config.generation() !== attempt.generation)
        return {
          ...attempt,
          status: "uncertain",
          message:
            "The account changed during saving. Possible effects and original writing are retained.",
          result: null,
        };
      const call = postCallback(result);
      if (
        call &&
        !call.success &&
        /subject_(?:empty|invalid|toolong)|message_(?:empty|toolong)/.test(
          call.values.join(" "),
        )
      )
        return {
          ...attempt,
          status: "rejected",
          message: "The forum rejected draft saving. Your writing is retained.",
          result: null,
        };
      const destination = call?.success
        ? safeURL(call.values[0] ?? "", config.origin)
        : null;
      const candidate = destination ? new URL(destination) : null;
      const row = writing.draft
        ? {
            threadId: writing.draft.threadId,
            boardId: writing.board.id,
            title: writing.title,
            url: writing.draft.url,
          }
        : candidate?.origin === config.origin &&
            candidate.pathname === "/forum.php" &&
            candidate.searchParams.get("mod") === "viewthread" &&
            /^[1-9]\d*$/.test(candidate.searchParams.get("tid") ?? "")
          ? {
              threadId: candidate.searchParams.get("tid")!,
              boardId: writing.board.id,
              title: writing.title,
              url: candidate.href,
            }
          : undefined;
      return check(attempt, row);
    } catch {
      return sent
        ? {
            ...attempt,
            status: "uncertain",
            message:
              "Draft saving may have succeeded. Check the original attempt before saving again; your writing is retained.",
            result: null,
          }
        : notSent(
            "Draft preparation failed. Nothing was sent and writing is retained.",
          );
    } finally {
      pending.delete(submission.contextId);
    }
  }
  return {
    resume: observe,
    prepareSave,
    save,
    check: async (
      attempt: DraftAttempt,
      row?: DraftRow,
    ): Promise<DraftAttempt> => ({
      ...(await check(attempt, row)),
      checked: true,
    }),
    publish,
  };
}
