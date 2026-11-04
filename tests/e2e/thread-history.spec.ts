import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { withRedirectFixture } from "../http-redirect-fixture";

const origin = "https://www.tsdm39.com";
const base = `${origin}/forum.php?mod=viewthread&tid=42`;
const route = (number: number) => `${base}&page=${number}&_dsign=returned`;
const ledgers = new WeakMap<Page, string[]>();
function fixture(number: number) {
  const ids =
    number === 1
      ? [101, 102, 103]
      : number === 2
        ? [103, 104, 105]
        : [105, 106, 107];
  const post = (id: number) =>
    `<div id="post_${id}"><div class="authi"><a href="home.php?mod=space&uid=9">Listener</a></div><a id="postnum${id}" href="${route(number)}#pid${id}">${id - 100}</a><em id="authorposton${id}">2026-11-04</em><div class="pcb"><p>${`Complete post ${id}. `.repeat(100)}</p><blockquote>Quoted attribution ${id}</blockquote></div></div>`;
  return `<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div><div id="postlist"><h1 id="thread_subject">Continuous rich history</h1>${ids.map(post).join("")}</div><div class="pg">${number > 1 ? `<a class="prev" href="${route(number - 1)}">&nbsp;&nbsp;</a>` : ""}${[1, 2, 3].map((page) => (page === number ? `<strong>${page}</strong>` : `<a href="${route(page)}">${page}</a>`)).join("")}<label><input name="custompage" value="${number}"><span title="共 3 页"> / 3 页</span></label>${number < 3 ? `<a class="nxt" href="${route(number + 1)}">下一页</a>` : ""}</div>`;
}
async function open(
  page: Page,
  response?: (
    number: number,
    url: string,
  ) =>
    | Promise<{
        status?: number;
        body: string;
        contentType?: string;
        headers?: Record<string, string>;
      } | null>
    | {
        status?: number;
        body: string;
        contentType?: string;
        headers?: Record<string, string>;
      }
    | null,
) {
  const requests: string[] = [];
  ledgers.set(page, requests);
  const built = readFileSync("dist/tsdm-ui.user.js", "utf8");
  await page.context().route("**/*", async (intercept) => {
    const request = intercept.request();
    if (request.url() === `${origin}/__history.js`)
      return intercept.fulfill({
        contentType: "text/javascript; charset=utf-8",
        body: built,
      });
    if (request.isNavigationRequest())
      return intercept.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<html><body>Native<script src="${origin}/__history.js"></script></body></html>`,
      });
    requests.push(`${request.method()} ${request.url()}`);
    if (new URL(request.url()).origin !== origin)
      return intercept.fulfill({ status: 404, body: "Blocked" });
    const number = Number(
      new URL(request.url()).searchParams.get("page") ?? "1",
    );
    const custom = await response?.(number, request.url());
    return intercept.fulfill(
      custom
        ? { contentType: "text/html; charset=utf-8", ...custom }
        : {
            contentType: "application/json",
            body: JSON.stringify({ document: fixture(number) }),
          },
    );
  });
  await page.goto(route(2));
  await expect(
    page.getByRole("heading", { name: "Continuous rich history", exact: true }),
  ).toBeVisible();
  return requests;
}
async function anchor(page: Page) {
  return page.locator("#pid104").evaluate((post) => ({
    top: post.getBoundingClientRect().top,
    scroll: post.closest(".reading-pane")!.scrollTop,
  }));
}
test.afterEach(async ({ page }, info) => {
  if (!ledgers.has(page)) return;
  await info.attach("requests.json", {
    body: JSON.stringify(ledgers.get(page)),
    contentType: "application/json",
  });
  if (await page.locator(".reading-pane").count()) {
    await info.attach("history-geometry.json", {
      body: JSON.stringify(
        await page.locator(".reading-pane").evaluate((pane) => ({
          scroll: pane.scrollTop,
          posts: [...pane.querySelectorAll("article")].map((node) => ({
            id: node.id,
            rect: node.getBoundingClientRect().toJSON(),
          })),
        })),
      ),
      contentType: "application/json",
    });
    await info.attach("history.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  }
});
test("IM68.manual-range: prepend and append complete returned pages without duplicates, anchor movement, Back entries or recovery growth", async ({
  page,
}) => {
  const requests = await open(page);
  await page.locator("#pid104").evaluate((post) => {
    const pane = post.closest(".reading-pane")!;
    pane.scrollTop +=
      post.getBoundingClientRect().top - pane.getBoundingClientRect().top + 37;
  });
  const before = await anchor(page);
  expect(before.scroll).toBeGreaterThan(100);
  const historyLength = await page.evaluate(() => history.length);
  await page
    .getByRole("button", { name: "Load earlier", exact: true })
    .click({ force: true });
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  expect((await anchor(page)).top).toBeCloseTo(before.top, 0);
  await page
    .getByRole("button", { name: "Load later", exact: true })
    .click({ force: true });
  await expect(page.locator(".reading-pane article")).toHaveCount(7);
  expect((await anchor(page)).top).toBeCloseTo(before.top, 0);
  expect(
    await page
      .locator(".reading-pane article")
      .evaluateAll((nodes) => nodes.map((n) => n.id)),
  ).toEqual([
    "pid101",
    "pid102",
    "pid103",
    "pid104",
    "pid105",
    "pid106",
    "pid107",
  ]);
  await expect(
    page.getByText("Beginning of thread", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Latest known content", { exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
  expect(
    requests.map((request) =>
      new URL(request.slice(4)).searchParams.get("page"),
    ),
  ).toEqual(["2", "1", "3"]);
  const saved = await page.evaluate(() =>
    sessionStorage.getItem("tsdm.workspace.recovery"),
  );
  expect(saved).not.toContain("Complete post 101");
  expect(saved).not.toContain("Complete post 107");
});

test("IM68.account-change: changed-account page clears the former account range without mixing posts", async ({
  page,
}) => {
  await open(page, (number) =>
    number === 3
      ? {
          body: fixture(3)
            .replace("uid=7", "uid=8")
            .replace("Reader Seven", "Reader Eight"),
        }
      : null,
  );
  await page.getByRole("button", { name: "Load later", exact: true }).click();
  await expect(page.locator(".reading-pane article")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Reload", exact: true }),
  ).toBeVisible();
});

test("IM68.retry: permission failure keeps readable posts and only a deliberate retry requests the boundary again", async ({
  page,
}) => {
  let attempts = 0;
  const requests = await open(page, (number) =>
    number === 3 && ++attempts === 1
      ? {
          status: 403,
          body: '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div><div id="messagetext">权限</div>',
        }
      : null,
  );
  await page.getByRole("button", { name: "Load later", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Retry later", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".reading-pane article")).toHaveCount(3);
  await expect(
    page.getByText(
      "The current account does not have permission to read this thread.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.locator(".reading-pane").evaluate((pane) => {
    pane.scrollTop = pane.scrollHeight;
    pane.dispatchEvent(new Event("scroll"));
  });
  await page.getByRole("button", { name: "Retry later", exact: true }).click();
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  expect(
    requests.map((request) =>
      new URL(request.slice(4)).searchParams.get("page"),
    ),
  ).toEqual(["2", "3", "3"]);
});

test("IM68.inconsistent-pager: missing next control with later numeric pages never claims a true end", async ({
  page,
}) => {
  await open(page, (number) => ({
    body: fixture(number).replace(/<a class="nxt"[^>]*>.*?<\/a>/, ""),
  }));
  await expect(
    page.getByText("Later boundary unverified", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Latest known content", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page
      .getByRole("navigation", { name: "Thread pages (top)", exact: true })
      .getByRole("link", { name: "3", exact: true }),
  ).toBeVisible();
});

test("IM68.stale-navigation: a delayed adjacent page cannot replace an explicit page selection or overlap history loads", async ({
  page,
}) => {
  let release: (() => void) | undefined;
  let started: (() => void) | undefined;
  const incoming = new Promise<void>((resolve) => {
    started = resolve;
  });
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requests = await open(page, async (number) => {
    if (number === 3) {
      started?.();
      await held;
    }
    return null;
  });
  await page.getByRole("button", { name: "Load later", exact: true }).click();
  await incoming;
  await expect(
    page.getByRole("button", { name: "Loading history…", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Load earlier", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("navigation", { name: "Thread pages (top)", exact: true })
    .getByRole("link", { name: "1", exact: true })
    .click();
  await expect(page.locator("#pid101")).toBeVisible();
  release?.();
  await expect(page.locator("#pid107")).toHaveCount(0);
  await expect(page.locator(".reading-pane article")).toHaveCount(3);
  expect(
    requests.map((request) =>
      new URL(request.slice(4)).searchParams.get("page"),
    ),
  ).toEqual(["2", "3", "1"]);
});

test("IM68.recovery-metadata: malformed newly optional history metadata is visibly incompatible", async ({
  page,
}) => {
  await open(page);
  await page.evaluate(() => {
    const record = JSON.parse(
      sessionStorage.getItem("tsdm.workspace.recovery")!,
    );
    for (const entry of Object.values(record.entries)) {
      const item = entry as {
        result?: { kind: string; thread?: { history?: unknown } };
      };
      if (item.result?.kind === "thread" && item.result.thread)
        item.result.thread.history = {
          earlier: null,
          later: null,
          beginning: false,
          end: false,
          latest: { label: "untrusted", url: "javascript:alert(1)" },
          order: "ascending",
        };
    }
    sessionStorage.setItem("tsdm.workspace.recovery", JSON.stringify(record));
  });
  await page.reload();
  await expect(
    page.getByText("Stored recovery data is incompatible or malformed.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Jump to latest", exact: true }),
  ).toHaveCount(0);
});

test("IM68.late-media: prepended history and a late intrinsic image preserve the same post and nonzero offset", async ({
  page,
}) => {
  let release: (() => void) | undefined;
  let started: (() => void) | undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const incoming = new Promise<void>((resolve) => {
    started = resolve;
  });
  await open(page, async (number, url) => {
    if (url.endsWith("late.png")) {
      started?.();
      await held;
      return {
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="orange"/></svg>',
      };
    }
    return {
      body: fixture(number).replace(
        '<div class="pcb">',
        '<div class="pcb"><img src="' + origin + '/late.png" alt="Late cover">',
      ),
    };
  });
  await incoming;
  await page.locator("#pid104").evaluate((post) => {
    const pane = post.closest(".reading-pane")!;
    pane.scrollTop +=
      post.getBoundingClientRect().top - pane.getBoundingClientRect().top + 37;
  });
  const before = await anchor(page);
  await page.getByRole("button", { name: "Load earlier", exact: true }).click();
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  expect((await anchor(page)).top).toBeCloseTo(before.top, 0);
  release?.();
  await expect
    .poll(() =>
      page
        .locator("#pid103 img")
        .evaluate((image) => (image as HTMLImageElement).naturalHeight),
    )
    .toBe(600);
  expect((await anchor(page)).top).toBeCloseTo(before.top, 0);
});

test("IM68.latest: the explicit native last link opens its returned page and exact last post", async ({
  page,
}) => {
  const requests = await open(page, (number) => ({
    body: fixture(number).replace(
      `<a href="${route(3)}">3</a>`,
      `<a class="last" href="${route(3)}">... 3</a>`,
    ),
  }));
  await expect(
    page.getByRole("link", { name: "Jump to latest", exact: true }),
  ).toHaveAttribute("href", `${route(3)}#lastpost`);
  await page.getByRole("link", { name: "Jump to latest", exact: true }).click();
  await expect(page.locator("#pid107")).toHaveAttribute(
    "data-targeted",
    "true",
  );
  await expect(page.locator("#pid107")).toBeFocused();
  expect(
    requests.map((request) =>
      new URL(request.slice(4)).searchParams.get("page"),
    ),
  ).toEqual(["2", "3"]);
});

test("IM68.preparation-priority: a delayed history result never interrupts deliberate reply preparation or changes retained writing", async ({
  page,
}) => {
  let release: (() => void) | undefined;
  let started: (() => void) | undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const incoming = new Promise<void>((resolve) => {
    started = resolve;
  });
  const requests = await open(page, async (number, value) => {
    const url = new URL(value);
    if (url.searchParams.get("mod") === "post")
      return {
        body: '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div><div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div><form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_PUBLIC_TOKEN"><input name="subject" value=""><textarea name="message"></textarea><label><input type="checkbox" name="usesig" value="1" checked>Signature</label><button name="replysubmit" value="yes">Reply</button></form>',
      };
    if (number === 3) {
      started?.();
      await held;
    }
    return {
      body:
        '<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div>' +
        fixture(number),
    };
  });
  await page.getByRole("button", { name: "Load later", exact: true }).click();
  await incoming;
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  await page
    .getByLabel("Complete source", { exact: true })
    .fill("Retained complete reply [quote]authored[/quote]");
  release?.();
  await expect(page.getByLabel("Complete source", { exact: true })).toHaveValue(
    "Retained complete reply [quote]authored[/quote]",
  );
  await page
    .getByRole("button", { name: "Return to reading", exact: true })
    .click();
  await expect(page.locator(".reading-pane article")).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "Load later", exact: true }),
  ).toBeEnabled();
  expect(requests).toHaveLength(3);
  expect(requests.every((value) => value.startsWith("GET "))).toBe(true);
});

