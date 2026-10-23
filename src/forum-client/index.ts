import {
  createAttachmentRemoval,
  createUploadAuthoring,
} from "./upload-authoring.js";
import { findMention } from "./mentions.js";
import { createDraftOperations } from "./draft-operations.js";
import { decodeDraftList, draftListPath, draftListURL } from "./drafts.js";
import { fileFailure } from "./download.js";
import { decodeNotices } from "./notices.js";
import {
  decodeSearchForm,
  prepareSearchRequest,
  decodeSearchResults,
} from "./search.js";
import { decodeWriting } from "./prepare-writing.js";
import { createPostEditor } from "./edit-post.js";
import { createThreadPublisher } from "./publish-thread.js";
export { editBaseline } from "./edit-post.js";
export { unresolvedWritingAttachments } from "./prepare-writing.js";
import { decodeThread } from "./read-thread.js";
import { decodeBoard } from "./read-board.js";
import { routeFor } from "./routes.js";
export function describeDestination(value: string): {
  kind: "directory" | "board" | "thread" | "redirect" | "search" | "notices";
  url: string;
} | null {
  const route = routeFor(value);
  return route ? { kind: route.kind, url: route.url.href } : null;
}
import type {
  Account,
  AttachmentRequest,
  AttachmentResult,
  ForumClient,
  ForumTransport,
  ReadResult,
  SearchCriteria,
  SearchForm,
  Search,
} from "./types.js";
export type * from "./types.js";
const actor = (account: Account): string =>
  account.kind === "member" ? `member:${account.id}` : account.kind;
