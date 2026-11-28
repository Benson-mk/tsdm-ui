import { readFileSync } from "node:fs";
import {
  expect,
  test,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";
import {
  chooseAttachments,
  revealWritingOptions,
  revealWritingTools,
  selectSourceEditor,
  writingDetailAction,
} from "./editor-controls";
import { preparePostReply } from "./navigation-ui";

const origin = "https://www.tsdm39.com";
const forum = `${origin}/forum.php`;
const board = `${forum}?mod=forumdisplay&fid=5`;
const savedBoard = `${forum}?mod=forumdisplay&fid=8`;
const thread = `${forum}?mod=viewthread&tid=42`;
const search = `${origin}/search.php?mod=forum`;
const home = `${origin}/home.php?mod=space&do=`;
const favorite = `${home}favorite&type=`;
const notices = `${home}notice`;
const messages = `${home}pm`;
const drafts = `${home}thread&view=me&type=thread&filter=save`;
const peer = (id: number) => `${messages}&subop=view&touid=${id}`;
const account =
  '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div>';
const publicTitle = "Existing public reading";
const names = { nine: "Listener Nine", ten: "Reader Ten" };
const boardPage = (url: string, title: string) =>
  `<div id="ct"><h1><a href="${url}">${title}</a></h1></div><table id="threadlisttableid">${Array.from({ length: 45 }, (_, index) => `<tbody id="normalthread_${index + 42}"><tr><th><a class="xst" href="${forum}?mod=viewthread&tid=${index + 42}${index === 0 ? "&page=1#pid102" : ""}">Board subject ${index + 1}</a></th><td class="by"><cite>Reader Seven</cite></td></tr></tbody>`).join("")}</table>`;
const postPage = (title: string, start: number, relatedURL?: string) =>
  `<div id="pt"><a href="${board}">Music discussion</a></div><div id="postlist"><h1 id="thread_subject">${title}</h1>${Array.from({ length: 7 }, (_, index) => `<div id="post_${index + start}"><div class="authi"><a href="home.php?mod=space&uid=9">${names.nine}</a></div><a id="postnum${index + start}">${index + 1}</a><div class="pcb">${index === 1 && relatedURL ? `<p><a href="${relatedURL}">Follow a different Thread</a></p>` : ""}${`<p>Passage ${index + 1}: retained reading text 保留原来的阅读位置。</p>`.repeat(38)}</div></div>`).join("")}</div>`;
const searchForm =
  '<form class="searchform" method="post" action="search.php?mod=forum"><input name="formhash" type="hidden" value="SYNTHETIC"><input name="searchsubmit" type="hidden" value="yes"><input name="seltableid" type="hidden" value="0"><table><tr><th><label for="keywords">Keywords</label></th><td><input id="keywords" name="srchtxt" type="text" maxlength="40"></td></tr><tr><th><label for="author">Author</label></th><td><input id="author" name="srchuname" type="text" maxlength="40"></td></tr></table><p class="search-restrictions">Search may use forum credits and is subject to frequency limits.</p><button type="submit">Search</button></form>';
const searchTarget = `${forum}?mod=viewthread&tid=52&page=2#pid202`;
const searchResults = `<div class="sttl"><h2><em>找到 “autumn” 相关内容 1 个</em></h2></div><div id="threadlist" class="slst"><ul><li class="pbw"><h3 class="xs3"><a href="${searchTarget}">Autumn exact result</a></h3><p class="xg1">5 replies · 80 views</p><p>Complete result excerpt.</p><p><span>2026-10-18</span><span><a href="home.php?mod=space&uid=9">${names.nine}</a></span><span><a href="${board}">Music discussion</a></span></p></li></ul></div><div class="pg"><strong>1</strong><a href="${search}&searchid=581&page=2">2</a></div>`;
const noticeTarget = `${forum}?mod=viewthread&tid=62&page=3#pid302`;
const noticeList = `<div id="ct"><div class="mn"><div class="nts"><dl notice="11" id="notice_11"><dt><span>just now</span></dt><dd class="ntc_body"><p>Exact Notice body.</p><a href="${noticeTarget}">Open exact Notice Post</a></dd></dl></div></div><div class="appl"><div class="tbn"><ul><li class="a"><a href="${notices}">All standard notices</a></li></ul></div></div></div>`;
const savedThread = `${forum}?mod=viewthread&tid=72`;
const favoriteList = (kind: "forum" | "thread") => {
  const [record, id, target, label] =
    kind === "forum"
      ? [805, 8, savedBoard, "Saved Board Eight"]
      : [972, 72, savedThread, "Saved Thread Seventy-two"];
  return `<div id="ct"><form id="delform"><ul id="favorite_ul"><li id="fav_${record}"><input type="checkbox" name="favorite[]" value="${record}" vid="${id}"><a href="${target}">${label}</a><span class="xg1">2026-10-22 12:00</span></li></ul></form></div>`;
};
const peerList = `<div id="ct"><ul class="tb"><li class="a"><a href="${messages}&filter=privatepm">私人消息</a></li></ul><div class="pml">${[9, 10].map((id, index) => `<dl id="pmlist_${81 + index}"><dd class="avt"><a href="home.php?mod=space&uid=${id}">Avatar</a></dd><dd class="pm_c"><a href="home.php?mod=space&uid=${id}">${id === 9 ? names.nine : names.ten}</a><br>${`Peer preview ${id}. `.repeat(280)}<br><span class="xg1"><span title="2026-11-04 17:00">now</span></span><a id="pmlist_${81 + index}_a" href="${peer(id)}#last">回复</a></dd></dl>`).join("")}</div></div>`;
const history = (id: number, name: string) =>
  `<div id="ct"><div class="bm bw0"><div class="tbmu pml"><div class="xw1">共有 <span id="membernum">1</span> 条与 <a href="home.php?mod=space&uid=${id}">${name}</a> 的交谈记录</div></div><div id="pm_ul" class="pml"><a name="last"></a><dl id="pmlist_${id}1"><dd class="avt"><a href="home.php?mod=space&uid=${id}">Avatar</a></dd><dd class="ptm"><a class="xw1" href="home.php?mod=space&uid=${id}">${name}</a><br>${"<p>Complete private history.</p>".repeat(85)}<br><span class="xg1"><span title="2026-11-04 17:00">now</span></span></dd></dl></div></div></div>`;
const draftList = `<a class="a" href="${drafts}">草稿箱</a><div class="tl"><form id="delform"><table><tbody><tr><th><a href="${forum}?mod=viewthread&tid=82">Exact Forum draft</a></th><td><a href="${board}">Board 5</a></td></tr></tbody></table></form></div>`;
const draftThread = `${forum}?mod=viewthread&tid=82`;
const draftTitle = "Exact Forum draft";
const draftSource = "[unknown]完整文字[/unknown]\n[attach]88[/attach]";
const draftRecord = `<div id="pt"><a href="${board}">Music discussion</a></div><div id="postlist"><h1><span id="thread_subject">${draftTitle}</span><span class="xg1">(草稿)</span></h1><div id="post_501"><div class="authi"><a href="home.php?mod=space&uid=7">Reader Seven</a></div><a id="postnum501"><em>1</em>#</a><div class="pcb"><p>Authoritative stored body</p></div><div class="po"><div class="pob"><a class="psave" href="forum.php?mod=misc&action=pubsave&tid=82">Publish</a></div></div></div></div>`;
const draftEdit = `${forum}?mod=post&action=edit&fid=5&tid=82&pid=501`;
const draftForm = `<form id="postform" method="post" action="forum.php?mod=post&action=edit&editsubmit=yes&tid=82&pid=501&fid=5"><input type="hidden" name="formhash" value="SYNTHETIC"><input type="hidden" name="save" id="postsave" value=""><input name="subject" value="${draftTitle}"><textarea name="message">${draftSource}</textarea><select name="typeid"><option value="3" selected>Listening</option></select><input type="hidden" name="attachnew[88][description]" value="existing metadata"><button type="submit" name="editsubmit" value="yes">Publish</button><button type="button" onclick="$('postsave').value=1;$('postsubmit').click();">Save draft</button></form>`;
const replyForm = `<form id="postform" method="post" action="${forum}?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC"><input type="hidden" name="reppid" value="102"><input type="hidden" name="reppost" value="102"><input type="hidden" name="noticeauthor" value="OPAQUE_AUTHOR_9"><input type="hidden" name="noticeauthormsg" value="${names.nine}"><input type="hidden" name="noticetrimstr" value=""><input name="subject" value=""><textarea name="message"></textarea><label><input name="usesig" type="checkbox" value="1" checked>Signature</label><button type="submit" name="replysubmit" value="yes">Reply</button></form>`;

const withJSON = (url: string) => {
  const destination = new URL(url);
  destination.hash = "";
  destination.searchParams.set("tsdmapp", "json");
  return destination.href;
};
type Operation = {
  method: string;
  url: string;
  body: string | null;
  navigation: boolean;
};
type Fixture = {
  expected: (Operation & { response: string })[];
  ledger: (Operation & { disposition: string })[];
};
const fixtures = new WeakMap<Page, Fixture>();
function authorize(
  page: Page,
  url: string,
  response: string,
  body: string | null = null,
  exact = false,
) {
  fixtures.get(page)!.expected.push({
    method: body === null ? "GET" : "POST",
    url: exact ? url : withJSON(url),
    body,
    navigation: false,
    response,
  });
}
async function mount(page: Page, width = 1440) {
  await page.setViewportSize({ width, height: 900 });
  const fixture: Fixture = {
    expected: [
      {
        method: "GET",
        url: board,
        body: null,
        navigation: true,
        response: "document",
      },
    ],
    ledger: [],
  };
  fixtures.set(page, fixture);
  authorize(page, board, boardPage(board, "Music discussion"));
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    const actual = {
      method: request.method(),
      url: request.url(),
      body: request.postData(),
      navigation: request.isNavigationRequest(),
    };
    const expected = fixture.expected[0];
    if (
      !expected ||
      actual.method !== expected.method ||
      actual.url !== expected.url ||
      actual.body !== expected.body ||
      actual.navigation !== expected.navigation
    ) {
      fixture.ledger.push({ ...actual, disposition: "refused" });
      return route.abort();
    }
    fixture.expected.shift();
    fixture.ledger.push({
      ...actual,
      disposition: actual.navigation ? "document" : "synthetic forum",
    });
    return route.fulfill(
      actual.navigation
        ? {
            contentType: "text/html",
            body: "<html><body>Native forum</body></html>",
          }
        : {
            contentType: "application/json",
            body: JSON.stringify({
              uid: 7,
              document: account + expected.response,
            }),
          },
    );
  });
  await page.goto(board);
  await page.addScriptTag({
    content: readFileSync("dist/tsdm-ui.user.js", "utf8"),
  });
  await expect(heading(page, "Music discussion")).toBeVisible();
  authorize(page, `${thread}&page=1`, postPage(publicTitle, 101));
  await link(page, "Board subject 1").click();
  await expect(heading(page, publicTitle)).toBeVisible();
}

