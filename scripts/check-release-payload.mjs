import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync, gunzipSync } from "node:zlib";

// Complete CLI checks at the confirmed release-packaging boundary. The failure
// inventory is recorded in docs/implementation/40-release-plan.md before code.
const [input, output] = process.argv.slice(2).map((p) => resolve(p));
assert(
  input && output,
  "Usage: node scripts/check-release-payload.mjs PAYLOAD NEW_OUTPUT",
);
assert(!existsSync(output), "Preserve previous execution evidence");
mkdirSync(output, { recursive: true });
const verifier = join(
  dirname(fileURLToPath(import.meta.url)),
  "verify-release-payload.mjs",
);
const cases = [];
const read = (root, name) => JSON.parse(readFileSync(join(root, name), "utf8"));
const write = (root, name, data) =>
  writeFileSync(join(root, name), JSON.stringify(data, null, 2) + "\n");
function identity(path) {
  const bytes = readFileSync(path);
  return {
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}
function rehash(root, file) {
  const manifest = read(root, "manifest.json");
  manifest[file] = identity(join(root, file));
  write(root, "manifest.json", manifest);
}
function check(name, mutate, expected, diagnostic, flags = []) {
  const root = join(output, name);
  cpSync(input, root, { recursive: true });
  mutate?.(root);
  const result = spawnSync(process.execPath, [verifier, root, ...flags], {
    encoding: "utf8",
  });
  let error = null;
  try {
    assert.equal(result.status, expected, result.stdout + result.stderr);
    if (diagnostic) assert.match(result.stdout + result.stderr, diagnostic);
  } catch (e) {
    error = String(e.message)
      .replaceAll(root, "[payload]")
      .replaceAll(verifier, "[verifier]");
  }
  cases.push({
    name,
    status: error ? "failed" : "passed",
    expectedExit: expected,
    actualExit: result.status,
    error,
  });
  // Only disposable copies created by this check are removed; retained input
  // and result receipts are never modified or removed.
  rmSync(root, { recursive: true });
}
check("exact-qualified-assets", null, 0, /Verified release payload/);
check(
  "release-target-must-be-qualified-source",
  (root) => {
    const request = read(root, "release-request.json");
    request.targetCommit = "0".repeat(40);
    write(root, "release-request.json", request);
    rehash(root, "release-request.json");
  },
  1,
  /release.*target|qualified source/i,
);
check(
  "changed-userscript-is-rejected",
  (root) => {
    writeFileSync(
      join(root, "frozen/tsdm-workspace.user.js"),
      "changed bytes\n",
    );
  },
  1,
  /hash|identity|mismatch/i,
);
check(
  "rehashed-userscript-still-must-match-freeze",
  (root) => {
    writeFileSync(
      join(root, "frozen/tsdm-workspace.user.js"),
      "changed bytes\n",
    );
    rehash(root, "frozen/tsdm-workspace.user.js");
  },
  1,
  /freeze|candidate|identity|mismatch/i,
);
check(
  "missing-required-coverage-is-rejected",
  (root) => {
    const coverage = read(root, "coverage.json");
    coverage.requirements = coverage.requirements.filter((r) => r.id !== "J7");
    write(root, "coverage.json", coverage);
    rehash(root, "coverage.json");
  },
  1,
  /coverage|J7/i,
);
check(
  "omitted-executed-case-is-rejected",
  (root) => {
    const receipt = read(root, "receipt.json");
    const removed = receipt.cases.find((c) => c.source === "shared-38");
    receipt.cases = receipt.cases.filter((c) => c.id !== removed.id);
    const coverage = read(root, "coverage.json");
    for (const row of coverage.requirements)
      row.cases = row.cases.filter((id) => id !== removed.id);
    write(root, "receipt.json", receipt);
    write(root, "coverage.json", coverage);
    rehash(root, "receipt.json");
    rehash(root, "coverage.json");
  },
  1,
  /application.*case|executed.*case|case.*inventory/i,
);
check(
  "missing-replay-configuration-is-rejected",
  (root) => {
    const name = "replay/workspace.tar.gz";
    const archive = gunzipSync(readFileSync(join(root, name)));
    const chunks = [];
    let offset = 0;
    while (offset + 512 <= archive.length) {
      const header = archive.subarray(offset, offset + 512);
      if (header.every((b) => b === 0)) break;
      const member = header.subarray(0, 100).toString("utf8").split("\0")[0];
      const size = parseInt(header.subarray(124, 136).toString("utf8"), 8);
      const end = offset + 512 + Math.ceil(size / 512) * 512;
      if (member !== "workspace/vite.config.ts")
        chunks.push(archive.subarray(offset, end));
      offset = end;
    }
    chunks.push(Buffer.alloc(1024));
    writeFileSync(join(root, name), gzipSync(Buffer.concat(chunks)));
    const inputs = read(root, "replay/workspace-inputs.json");
    delete inputs["vite.config.ts"];
    write(root, "replay/workspace-inputs.json", inputs);
    rehash(root, name);
    rehash(root, "replay/workspace-inputs.json");
  },
  1,
  /required replay input|replay.*inventory/i,
);
check(
  "nonpassing-required-case-blocks",
  (root) => {
    const receipt = read(root, "receipt.json");
    receipt.cases.find((c) => c.required && c.status === "passed").status =
      "inconclusive";
    write(root, "receipt.json", receipt);
    rehash(root, "receipt.json");
  },
  1,
  /required|inconclusive|coverage/i,
);
for (const issue of [39, 47]) {
  check(
    `deferred-${issue}-cannot-be-passed`,
    (root) => {
      const receipt = read(root, "receipt.json");
      receipt.deferred.find((item) => item.issue === issue).status = "passed";
      write(root, "receipt.json", receipt);
      rehash(root, "receipt.json");
    },
    1,
    /deferred|unverified/i,
  );
}
check(
  "historical-candidate-cannot-be-relabeled-current",
  (root) => {
    const receipt = read(root, "receipt.json");
    receipt.sources.find((s) => s.id === "chrome-37").candidateSha256 =
      receipt.candidate.sha256;
    write(root, "receipt.json", receipt);
    rehash(root, "receipt.json");
  },
  1,
  /historical|Chrome|candidate/i,
);
check(
  "private-workstation-path-blocks",
  (root) => {
    writeFileSync(
      join(root, "INSTALL.md"),
      "Private path: " +
        ["", "Users", "fixture", "private-observation"].join("/") +
        "\n",
    );
    rehash(root, "INSTALL.md");
  },
  1,
  /private|sensitive|sanitation/i,
);
check(
  "credential-assignment-blocks",
  (root) => {
    writeFileSync(
      join(root, "INSTALL.md"),
      "authorization: " +
        JSON.stringify("Bearer SYNTHETIC_REJECTION_PROBE") +
        "\n",
    );
    rehash(root, "INSTALL.md");
  },
  1,
  /private|sensitive|sanitation/i,
);
check(
  "unlisted-file-blocks",
  (root) => {
    writeFileSync(join(root, "unlisted.txt"), "unexpected\n");
  },
  1,
  /inventory|unlisted|manifest/i,
);
check(
  "linked-file-blocks",
  (root) => {
    rmSync(join(root, "INSTALL.md"));
    symlinkSync("README.md", join(root, "INSTALL.md"));
  },
  1,
  /link|regular/i,
);
check(
  "dangling-case-reference-blocks",
  (root) => {
    const coverage = read(root, "coverage.json");
    coverage.requirements[0].cases.push("nonexistent-case");
    write(root, "coverage.json", coverage);
    rehash(root, "coverage.json");
  },
  1,
  /reference|case/i,
);
check(
  "unreviewed-public-file-blocks",
  (root) => {
    const policy = read(root, "public-files.json");
    policy.files[0].reviewed = false;
    write(root, "public-files.json", policy);
    rehash(root, "public-files.json");
  },
  1,
  /review/i,
);
check(
  "unpublished-assets-cannot-claim-download-verification",
  (root) => {
    const receipt = read(root, "receipt.json");
    receipt.publication.downloadVerified = true;
    write(root, "receipt.json", receipt);
    rehash(root, "receipt.json");
  },
  1,
  /publication|download/i,
);
check(
  "pending-review-cannot-qualify",
  (root) => {
    const receipt = read(root, "receipt.json");
    receipt.status = "pending-review";
    receipt.signoffs.bdfl.status = "pending";
    write(root, "receipt.json", receipt);
    rehash(root, "receipt.json");
  },
  1,
  /pending|sign-off/i,
  ["--require-qualified"],
);
const receipt = {
  schema: 1,
  mode: "release-payload-cli",
  status: cases.every((c) => c.status === "passed") ? "passed" : "failed",
  node: process.version,
  inputManifest: identity(join(input, "manifest.json")),
  verifier: existsSync(verifier) ? identity(verifier) : null,
  cases,
};
write(output, "receipt.json", receipt);
writeFileSync(
  join(output, "report.md"),
  "# Release payload CLI verification\n\n" +
    cases.map((c) => `- ${c.name}: ${c.status}`).join("\n") +
    "\n",
);
write(
  output,
  "manifest.json",
  Object.fromEntries(
    readdirSync(output).map((name) => [name, identity(join(output, name))]),
  ),
);
console.log(
  JSON.stringify({
    status: receipt.status,
    scenarios: cases.length,
    failures: cases.filter((c) => c.status !== "passed").map((c) => c.name),
  }),
);
process.exitCode = receipt.status === "passed" ? 0 : 1;
