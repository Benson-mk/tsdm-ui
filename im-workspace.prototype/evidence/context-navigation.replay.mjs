// Browser E2E probe written before the contextual-sidebar correction.
// In cua_repl, import this module, then run: await contextNavigationProbe(tab).
// Use the served prototype at a desktop width (1440px). The tab uses cua_repl APIs.
export async function contextNavigationProbe(tab) {
  const observations = [];
  for (const destination of ['search', 'favorites', 'notifications', 'drafts', 'boards']) {
    await tab.playwright.locator(`#nav [data-dest="${destination}"]`).click();
    await tab.getAXState({ emit: false });
    const actual = await tab.playwright.evaluate(() => ({
      selected: document.querySelector('#nav [aria-current="page"]').dataset.dest,
      mainLabel: document.querySelector('#nav [aria-current="page"] span:last-child').textContent,
      heading: document.querySelector('#boards h2').textContent,
      boardNavigationCount: document.querySelectorAll('#boards [data-board]').length,
      pane: document.querySelector('#boards').textContent,
    }));
    const pass = destination === 'boards'
      ? actual.selected === destination && actual.boardNavigationCount === 4
      : actual.selected === destination && actual.heading === actual.mainLabel && actual.boardNavigationCount === 0;
    observations.push({ destination, pass, actual });
  }
  return { pass: observations.every(x => x.pass), observations };
}

// Added before the follow-up history correction. Run on variant A at 1440px.
export async function searchReturnProbe(tab) {
  await tab.playwright.locator('#nav [data-dest="search"]').click();
  await tab.playwright.locator('#board-options [data-context="anime"]').click();
  await tab.playwright.locator('#search').fill('光');
  await tab.playwright.locator('#nav [data-dest="notifications"]').click();
  await tab.back();
  await tab.getAXState({ emit: false });
  const actual = await tab.playwright.evaluate(() => ({
    destination: document.querySelector('#nav [aria-current="page"]').dataset.dest,
    search: document.querySelector('#search').value,
    scope: document.querySelector('#board-options [aria-current="page"]').dataset.context,
    resultCount: document.querySelectorAll('#thread-list [data-thread]').length,
  }));
  return { pass: actual.destination === 'search' && actual.search === '光' && actual.scope === 'anime' && actual.resultCount === 1, actual };
}

// Run on variant B. Back must update the open picker as well as the main panes.
export async function pickerReturnProbe(tab) {
  await tab.playwright.locator('#nav [data-dest="favorites"]').click();
  await tab.playwright.locator('#picker [data-context="threads"]').click();
  await tab.playwright.locator('#picker [data-context="boards"]').click();
  await tab.back();
  await tab.getAXState({ emit: false });
  const actual = await tab.playwright.evaluate(() => ({
    selected: document.querySelector('#picker [aria-current="page"]').dataset.context,
    threadCount: document.querySelectorAll('#picker-rows [data-thread]').length,
    boardCount: document.querySelectorAll('#picker-rows [data-open-board]').length,
  }));
  return { pass: actual.selected === 'threads' && actual.threadCount === 1 && actual.boardCount === 0, actual };
}
