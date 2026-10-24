import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Failure inventory before execution: a changed artifact or missing manifest
// entry must fail; unresolved installed coverage must not be promoted to pass.
// These are complete CLI processes consuming real frozen packages, not mocks.
const [freeze, evidence, destination] = process.argv.slice(2);
assert(
  freeze && evidence && destination,
  "Usage: node scripts/check-frozen-evidence.mjs FREEZE PUBLIC_EVIDENCE NEW_OUTPUT",
);
assert(!existsSync(destination), "Preserve earlier observations");
const scripts = dirname(fileURLToPath(import.meta.url));
const cases = [];
const identity = (path) => {
  const bytes = readFileSync(path);
  return {
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
};
function check(name, script, args, expected, diagnostic) {
  const result = spawnSync(process.execPath, [join(scripts, script), ...args], {
    encoding: "utf8",
  });
  const output = result.stdout + result.stderr;
  assert.equal(result.status, expected, name);
  assert.match(output, diagnostic, name);
  cases.push({
    name,
    status: "passed",
    exitCode: result.status,
    expectedExit: expected,
  });
}
check(
  "exact-clean-committed-freeze-verification",
  "verify-release.mjs",
  [resolve(freeze)],
  0,
  /Verified release exact frozen bytes/,
);
check(
  "authored-public-schema-coverage-and-hash-verification",
  "verify-evidence.mjs",
  [resolve(evidence), "--public"],
  0,
  /Verified exact coverage/,
);
check(
  "unexecuted-final-matrix-cannot-qualify",
  "verify-evidence.mjs",
  [resolve(evidence), "--public", "--require-pass"],
  1,
  /Required coverage is not all passed/,
);
const receipt = {
  schema: 1,
  status: "passed",
  runtime: { node: process.version },
  inputs: {
    freezeReceipt: identity(join(freeze, "freeze.json")),
    freezeManifest: identity(join(freeze, "manifest.json")),
    publicReceipt: identity(join(evidence, "receipt.json")),
    publicManifest: identity(join(evidence, "manifest.json")),
  },
  cases,
  limits: [
    "Exact CLI contract verification; no installed or live qualification inferred.",
  ],
};
mkdirSync(destination, { recursive: true });
writeFileSync(
  join(destination, "receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
writeFileSync(
  join(destination, "report.md"),
  "# Frozen evidence CLI observations\n\n" +
    cases
      .map((c) => `- ${c.name}: ${c.status} (exit ${c.exitCode})`)
      .join("\n") +
    "\n",
);
writeFileSync(
  join(destination, "manifest.json"),
  JSON.stringify(
    Object.fromEntries(
      ["receipt.json", "report.md"].map((n) => [
        n,
        identity(join(destination, n)),
      ]),
    ),
    null,
    2,
  ) + "\n",
);
console.log(JSON.stringify({ status: "passed", cases: cases.length }));