const button = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });
const heading = (page: Page, name: string) =>
  page.getByRole("heading", { name, exact: true });
const link = (page: Page, name: string) =>
  page.getByRole("link", { name, exact: true });
const reading = (page: Page) => page.locator(".reading-pane");
const currentCanvas = (page: Page) => page.locator("main.workspace-body");
const opener = (page: Page) => button(page, "Back");
async function section(page: Page, name: string) {
  const narrow = page.viewportSize()!.width < 960;
  if (narrow && name !== "Messages") {
    await button(page, "More").click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name, exact: true })
      .click();
  } else {
    await page
      .getByRole("navigation", { name: "Main destinations", exact: true })
      .getByRole("button", { name, exact: true })
      .click();
  }
}
const count = (page: Page) => fixtures.get(page)!.ledger.length;
const settle = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>((done) =>
        requestAnimationFrame(() => requestAnimationFrame(() => done())),
      ),
  );
async function sample(
  page: Page,
  info: TestInfo,
  name: string,
  locator = currentCanvas(page),
) {
  await settle(page);
  await info.attach(`${name}.json`, {
    body: JSON.stringify(
      await locator.evaluate((element) => {
        const root = element.getRootNode() as ShadowRoot;
        const focused = root.activeElement;
        const panes = [
          ...element.querySelectorAll<HTMLElement>("[data-scroll-pane]"),
        ].filter((pane) => pane.getClientRects().length);
        return {
          viewport: { width: innerWidth, height: innerHeight },
          canvas: element.getBoundingClientRect().toJSON(),
          focus: focused && {
            id: focused.id,
            text: focused.textContent?.trim().slice(0, 130),
            label: focused.getAttribute("aria-label"),
          },
          panes: panes.map((pane) => ({
            name: pane.dataset.scrollPane,
            width: pane.clientWidth,
            scrollTop: pane.scrollTop,
            top: pane.getBoundingClientRect().top,
            visibleAnchor: [
              ...pane.querySelectorAll<HTMLElement>(
                "article[id], [data-thread-id], [data-peer-id]",
              ),
            ].find(
              (anchor) =>
                anchor.getBoundingClientRect().bottom >
                pane.getBoundingClientRect().top,
            )?.id,
          })),
        };
      }),
    ),
    contentType: "application/json",
  });
  await info.attach(`${name}.aria.txt`, {
    body: (await locator.ariaSnapshot()).slice(0, 12000),
    contentType: "text/plain",
  });
  await info.attach(`${name}.png`, {
    body: await page.screenshot(),
    contentType: "image/png",
  });
}
async function dominant(task: Locator, page: Page) {
  await expect(task).toBeVisible();
  const taskBox = await task.boundingBox();
  const canvas = await currentCanvas(page).boundingBox();
  expect(
    taskBox!.width,
    "task takes the main canvas, not the old results column",
  ).toBeGreaterThan(canvas!.width * 0.65);
}
test.afterEach(async ({ page, browser }, info) => {
  const fixture = fixtures.get(page);
  if (!fixture) return;
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
  await info.attach("exact-forum-http-ledger.json", {
    body: JSON.stringify(
      {
        actual: fixture.ledger,
        unused: fixture.expected.map(({ method, url, body, navigation }) => ({
          method,
          url,
          body,
          navigation,
        })),
      },
      null,
      2,
    ),
    contentType: "application/json",
  });
  if (await currentCanvas(page).count()) await sample(page, info, "end");
  expect(
    fixture.ledger.filter(({ disposition }) => disposition === "refused"),
  ).toEqual([]);
  expect(fixture.expected).toHaveLength(0);
});

