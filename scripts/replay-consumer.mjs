import assert from "node:assert/strict";
import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const evidence = resolve(process.argv[2] ?? ".");
const stamp = new Date().toISOString();
const output = evidence + "-replay-" + stamp.replaceAll(":", "-");
const identity = (file) => {
  const bytes = readFileSync(join(evidence, file));
  return {
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
};
function finish(receipt, explanation) {
  mkdirSync(output);
  const files = {
    "receipt.json": JSON.stringify(receipt, null, 2) + "\n",
    "report.md": "# Independent consumer replay\n\n" + explanation + "\n",
  };
  const manifest = {};
  for (const [file, contents] of Object.entries(files)) {
    writeFileSync(join(output, file), contents);
    manifest[file] = {
      bytes: Buffer.byteLength(contents),
      sha256: createHash("sha256").update(contents).digest("hex"),
    };
  }
  writeFileSync(
    join(output, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log(JSON.stringify(receipt, null, 2));
  console.error("Replay receipt/report: " + output);
}
try {
  const manifest = JSON.parse(
    readFileSync(join(evidence, "manifest.json"), "utf8"),
  );
  const receipt = JSON.parse(
    readFileSync(join(evidence, "receipt.json"), "utf8"),
  );
  for (const [file, expected] of Object.entries(manifest)) {
    assert.equal(basename(file), file, "Evidence entries must be filenames");
    assert.deepEqual(identity(file), expected, file);
  }
  assert.ok(
    manifest["receipt.json"],
    "Receipt must be covered by evidence manifest",
  );
  assert.equal(
    receipt.status,
    "passed",
    "Only a passing package is replayable",
  );
  assert.equal(
    process.version,
    receipt.runtime.node,
    "Use the recorded Node runtime",
  );
  const npm = process.env.npm_execpath;
  assert.ok(
    npm,
    "Invoke through npm exec -- node scripts/replay-consumer.mjs RUN",
  );
  const run = (args, cwd) =>
    execFileSync(process.execPath, [npm, ...args], { cwd, encoding: "utf8" });
  assert.equal(run(["--version"], evidence).trim(), receipt.runtime.npm);
  const consumer = mkdtempSync(join(tmpdir(), "tsdm-consumer-replay-"));
  const files = [
    "consume.mjs",
    "consume.ts",
    "tsconfig.json",
    "package.json",
    "package-lock.json",
    receipt.package?.file,
  ];
  for (const file of files) {
    assert.equal(
      typeof file,
      "string",
      "Evidence must identify its exact package",
    );
    assert.equal(basename(file), file, "Replay input must be a filename");
    const bytes = readFileSync(join(evidence, file));
    assert.deepEqual(
      manifest[file],
      {
        bytes: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      },
      file,
    );
    copyFileSync(join(evidence, file), join(consumer, file));
  }
  run(["ci", "--ignore-scripts", "--no-audit", "--no-fund"], consumer);
  execFileSync(
    process.execPath,
    ["node_modules/typescript/bin/tsc", "-p", "tsconfig.json"],
    { cwd: consumer, stdio: "inherit" },
  );
  const observed = JSON.parse(
    execFileSync(process.execPath, ["consume.mjs"], {
      cwd: consumer,
      encoding: "utf8",
    }),
  );
  assert.equal(observed.status, "passed");
  assert.deepEqual(
    observed,
    receipt.observed,
    "All recorded consumer observations must replay identically",
  );
  assert.equal(identity(receipt.package.file).sha256, receipt.packageSha256);
  for (const [file, expected] of Object.entries(receipt.artifact)) {
    assert.equal(basename(file), file, "Artifact entries must be filenames");
    const bytes = readFileSync(
      join(consumer, "node_modules/@tsdm/forum-client", file),
    );
    assert.deepEqual(
      {
        bytes: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      },
      expected,
      file,
    );
  }
  assert.deepEqual(
    observed.publicationCases,
    receipt.observed.publicationCases,
  );
  for (const family of [
    "boundaryCases",
    "replyCases",
    "editingCases",
    "packetCases",
    "draftCases",
    "favoriteCases",
  ]) {
    assert.deepEqual(observed[family], receipt.observed[family], family);
    assert.ok(
      Array.isArray(observed[family]) && observed[family].length > 0,
      "Missing cases: " + family,
    );
  }
  const typescript = JSON.parse(
    readFileSync(
      join(consumer, "node_modules/typescript/package.json"),
      "utf8",
    ),
  ).version;
  assert.equal(typescript, receipt.runtime.typescript);
  const result = {
    schema: 1,
    runId: stamp,
    status: "passed",
    mode: "independent-consumer-replay",
    runtime: {
      node: process.version,
      npm: run(["--version"], consumer).trim(),
      typescript,
      platform: process.platform,
      arch: process.arch,
    },
    sourceManifestSha256: identity("manifest.json").sha256,
    packageSha256: receipt.packageSha256,
    boundaryCases: observed.boundaryCases,
    publicationCases: observed.publicationCases,
    replyCases: observed.replyCases,
    editingCases: observed.editingCases,
    packetCases: observed.packetCases,
    draftCases: observed.draftCases,
    favoriteCases: observed.favoriteCases,
  };
  finish(
    result,
    "Passed exact retained artifact installation, strict declarations and all recorded synthetic consumer cases. This replay does not qualify later artifacts or installed/live browser behavior.",
  );
} catch (error) {
  finish(
    {
      schema: 1,
      runId: stamp,
      status: "failed",
      mode: "independent-consumer-replay",
      runtime: { node: process.version },
    },
    "Replay failed. Hash verification, isolated install, declarations or behavioral checks did not complete. Private terminal diagnostics identify the failing step; no passing qualification is claimed.",
  );
  console.error(error);
  process.exitCode = 1;
}
