import assert from "node:assert/strict";
import { spawnSync, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

// Complete CLI scenarios, written before implementation; see the failure inventory.
const [build, destination] = process.argv.slice(2).map((p) => resolve(p));
assert(
  build && destination,
  "Usage: node scripts/check-tag-release.mjs BUILD NEW_OUTPUT",
);
assert(!existsSync(destination), "Preserve earlier verification evidence");
mkdirSync(destination, { recursive: true });
const root = join(destination, "fixture");
mkdirSync(root);
mkdirSync(join(root, "docs/releases/notes"), { recursive: true });
const summaryPath = join(root, "docs/releases/notes/v0.1.1.md");
const summary =
  "## 0.1.1: a deliberately chosen patch\n\n- Keeps all 100 corrections in one owner-selected version.\n";
writeFileSync(summaryPath, summary);
mkdirSync(join(root, ".github"));
writeFileSync(
  join(root, ".github/release.yml"),
  JSON.stringify({
    changelog: {
      exclude: { labels: ["ignore-for-release"] },
      categories: [
        { title: "New features", labels: ["enhancement"] },
        { title: "Fixes", labels: ["bug"] },
        { title: "Documentation", labels: ["documentation"] },
        { title: "Other changes", labels: ["*"] },
      ],
    },
  }),
);
const bin = join(root, "bin");
mkdirSync(bin);
const fakeGh = join(bin, "gh");
writeFileSync(
  fakeGh,
  `#!/usr/bin/env node
import fs from 'node:fs';
if (process.argv.slice(2).join(' ') !== 'api --paginate --slurp repos/Benson-mk/tsdm-ui/pulls?state=closed&per_page=100') process.exit(2);
process.stdout.write(fs.readFileSync(process.env.RELEASE_TEST_PRS, 'utf8'));
`,
);
chmodSync(fakeGh, 0o755);
const prsPath = join(root, "prs.json");
let hosted = false;
const git = (...args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
git("init", "--initial-branch=main");
git("config", "user.name", "Release fixture");
git("config", "user.email", "release-fixture@example.invalid");
writeFileSync(join(root, "README.md"), "Synthetic release fixture\n");
git("add", "README.md");
git("commit", "-m", "chore: baseline");
git("tag", "v0.1.0");
for (let i = 1; i <= 100; i++)
  git("commit", "--allow-empty", "-m", `fix: synthetic correction ${i}`);
git("tag", "-a", "v0.1.1", "-m", "Owner-selected version");
const head = git("rev-parse", "HEAD");
const cli = fileURLToPath(
  new URL("./prepare-tag-release.mjs", import.meta.url),
);
const cases = [];
function check(name, args, setup, verify, expected = 0) {
  const dist = join(root, "dist");
  rmSync(dist, { recursive: true, force: true });
  cpSync(build, dist, { recursive: true });
  const output = join(destination, name);
  setup?.(dist, output);
  const result = spawnSync(process.execPath, [cli, ...args, output], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      RELEASE_REPOSITORY: "Benson-mk/tsdm-ui",
      RELEASE_GITHUB_NOTES: hosted ? "true" : "false",
      RELEASE_TEST_PRS: prsPath,
      PATH: `${bin}:${process.env.PATH}`,
    },
  });
  let error = null;
  try {
    assert.equal(result.status, expected, result.stdout + result.stderr);
    if (expected === 0) verify?.(output);
  } catch (e) {
    error = String(e.message);
  }
  cases.push({
    name,
    status: error ? "failed" : "passed",
    expectedExit: expected,
    actualExit: result.status,
    error,
  });
}
const read = (path) => JSON.parse(readFileSync(path, "utf8"));
check("hundred-fixes-owner-version", ["v0.1.1"], null, (output) => {
  const receipt = read(join(output, "release.json"));
  assert.equal(receipt.version, "0.1.1");
  assert.equal(receipt.commit, head);
  assert.equal(receipt.previousTag, "v0.1.0");
  assert.equal(receipt.preview, false);
  assert.equal(receipt.installedQualification, "not-assessed");
  const notes = readFileSync(join(output, "RELEASE_NOTES.md"), "utf8");
  assert.equal((notes.match(/synthetic correction/g) ?? []).length, 100);
  assert(!notes.includes("chore: baseline"));
  assert.deepEqual(receipt.assets, ["tsdm-ui.user.js", "tsdm-ui.meta.js"]);
  const meta = readFileSync(join(output, "tsdm-ui.meta.js"), "utf8");
  assert.equal(
    meta.trimEnd(),
    readFileSync(join(output, "tsdm-ui.user.js"), "utf8").split(
      "// ==/UserScript==",
    )[0] + "// ==/UserScript==",
  );
  assert.equal(meta, readFileSync(join(build, "tsdm-ui.meta.js"), "utf8"));
  assert(notes.startsWith(summary.trim()));
  assert(notes.includes("## What's Changed"));
  assert(notes.includes("**Full Changelog**:"));
  assert(notes.includes("README.md#quick-start"));
  assert(!notes.includes("Read `INSTALL.md`"));
  const notices = readFileSync(join(output, "THIRD_PARTY_NOTICES.md"), "utf8");
  const script = readFileSync(join(output, "tsdm-ui.user.js"), "utf8");
  assert(
    !script.includes(
      notices
        .trimEnd()
        .split("\n")
        .map((line) => `// ${line}`)
        .join("\n"),
    ),
  );
  assert.match(script, /^\/\/\s+@name\s+TSDM UI\s*$/m);
  assert.equal(script, readFileSync(join(build, "tsdm-ui.user.js"), "utf8"));
  for (const line of readFileSync(join(output, "SHA256SUMS"), "utf8")
    .trim()
    .split("\n")) {
    const [hash, name] = line.split("  ");
    assert.equal(
      createHash("sha256")
        .update(readFileSync(join(output, name)))
        .digest("hex"),
      hash,
    );
  }
});
for (const [name, mutate] of [
  [
    "missing-metadata",
    (dist) => rmSync(join(dist, "tsdm-ui.meta.js"), { force: true }),
  ],
  [
    "stale-metadata",
    (dist) =>
      writeFileSync(
        join(dist, "tsdm-ui.meta.js"),
        readFileSync(join(dist, "tsdm-ui.meta.js"), "utf8").replace(
          "@version",
          "@old-version",
        ),
      ),
  ],
  [
    "executable-metadata",
    (dist) =>
      writeFileSync(
        join(dist, "tsdm-ui.meta.js"),
        readFileSync(join(dist, "tsdm-ui.meta.js"), "utf8") +
          "\nalert('unexpected');\n",
      ),
  ],
  [
    "metadata-manifest-mismatch",
    (dist) => {
      const path = join(dist, "build-manifest.json");
      const manifest = read(path);
      manifest.userscriptMetadata = {
        file: "tsdm-ui.meta.js",
        bytes: 0,
        sha256: "0".repeat(64),
      };
      writeFileSync(path, JSON.stringify(manifest));
    },
  ],
])
  check(name, ["v0.1.1"], mutate, null, 1);
