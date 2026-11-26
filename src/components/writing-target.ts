import type { DeepReadonly } from "vue";
import type { PreparedWriting } from "../forum-client";
import { postPermalink } from "../forum-client/post-permalink";

export function addressedPostURL(writing: DeepReadonly<PreparedWriting>) {
  const target = writing.replyTarget;
  if (!target?.postId || !URL.canParse(writing.board.url)) return null;
  const thread = new URL("/forum.php", writing.board.url);
  thread.search = new URLSearchParams({
    mod: "viewthread",
    tid: target.threadId,
  }).toString();
  const post = new URL(thread);
  post.search = new URLSearchParams({
    mod: "redirect",
    goto: "findpost",
    ptid: target.threadId,
    pid: target.postId,
  }).toString();
  return postPermalink(post.href, thread.href, target.threadId, target.postId);
}
