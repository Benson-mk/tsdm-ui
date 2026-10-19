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
assert.equal(FORUM_CLIENT_VERSION, '0.2.0');
const requests = [];
const client = createForumClient({ origin: 'https://fixture.example', transport: { async request(url) {
  requests.push(url);
  return { status: 200, url, contentType: 'application/json', body: JSON.stringify({ uid: 0, thread: { tid: 42 }, document: '<div id="postlist"><h1 id="thread_subject">External reader</h1><div id="post_101"><div class="authi">Author</div><div class="pcb"><p>Portable populated content</p></div></div></div>' }) };
} } });
const result = await client.readThread('https://fixture.example/forum.php?mod=viewthread&tid=42');
assert.equal(result.kind, 'thread');
assert.equal(result.thread.id, '42');
assert.equal(result.thread.posts[0].id, '101');
assert.equal(result.account.kind, 'guest');
assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
assert.equal(requests.length, 1);
assert.match(requests[0], /tsdmapp=json/);
assert.equal(typeof globalThis.document, 'undefined');
assert.equal(typeof globalThis.GM, 'undefined');
console.log(JSON.stringify({ status: 'passed', title: result.thread.title, threadId: result.thread.id, postId: result.thread.posts[0].id, account: result.account.kind, requests: requests.length }));
`;
  writeFileSync(join(consumer, "consume.mjs"), source);
  writeFileSync(
    join(consumer, "consume.ts"),
    `import { createForumClient, type ForumClient, type ReadResult } from '@tsdm/forum-client';
const client: ForumClient = createForumClient({ origin: 'https://fixture.example', transport: { async request(url) { return { status: 200, url, contentType: 'text/html', body: '' }; } } });
const result: ReadResult = await client.readThread('https://fixture.example/forum.php?mod=viewthread&tid=42');
const serialized: string = JSON.stringify(result);
void serialized;
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
      noRuntimeDependencies: "passed",
    },
    observed,
    limitations: [
      "Read-only initial contract; later workflows belong to their tickets.",
      "Synthetic transport is not live forum evidence.",
    ],
  };
  writeFileSync(
    `${directory}/receipt.json`,
    JSON.stringify(receipt, null, 2) + "\n",
  );
  writeFileSync(
    `${directory}/report.md`,
    "# Clean public consumer\n\nPassed clean local package installation, public ESM import, strict declarations without DOM types, populated read, exact identity and JSON serialization on pinned Node LTS. No runtime package dependencies. See receipt.json and consume.mjs.\n",
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