check("missing-summary", ["v0.1.1"], () => rmSync(summaryPath), null, 1);
writeFileSync(summaryPath, " \n");
check("empty-summary", ["v0.1.1"], null, null, 1);
writeFileSync(summaryPath, summary);
const pr = (number, offset, labels, title, user = "fixture-author") => ({
  number,
  title,
  labels: labels.map((name) => ({ name })),
  merge_commit_sha: git("rev-parse", `HEAD~${offset}`),
  merged_at: `2026-01-${String(number).padStart(2, "0")}T00:00:00Z`,
  user: { login: user, type: "User" },
});
writeFileSync(
  prsPath,
  JSON.stringify([
    [
      pr(1, 0, ["enhancement", "bug"], "Feature entry"),
      pr(2, 1, ["bug"], "Fix entry"),
      pr(3, 2, ["documentation"], "Documentation entry"),
      pr(4, 3, [], "Unlabelled entry"),
      pr(
        5,
        4,
        ["bug", "ignore-for-release"],
        "Excluded entry",
        "excluded-author",
      ),
      pr(6, 100, ["enhancement"], "Earlier entry"),
    ],
  ]),
);
hosted = true;
check("categorized-hosted-notes", ["v0.1.1"], null, (output) => {
  const notes = readFileSync(join(output, "RELEASE_NOTES.md"), "utf8");
  assert(notes.startsWith(summary.trim()));
  assert.match(notes, /### New features\n\n\* Feature entry/);
  assert.match(notes, /### Fixes\n\n\* Fix entry/);
  assert.match(notes, /### Documentation\n\n\* Documentation entry/);
  assert.match(notes, /### Other changes\n\n\* Unlabelled entry/);
  assert.equal((notes.match(/Feature entry/g) ?? []).length, 1);
  assert(!notes.includes("Excluded entry"));
  assert(!notes.includes("excluded-author"));
  assert(!notes.includes("Earlier entry"));
  assert.equal((notes.match(/synthetic correction/g) ?? []).length, 95);
  assert(!notes.includes("synthetic correction 96"));
});
writeFileSync(prsPath, JSON.stringify([[pr(1, 0, [], "Unlabelled only")]]));
check("omit-empty-categories", ["v0.1.1"], null, (output) => {
  const notes = readFileSync(join(output, "RELEASE_NOTES.md"), "utf8");
  assert(!notes.includes("### New features"));
  assert(!notes.includes("### Fixes"));
  assert(!notes.includes("### Documentation"));
  assert(notes.includes("### Other changes"));
});
hosted = false;
check("wrong-built-version", ["v0.2.0", "--preview"], null, null, 1);
check("malformed-version", ["not-a-version", "--preview"], null, null, 1);
check(
  "changed-executable",
  ["v0.1.1"],
  (dist) => {
    writeFileSync(
      join(dist, "tsdm-ui.user.js"),
      readFileSync(join(dist, "tsdm-ui.user.js"), "utf8") + "\n// changed\n",
    );
  },
  null,
  1,
);
check(
  "missing-notices",
  ["v0.1.1"],
  (dist) => rmSync(join(dist, "THIRD_PARTY_NOTICES.md"), { force: true }),
  null,
  1,
);
check(
  "preserve-output",
  ["v0.1.1"],
  (_dist, output) => mkdirSync(output),
  null,
  1,
);
git("tag", "-d", "v0.1.1");
check("absent-tag-refused", ["v0.1.1"], null, null, 1);
check("explicit-preview", ["v0.1.1", "--preview"], null, (output) =>
  assert.equal(read(join(output, "release.json")).preview, true),
);
git("tag", "v0.1.1", "HEAD~1");
check("wrong-tag-commit", ["v0.1.1"], null, null, 1);
git("tag", "-d", "v0.1.1", "v0.1.0");
git("tag", "v0.1.1");
check("first-release", ["v0.1.1"], null, (output) => {
  assert.equal(read(join(output, "release.json")).previousTag, null);
  assert(
    readFileSync(join(output, "RELEASE_NOTES.md"), "utf8").includes(
      "chore: baseline",
    ),
  );
});
rmSync(root, { recursive: true });
const receipt = {
  schema: 1,
  status: cases.every((c) => c.status === "passed") ? "passed" : "failed",
  node: process.version,
  cases,
};
writeFileSync(
  join(destination, "receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
writeFileSync(
  join(destination, "report.md"),
  "# Tag release CLI verification\n\n" +
    cases.map((c) => `- ${c.name}: ${c.status}`).join("\n") +
    "\n",
);
console.log(JSON.stringify(receipt, null, 2));
process.exitCode = receipt.status === "passed" ? 0 : 1;