export const FORUM_CLIENT_VERSION = "0.8.0";
export function createForumClient(options: {
  origin: string;
  transport: ForumTransport;
}): ForumClient {
  let account: Account = { kind: "unknown" };
  let generation = 0;
  let sequence = 0;
  let downloadSequence = 0;
  const drafts = createDraftOperations({
    ...options,
    account: () => account,
    generation: () => generation,
    observe: (observed) => {
      if (actor(observed) !== actor(account)) {
        account = observed;
        generation++;
      }
    },
  });
  const publisher = createThreadPublisher({
    ...options,
    account: () => account,
    generation: () => generation,
    observe: (observed) => {
      if (actor(observed) !== actor(account)) {
        account = observed;
        generation++;
      }
    },
  });
  const editor = createPostEditor({
    ...options,
    account: () => account,
    generation: () => generation,
    observe: (observed) => {
      if (actor(observed) !== actor(account)) {
        account = observed;
        generation++;
      }
    },
  });
  return {
    removeUploadedAttachment: createAttachmentRemoval({
      ...options,
      generation: () => generation,
      observe: (observed) => {
        if (actor(observed) !== actor(account)) {
          account = observed;
          generation++;
        }
      },
    }),
    uploadAttachment: createUploadAuthoring({
      ...options,
      generation: () => generation,
      observe: (observed) => {
        if (actor(observed) !== actor(account)) {
          account = observed;
          generation++;
        }
      },
    }),
    findMention: (writing, query) =>
      findMention(
        {
          ...options,
          account: () => account,
          generation: () => generation,
          observe: (observed) => {
            if (actor(observed) !== actor(account)) {
              account = observed;
              generation++;
            }
          },
        },
        writing,
        query,
      ),
    preparePostEdit: editor.load,
    prepareEditPublication: editor.prepare,
    savePostEdit: editor.save,
    checkEditResult: editor.check,
    resumeDraft: drafts.resume,
    prepareDraftSave: drafts.prepareSave,
    saveDraft: drafts.save,
    publishDraft: drafts.publish,
    checkDraft: drafts.check,
    async readDrafts(
      destination = new URL(draftListPath, options.origin).href,
      prior,
      expectedAccount,
    ) {
      const current = ++sequence;
      const fail = (
        kind: "invalid" | "network" | "stale",
        message: string,
      ) => ({ kind, message, account, generation, sourceURL: destination });
      const url = draftListURL(destination, options.origin);
      if (
        !url ||
        (prior &&
          ![prior.url, ...prior.pages.links.map((link) => link.url)].includes(
            url.href,
          ))
      )
        return fail(
          "invalid",
          "This draft page was not offered by the current list.",
        );
      url.searchParams.set("tsdmapp", "json");
      try {
        const response = await options.transport.request(url.href, {
          fresh: true,
        });
        if (current !== sequence)
          return fail("stale", "A newer request replaced this draft list.");
        const decoded = decodeDraftList(response, destination);
        if (actor(decoded.account) !== actor(account)) {
          account = decoded.account;
          generation++;
        }
        if (
          expectedAccount &&
          actor(decoded.account) !== actor(expectedAccount)
        )
          return fail(
            "stale",
            "The account changed while loading drafts. Load the current account's list explicitly.",
          );
        if (decoded.kind === "drafts" && decoded.drafts)
          return {
            kind: "drafts",
            drafts: decoded.drafts,
            account,
            generation,
            sourceURL: destination,
          };
        return {
          kind: decoded.kind === "drafts" ? "invalid" : decoded.kind,
          message:
            "message" in decoded
              ? String(decoded.message)
              : "The draft list is incomplete.",
          account,
          generation,
          sourceURL: destination,
        };
      } catch {
        return fail(
          current !== sequence ? "stale" : "network",
          "The forum draft list could not be reached.",
        );
      }
    },
    prepareThreadPublication: publisher.prepare,
    publishThread: publisher.publish,
    checkThreadResult: publisher.check,
    async readNotices(destination, prior, expectedAccount) {
      const current = ++sequence;
      const route = routeFor(destination);
      const fail = (
        message: string,
        kind: "invalid" | "stale" | "network" = "invalid",
      ): ReadResult => ({
        kind,
        message,
        account,
        generation,
        sourceURL: destination,
      });
      if (route?.kind !== "notices" || route.url.origin !== options.origin)
        return fail("This is not a supported notice destination.");
      if (
        prior &&
        ![
          prior.url,
          ...prior.categories.map((link) => link.url),
          ...prior.pages.links.map((link) => link.url),
        ].includes(destination)
      )
        return fail(
          "This category or page was not offered by the current notice list.",
        );
      route.url.searchParams.set("tsdmapp", "json");
      try {
        const response = await options.transport.request(route.url.href, {
          fresh: true,
        });
        if (current !== sequence)
          return fail(
            "A newer request replaced this notice load. It may still have marked notices read.",
            "stale",
          );
        const decoded = decodeNotices(response, destination);
        if (actor(decoded.account) !== actor(account)) {
          account = decoded.account;
          generation++;
        }
        if (
          decoded.kind === "notices" &&
          expectedAccount &&
          actor(decoded.account) !== actor(expectedAccount)
        )
          return fail(
            "The account changed while loading notices. Previous notices were cleared. This request may still have had read effects.",
          );
        return { ...decoded, generation };
      } catch {
        return fail(
          "The notice request failed. It may still have marked notices read. Retry only deliberately.",
          current !== sequence ? "stale" : "network",
        );
      }
    },
    async prepareReply(boardId, target) {
      const current = ++sequence;
      const url = new URL("/forum.php", options.origin);
      for (const [key, value] of Object.entries({
        mod: "post",
        action: "reply",
        fid: boardId,
        tid: target.threadId,
        tsdmapp: "json",
      }))
        url.searchParams.set(key, value);
      if (
        !/^[1-9]\d*$/.test(boardId) ||
        !/^[1-9]\d*$/.test(target.threadId) ||
        (target.postId !== null && !/^[1-9]\d*$/.test(target.postId))
      )
        return {
          kind: "invalid",
          message: "A supported ordinary thread target is required.",
          account,
          generation,
          sourceURL: url.href,
        };
      if (target.postId) url.searchParams.set("reppost", target.postId);
      try {
        const response = await options.transport.request(url.href, {
          fresh: true,
        });
        if (current !== sequence)
          return {
            kind: "stale",
            message: "A newer action replaced reply preparation.",
            account,
            generation,
            sourceURL: url.href,
          };
        const result = decodeWriting(
          response,
          url.href,
          boardId,
          undefined,
          target,
        );
        if (actor(result.account) !== actor(account)) {
          account = result.account;
          generation++;
        }
        return { ...result, generation };
      } catch {
        return {
          kind: "network",
          message:
            "The reply form could not be reached. Your writing is retained.",
          account,
          generation,
          sourceURL: url.href,
        };
      }
    },
    async prepareNewThread(boardId) {
      const current = ++sequence;
      const url = new URL("/forum.php", options.origin);
      url.searchParams.set("mod", "post");
      url.searchParams.set("action", "newthread");
      url.searchParams.set("fid", boardId);
      url.searchParams.set("tsdmapp", "json");
      if (!/^[1-9]\d*$/.test(boardId))
        return {
          kind: "invalid",
          message: "A valid board is required.",
          account,
          generation,
          sourceURL: url.href,
        };
      try {
        const response = await options.transport.request(url.href);
        if (current !== sequence)
          return {
            kind: "stale",
            message: "A newer account request replaced this preparation.",
            account,
            generation,
            sourceURL: url.href,
          };
        const result = decodeWriting(response, url.href, boardId);
        if (JSON.stringify(result.account) !== JSON.stringify(account)) {
          account = result.account;
          generation++;
        }
        return { ...result, generation };
      } catch {
        return {
          kind: current !== sequence ? "stale" : "network",
          message: "The form could not be reached. Your writing is retained.",
          account,
          generation,
          sourceURL: url.href,
        };
      }
    },
    get account() {
      return account;
    },
    get generation() {
      return generation;
    },
    cancelDownload() {
      downloadSequence++;
    },
    async downloadAttachment(
      request: AttachmentRequest,
    ): Promise<AttachmentResult> {
      const attempt = ++downloadSequence;
      const stale = () => ({
        kind: "stale" as const,
        message: "This download attempt was replaced or cancelled.",
      });
      if (!options.transport.requestFile)
        return {
          kind: "invalid",
          message: "File downloads are unavailable in this host.",
        };
      const checked = await this.readPage(request.threadURL, { fresh: true });
      if (checked.kind !== "thread")
        return {
          kind: "invalid",
          message:
            "Current attachment access could not be confirmed. Refresh the thread or continue in the native forum.",
        };
      if (attempt !== downloadSequence) return stale();
      const identity = (value: Account) =>
        value.kind === "member" ? `member:${value.id}` : value.kind;
      if (
        checked.account.kind === "unknown" ||
        identity(checked.account) !== identity(request.account)
      )
        return {
          kind: "stale",
          message:
            "The forum account changed or could not be confirmed. Refresh the thread before downloading.",
        };
      const found = checked.thread.posts
        .find((post) => post.id === request.postId)
        ?.attachments?.filter((item) => item.id === request.attachmentId);
      if (found?.length !== 1)
        return {
          kind: "permission",
          message:
            "The forum no longer offers this attachment for direct download. No purchase was attempted.",
        };
      const attachment = found[0]!;
      const ticket = generation;
      try {
        const response = await options.transport.requestFile(attachment.url);
        if (attempt !== downloadSequence) return stale();
        if (generation !== ticket)
          return {
            kind: "stale",
            message:
              "The forum account changed while receiving the file. Refresh the thread before downloading.",
          };
        const failure = fileFailure(response);
        if (failure) return failure;
        if (response.url !== attachment.url)
          return {
            kind: "invalid",
            message:
              "The forum returned a different file destination. Nothing is ready to save.",
          };
        return {
          kind: "file",
          name: attachment.name,
          contentType: response.contentType,
          bytes: response.bytes,
          generation: ticket,
        };
      } catch {
        return {
          kind: "network",
          message:
            "The file transfer failed or was interrupted. Nothing is ready to save.",
        };
      }
    },
    async readSearchPage(
      destination: string,
      prior: Search,
      expectedAccount: Account,
    ): Promise<ReadResult> {
      const current = ++sequence;
      const fail = (
        kind: "invalid" | "stale" | "network",
        message: string,
      ): ReadResult => ({
        kind,
        message,
        account,
        generation,
        sourceURL: destination,
      });
      if (
        !prior.results ||
        !prior.effective ||
        !prior.results.pages.links.some((link) => link.url === destination)
      )
        return fail(
          "invalid",
          "This page was not offered by the current search results.",
        );
      const url = new URL(destination);
      url.searchParams.set("tsdmapp", "json");
      try {
        const response = await options.transport.request(url.href);
        if (current !== sequence)
          return fail("stale", "A newer request replaced this search page.");
        const decoded = decodeSearchResults(
          response,
          destination,
          prior.form,
          prior.effective,
        );
        if (actor(decoded.account) !== actor(account)) {
          account = decoded.account;
          generation++;
        }
        if (decoded.kind === "search") {
          if (decoded.account.kind === "unknown")
            return fail(
              "invalid",
              "The current account could not be established from this search page. Review the current account before searching again deliberately.",
            );
          if (actor(decoded.account) !== actor(expectedAccount))
            return fail(
              "invalid",
              "The account changed while reading search results. Review the current account before searching again deliberately.",
            );
          if (decoded.search.results?.id !== prior.results.id)
            return fail(
              "invalid",
              "The returned page belongs to a different search.",
            );
          decoded.search.edited = prior.edited;
          decoded.search.submitted = prior.submitted;
        }
        return { ...decoded, generation };
      } catch {
        return fail(
          current !== sequence ? "stale" : "network",
          "The search page could not be loaded. It has not been requested again automatically.",
        );
      }
    },
    async search(
      criteria: SearchCriteria,
      form: SearchForm,
      expectedAccount: Account,
    ): Promise<ReadResult> {
      const current = ++sequence;
      const fail = (
        kind: "invalid" | "stale" | "network",
        message: string,
      ): ReadResult => ({
        kind,
        message,
        account,
        generation,
        sourceURL: form.url,
      });
      const formURL = new URL(form.url);
      if (
        formURL.origin !== options.origin ||
        formURL.pathname !== "/search.php"
      )
        return fail("invalid", "The search form is not from this forum.");
      formURL.searchParams.set("tsdmapp", "json");
      try {
        const fresh = await options.transport.request(formURL.href);
        if (current !== sequence)
          return fail("stale", "A newer action replaced this search.");
        const prepared = prepareSearchRequest(fresh, form.url, criteria);
        if (prepared.kind !== "prepared") return { ...prepared, generation };
        if (
          prepared.account.kind === "unknown" ||
          expectedAccount.kind === "unknown"
        )
          return fail(
            "invalid",
            "The current account could not be established. Search has not been submitted.",
          );
        if (actor(prepared.account) !== actor(expectedAccount)) {
          account = prepared.account;
          generation++;
          return fail(
            "invalid",
            "The account changed while preparing search. Review the current form and submit again deliberately.",
          );
        }
        const response = await options.transport.request(prepared.url, {
          method: "POST",
          body: prepared.body,
        });
        if (current !== sequence)
          return fail(
            "stale",
            "A newer action replaced this search. The earlier request may still have had effects.",
          );
        const decoded = decodeSearchResults(
          response,
          form.url,
          prepared.form,
          criteria,
        );
        if (actor(decoded.account) !== actor(account)) {
          account = decoded.account;
          generation++;
        }
        if (decoded.kind === "search" && decoded.account.kind === "unknown")
          return fail(
            "invalid",
            "The current account could not be established from the search response. The request may still have used credits or quota.",
          );
        if (
          decoded.kind === "search" &&
          actor(decoded.account) !== actor(expectedAccount)
        )
          return fail(
            "invalid",
            "The account changed during search. Its effects are not isolated; review the current account before another deliberate search.",
          );
        return { ...decoded, generation };
      } catch {
        return fail(
          current !== sequence ? "stale" : "network",
          "Search could not be completed. It may have used credits or quota. Submit again only deliberately.",
        );
      }
    },
    readThread(destination: string): Promise<ReadResult> {
      return this.readPage(destination);
    },
    async readPage(
      destination: string,
      readOptions?: { fresh?: boolean },
    ): Promise<ReadResult> {
      const current = ++sequence;
      const route = routeFor(destination);
      const url = route?.url;
      if (route?.kind === "notices")
        return {
          kind: "invalid",
          message:
            "Notices must be loaded deliberately. Each load may mark notices read.",
          account,
          generation,
          sourceURL: destination,
        };
      if (route?.kind === "search" && url?.searchParams.has("searchid"))
        return {
          kind: "invalid",
          message:
            "An existing search page must be opened deliberately from its returned results. Open Search to prepare a new search.",
          account,
          generation,
          sourceURL: destination,
        };
      if (!url || url.origin !== options.origin)
        return {
          kind: "invalid",
          message: "This is not a supported thread destination.",
          account,
          generation,
          sourceURL: destination,
        };
      url.searchParams.set("tsdmapp", "json");
      try {
        const response = await options.transport.request(url.href, readOptions);
        if (current !== sequence)
          return {
            kind: "stale",
            message: "A newer request has replaced this result.",
            account,
            generation,
            sourceURL: destination,
          };
        if (route?.kind === "redirect" && response.redirect === "opaque")
          return {
            kind: "document-navigation",
            message: "The forum redirect requires a document navigation.",
            destination,
            account,
            generation,
            sourceURL: destination,
          };
        const decoded =
          route?.kind === "search"
            ? decodeSearchForm(response, destination)
            : route?.kind === "thread"
              ? decodeThread(response, destination)
              : decodeBoard(response, destination);
        if (actor(decoded.account) !== actor(account)) {
          account = decoded.account;
          generation++;
        }
        return { ...decoded, generation };
      } catch {
        return {
          kind: current !== sequence ? "stale" : "network",
          message:
            "The forum could not be reached. Retry or continue in the native forum.",
          account,
          generation,
          sourceURL: destination,
        };
      }
    },
  };
}