for (const { name, width, load } of [
  { name: "Search", width: 1440, load: "Keywords" },
  { name: "Saved", width: 960, load: "Load saved threads" },
  { name: "Notices", width: 768, load: "Load notices" },
  { name: "Drafts", width: 1440, load: "Load forum drafts" },
  { name: "Messages", width: 390, load: "Load messages" },
]) {
  test(`CANVAS128.entry-${name}: own the canvas without unrelated reading or implicit effects`, async ({
    page,
  }, info) => {
    await mount(page, width);
    const start = count(page);
    if (name === "Search") authorize(page, `${search}&adv=yes`, searchForm);
    await section(page, name);
    await expect(
      name === "Search"
        ? page.getByLabel(load, { exact: true })
        : button(page, load),
    ).toBeVisible();
    await sample(page, info, "entry");
    expect(count(page) - start).toBe(name === "Search" ? 1 : 0);
    await expect
      .soft(reading(page), "unrelated retained Reader must be hidden")
      .toBeHidden({ timeout: 1200 });
    await dominant(
      currentCanvas(page)
        .getByRole("heading", { name, exact: true, level: 1 })
        .locator(".."),
      page,
    );
    await expect(opener(page)).toBeVisible();
    await opener(page).click();
    await expect(page.locator("#pid102")).toBeFocused();
    await page.goForward();
    await expect(heading(page, name).first()).toBeVisible();
    expect(count(page) - start).toBe(name === "Search" ? 1 : 0);
  });
}

