import { test, expect } from "@playwright/test";
import { withRedirectFixture } from "../http-redirect-fixture";

const origin = "https://www.tsdm39.com";
const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=5`;
const threadURL = `${origin}/forum.php?mod=viewthread&tid=42`;
const account =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Writer Seven</a></strong></div>';
const form = `${account}<form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_TOKEN"><input type="hidden" name="reppid" value="100"><input type="hidden" name="reppost" value="100"><input type="hidden" name="noticeauthor" value="AUTHOR_9"><input type="hidden" name="noticeauthormsg" value="Composer Nine"><input type="hidden" name="noticetrimstr" value=""><input name="subject" value=""><textarea name="message"></textarea><label><input name="usesig" type="checkbox" value="1" checked>Signature</label><button type="submit" name="replysubmit">Reply</button></form>`;
function thread(id: string) {
  return `${account}<div id="pt"><a href="${boardURL}">Music discussion</a></div><div id="postlist"><h1 id="thread_subject">Thread ${id}</h1><div id="post_100"><div class="authi"><a href="home.php?mod=space&uid=9">Composer Nine</a></div><a id="postnum100">1</a><div class="pcb"><p>Complete native post.</p></div></div></div>`;
}
for (const [name, query, target, guarded] of [
  ["lastpost", "goto=lastpost&tid=99", "99", true],
  ["findpost", "goto=findpost&ptid=99&pid=100", "99", true],
  ["unknown-thread", "goto=findpost&pid=100", "99", true],
  ["same-thread", "goto=findpost&ptid=42&pid=100", "42", false],
  ["same-lastpost", "goto=lastpost&tid=42", "42", false],
] as const) {
  test(`IM66.redirect-${name}: supported native redirect choices preserve the writing guard before any request`, async ({
    browser,
  }, info) => {
    const link = `${origin}/forum.php?mod=redirect&${query}`;
    const board = `${account}<div id="ct"><h1><a href="${boardURL}">Music discussion</a></h1></div><table id="threadlisttableid"><tbody id="normalthread_${target}"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=${target}">Target thread</a></th><td class="by"><cite>Composer Nine</cite></td><td class="num"><a>1</a><em>20</em></td><td class="by"><cite>Composer Nine</cite><em><a href="${link}">Last reply</a></em></td></tr></tbody></table>`;
    await withRedirectFixture(
      browser,
      {
        origin,
        redirect: `${origin}/forum.php?mod=viewthread&tid=${target}&page=2#pid100`,
        document(url) {
          const mod = url.searchParams.get("mod");
          return mod === "post"
            ? form
            : mod === "forumdisplay"
              ? board
              : thread(url.searchParams.get("tid") ?? "42");
        },
      },
      async (page, reads, redirects) => {
        await page.goto(threadURL);
        await page
          .getByRole("button", { name: "Reply to this post", exact: true })
          .click();
        const source = "[unknown=x]Original addressed source 中文[/unknown]";
        await page.getByLabel("Complete source", { exact: true }).fill(source);
        const original = await page.evaluate(
          () =>
            JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!)
              .writing,
        );
        await page
          .locator(".boards-navigation")
          .getByRole("link", { name: "Music discussion", exact: true })
          .click();
        const last = page.getByRole("link", {
          name: "Last reply to Target thread",
          exact: true,
        });
        await expect(last).toHaveAttribute("href", link);
        const before = [...reads];
        await last.click();
        const guard = page.getByRole("dialog", {
          name: "Keep current writing?",
          exact: true,
        });
        if (guarded) {
          await expect(guard).toBeVisible();
          expect(reads).toEqual(before);
          expect(redirects).toEqual([]);
          await guard
            .getByRole("button", { name: "Continue editing", exact: true })
            .click();
          await expect(
            page.getByRole("heading", { name: "Thread 42", exact: true }),
          ).toBeVisible();
          expect(reads).toEqual(before);
          expect(redirects).toEqual([]);
          await last.click();
          await guard
            .getByRole("button", {
              name: "Keep writing and read thread",
              exact: true,
            })
            .click();
        } else await expect(guard).toBeHidden();
        await expect.poll(() => redirects.length).toBe(2);
        await expect(
          page.getByRole("heading", { name: `Thread ${target}`, exact: true }),
        ).toBeVisible();
        const retained = await page.evaluate(
          () =>
            JSON.parse(sessionStorage.getItem("tsdm.workspace.recovery")!)
              .writing,
        );
        expect(retained.source).toBe(source);
        expect(retained.replyTarget).toEqual(original.replyTarget);
        expect(reads).toHaveLength(before.length + 1);
        expect(redirects).toEqual(["fetch", "document"]);
        await info.attach("redirect-request-state.json", {
          body: JSON.stringify({
            query,
            before,
            reads,
            redirects,
            source: retained.source,
            target: retained.replyTarget,
          }),
          contentType: "application/json",
        });
        await info.attach("redirect-retained-writing.png", {
          body: await page.screenshot(),
          contentType: "image/png",
        });
      },
    );
  });
}
