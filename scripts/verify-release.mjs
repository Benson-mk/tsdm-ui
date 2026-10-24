import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
const root = process.argv[2];
if (!root)
  throw new Error("Usage: node scripts/verify-release.mjs <frozen-directory>");
execFileSync(
  process.execPath,
  [
    fileURLToPath(new URL("./verify-evidence.mjs", import.meta.url)),
    resolve(root),
  ],
  { stdio: "inherit" },
);
const r = JSON.parse(readFileSync(join(root, "freeze.json"), "utf8"));
if (
  r.schema !== 1 ||
  !["release", "development-snapshot"].includes(r.mode) ||
  r.releaseEligible !== false ||
  r.packagingEligible !== (r.mode === "release") ||
  r.cleanCommitted !== (r.mode === "release")
)
  throw new Error("Invalid freeze schema or eligibility");
const digest = /^[a-f0-9]{64}$/;
if (
  !r.tools ||
  !/^v\d+\.\d+\.\d+$/.test(r.tools.node) ||
  !/^\d+\.\d+\.\d+$/.test(r.tools.npm) ||
  !digest.test(r.tools.nodeSha256) ||
  !digest.test(r.tools.npmCliSha256)
)
  throw new Error("Invalid freeze tools schema");
if (
  !/^[a-f0-9]{40,64}$/.test(r.gitHead) ||
  !r.inputs ||
  !r.outputs ||
  !Array.isArray(r.commands) ||
  !r.commands.length ||
  !Array.isArray(r.limits) ||
  !r.limits.length
)
  throw new Error("Invalid freeze provenance schema");
for (const collection of [r.inputs, r.outputs]) {
  if (
    typeof collection !== "object" ||
    Array.isArray(collection) ||
    !Object.keys(collection).length
  )
    throw new Error("Invalid freeze identity inventory");
  for (const id of Object.values(collection))
    if (
      !id ||
      !Number.isSafeInteger(id.bytes) ||
      id.bytes < 0 ||
      !digest.test(id.sha256) ||
      !Number.isSafeInteger(id.mode)
    )
      throw new Error("Invalid freeze file identity schema");
}
if (JSON.stringify(r.lock) !== JSON.stringify(r.inputs["package-lock.json"]))
  throw new Error("Freeze lock identity mismatch");
if (
  !r.toolingInputs ||
  JSON.stringify(Object.keys(r.toolingInputs).sort()) !==
    JSON.stringify(["freeze-release.mjs", "package-notices.mjs"]) ||
  !r.provenance ||
  !/^\d+\.\d+\.\d+$/.test(r.applicationVersion) ||
  !/^\d+\.\d+\.\d+$/.test(r.libraryVersion)
)
  throw new Error("Missing or invalid external tooling provenance");
for (const id of Object.values(r.toolingInputs))
  if (
    !id ||
    !Number.isSafeInteger(id.bytes) ||
    id.bytes <= 0 ||
    !digest.test(id.sha256) ||
    !Number.isSafeInteger(id.mode)
  )
    throw new Error("Invalid external tooling identity");
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
if (
  JSON.stringify(
    Object.keys(manifest)
      .filter((n) => n !== "freeze.json")
      .sort(),
  ) !== JSON.stringify(Object.keys(r.outputs).sort())
)
  throw new Error("Freeze output inventory mismatch");
for (const [name, id] of Object.entries(r.outputs)) {
  const bytes = readFileSync(join(root, name));
  if (
    bytes.length !== id.bytes ||
    createHash("sha256").update(bytes).digest("hex") !== id.sha256
  )
    throw new Error(`Freeze output hash mismatch: ${name}`);
}
console.log(
  `Verified ${r.mode} exact frozen bytes; installed and release acceptance are not inferred.`,
);