test("CANVAS128.search: exact result, labelled return and reflowed Board/Reader with parked writing", async ({
  page,
}, info) => {
  await mount(page);
  const post = page.locator("#pid102");
  authorize(
    page,
    `${forum}?mod=post&action=reply&fid=5&tid=42&tsdmapp=json&reppost=102`,
    replyForm,
  );
  await preparePostReply(page, "102");
  const source = await selectSourceEditor(page);
  const parked = "[b]Park exact reply 原文[/b]";
  await source.fill(parked);
  await revealWritingTools(page);
  await chooseAttachments(page, {
    name: "parked-intent.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Synthetic local selection; never uploaded"),
  });
  const signature = page.getByRole("checkbox", {
    name: "Signature",
    exact: true,
  });
  await revealWritingOptions(page);
  await signature.uncheck();
  await page.keyboard.press("Escape");
  await (await writingDetailAction(page, "Return to reading")).click();
  await expect(source).toBeHidden();
  const boardList = page.getByRole("region", {
    name: "Thread results",
    exact: true,
  });
  const readOffset = () => reading(page).evaluate((pane) => pane.scrollTop);
  const visibleRow = () =>
    boardList.evaluate(
      (pane) =>
        [...pane.querySelectorAll("[data-thread-id]")].find(
          (row) =>
            row.getBoundingClientRect().bottom >
            pane.getBoundingClientRect().top + 1,
        )?.id,
    );
  await boardList.evaluate((pane) => {
    pane.scrollTop = 550;
  });
  const row = await visibleRow();
  await reading(page).evaluate((pane) => {
    pane.scrollTop +=
      pane.querySelector("#pid102")!.getBoundingClientRect().top -
      pane.getBoundingClientRect().top +
      150;
  });
  await settle(page);
  const offset = await readOffset();
  await sample(page, info, "board-and-reader-before");
  authorize(page, `${search}&adv=yes`, searchForm);
  await section(page, "Search");
  const searchOverview = page.getByRole("region", {
    name: "Search overview",
    exact: true,
  });
  const submit = searchOverview.getByRole("button", {
    name: "Search",
    exact: true,
  });
  await expect(submit).toHaveAccessibleDescription(/credits|quota/i);
  await page.getByLabel("Keywords", { exact: true }).fill("autumn");
  authorize(page, `${search}&adv=yes`, searchForm);
  authorize(
    page,
    search,
    searchResults,
    "formhash=SYNTHETIC&searchsubmit=yes&seltableid=0&srchtxt=autumn&srchuname=",
  );
  await submit.click();
  const result = link(page, "Autumn exact result");
  await expect(result).toHaveAttribute("href", searchTarget);
  const rerun = button(page, "Rerun effective search (may use credits)");
  await expect(rerun).toHaveAccessibleDescription(/credits|quota/i);
  const otherThread = `${forum}?mod=viewthread&tid=92&page=1#pid602`;
  authorize(
    page,
    searchTarget,
    postPage("Exact Search result", 201, otherThread),
  );
  await result.click();
  const target = page.locator("#pid202");
  await expect(target).toBeFocused();
  await expect(heading(page, publicTitle)).toBeHidden();
  authorize(page, otherThread, postPage("Linked independent Thread", 601));
  await link(page, "Follow a different Thread").click();
  await expect(page.locator("#pid602")).toBeFocused();
  await expect(searchOverview).toBeHidden();
  await page.goBack();
  await expect(target).toBeFocused();
  const requests = count(page);
  await expect(opener(page)).toBeVisible();
  await opener(page).click();
  await expect(result).toBeFocused();
  await page.goForward();
  await expect(target).toBeFocused();
  await page.goBack();
  await expect(result).toBeFocused();
  await page.goBack();
  await page.setViewportSize({ width: 1160, height: 900 });
  await page.goBack();
  await expect(post).toBeFocused();
  await expect(post).toBeInViewport();
  expect(await visibleRow()).toBe(row);
  expect(await readOffset()).toBeGreaterThan(0);
  expect(offset).toBeGreaterThan(0);
  await sample(page, info, "board-and-reader-after-reflow");
  await button(page, "Return to writing").click();
  await selectSourceEditor(page);
  await expect(source).toBeFocused();
  await expect(source).toHaveValue(parked);
  await expect(
    page.getByRole("group", { name: "Reply target" }).getByRole("link"),
  ).toHaveAttribute(
    "href",
    `${forum}?mod=redirect&goto=findpost&ptid=42&pid=102`,
  );
  await revealWritingOptions(page);
  await expect(signature).not.toBeChecked();
  await page.keyboard.press("Escape");
  await revealWritingTools(page);
  await expect(button(page, "Upload parked-intent.txt")).toBeVisible();
  expect(count(page)).toBe(requests);
});

