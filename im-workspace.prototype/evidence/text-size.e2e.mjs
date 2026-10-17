// Browser expectations written before the text-size implementation. Synthetic local UI only.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2] || 'text-size-final';
const evidence = path.join(root, 'evidence', output);
await mkdir(evidence, { recursive: true });
const base = process.env.BASE_URL || 'http://127.0.0.1:4176/im-workspace.prototype.html?variant=A';
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.setDefaultTimeout(10000);
const errors = [], externalRequests = [], cases = [];
page.on('pageerror', e => errors.push(e.message));
page.on('request', r => { if (new URL(r.url()).origin !== new URL(base).origin) externalRequests.push(r.url()); });
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const near = (a, b, tolerance = .15) => Math.abs(a - b) < tolerance;
async function check(name, run) { try { cases.push({ name, pass: true, observed: await run() }); } catch (e) { cases.push({ name, pass: false, error: e.message }); } }
async function settings() { if (!await page.locator('#settings').evaluate(el => el.open)) await page.locator('#topbar [data-action=settings]').click(); }
async function close() { if (await page.locator('#settings').evaluate(el => el.open)) await page.locator('[data-close=settings]').click(); }
async function size(n) { await settings(); const slider = page.locator('#text-size'); await slider.press('Home'); for (let i = 70; i < n; i += 10) await slider.press('ArrowRight'); }
const selectors = ['body', '#nav [data-i=boards]', '.board-option', '.thread-title', '#thread-title', '.post-content', '.post-head .meta', '.post-content code', '#compose-body', '#settings h2', '#state'];
async function fonts() { return page.evaluate(ss => Object.fromEntries(ss.map(s => [s, parseFloat(getComputedStyle(document.querySelector(s)).fontSize)])), selectors); }
await page.goto(base);
await check('Labelled slider replaces density; exact range, baseline and reset', async () => {
  const range = await page.locator('#text-size').count();
  assert(range === 1, 'Missing text-size range input (legacy density selector still present)');
  const attrs = await page.locator('#text-size').evaluate(el => ({ type: el.type, min: el.min, max: el.max, step: el.step, value: el.value, labels: [...el.labels].map(x => x.textContent) }));
  assert(attrs.type === 'range' && attrs.min === '70' && attrs.max === '150' && attrs.step === '10' && attrs.value === '100' && attrs.labels.some(Boolean), JSON.stringify(attrs));
  assert(await page.locator('#density').count() === 0 && await page.locator('#reset-text-size').count() === 1, 'Old selector or missing reset');
  return attrs;
});
if (await page.locator('#text-size').count()) {
  await check('Pointer dragging previews and saves before release', async () => {
    await settings(); const box = await page.locator('#text-size').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
    await page.mouse.move(box.x + box.width - 8, box.y + box.height / 2, { steps: 8 });
    const observed = await page.evaluate(() => ({ value: document.querySelector('#text-size').value, root: document.documentElement.dataset.textSize, saved: localStorage.getItem('tsdm-im-workspace.prototype.text-size') }));
    await page.mouse.up(); assert(observed.value === '150' && observed.root === '150' && observed.saved === '150', JSON.stringify(observed)); return observed;
  });
  await check('Global role scaling, automatic Compact threshold and unchanged panes/icons', async () => {
    await size(100); const baseline = await fonts();
    const fixed = await page.evaluate(() => ({ grid: getComputedStyle(document.querySelector('#shell')).gridTemplateColumns, icon: getComputedStyle(document.querySelector('#nav button>span')).fontSize }));
    const observed = [];
    for (const n of [70, 80, 90, 100, 110, 120, 130, 140, 150]) {
      await size(n); const values = await fonts();
      for (const s of selectors) assert(near(values[s], baseline[s] * n / 100), `${s} at ${n}%: ${values[s]} vs ${baseline[s] * n / 100}`);
      const metrics = await page.evaluate(() => { const style = s => getComputedStyle(document.querySelector(s)); return { density: document.documentElement.dataset.density, grid: style('#shell').gridTemplateColumns, icon: style('#nav button>span').fontSize, rowY: style('.thread-row').paddingTop, rowX: style('.thread-row').paddingLeft, rowMin: style('.thread-row').minHeight, post: style('.post').paddingTop, composer: style('#composer').paddingLeft, output: document.querySelector('#text-size-value').textContent, focus: document.activeElement.id, variant: document.documentElement.dataset.variant }; });
      assert(metrics.density === (n < 100 ? 'Compact' : 'Default'), JSON.stringify(metrics));
      assert(metrics.grid === fixed.grid && metrics.icon === fixed.icon, 'Pane/icon geometry changed');
      assert(metrics.output.includes(`${n}%`) && metrics.focus === 'text-size' && metrics.variant === 'A', 'Live output/focus/keyboard changed');
      assert(metrics.rowY === (n < 100 ? '12px' : '16px') && metrics.rowX === (n < 100 ? '16px' : '24px'), 'Wrong row spacing');
      assert(metrics.post === (n < 100 ? '16px' : '32px') && (n >= 100 || parseFloat(metrics.rowMin) < 118), 'Compact post/row sizing incorrect');
      observed.push({ percentage: n, ...metrics });
    }
    return observed;
  });
  await check('Writing, caret, nodes, disclosure, reading anchor and navigation survive resize', async () => {
    await size(100); await close();
    await page.locator('#spoiler summary').click();
    await page.locator('[data-quote="1"]').click();
    await page.locator('#compose-body').fill('Preserve this writing — 保留文字 and caret.');
    await page.locator('#compose-body').evaluate(el => el.setSelectionRange(4, 11));
    await settings();
    await page.evaluate(() => {
      const scroller = document.querySelector('#reader-scroll'); scroller.scrollTop = 420;
      const anchor = [...document.querySelectorAll('.post-head,.post-content>p,.post-content>figure,.post-content>h2')].find(el => el.getBoundingClientRect().bottom > scroller.getBoundingClientRect().top + 8);
      window.textSizeProbe = { editor: document.querySelector('#compose-body'), post: document.querySelector('.post'), row: document.querySelector('.thread-row'), anchor, offset: anchor.getBoundingClientRect().top - scroller.getBoundingClientRect().top, href: location.href, history: history.length, target: document.querySelector('#compose-target').textContent };
    });
    const observations = [];
    for (const n of [90, 150, 70, 100]) {
      await size(n);
      const result = await page.evaluate(() => { const p = window.textSizeProbe, e = document.querySelector('#compose-body'); return { nodes: p.editor === e && p.post === document.querySelector('.post') && p.row === document.querySelector('.thread-row'), text: e.value, selection: [e.selectionStart, e.selectionEnd], spoiler: document.querySelector('#spoiler').open, delta: p.anchor.getBoundingClientRect().top - document.querySelector('#reader-scroll').getBoundingClientRect().top - p.offset, history: p.history === history.length && p.href === location.href, target: p.target === document.querySelector('#compose-target').textContent }; });
      assert(result.nodes && result.text === 'Preserve this writing — 保留文字 and caret.' && result.selection.join() === '4,11' && result.spoiler && Math.abs(result.delta) < 2 && result.history && result.target, JSON.stringify(result)); observations.push({ percentage: n, ...result });
    }
    await close();
    assert(await page.locator('#topbar [data-action=settings]').evaluate(el => el === document.activeElement), 'Modal did not restore its invoking control focus');
    return observations;
  });
  await check('Immediate save, reload, reset persistence and history independence', async () => {
    await size(90); await page.reload(); await settings();
    assert(await page.locator('#text-size').inputValue() === '90', 'Size did not persist');
    await close(); await page.locator('[data-dest=search]').click(); await size(150); await close(); await page.goBack(); await settings();
    assert(await page.locator('#text-size').inputValue() === '150', 'History reverted preference');
    await page.locator('#reset-text-size').click(); await page.reload(); await settings();
    assert(await page.locator('#text-size').inputValue() === '100' && await page.locator('html').getAttribute('data-density') === 'Default', 'Reset did not persist');
    return { reload: 90, afterBack: 150, resetReload: 100 };
  });
  await check('Malformed storage and unavailable storage keep the UI usable', async () => {
    const key = 'tsdm-im-workspace.prototype.text-size';
    for (const value of ['NaN', '0', '95', '200']) {
      await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key, value }); await page.reload(); await settings();
      assert(await page.locator('#text-size').inputValue() === '100', `Invalid saved ${value} was accepted`);
    }
    const blocked = await browser.newContext(); await blocked.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } }));
    const p = await blocked.newPage(); await p.goto(base); await p.locator('#topbar [data-action=settings]').click();
    await p.locator('#text-size').press('Home'); await p.locator('#text-size').press('ArrowRight');
    assert(await p.locator('#text-size').inputValue() === '80' && await p.locator('html').getAttribute('data-density') === 'Compact', 'Blocked storage prevented session change');
    assert(await p.locator('#text-size-storage').isVisible(), 'Session-only fallback is not disclosed');
    await p.reload(); await p.locator('#topbar [data-action=settings]').click(); assert(await p.locator('#text-size').inputValue() === '100', 'Blocked storage should not claim persistence');
    await blocked.close(); return { invalidValues: 'fallback to 100', blockedStorage: 'session value works; reload defaults' };
  });
  await check('All palettes and structural breakpoints retain readable controls and local overflow', async () => {
    await page.goto(base); const matrix = [];
    for (const width of [375, 559, 560, 767, 768, 959, 960, 1100, 1279, 1280, 1400, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const theme of ['Light', 'Alias', 'Mono', 'Dark']) {
        await settings(); await page.locator(`#themes [data-theme=${theme}]`).click();
        for (const n of [70, 90, 100, 150]) {
          await size(n); await close();
          const view = await page.evaluate(() => {
            const visible = el => el.getBoundingClientRect().width && el.getBoundingClientRect().height && getComputedStyle(el).visibility !== 'hidden';
            const controls = [...document.querySelectorAll('button:not(:disabled),input:not([type=range]),select')].filter(visible);
            return { overflow: document.documentElement.scrollWidth > innerWidth + 1, shortControls: controls.filter(el => { const r = el.getBoundingClientRect(); return r.width < 43.9 || r.height < (el.matches('input,select') ? 47.9 : 43.9); }).map(el => el.id || el.dataset.action || el.outerHTML.slice(0,90)), clippedControls: controls.filter(el => el.scrollWidth > el.clientWidth + 2).map(el => el.id || el.dataset.action || el.outerHTML.slice(0,90)), post: parseFloat(getComputedStyle(document.querySelector('.post-content')).fontSize), readerHeight: document.querySelector('#reader-scroll').clientHeight };
          });
          assert(!view.overflow && !view.shortControls.length && !view.clippedControls.length && view.readerHeight > 80 && near(view.post, 18*n/100), `${width}/${theme}/${n}: ${JSON.stringify(view)}`);
          matrix.push({ width, theme, percentage: n, ...view });
        }
      }
    }
    return matrix;
  });
  await check('Languages, medium picker and narrow list use the same size and Compact spacing', async () => {
    await page.setViewportSize({ width: 1100, height: 1000 }); await size(90);
    for (const lang of ['en','zh-CN','zh-TW']) { await page.locator('#language').selectOption(lang); assert(await page.locator('#text-size').inputValue() === '90', 'Language reset size'); }
    await close(); await page.locator('#thread-head [data-action=browse]').click();
    assert(near(await page.locator('#picker .thread-title').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize)), 16.2), 'Picker title not scaled');
    await page.locator('[data-close=picker]').click(); await page.setViewportSize({ width: 390, height: 900 }); await page.locator('#back').click();
    assert(await page.locator('.thread-row').first().evaluate(el => getComputedStyle(el).padding === '12px'), 'Narrow row spacing not compact');
    await page.screenshot({ path: path.join(evidence, 'A-narrow-90-list.png') });
    await page.locator('.thread-row').first().click(); return { locales: ['en','zh-CN','zh-TW'], picker: '16.2px titles', narrowRows: '12px padding' };
  });
  await check('User font baseline composes with the slider', async () => {
    await page.setViewportSize({ width: 1440, height: 1000 }); await size(150);
    await page.addStyleTag({ content: 'html { font-size: calc(125% * var(--text-scale)); }' });
    const observedSize = await page.locator('.post-content').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize));
    assert(near(observedSize, 33.75), `Combined baseline/slider size ${observedSize}`);
    await page.reload(); return { userStylesheetBaseline: '125%', slider: '150%', postText: observedSize, limitation: 'User stylesheet probe; not browser chrome zoom or an installed-manager check' };
  });
  await check('Final screenshots and error-free local operation', async () => {
    for (const [width, n] of [[1440,100],[1440,90],[1440,150],[390,90],[390,150]]) {
      await page.setViewportSize({ width, height: 1000 }); await size(n); await page.locator('#language').selectOption('en'); await close();
      await page.locator('#reader-scroll').evaluate(el => el.scrollTop = 0);
      if (width < 960) await page.locator('.post').first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(evidence, `A-${width}-${n}.png`) });
    }
    await settings(); await page.screenshot({ path: path.join(evidence, 'settings-150.png') });
    assert(!errors.length && !externalRequests.length, JSON.stringify({ errors, externalRequests })); return { errors, externalRequests };
  });
  await check('Shared comparison variants retain basic preference and reading behavior', async () => {
    const observed = [];
    for (const variant of ['B','C']) for (const width of [1440,390]) {
      const url = new URL(base); url.searchParams.set('variant', variant); await page.goto(url.href); await page.setViewportSize({ width, height: 1000 });
      await size(90); await close();
      const result = await page.evaluate(() => ({ variant: document.documentElement.dataset.variant, size: getComputedStyle(document.querySelector('.post-content')).fontSize, overflow: document.documentElement.scrollWidth > innerWidth + 1 }));
      assert(result.variant === variant && near(parseFloat(result.size),16.2) && !result.overflow, JSON.stringify(result)); observed.push({ width, ...result });
    }
    return observed;
  });
}
const hashes = {};
for (const name of ['im-workspace.prototype.html','prototype.css','prototype.js']) hashes[name] = createHash('sha256').update(await readFile(path.join(root,name))).digest('hex');
const report = { date: new Date().toISOString(), browser: await browser.version(), sourceHashes: hashes, cases, pass: cases.every(c => c.pass), errors, externalRequests };
await writeFile(path.join(evidence,'report.json'), JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({ output, pass: report.pass, cases: cases.map(({name,pass,error})=>({name,pass,error})) },null,2));
await browser.close();
process.exitCode = report.pass ? 0 : 1;
