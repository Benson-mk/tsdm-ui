import { decodeThread, threadURL } from "./read-thread.js";
import type {
  Account,
  ForumClient,
  ForumTransport,
  ReadResult,
} from "./types.js";
export type {
  Account,
  ContentNode,
  FailureKind,
  ForumClient,
  ForumTransport,
  HostResponse,
  Post,
  ReadResult,
  Thread,
} from "./types.js";
export const FORUM_CLIENT_VERSION = "0.1.0";
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
    async readThread(destination: string): Promise<ReadResult> {
      const current = ++sequence;
      const url = threadURL(destination);
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
        const decoded = decodeThread(response, destination);
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