test("CANVAS128.personal-targets: Saved Thread and Board and Notice open the exact related content", async ({
  page,
}, info) => {
  await mount(page);
  await section(page, "Saved");
  authorize(page, `${favorite}thread`, favoriteList("thread"));
  await button(page, "Load saved threads").click();
  const savedThreadLink = link(page, "Saved Thread Seventy-two");
  await expect(savedThreadLink).toHaveAttribute("href", savedThread);
  authorize(page, savedThread, postPage("Saved Thread detail", 401));
  await savedThreadLink.click();
  await expect(heading(page, "Saved Thread detail")).toBeVisible();
  await expect(opener(page)).toBeVisible();
  await opener(page).click();
  await expect(page.locator('[data-favorite-id="972"]')).toBeFocused();
  authorize(page, `${favorite}forum`, favoriteList("forum"));
  await button(page, "Load saved boards").click();
  const savedBoardLink = link(page, "Saved Board Eight");
  await expect(savedBoardLink).toHaveAttribute("href", savedBoard);
  authorize(page, savedBoard, boardPage(savedBoard, "Saved Board detail"));
  await savedBoardLink.click();
  await expect(heading(page, "Saved Board detail")).toBeVisible();
  await expect(reading(page)).toBeHidden();
  await sample(page, info, "saved-board-detail");
  await page.goBack();
  await expect(page.locator('[data-favorite-id="805"]')).toBeFocused();
  await section(page, "Notices");
  const load = button(page, "Load notices");
  await expect(load).toHaveAccessibleDescription(/mark notices read/i);
  authorize(page, notices, noticeList);
  await load.click();
  const noticeLink = link(page, "Open exact Notice Post");
  await expect(noticeLink).toHaveAttribute("href", noticeTarget);
  authorize(page, noticeTarget, postPage("Notice detail", 301));
  await noticeLink.click();
  const post = page.locator("#pid302");
  await expect(post).toBeFocused();
  const requests = count(page);
  await page.goBack();
  await expect(page.locator('[data-notice-id="11"]')).toBeFocused();
  await page.goForward();
  await expect(post).toBeFocused();
  expect(count(page)).toBe(requests);
});

