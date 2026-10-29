import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  mkdirSync,
  copyFileSync,
  readdirSync,
} from "node:fs";
import assert from "node:assert/strict";
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
try {
  if (!npm)
    throw new Error("Run npm run test:consumer using the pinned runtime.");
  const metadata = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(
    process.version,
    "v" + metadata.engines.node,
    "Use the selected Node LTS runtime",
  );
  const inputFiles = [
    "package.json",
    "package-lock.json",
    "vite.library.config.ts",
    "tsconfig.library.json",
    "tsconfig.json",
    "scripts/package-library.mjs",
    "scripts/check-consumer.mjs",
    "scripts/replay-consumer.mjs",
    ...readdirSync("tests/consumer")
      .filter((name) => name.endsWith(".mjs") || name.endsWith(".txt"))
      .sort()
      .map((name) => "tests/consumer/" + name),
    ...readdirSync("src/forum-client")
      .filter((name) => name.endsWith(".ts"))
      .map((name) => "src/forum-client/" + name),
  ];
  const inputs = Object.fromEntries(
    inputFiles.map((file) => [file, fileIdentity(file)]),
  );
  const artifactFiles = readdirSync("dist/forum-client").filter(
    (file) => !file.endsWith(".map"),
  );
  const artifact = Object.fromEntries(
    artifactFiles.map((file) => [
      file,
      fileIdentity("dist/forum-client/" + file),
    ]),
  );
  const consumer = mkdtempSync(join(tmpdir(), "tsdm-public-consumer-"));
  const run = (args, cwd) =>
    execFileSync(process.execPath, [npm, ...args], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  assert.equal(
    run(["--version"], consumer).trim(),
    metadata.engines.npm,
    "Use the selected npm runtime",
  );
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
      devDependencies: { typescript: metadata.devDependencies.typescript },
    }),
  );
  run(
    [
      "install",
      "./" + packed.filename,
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--offline",
    ],
    consumer,
  );
  const source =
    `import assert from 'node:assert/strict';
import { createForumClient, FORUM_CLIENT_VERSION, unresolvedWritingAttachments } from '@tsdm/forum-client';
assert.equal(FORUM_CLIENT_VERSION, '0.13.0');
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
const preparationRequests=[];
const writer=createForumClient({origin:'https://fixture.example',transport:{async request(url){
 preparationRequests.push(url);
 return {status:200,url,contentType:'text/html',body:'<div id="um"><strong><a href="home.php?mod=space&uid=7">Writer Seven</a></strong></div><form id="postform" method="post" action="forum.php?mod=post&action=newthread&fid=5&topicsubmit=yes"><input name="formhash" value="NEVER-EXPORT"><input name="subject" value="Portable writing"><textarea name="message">[unknown]complete source[/unknown]</textarea><label><input type="checkbox" name="usesig" checked value="1">Signature</label></form>'};
}}});
const prepared=await writer.prepareNewThread('5');
assert.equal(prepared.kind,'prepared');
assert.equal(prepared.prepared.board.id,'5');
assert.equal(prepared.prepared.account.id,'7');
assert.equal(prepared.prepared.source,'[unknown]complete source[/unknown]');
assert.equal(prepared.prepared.options[0].checked,true);
assert.deepEqual(JSON.parse(JSON.stringify(prepared)),prepared);
assert.equal(JSON.stringify(prepared).includes('NEVER-EXPORT'),false);
assert.equal(preparationRequests.length,1);
const referenceSource = '[unknown]literal[/unknown][attach]51[/attach][ATTACHIMG] 52 [/ATTACHIMG][attach]51[/attach][attach]0[/attach][attach]external[/attach]';
const referenceWriting = { ...prepared.prepared, source: referenceSource, uploadedReferences: ['52'] };
const beforeReferences = JSON.stringify(referenceWriting);
assert.deepEqual(unresolvedWritingAttachments(referenceWriting), ['51']);
assert.equal(JSON.stringify(referenceWriting), beforeReferences);
assert.deepEqual(unresolvedWritingAttachments({ ...referenceWriting, uploadedReferences: [] }), ['51', '52']);
assert.deepEqual(unresolvedWritingAttachments({ source: '[unknown]literal[/unknown]', uploadedReferences: [] }), []);

const noticeURL = origin + '/home.php?mod=space&do=notice';
const nativeNextNoticePage = noticeURL + '&view=all&type=&isread=1&page=2';
const noticeRequests = [];
let noticeActor = 7;
let noticeNetworkFailure = false;
const noticeClient = createForumClient({ origin, transport: { async request(url, options) {
  noticeRequests.push({ url, options });
  if (noticeNetworkFailure) throw Error('Authored network failure');
  const selected = new URL(url);
  const page = selected.searchParams.get('page') ?? '1';
  const category = selected.searchParams.get('view') === 'system' ? '&view=system' : '';
  const next = category ? noticeURL + category + '&page=2' : nativeNextNoticePage;
  const document = '<div id="um"><strong><a href="home.php?mod=space&uid=' + noticeActor + '">Authored member</a></strong><a id="myprompt">提醒(0)</a></div><div id="ct"><div class="tbn"><a href="' + noticeURL + '">All notices</a><a href="' + noticeURL + '&view=system">System notices</a></div><div class="nts"><dl notice="73" id="pendingFriend_19"><dt><span title="2026-10-20 21:40:00">just now</span></dt><dd class="ntc_body"><p>Complete portable notice body.</p><a href="forum.php?mod=redirect&goto=findpost&ptid=42&pid=202">Exact portable target</a><a href="home.php?mod=spacecp&ac=friend&formhash=NEVER-EXPORT-NOTICE">Native action</a></dd></dl></div><div class="pg"><strong>' + page + '</strong><a href="' + next + '">2</a></div></div>';
  return { status: 200, url, contentType: 'application/json', body: JSON.stringify({ uid: noticeActor, document }) };
} } });
assert.equal((await noticeClient.readPage(noticeURL)).kind, 'invalid');
assert.equal(noticeRequests.length, 0);
const loadedNotices = await noticeClient.readNotices(noticeURL);
assert.equal(loadedNotices.kind, 'notices');
assert.equal(loadedNotices.notices.entries[0].id, '73');
assert.equal(loadedNotices.notices.entries[0].time, '2026-10-20 21:40:00');
assert.deepEqual(loadedNotices.notices.unread, { kind: 'observed', count: 0 });
assert.deepEqual(loadedNotices.notices.entries[0].body[0].children, [{ kind: 'text', text: 'Complete portable notice body.' }]);
assert.equal(loadedNotices.notices.entries[0].body[1].attributes.href, origin + '/forum.php?mod=redirect&goto=findpost&ptid=42&pid=202');
assert.deepEqual(JSON.parse(JSON.stringify(loadedNotices)), loadedNotices);
assert.equal(JSON.stringify(loadedNotices).includes('NEVER-EXPORT-NOTICE'), false);
assert.equal((await noticeClient.readNotices(noticeURL + '&page=99', loadedNotices.notices, loadedNotices.account)).kind, 'invalid');
assert.equal(noticeRequests.length, 1);
assert.equal(loadedNotices.notices.pages.links[0].url, nativeNextNoticePage);
assert.equal((await noticeClient.readNotices(noticeURL + '&view=all&type=&isread=0&page=2', loadedNotices.notices, loadedNotices.account)).kind, 'invalid');
assert.equal(noticeRequests.length, 1);
const nextAllNotices = await noticeClient.readNotices(nativeNextNoticePage, loadedNotices.notices, loadedNotices.account);
assert.equal(nextAllNotices.kind, 'notices');
assert.equal(nextAllNotices.notices.pages.current, '2');
assert.equal(nextAllNotices.notices.url, nativeNextNoticePage);
assert.equal(noticeRequests[1].url, nativeNextNoticePage + '&tsdmapp=json');
const systemNotices = await noticeClient.readNotices(loadedNotices.notices.categories[1].url, loadedNotices.notices, loadedNotices.account);
assert.equal(systemNotices.kind, 'notices');
const nextNotices = await noticeClient.readNotices(systemNotices.notices.pages.links[0].url, systemNotices.notices, systemNotices.account);
assert.equal(nextNotices.kind, 'notices');
assert.equal(nextNotices.notices.pages.current, '2');
assert.equal(nextNotices.notices.url, noticeURL + '&view=system&page=2');
assert.equal(noticeRequests.length, 4);
assert.equal(noticeRequests.every((request) => request.options.fresh === true && new URL(request.url).searchParams.get('tsdmapp') === 'json'), true);
noticeActor = 8;
const changedNotices = await noticeClient.readNotices(nextNotices.notices.url, nextNotices.notices, nextNotices.account);
assert.equal(changedNotices.kind, 'invalid');
assert.equal(changedNotices.account.id, '8');
assert.ok(changedNotices.generation > nextNotices.generation);
noticeNetworkFailure = true;
const failedNotices = await noticeClient.readNotices(noticeURL);
assert.equal(failedNotices.kind, 'network');
assert.match(failedNotices.message, /may still have marked notices read/);
assert.equal(noticeRequests.length, 6);

` +
    readFileSync(resolve(root, "tests/consumer/package-boundary.mjs"), "utf8") +
    readFileSync(resolve(root, "tests/consumer/publication.mjs"), "utf8") +
    "\n" +
    readFileSync(resolve(root, "tests/consumer/replies.mjs"), "utf8") +
    "\n" +
    readFileSync(resolve(root, "tests/consumer/editing.mjs"), "utf8") +
    "\n" +
    readFileSync(resolve(root, "tests/consumer/drafts.mjs"), "utf8") +
    "\n" +
    readFileSync(resolve(root, "tests/consumer/favorites.mjs"), "utf8") +
    "\n" +
    readFileSync(resolve(root, "tests/consumer/packets.mjs"), "utf8") +
    `
console.log(JSON.stringify({ status: 'passed', version: FORUM_CLIENT_VERSION, threadId: read.thread.id, searchId: searched.search.results.id, resultTitle: searched.search.results.rows[0].label, downloadName: download.name, downloadBytes: [...download.bytes], requests, fileRequests, preparedBoard: prepared.prepared.board.id, preparationRequests, noticeRequests, noticeId: loadedNotices.notices.entries[0].id, noticePage: nextNotices.notices.pages.current, publicationCases, replyCases, editingCases, draftCases, favoriteCases, packetCases, boundaryCases }));
`;
  writeFileSync(join(consumer, "consume.mjs"), source);
  writeFileSync(
    join(consumer, "consume.ts"),
    `import { createForumClient, editBaseline, unresolvedWritingAttachments, type ForumClient, type ReadResult, type SearchForm, type SearchCriteria, type AttachmentRequest, type PrepareWritingResult, type Account, type Notice, type Notices, type ThreadSubmission, type ThreadAttempt, type PublicationPreparationResult, type ThreadVerification, type PreparedWriting, type WritingBaseline, type DraftList, type DraftListResult, type DraftRow, type DraftAttempt, type UploadFile, type UploadCancellation, type UploadResult, type AttachmentRemovalResult } from '@tsdm/forum-client';
const client: ForumClient = createForumClient({ origin: 'https://fixture.example', transport: { async request(url) { return { status: 200, url, contentType: 'text/html', body: '' }; } } });
const result: ReadResult = await client.readThread('https://fixture.example/forum.php?mod=viewthread&tid=42');
const serialized: string = JSON.stringify(result);
const prepared: PrepareWritingResult = await client.prepareNewThread("5");
const references: string[] = unresolvedWritingAttachments({ source: "[attach]51[/attach]", uploadedReferences: [] });
void [prepared, references];
void serialized;
const search: (criteria: SearchCriteria, form: SearchForm, account: Account) => Promise<ReadResult> = client.search;
const returnedPage: (url: string, prior: Extract<ReadResult, { kind: 'search' }>['search'], account: Account) => Promise<ReadResult> = client.readSearchPage;
const attachment = (request: AttachmentRequest) => client.downloadAttachment(request);
const notices: (url: string, prior?: Notices, account?: Account) => Promise<ReadResult> = client.readNotices;
const notice: Notice = { id: '73', time: '2026-10-20 21:40:00', body: [{ kind: 'text', text: 'Portable notice' }] };
const publication: (submission: ThreadSubmission) => Promise<PublicationPreparationResult> = client.prepareThreadPublication;
const publish: (attempt: ThreadAttempt) => Promise<ThreadAttempt> = client.publishThread;
const check: (attempt: ThreadAttempt, url?: string) => Promise<ThreadAttempt> = client.checkThreadResult;
const prepareEdit: (threadURL: string, postId: string) => Promise<PrepareWritingResult> = client.preparePostEdit;
const reviewEdit: (submission: ThreadSubmission) => Promise<PublicationPreparationResult> = client.prepareEditPublication;
const saveEdit: (attempt: ThreadAttempt) => Promise<ThreadAttempt> = client.savePostEdit;
const checkEdit: (attempt: ThreadAttempt) => Promise<ThreadAttempt> = client.checkEditResult;
const actions: Record<PreparedWriting["action"], string> = { "new-thread": "create", reply: "reply", "quick-quote": "quote", "edit-post": "edit" };
const baseline: (writing: PreparedWriting) => WritingBaseline = editBaseline;
void [search, returnedPage, attachment, notices, notice, publication, publish, check, prepareEdit, reviewEdit, saveEdit, checkEdit, actions, baseline];
const verification: ThreadVerification = { stored: 'verified', normalizations: [{ name: 'price', submitted: '', stored: '0' }], creationEffects: [{ name: 'addfeed', requested: true, included: false, outcome: 'unknown' }] };
const evidence = (attempt: ThreadAttempt): ThreadVerification | undefined => attempt.result?.verification;
const attachmentVerification: ThreadVerification = { stored: 'verified', normalizations: [], attachmentNormalizations: [{ name: 'attachnew[88][price]', submitted: '', stored: '0' }], creationEffects: [] };
void [verification, attachmentVerification, evidence];
const drafts: Promise<DraftListResult> = client.readDrafts();
const resume = (row: DraftRow, account: Account) => client.resumeDraft(row, account);
const prepareSave = (attempt: DraftAttempt): Promise<DraftAttempt> => client.prepareDraftSave(attempt);
const draftRows = (list: DraftList) => list.rows;
void [drafts, resume, prepareSave, draftRows];
const cancellation: UploadCancellation = { aborted: false, addEventListener() {}, removeEventListener() {} };
const transfer: (writing: PreparedWriting, file: UploadFile, progress: (loaded: number) => void, signal: UploadCancellation) => Promise<UploadResult> = client.uploadAttachment;
const removal: (writing: PreparedWriting, id: string, checkOnly?: boolean) => Promise<AttachmentRemovalResult> = client.removeUploadedAttachment;
void [cancellation, transfer, removal];
` + readFileSync(resolve(root, "tests/consumer/current-types.txt"), "utf8"),
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
    ["node_modules/typescript/bin/tsc", "-p", "tsconfig.json"],
    { cwd: consumer, encoding: "utf8" },
  );
  const installed = JSON.parse(
    readFileSync(
      join(consumer, "node_modules/@tsdm/forum-client/package.json"),
      "utf8",
    ),
  );
  if (installed.version !== "0.13.0")
    throw new Error(
      "Expected the attachment-normalization public package contract version 0.13.0.",
    );
  if (
    Object.keys(installed.dependencies ?? {}).length ||
    Object.keys(installed.peerDependencies ?? {}).length ||
    Object.keys(installed.optionalDependencies ?? {}).length
  )
    throw new Error(
      "Public artifact unexpectedly requires runtime dependencies.",
    );
  const typescript = JSON.parse(
    readFileSync(
      join(consumer, "node_modules/typescript/package.json"),
      "utf8",
    ),
  ).version;
  assert.equal(typescript, metadata.devDependencies.typescript);
  assert.equal(installed.version, observed.version);
  assert.deepEqual(installed.exports, {
    ".": { types: "./index.d.ts", import: "./index.js" },
  });
  for (const file of packed.files) {
    const expected = fileIdentity(join(root, "dist/forum-client", file.path));
    assert.deepEqual(
      fileIdentity(
        join(consumer, "node_modules/@tsdm/forum-client", file.path),
      ),
      expected,
      "Installed artifact bytes: " + file.path,
    );
  }
  assert.deepEqual(
    Object.fromEntries(inputFiles.map((file) => [file, fileIdentity(file)])),
    inputs,
    "Consumer inputs changed during qualification",
  );
  assert.deepEqual(
    Object.fromEntries(
      artifactFiles.map((file) => [
        file,
        fileIdentity("dist/forum-client/" + file),
      ]),
    ),
    artifact,
    "Built artifact changed during qualification",
  );
  const stamp = new Date().toISOString();
  const directory = `evidence/runs/consumer-${stamp.replaceAll(":", "-")}`;
  mkdirSync(directory, { recursive: true });
  const replayFiles = [
    "consume.mjs",
    "consume.ts",
    "tsconfig.json",
    "package.json",
    "package-lock.json",
    packed.filename,
  ];
  for (const file of replayFiles)
    copyFileSync(join(consumer, file), join(directory, file));
  copyFileSync(
    "scripts/replay-consumer.mjs",
    join(directory, "replay-consumer.mjs"),
  );
  writeFileSync(
    join(directory, "inputs.json"),
    JSON.stringify(inputs, null, 2) + "\n",
  );
  const receipt = {
    schema: 1,
    runId: stamp,
    timezone: "Asia/Hong_Kong",
    mode: "clean-public-node-consumer",
    status: "passed",
    runtime: {
      node: process.version,
      npm: run(["--version"], consumer).trim(),
      typescript,
      platform: process.platform,
      arch: process.arch,
    },
    package: {
      name: installed.name,
      version: installed.version,
      file: packed.filename,
      ...fileIdentity(tarball),
    },
    artifact: Object.fromEntries(
      packed.files.map((file) => [
        file.path,
        fileIdentity(
          join(consumer, "node_modules/@tsdm/forum-client", file.path),
        ),
      ]),
    ),
    caseInputs: {
      consumer: fileIdentity(join(consumer, "consume.mjs")),
      declarations: fileIdentity(join(consumer, "consume.ts")),
    },
    commands: [
      "npm run build",
      "npm run test:consumer",
      "npm exec -- node replay-consumer.mjs .",
    ],
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
      portablePreparedWriting: "passed",
      portableWritingReferences: "passed",
      deliberateCompleteNotices: "passed",
      completePublicationBindingAndRecovery: "passed",
      ordinaryDraftPublicFlow: "passed",
      replyFullSourceAndMergedReadOnlyRecovery: "passed",
      ownedEditSourceConflictAndIndependentReferenceReadback: "passed",
      fundedAndDirectPacketConsentAndIndependentOutcomes: "passed",
      favoriteOneUseAndUncertainAuthorization: "passed",
      noRuntimeDependencies: "passed",
      privateSubpathsRejected: "passed",
      isolatedCompiler: "passed",
      exactInstalledArtifact: "passed",
      inputsUnchangedDuringRun: "passed",
    },
    observed,
    limitations: [
      "This run qualifies the recorded artifact and existing public read/prepare/write/check-result contracts. Later integrated APIs require a final-candidate rerun; browser behavior is qualified separately.",
      "Synthetic transport is not live forum evidence.",
    ],
  };
  writeFileSync(
    `${directory}/receipt.json`,
    JSON.stringify(receipt, null, 2) + "\n",
  );
  writeFileSync(
    `${directory}/report.md`,
    `# Clean public consumer

Passed installation of the exact retained ${installed.name}@${installed.version} tarball, public ESM imports, rejected private subpaths, and strict declarations with no DOM types using an isolated TypeScript ${typescript} compiler. Existing populated read/search/notices/download/preparation, ${observed.replyCases.length} reply, ${observed.editingCases.length} owned edit, ${observed.draftCases.length} draft, ${observed.favoriteCases.length} favorite, ${observed.packetCases.length} direct/funded packet and ${observed.publicationCases.length} publication cases passed, including account changes, duplicate pending sends, lost responses, later revisions and raw source. No runtime or peer dependencies; no browser globals supplied.

This is synthetic transport evidence for these artifact bytes. This run qualifies the current fully evolved API artifact. Later frozen-release artifacts and installed/live qualification still require their own checks.

## Replay independently

Copy this entire run directory outside the UI checkout. Use Node ${process.version} and npm ${metadata.engines.npm}, then run:

\`\`\`sh
npm exec -- node replay-consumer.mjs .
\`\`\`

The replay validates retained input hashes, installs from the exact local tarball and locked compiler into a new temporary directory, typechecks and reruns the public consumer. npm needs the locked TypeScript package available in its cache or configured registry. The original run installed from the existing cache with scripts disabled. The command writes a distinct sibling replay directory containing its receipt, report and manifest, including when verification fails.

See receipt.json for runtime, package, case and installed-file identities; inputs.json for qualification source identities; manifest.json covers every retained file. This run checks inputs stayed stable during qualification, not that a separate earlier build used those exact source bytes.
`,
  );
  const manifest = Object.fromEntries(
    [
      ...replayFiles,
      "replay-consumer.mjs",
      "inputs.json",
      "receipt.json",
      "report.md",
    ].map((file) => [file, fileIdentity(`${directory}/${file}`)]),
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
