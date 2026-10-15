// Browser acceptance probe written before implementing the human's overview choice.
// Start a fresh variant A tab at 1440px. Pass a CUA tab to sectionOverviewProbe.
// Failure cases: stale posts/editor after section switches; mismatched overview;
// lost writing or target; unavailable return path; selecting a result stays in
// overview; Back restores the wrong view; narrow navigation bypasses the list.
export async function sectionOverviewProbe(tab) {
  await tab.playwright.locator('#thread-head [data-action="reply"]').click();
  await tab.playwright.locator('#compose-body').fill('Overview navigation must retain this writing.');
  const observations = [];
  for (const destination of ['search', 'favorites', 'notifications', 'drafts', 'boards']) {
    await tab.playwright.locator(`#nav [data-dest="${destination}"]`).click();
    await tab.getAXState({ emit: false });
    const actual = await tab.playwright.evaluate(() => {
      const visible = selector => Boolean(document.querySelector(selector)?.getClientRects().length);
      return {
        mainLabel: document.querySelector('#nav [aria-current="page"] span:last-child').textContent,
        overviewHeading: document.querySelector('#overview-title')?.textContent ?? null,
        overviewVisible: visible('#section-overview'),
        threadVisible: visible('#thread-view'),
        composerVisible: visible('#composer'),
        text: document.querySelector('#compose-body').value,
        target: document.querySelector('#compose-target').textContent,
        returnWritingVisible: visible('#return-writing'),
      };
    });
    observations.push({ destination, pass: actual.overviewVisible && !actual.threadVisible && !actual.composerVisible && actual.overviewHeading === actual.mainLabel && actual.returnWritingVisible && actual.text === 'Overview navigation must retain this writing.', actual });
  }
  return { pass: observations.every(x => x.pass), observations };
}
