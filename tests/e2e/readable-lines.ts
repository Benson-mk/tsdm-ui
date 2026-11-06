import { expect, type Page } from "@playwright/test";

// Observe rendered content and both real scroll owners, never controller state.
export async function readableLines(
  page: Page,
  selector = ".reading-pane",
  allText = false,
) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  return page.locator(selector).evaluate((reader, allText) => {
    const rect = reader.getBoundingClientRect();
    const outer = reader.closest(".conversation-region")!;
    const bounds = outer.getBoundingClientRect();
    const top = Math.max(0, rect.top, bounds.top);
    const bottom = Math.min(innerHeight, rect.bottom, bounds.bottom);
    const nodes: Node[] = allText
      ? [...reader.querySelectorAll(".post-content")].flatMap((content) => {
          const walker = document.createTreeWalker(
            content,
            NodeFilter.SHOW_TEXT,
          );
          const nodes: Node[] = [];
          let text;
          while ((text = walker.nextNode()))
            if (text.textContent?.trim()) nodes.push(text);
          return nodes;
        })
      : [...reader.querySelectorAll(".post-content p")];
    const lines = nodes.flatMap((p, paragraph) => {
      const range = document.createRange();
      range.selectNodeContents(p);
      return [...range.getClientRects()]
        .filter((r) => r.width > 0 && r.height > 0)
        .map((r, line) => ({
          post:
            (p instanceof Element ? p : p.parentElement)?.closest("article[id]")
              ?.id ?? null,
          paragraph,
          line,
          text: p.textContent,
          top: r.top,
          bottom: r.bottom,
          offset: r.top - top,
          visible: bottom > top && r.bottom > top + 1 && r.top < bottom - 1,
          complete: r.top >= top - 1 && r.bottom <= bottom + 1,
        }));
    });
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
  }, allText);
}

// Preserve an actual complete text line. Header/status growth can make its old
// screen coordinate unavailable; only then preserve its offset within the pane.
export function expectPreservedReadingLine(
  before: Awaited<ReturnType<typeof readableLines>>,
  after: Awaited<ReturnType<typeof readableLines>>,
  normalize = (text: string | null) => text,
) {
  const prior = before.lines.find((line) => line.visible && line.complete);
  expect(
    prior,
    "a complete line must actually be visible before the action",
  ).toBeTruthy();
  const current = after.lines.find(
    (line) =>
      line.post === prior!.post &&
      line.line === prior!.line &&
      normalize(line.text) === normalize(prior!.text),
  );
  expect(
    current,
    "the exact previously visible text line must remain",
  ).toBeTruthy();
  expect(current!.top).toBeGreaterThanOrEqual(after.top - 1);
  expect(current!.bottom).toBeLessThanOrEqual(after.bottom + 1);
  const fits = prior!.top >= after.top - 1 && prior!.bottom <= after.bottom + 1;
  expect(
    Math.abs(
      fits ? current!.top - prior!.top : current!.offset - prior!.offset,
    ),
  ).toBeLessThanOrEqual(1);
}
