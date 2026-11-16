import { threadURL } from "./routes.js";

/** Qualify current and recovered native post links without trusting link text.
 * Legacy thread-only, foreign or mismatched links need a fresh thread read.
 * Kept internal: no portable client method or serialized recovery field changes.
 */
export function postPermalink(
  value: string,
  source: string,
  threadId: string,
  postId: string,
): string | null {
  try {
    const thread = threadURL(source),
      url = new URL(value),
      q = url.searchParams;
    if (
      !thread ||
      thread.searchParams.get("tid") !== threadId ||
      !/^[1-9]\d*$/.test(postId) ||
      url.origin !== thread.origin ||
      url.username ||
      url.password ||
      url.pathname !== "/forum.php" ||
      q.get("mod") !== "redirect" ||
      q.get("goto") !== "findpost" ||
      q.get("ptid") !== threadId ||
      q.get("pid") !== postId ||
      [...q.keys()].some(
        (key) =>
          !["mod", "goto", "ptid", "pid", "fromuid"].includes(key) ||
          q.getAll(key).length !== 1,
      ) ||
      (q.has("fromuid") && !/^[1-9]\d*$/.test(q.get("fromuid")!))
    )
      return null;
    return `${thread.origin}/forum.php?mod=redirect&goto=findpost&ptid=${threadId}&pid=${postId}`;
  } catch {
    return null;
  }
}