for (const kind of ["empty", "repeated"] as const) {
  test(`IM68.${kind}-boundary: unusable adjacent content retains the loaded range and an explicit retry`, async ({
    page,
  }) => {
    const requests = await open(page, (number) =>
      number === 3
        ? {
            body:
              kind === "empty"
                ? fixture(3).replace(
                    /<div id="post_\d+">[\s\S]*?<\/div><\/div>/g,
                    "",
                  )
                : fixture(2),
          }
        : null,
    );
    await page.getByRole("button", { name: "Load later", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Retry later", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".reading-pane article")).toHaveCount(3);
    expect(requests).toHaveLength(2);
  });
}

test("IM68.reader-moves-during-load: preserve the reader's current anchor when a delayed earlier page arrives", async ({
  page,
}) => {
  let release: (() => void) | undefined;
  let started: (() => void) | undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const incoming = new Promise<void>((resolve) => {
    started = resolve;
  });
  await open(page, async (number) => {
    if (number === 1) {
      started?.();
      await held;
    }
    return null;
  });
  await page.getByRole("button", { name: "Load earlier", exact: true }).click();
  await incoming;
  await page.locator("#pid104").evaluate((post) => {
    const pane = post.closest(".reading-pane")!;
    pane.scrollTop +=
      post.getBoundingClientRect().top - pane.getBoundingClientRect().top + 37;
  });
  const before = await anchor(page);
  release?.();
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  expect((await anchor(page)).top).toBeCloseTo(before.top, 0);
});

test("IM68.loaded-permalink: selecting a post in the current loaded page updates its exact target without discarding the range", async ({
  page,
}) => {
  const requests = await open(page);
  await page.getByRole("button", { name: "Load later", exact: true }).click();
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  await page
    .locator("#pid104")
    .getByRole("link", { name: "Post 104", exact: true })
    .click();
  await expect(page.locator("#pid104")).toHaveAttribute(
    "data-targeted",
    "true",
  );
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  expect(requests).toHaveLength(2);
});

test("IM68.filtered-return: a response resolving into another filter never mixes its posts into the loaded range", async ({
  browser,
}, info) => {
  await withRedirectFixture(
    browser,
    {
      origin,
      redirect: route(3),
      document: (url) => fixture(Number(url.searchParams.get("page") ?? "1")),
      readRedirect: (url) =>
        url.searchParams.get("page") === "3" &&
        !url.searchParams.has("authorid")
          ? `${route(3)}&authorid=9&tsdmapp=json`
          : null,
    },
    async (page, requests) => {
      await page.goto(route(2));
      await expect(
        page.getByRole("heading", {
          name: "Continuous rich history",
          exact: true,
        }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Load later", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Retry later", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText(
          "The returned history did not match this thread, account, filter or adjacent page.",
          { exact: true },
        ),
      ).toBeVisible();
      await expect(page.locator(".reading-pane article")).toHaveCount(3);
      expect(requests).toHaveLength(3);
      await info.attach("filtered-redirect-requests.json", {
        body: JSON.stringify(requests),
        contentType: "application/json",
      });
      await info.attach("filtered-redirect.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
    },
  );
});

for (const [direction, pageNumber, postId] of [
  ["earlier", 1, 101],
  ["later", 3, 107],
] as const) {
  test(`IM68.${direction}-attachment: fresh access uses the containing returned page and saves verified bytes`, async ({
    page,
  }, info) => {
    const bytes = "Exact adjacent-page attachment bytes.\n";
    const attachmentURL = `${origin}/forum.php?mod=attachment&aid=range-file&nothumb=yes`;
    const requests = await open(page, (number, value) => {
      if (new URL(value).searchParams.get("mod") === "attachment")
        return {
          body: bytes,
          contentType: "application/octet-stream",
          headers: {
            "content-disposition": 'attachment; filename="range-notes.txt"',
            "content-length": String(Buffer.byteLength(bytes)),
          },
        };
      return {
        body:
          number === pageNumber
            ? fixture(number).replace(
                `Quoted attribution ${postId}</blockquote>`,
                `Quoted attribution ${postId}</blockquote><ignore_js_op><span id="attach_51"><a href="${attachmentURL}">range-notes.txt</a></span><div id="attach_51_menu">${Buffer.byteLength(bytes)} Bytes</div></ignore_js_op>`,
              )
            : fixture(number),
      };
    });
    await page
      .getByRole("button", {
        name: direction === "earlier" ? "Load earlier" : "Load later",
        exact: true,
      })
      .click();
    await page
      .locator(`#pid${postId}`)
      .getByRole("button", { name: "Download range-notes.txt", exact: true })
      .click();
    await expect(
      page.getByText("File ready to save", { exact: true }),
    ).toBeVisible();
    const savedEvent = page.waitForEvent("download");
    await page.getByRole("button", { name: "Save file", exact: true }).click();
    const downloaded = await savedEvent;
    const path = info.outputPath("range-notes.txt");
    await downloaded.saveAs(path);
    expect(await downloaded.failure()).toBeNull();
    expect(readFileSync(path, "utf8")).toBe(bytes);
    expect(
      requests
        .filter(
          (value) =>
            new URL(value.slice(4)).searchParams.get("mod") === "viewthread",
        )
        .map((value) => new URL(value.slice(4)).searchParams.get("page")),
    ).toEqual(["2", String(pageNumber), String(pageNumber)]);
    expect(requests.at(-1)).toBe(`GET ${attachmentURL}`);
    await info.attach("saved-range-file.txt", {
      body: bytes,
      contentType: "text/plain",
    });
  });
}

test("IM68.compact-writing-anchor: manual history keeps the visible post and sole active writing context", async ({
  page,
}) => {
  const requests = await open(page, (number, value) => {
    if (new URL(value).searchParams.get("mod") === "post")
      return {
        body: '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div><div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div><form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_PUBLIC_TOKEN"><input name="subject" value=""><textarea name="message"></textarea><button name="replysubmit" value="yes">Reply</button></form>',
      };
    return {
      body:
        '<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div>' +
        fixture(number),
    };
  });
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  const editor = page.getByLabel("Complete source", { exact: true });
  await editor.fill("Retained composition [quote]complete[/quote]");
  const original = await editor.elementHandle();
  await page.locator("#pid104").evaluate((post) => {
    const pane = post.closest(".reading-pane")!;
    pane.scrollTop +=
      post.getBoundingClientRect().top - pane.getBoundingClientRect().top + 37;
  });
  const before = await anchor(page);
  await page.getByRole("button", { name: "Load earlier", exact: true }).click();
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  expect((await anchor(page)).top).toBeCloseTo(before.top, 0);
  await expect(editor).toHaveValue(
    "Retained composition [quote]complete[/quote]",
  );
  expect(await original?.evaluate((node) => node.isConnected)).toBe(true);
  expect(requests).toHaveLength(3);
  expect(requests.every((value) => value.startsWith("GET "))).toBe(true);
});

test("IM68.board-browse-range: three-region board browsing and history return retain the loaded range and its reader anchor", async ({
  page,
}) => {
  const member =
    '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div>';
  const boardURL = `${origin}/forum.php?mod=forumdisplay&fid=6`;
  const requests = await open(page, (number, value) => {
    const url = new URL(value);
    if (url.searchParams.get("mod") === "viewthread")
      return { body: fixture(number) };
    if (url.searchParams.get("mod") === "forumdisplay")
      return {
        body: `${member}<div id="ct"><h1><a href="${boardURL}">Other board</a></h1></div><table id="threadlisttableid"><tbody id="normalthread_80"><tr><th><a class="xst" href="forum.php?mod=viewthread&tid=80">Other thread</a></th><td class="by"><cite>Writer</cite></td></tr></tbody></table>`,
      };
    return {
      body: `${member}<div class="bm bmw fl"><div class="bm_h"><h2>Community</h2></div><table><tr><td><h2><a href="${boardURL}">Other board</a></h2><p>Browse other threads</p></td></tr></table></div>`,
    };
  });
  await page.getByRole("button", { name: "Load later", exact: true }).click();
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  await page.locator("#pid104").evaluate((post) => {
    const pane = post.closest(".reading-pane")!;
    pane.scrollTop +=
      post.getBoundingClientRect().top - pane.getBoundingClientRect().top + 37;
  });
  const before = await anchor(page);
  await page.getByRole("link", { name: "All boards", exact: true }).click();
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  expect((await anchor(page)).top).toBeCloseTo(before.top, 0);
  await page
    .getByRole("region", { name: "Boards overview", exact: true })
    .getByRole("link", { name: "Other board", exact: true })
    .click();
  await expect(
    page
      .locator(".results-pane")
      .getByRole("link", { name: "Other thread", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  expect((await anchor(page)).top).toBeCloseTo(before.top, 0);
  await page.getByRole("button", { name: "Load earlier", exact: true }).click();
  await expect(page.locator(".reading-pane article")).toHaveCount(7);
  expect((await anchor(page)).top).toBeCloseTo(before.top, 0);
  await page.goBack();
  await expect(page.locator(".reading-pane article")).toHaveCount(7);
  await page.goForward();
  await expect(page.locator(".reading-pane article")).toHaveCount(7);
  expect((await anchor(page)).top).toBeCloseTo(before.top, 0);
  expect(
    requests
      .filter(
        (value) =>
          new URL(value.slice(4)).searchParams.get("mod") === "viewthread",
      )
      .map((value) => new URL(value.slice(4)).searchParams.get("page")),
  ).toEqual(["2", "3", "1"]);
});

test("IM68.short-writing-anchor: manual history keeps the visible post and sole active writing context", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1265, height: 629 });
  const requests = await open(page, async (number, value) => {
    if (number !== 2 && new URL(value).searchParams.get("mod") === "viewthread")
      await new Promise((resolve) => setTimeout(resolve, 250));
    if (new URL(value).searchParams.get("mod") === "post")
      return {
        body: '<div id="um"><strong><a href="home.php?mod=space&uid=7">Reader Seven</a></strong></div><div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div><form id="postform" method="post" action="forum.php?mod=post&action=reply&fid=5&tid=42&replysubmit=yes"><input type="hidden" name="formhash" value="SYNTHETIC_PUBLIC_TOKEN"><input name="subject" value=""><textarea name="message"></textarea><button name="replysubmit" value="yes">Reply</button></form>',
      };
    return {
      body:
        '<div id="pt"><a href="forum.php?mod=forumdisplay&fid=5">Music</a></div>' +
        fixture(number),
    };
  });
  await page
    .getByRole("button", { name: "Reply to thread", exact: true })
    .click();
  const editor = page.getByLabel("Complete source", { exact: true });
  await editor.fill("Retained composition [quote]complete[/quote]");
  const original = await editor.elementHandle();
  await page.locator("#pid104").evaluate((post) => {
    const pane = post.closest(".reading-pane")!;
    pane.scrollTop +=
      post.getBoundingClientRect().top - pane.getBoundingClientRect().top - 70;
  });
  const before = await anchor(page);
  await page.getByRole("button", { name: "Load earlier", exact: true }).click();
  await expect(page.locator(".reading-pane article")).toHaveCount(5);
  // Bounded observation interval: detect a late browser-layout drift after insertion.
  await page.waitForTimeout(1000);
  expect((await anchor(page)).top).toBeCloseTo(before.top, 0);
  await expect(editor).toHaveValue(
    "Retained composition [quote]complete[/quote]",
  );
  expect(await original?.evaluate((node) => node.isConnected)).toBe(true);
  expect(requests).toHaveLength(3);
  expect(requests.every((value) => value.startsWith("GET "))).toBe(true);
});
