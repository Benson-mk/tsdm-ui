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
  return {
    get account() {
      return account;
    },
    get generation() {
      return generation;
    },
    readThread(destination: string): Promise<ReadResult> {
      return this.readPage(destination);
    },
    async readPage(destination: string): Promise<ReadResult> {
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
        const response = await options.transport.request(url.href);
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
