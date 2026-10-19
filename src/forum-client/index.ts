import { fileFailure } from "./download.js";
import { decodeThread } from "./read-thread.js";
import { decodeBoard } from "./read-board.js";
import { routeFor } from "./routes.js";
export function describeDestination(
  value: string,
): { kind: "directory" | "board" | "thread" | "redirect"; url: string } | null {
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
} from "./types.js";
export type * from "./types.js";
export const FORUM_CLIENT_VERSION = "0.2.0";
export function createForumClient(options: {
  origin: string;
  transport: ForumTransport;
}): ForumClient {
  let account: Account = { kind: "unknown" };
  let generation = 0;
  let sequence = 0;
  let downloadSequence = 0;
  return {
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
          route?.kind === "thread"
            ? decodeThread(response, destination)
            : decodeBoard(response, destination);
        if (JSON.stringify(decoded.account) !== JSON.stringify(account)) {
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