test("CANVAS128.peers: re-enter Messages at the list and restore only the deliberately selected Peer", async ({
  page,
}, info) => {
  await mount(page);
  await section(page, "Messages");
  const load = button(page, "Load messages");
  await expect(load).toBeVisible();
  authorize(page, messages, peerList);
  await load.click();
  const nine = link(page, `Read private conversation with ${names.nine}`);
  const ten = link(page, `Read private conversation with ${names.ten}`);
  await expect(nine).toHaveAccessibleDescription(/mark it read/i);
  await expect(page.locator(".private-reading-pane")).toHaveCount(0);
  authorize(page, peer(9), history(9, names.nine));
  await nine.click();
  await expect(page.locator("#pmlist_91")).toBeVisible();
  authorize(page, peer(10), history(10, names.ten));
  await ten.click();
  await expect(page.locator("#pmlist_101")).toBeVisible();
  await page.goBack();
  await expect(page.locator("#pmlist_91")).toBeVisible();
  await expect(nine).toHaveAttribute("aria-current", "true");
  const requests = count(page);
  await section(page, "Messages");
  await expect(page.locator(".private-reading-pane")).toBeHidden();
  await expect(nine).toBeVisible();
  await sample(page, info, "peer-list");
  await opener(page).click();
  await expect(page.locator("#pmlist_91")).toBeFocused();
  await page.goForward();
  await expect(page.locator(".private-reading-pane")).toBeHidden();
  await page.goBack();
  await page.goBack();
  await expect(nine).toBeFocused();
  await expect(nine).toHaveAttribute("aria-current", "true");
  expect(count(page)).toBe(requests);
  const refresh = button(page, "Refresh messages");
  await expect(refresh).toHaveAccessibleDescription(
    /clear.*new-private-message prompt/i,
  );
  authorize(page, messages, peerList);
  await refresh.click();
  await expect.poll(() => count(page)).toBe(requests + 1);
  await expect(refresh).toBeEnabled();
  await page.goBack();
  await expect(nine).toBeFocused();
  await page.goForward();
  await expect(refresh).toBeVisible();
  await expect(page.locator(".private-reading-pane")).toBeHidden();
  expect(count(page)).toBe(requests + 1);
});

test("CANVAS128.drafts: deliberate Load and exact Forum draft resume do not send or publish", async ({
  page,
}) => {
  await mount(page, 959);
  await section(page, "Drafts");
  authorize(page, drafts, draftList);
  await button(page, "Load forum drafts").click();
  const resume = button(page, "Resume Exact Forum draft");
  await expect(resume).toBeVisible();
  await expect.soft(heading(page, publicTitle)).toBeHidden({ timeout: 1200 });
  authorize(page, drafts, draftList, null, true);
  authorize(page, draftThread, draftRecord, null, true);
  authorize(page, draftEdit, draftForm, null, true);
  await resume.click();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
    draftTitle,
  );
  const source = await selectSourceEditor(page);
  await expect(source).toHaveValue(draftSource);
  await expect(heading(page, publicTitle)).toBeHidden();
  await (await writingDetailAction(page, "Return to reading")).click();
  await expect(source).toBeHidden();
  await expect(resume).toBeVisible();
  const requests = count(page);
  await page.goBack();
  await expect(button(page, "Load forum drafts")).toBeVisible();
  await page.goForward();
  await expect(resume).toBeFocused();
  expect(count(page)).toBe(requests);
});
