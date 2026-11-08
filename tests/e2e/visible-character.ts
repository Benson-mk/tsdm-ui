import { expect, type Page } from "@playwright/test";

// Independent DOM observation: retain one complete visible glyph, never app state.
export async function visibleCharacter(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  return page.locator(".reading-pane").evaluateHandle((pane) => {
    const bounds = pane.getBoundingClientRect();
    const outer = pane.closest(".conversation-region")!.getBoundingClientRect();
    const top = Math.max(0, bounds.top, outer.top),
      bottom = Math.min(innerHeight, bounds.bottom, outer.bottom);
    const walker = document.createTreeWalker(pane, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (
        !node.parentElement?.closest(".post-content") ||
        !node.textContent?.trim()
      )
        continue;
      const range = document.createRange();
      for (let offset = 0; offset < node.textContent.length; offset++) {
        if (!node.textContent[offset]?.trim()) continue;
        range.setStart(node, offset);
        range.setEnd(node, offset + 1);
        const r = range.getBoundingClientRect();
        if (r.width > 0 && r.top >= top && r.bottom <= bottom)
          return {
            range,
            pane,
            post: node.parentElement.closest("article")!.id,
            text: node.textContent,
            offset,
            screenTop: r.top,
            top: r.top - bounds.top,
          };
      }
    }
    throw Error("No complete visible reading glyph");
  });
}
export async function characterObservation(
  handle: Awaited<ReturnType<typeof visibleCharacter>>,
) {
  await handle.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  return handle.evaluate(
    ({ range, pane, post, text, offset, screenTop, top }) => {
      const r = range.getBoundingClientRect(),
        b = pane.getBoundingClientRect(),
        o = pane.closest(".conversation-region")!.getBoundingClientRect();
      return {
        post,
        actualPost: range.startContainer.parentElement?.closest("article")?.id,
        text,
        actualText: range.startContainer.textContent,
        offset,
        actualOffset: range.startOffset,
        top,
        after: r.top - b.top,
        screenTop,
        screenAfter: r.top,
        screenFits:
          screenTop >= Math.max(0, b.top, o.top) &&
          screenTop + r.height <= Math.min(innerHeight, b.bottom, o.bottom),
        visible:
          r.width > 0 &&
          r.top >= Math.max(0, b.top, o.top) - 1 &&
          r.bottom <= Math.min(innerHeight, b.bottom, o.bottom) + 1,
        scroll: pane.scrollTop,
      };
    },
  );
}
export async function expectCharacter(
  handle: Awaited<ReturnType<typeof visibleCharacter>>,
  mode: "pane" | "screen" = "pane",
) {
  const result = await characterObservation(handle);
  expect(result.visible, JSON.stringify(result)).toBe(true);
  expect(result.actualPost).toBe(result.post);
  expect(result.actualText).toBe(result.text);
  expect(result.actualOffset).toBe(result.offset);
  expect(
    Math.abs(
      mode === "screen" && result.screenFits
        ? result.screenAfter - result.screenTop
        : result.after - result.top,
    ),
    JSON.stringify(result),
  ).toBeLessThanOrEqual(1);
  expect(result.scroll).toBeGreaterThan(0);
  return result;
}

// Keep the same independently selected glyph throughout a series of reflows.
// Only its baseline coordinates advance; text/post/character identity do not.
export async function rebaseCharacter(
  handle: Awaited<ReturnType<typeof visibleCharacter>>,
) {
  await handle.evaluate((anchor) => {
    anchor.screenTop = anchor.range.getBoundingClientRect().top;
    anchor.top = anchor.screenTop - anchor.pane.getBoundingClientRect().top;
  });
}
