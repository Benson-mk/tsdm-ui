import { mkdtempSync, writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
function fileIdentity(path) {
  const bytes = readFileSync(path);
  return {
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}
const root = process.cwd();
const npm = process.env.npm_execpath;
if (!npm)
  throw new Error("Run npm run test:consumer using the pinned runtime.");
try {
  const consumer = mkdtempSync(join(tmpdir(), "tsdm-public-consumer-"));
  const run = (args, cwd) =>
    execFileSync(process.execPath, [npm, ...args], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  const packed = JSON.parse(
    run(
      ["pack", "./dist/forum-client", "--pack-destination", consumer, "--json"],
      root,
    ),
  )[0];
  const tarball = join(consumer, packed.filename);
  writeFileSync(
    join(consumer, "package.json"),
    JSON.stringify({
      name: "clean-forum-consumer",
      version: "1.0.0",
      private: true,
      type: "module",
    }),
  );
  run(
    ["install", tarball, "--ignore-scripts", "--no-audit", "--no-fund"],
    consumer,
  );
  const source = `import assert from 'node:assert/strict';
import { createForumClient, FORUM_CLIENT_VERSION } from '@tsdm/forum-client';
assert.equal(FORUM_CLIENT_VERSION, '0.3.0');
const origin = 'https://fixture.example';
const threadURL = origin + '/forum.php?mod=viewthread&tid=42';
const attachmentURL = origin + '/forum.php?mod=attachment&aid=authored-token';
const searchURL = origin + '/search.php?mod=forum&searchid=581';
const thread = '<div id="postlist"><h1 id="thread_subject">External reader</h1><div id="post_101"><div class="authi">Author</div><div class="pcb"><p>Portable populated content</p><ignore_js_op><span id="attach_51"><a href="' + attachmentURL + '">portable.bin</a></span><div id="attach_51_menu">4 Bytes</div></ignore_js_op></div></div></div>';
const form = '<form method="post" action="search.php?mod=forum"><input type="hidden" name="formhash" value="current-token"><input type="hidden" name="searchsubmit" value="yes"><input name="srchtxt" type="text"><input name="srchuname" type="text"></form>';
const results = '<div class="sttl"><h2>One authored result</h2><a href="search.php?mod=forum&adv=yes&searchid=581">Advanced search</a></div><div id="threadlist" class="slst"><ul><li class="pbw"><h3><a href="forum.php?mod=viewthread&tid=42">External result</a></h3><p class="xg1">1 reply · 4 views</p><p>Authored snippet</p><p><span>2026-10-19</span><span><a href="home.php?mod=space&uid=9">Authored reader</a></span><span><a href="forum.php?mod=forumdisplay&fid=5">Listening</a></span></p></li></ul></div><div class="pg"><strong>1</strong><a href="' + searchURL + '&page=2">2</a></div>';
const requests = [];
const fileRequests = [];
const client = createForumClient({ origin, transport: {
  async request(url, options) {
    requests.push({ url, options });
    const isSearch = new URL(url).pathname === '/search.php';
    const document = isSearch ? options?.method === 'POST' || new URL(url).searchParams.has('searchid') ? results : form : thread;
    return { status: 200, url, contentType: 'application/json', body: JSON.stringify({ uid: 7, document }) };
  },
  async requestFile(url) {
    fileRequests.push(url);
    return { status: 200, url, contentType: 'application/octet-stream', contentLength: '4', contentEncoding: '', disposition: 'attachment; filename="portable.bin"', redirected: false, bytes: new Uint8Array([1, 2, 3, 4]) };
  }
} });
const read = await client.readThread(threadURL);
assert.equal(read.kind, 'thread');
assert.equal(read.thread.id, '42');
assert.equal(read.thread.posts[0].id, '101');
assert.equal(read.thread.posts[0].attachments[0].id, '51');
assert.equal(read.account.kind, 'member');
assert.deepEqual(JSON.parse(JSON.stringify(read)), read);
const overview = await client.readPage(origin + '/search.php?mod=forum&adv=yes');
assert.equal(overview.kind, 'search');
assert.equal(overview.search.results, null);
const searched = await client.search({ ...overview.search.edited, srchtxt: ['autumn'] }, overview.search.form, overview.account);
assert.equal(searched.kind, 'search');
assert.equal(searched.search.results.id, '581');
assert.equal(searched.search.results.rows[0].label, 'External result');
assert.deepEqual(JSON.parse(JSON.stringify(searched)), searched);
assert.equal(JSON.stringify(searched).includes('current-token'), false);
const second = await client.readSearchPage(searched.search.results.pages.links[0].url, searched.search, searched.account);
assert.equal(second.kind, 'search');
assert.equal(second.search.results.id, '581');
const download = await client.downloadAttachment({ threadURL, postId: '101', attachmentId: '51', account: read.account });
assert.equal(download.kind, 'file');
assert.equal(download.name, 'portable.bin');
assert.deepEqual([...download.bytes], [1, 2, 3, 4]);
assert.deepEqual(fileRequests, [attachmentURL]);
assert.equal(requests.filter((r) => r.options?.method === 'POST').length, 1);
assert.deepEqual(requests.at(-1).options, { fresh: true });
assert.equal(typeof globalThis.document, 'undefined');
assert.equal(typeof globalThis.GM, 'undefined');
console.log(JSON.stringify({ status: 'passed', version: FORUM_CLIENT_VERSION, threadId: read.thread.id, searchId: searched.search.results.id, resultTitle: searched.search.results.rows[0].label, downloadName: download.name, downloadBytes: [...download.bytes], requests, fileRequests }));
`;
  writeFileSync(join(consumer, "consume.mjs"), source);
  writeFileSync(
    join(consumer, "consume.ts"),
    `import { createForumClient, type ForumClient, type ReadResult, type SearchForm, type SearchCriteria, type AttachmentRequest, type Account } from '@tsdm/forum-client';
const client: ForumClient = createForumClient({ origin: 'https://fixture.example', transport: { async request(url) { return { status: 200, url, contentType: 'text/html', body: '' }; } } });
const result: ReadResult = await client.readThread('https://fixture.example/forum.php?mod=viewthread&tid=42');
const serialized: string = JSON.stringify(result);
void serialized;
const search: (criteria: SearchCriteria, form: SearchForm, account: Account) => Promise<ReadResult> = client.search;
const returnedPage: (url: string, prior: Extract<ReadResult, { kind: 'search' }>['search'], account: Account) => Promise<ReadResult> = client.readSearchPage;
const attachment = (request: AttachmentRequest) => client.downloadAttachment(request);
void [search, returnedPage, attachment];
`,
  );
  writeFileSync(
    join(consumer, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        noEmit: true,
        target: "ES2023",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        lib: ["ES2023"],
        types: [],
        skipLibCheck: false,
      },
      include: ["consume.ts"],
    }),
  );
  const observed = JSON.parse(
    execFileSync(process.execPath, ["consume.mjs"], {
      cwd: consumer,
      encoding: "utf8",
    }),
  );
  execFileSync(
    process.execPath,
    [resolve(root, "node_modules/typescript/bin/tsc"), "-p", "tsconfig.json"],
    { cwd: consumer, encoding: "utf8" },
  );
  const installed = JSON.parse(
    readFileSync(
      join(consumer, "node_modules/@tsdm/forum-client/package.json"),
      "utf8",
    ),
  );
  if (
    Object.keys(installed.dependencies ?? {}).length ||
    Object.keys(installed.peerDependencies ?? {}).length
  )
    throw new Error(
      "Public artifact unexpectedly requires runtime dependencies.",
    );
  const stamp = new Date().toISOString();
  const directory = `evidence/runs/consumer-${stamp.replaceAll(":", "-")}`;
  mkdirSync(directory, { recursive: true });
  writeFileSync(`${directory}/consume.mjs`, source);
  const receipt = {
    schema: 1,
    runId: stamp,
    timezone: "Asia/Hong_Kong",
    mode: "clean-public-node-consumer",
    status: "passed",
    runtime: {
      node: process.version,
      npm: run(["--version"], consumer).trim(),
    },
    packageSha256: createHash("sha256")
      .update(readFileSync(tarball))
      .digest("hex"),
    checks: {
      install: "passed",
      import: "passed",
      declarationsWithoutDOM: "passed",
      serializablePopulatedResult: "passed",
      searchAndReturnedPageContract: "passed",
      freshAttachmentAndBinaryContract: "passed",
      noRuntimeDependencies: "passed",
    },
    observed,
    limitations: [
      "This consumer qualifies public imports, declarations and read/search/download contracts without browser globals; browser behavior is qualified by complete application E2Es.",
      "Synthetic transport is not live forum evidence.",
    ],
  };
  writeFileSync(
    `${directory}/receipt.json`,
    JSON.stringify(receipt, null, 2) + "\n",
  );
  writeFileSync(
    `${directory}/report.md`,
    "# Clean public consumer\n\nPassed clean local package installation, public ESM import, strict declarations without DOM types, populated read, explicit search, returned-identity page, freshly checked attachment and exact binary bytes, plus JSON serialization on pinned Node LTS. No runtime package dependencies. See receipt.json and consume.mjs.\n",
  );
  const manifest = Object.fromEntries(
    ["consume.mjs", "receipt.json", "report.md"].map((file) => [
      file,
      fileIdentity(`${directory}/${file}`),
    ]),
  );
  writeFileSync(
    `${directory}/manifest.json`,
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log(
    `Clean external consumer passed. Authored evidence: ${directory}`,
  );
} catch (error) {
  const stamp = new Date().toISOString();
  const directory = `evidence/runs/consumer-${stamp.replaceAll(":", "-")}`;
  mkdirSync(directory, { recursive: true });
  const receipt = {
    schema: 1,
    runId: stamp,
    timezone: "Asia/Hong_Kong",
    mode: "clean-public-node-consumer",
    status: "failed",
    runtime: { node: process.version },
    failure:
      "External install/import/declaration/serialization qualification failed. See private terminal diagnostics; no unreviewed capture is published.",
  };
  writeFileSync(
    `${directory}/receipt.json`,
    JSON.stringify(receipt, null, 2) + "\n",
  );
  writeFileSync(
    `${directory}/report.md`,
    "# Clean public consumer failed\n\nAt least one required check failed; the library is not qualified by this run. Terminal diagnostics remain private.\n",
  );
  writeFileSync(
    `${directory}/manifest.json`,
    JSON.stringify(
      Object.fromEntries(
        ["receipt.json", "report.md"].map((file) => [
          file,
          fileIdentity(`${directory}/${file}`),
        ]),
      ),
      null,
      2,
    ) + "\n",
  );
  console.error(error);
  process.exitCode = 1;
}
