import type { Page } from "@playwright/test";

// Observe rendered content and both real scroll owners, never controller state.
export async function readableLines(page: Page, selector = ".reading-pane") {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  return page.locator(selector).evaluate((reader) => {
    const rect = reader.getBoundingClientRect();
    const outer = reader.closest(".conversation-region")!;
    const bounds = outer.getBoundingClientRect();
    const top = Math.max(0, rect.top, bounds.top);
    const bottom = Math.min(innerHeight, rect.bottom, bounds.bottom);
    const lines = [...reader.querySelectorAll(".post-content p")].flatMap(
      (p, paragraph) => {
        const range = document.createRange();
        range.selectNodeContents(p);
        return [...range.getClientRects()]
          .filter((r) => r.width > 0 && r.height > 0)
          .map((r, line) => ({
            paragraph,
            line,
            text: p.textContent,
            top: r.top,
            bottom: r.bottom,
            offset: r.top - top,
            visible: bottom > top && r.bottom > top + 1 && r.top < bottom - 1,
            complete: r.top >= top - 1 && r.bottom <= bottom + 1,
          }));
      },
    );
    return {
      top,
      bottom,
      paneTop: rect.top,
      inner: reader.scrollTop,
      outer: outer.scrollTop,
      remaining: reader.scrollHeight - reader.clientHeight - reader.scrollTop,
      visibleHeight: Math.max(0, bottom - top),
      articleTop: reader.querySelector("article")?.getBoundingClientRect().top,
      first: lines.find((line) => line.visible) ?? null,
      lines,
    };
  });
}
