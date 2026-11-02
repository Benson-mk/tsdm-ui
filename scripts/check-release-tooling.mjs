import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  symlinkSync,
} from "node:fs";
import { join, resolve } from "node:path";

// Complete CLI scenarios. Fixtures are authored data; no internal imports.
const output = resolve(process.argv[2] ?? "");
assert(
  process.argv[2],
  "Usage: node scripts/check-release-tooling.mjs <new-artifact-directory> [evidence|contract|identity|references|installed-accounting|freeze|notices]",
);
assert(
  !existsSync(output),
  "Artifact directory must be new to preserve earlier runs",
);
mkdirSync(output, { recursive: true });
const slice = process.argv[3] ?? "evidence";
const cases = [];
const hash = (b) => createHash("sha256").update(b).digest("hex");
const write = (dir, name, value) => {
  mkdirSync(join(dir, name, ".."), { recursive: true });
  writeFileSync(
    join(dir, name),
    typeof value === "string" ? value : JSON.stringify(value, null, 2) + "\n",
  );
};
const ids = [
  ...Array.from({ length: 63 }, (_, i) => `story-${i + 1}`),
  ...Array.from({ length: 11 }, (_, i) => `J${i + 1}`),
  "Node",
  "F1-response-representation",
  "F2-write-outcome",
  "F3-recovery-lifetime",
  "F4-effectful-history",
  "F5-inert-input",
  "F6-files",
  "F7-identity",
  "S7-framework",
  "S8-ownership",
  "S8-transport-trust",
  "S10-writing-recovery",
  "S10-workflows",
  "S12-financial-limits",
  "S9-replication",
  "S9-exact-evidence",
  "S6-appearance-followup",
  ...Array.from({ length: 6 }, (_, i) => `36.${i + 1}`),
];
const candidate = "a".repeat(64);
function legacyFixture(dir) {
  mkdirSync(dir, { recursive: true });
  write(
    dir,
    "synthetic/example.spec.ts",
    "test('authored CLI fixture', () => {});\n",
  );
  write(dir, "synthetic/observed.json", {
    stored: "authored body",
    effects: 1,
  });
  write(
    dir,
    "report.md",
    "# Authored tooling scenario\n\nThis is synthetic CLI-system evidence only. No product acceptance.\n",
  );
  const receipt = {
    schema: 2,
    runId: "authored-fixture",
    timezone: "Asia/Hong_Kong",
    status: "passed",
    candidate: { userscriptSha256: candidate },
    cases: [
      {
        id: "case-1",
        name: "authored CLI fixture",
        status: "passed",
        evidenceLevel: "synthetic",
        candidateSha256: candidate,
        installedSha256: null,
        declaration: {
          file: "synthetic/example.spec.ts",
          title: "authored CLI fixture",
        },
        readback: {
          kind: "independent-state",
          artifact: "synthetic/observed.json",
        },
        artifacts: ["synthetic/observed.json"],
      },
    ],
  };
  const coverage = {
    schema: 1,
    requirements: ids.map((id) => ({
      id,
      status: "passed",
      cases: ["case-1"],
      gap: "",
      requiredLevels: ["synthetic"],
    })),
  };
  write(dir, "receipt.json", receipt);
  write(dir, "coverage.json", coverage);
  const policy = {
    schema: 1,
    files: [
      "receipt.json",
      "coverage.json",
      "report.md",
      "synthetic/example.spec.ts",
      "synthetic/observed.json",
    ].map((path) => ({
      path,
      kind: path.startsWith("synthetic/")
        ? "synthetic-artifact"
        : "authored-summary",
      reviewed: true,
    })),
  };
  write(dir, "public-files.json", policy);
  return { receipt, coverage, policy };
}
function manifest(dir) {
  const p = JSON.parse(readFileSync(join(dir, "public-files.json")));
  const files = [...p.files.map((f) => f.path), "public-files.json"];
  const result = {};
  for (const file of files) {
    if (existsSync(join(dir, file))) {
      const b = readFileSync(join(dir, file));
      result[file] = { bytes: b.length, sha256: hash(b) };
    }
  }
  write(dir, "manifest.json", result);
}
function run(name, script, args, expected, pattern, inspect) {
  const r = spawnSync(process.execPath, [resolve(script), ...args], {
    encoding: "utf8",
  });
  const text = (r.stdout ?? "") + (r.stderr ?? "");
  let error = null;
  try {
    assert(!/Cannot find module/.test(text), "CLI setup missing");
    assert.equal(r.status, expected);
    if (pattern) {
      const diagnostic =
        text
          .split(/\r?\n/)
          .find((line) => /^(?:Error|TypeError|AssertionError): /.test(line)) ??
        text;
      assert.match(diagnostic, pattern);
    }
    inspect?.();
  } catch (e) {
    error = e.message;
  }
  cases.push({
    name,
    status: error ? "failed" : "passed",
    exitCode: r.status,
    expectedExit: expected,
    error,
    output: text
      .replaceAll(output, "[scenario-directory]")
      .replaceAll(process.cwd(), "[checkout]"),
  });
}
function evidenceScenario(name, change, pass = false, pattern) {
  const dir = join(output, name);
  const f = fixture(dir);
  change?.(f, dir);
  manifest(dir);
  run(
    name,
    "scripts/verify-evidence.mjs",
    [dir, "--public", ...(pass ? ["--require-pass"] : [])],
    pattern ? 1 : 0,
    pattern,
  );
}
if (slice === "evidence") {
  evidenceScenario("valid-authored-package");
  evidenceScenario(
    "missing-story",
    (f) => {
      f.coverage.requirements.shift();
      write(join(output, "missing-story"), "coverage.json", f.coverage);
    },
    false,
    /coverage|requirement/i,
  );
  evidenceScenario(
    "unknown-case",
    (f, d) => {
      f.coverage.requirements[0].cases = ["missing"];
      write(d, "coverage.json", f.coverage);
    },
    false,
    /case/i,
  );
  evidenceScenario(
    "nonexistent-test",
    (f, d) => {
      f.receipt.cases[0].reference.case = "not present";
      write(d, "receipt.json", f.receipt);
    },
    false,
    /declaration/i,
  );
  evidenceScenario(
    "wrong-candidate",
    (f, d) => {
      f.receipt.cases[0].candidateSha256 = "b".repeat(64);
      write(d, "receipt.json", f.receipt);
    },
    false,
    /candidate/i,
  );
  evidenceScenario(
    "no-evidence-level",
    (f, d) => {
      delete f.receipt.cases[0].evidenceLevel;
      write(d, "receipt.json", f.receipt);
    },
    false,
    /level|schema/i,
  );
  evidenceScenario(
    "no-readback",
    (f, d) => {
      delete f.receipt.cases[0].readback;
      write(d, "receipt.json", f.receipt);
    },
    false,
    /readback|schema/i,
  );
  evidenceScenario(
    "false-pass",
    (f, d) => {
      f.receipt.cases[0].status = "failed";
      write(d, "receipt.json", f.receipt);
    },
    false,
    /status|pass/i,
  );
  for (const status of ["failed", "blocked", "not-run", "inconclusive"]) {
    const edit = (f, d) => {
      f.receipt.status = status;
      f.receipt.cases[0].status = status;
      f.coverage.requirements.forEach((r) => {
        r.status = status;
        r.gap = "Not qualified by this scenario.";
      });
      write(d, "receipt.json", f.receipt);
      write(d, "coverage.json", f.coverage);
    };
    evidenceScenario(`preserve-${status}`, edit);
    evidenceScenario(`reject-required-${status}`, edit, true, /pass|qualif/i);
  }
  evidenceScenario(
    "missing-required-level",
    (f, d) => {
      f.coverage.requirements[0].requiredLevels = ["synthetic", "installed"];
      write(d, "coverage.json", f.coverage);
    },
    false,
    /level/i,
  );
  evidenceScenario(
    "comment-is-not-test",
    (f, d) => {
      const source = "// authored CLI fixture\n";
      write(d, "synthetic/example.spec.ts", source);
      f.receipt.cases[0].reference.sha256 = hash(source);
      write(d, "receipt.json", f.receipt);
    },
    false,
    /declaration/i,
  );
  evidenceScenario(
    "installed-identity",
    (f, d) => {
      f.receipt.cases[0].evidenceLevel = "installed";
      write(d, "receipt.json", f.receipt);
    },
    false,
    /installed|identity/i,
  );
  evidenceScenario(
    "unknown-schema",
    (f, d) => {
      f.receipt.schema = 999;
      write(d, "receipt.json", f.receipt);
    },
    false,
    /schema/i,
  );
  evidenceScenario(
    "duplicate-case",
    (f, d) => {
      f.receipt.cases.push(f.receipt.cases[0]);
      write(d, "receipt.json", f.receipt);
    },
    false,
    /duplicate/i,
  );
  evidenceScenario(
    "missing-artifact",
    (f, d) => {
      f.receipt.cases[0].readback.artifact = "synthetic/missing.json";
      write(d, "receipt.json", f.receipt);
    },
    false,
    /artifact|readback/i,
  );
  evidenceScenario(
    "workstation-path",
    (f, d) => write(d, "report.md", "private /Users/author/private.txt"),
    false,
    /sensitive|private/i,
  );
  evidenceScenario(
    "auth-header",
    (f, d) =>
      write(d, "synthetic/observed.json", {
        Authorization: "Bearer authored-secret",
      }),
    false,
    /sensitive|private/i,
  );
  evidenceScenario(
    "raw-capture",
    (f, d) => {
      write(d, "capture.har", "{}");
      f.policy.files.push({
        path: "capture.har",
        kind: "authored-summary",
        reviewed: true,
      });
      write(d, "public-files.json", f.policy);
    },
    false,
    /allow|public|capture/i,
  );
  evidenceScenario(
    "unreviewed",
    (f, d) => {
      f.policy.files[0].reviewed = false;
      write(d, "public-files.json", f.policy);
    },
    false,
    /review/i,
  );
  evidenceScenario(
    "unknown-field",
    (f, d) => {
      f.receipt.accidentalCapture = "raw";
      write(d, "receipt.json", f.receipt);
    },
    false,
    /schema|field/i,
  );
  const tamper = join(output, "tampered");
  fixture(tamper);
  manifest(tamper);
  write(tamper, "report.md", "changed");
  run(
    "hash-mismatch",
    "scripts/verify-evidence.mjs",
    [tamper, "--public"],
    1,
    /mismatch/i,
  );
  const link = join(output, "symlink");
  fixture(link);
  manifest(link);
  symlinkSync("report.md", join(link, "alias.md"));
  run(
    "symlink-refusal",
    "scripts/verify-evidence.mjs",
    [link, "--public"],
    1,
    /entry|link/i,
  );
  const source = join(output, "export-source");
  fixture(source);
  manifest(source);
  write(source, "private-unlisted.txt", "not for export");
  const dest = join(output, "exported");
  run(
    "allowlisted-export",
    "scripts/package-evidence.mjs",
    [source, dest],
    0,
    null,
    () => {
      assert(!existsSync(join(dest, "private-unlisted.txt")));
      assert(existsSync(join(dest, "manifest.json")));
    },
  );
  run(
    "preserve-output",
    "scripts/package-evidence.mjs",
    [source, dest],
    1,
    /exists/i,
  );
}

function fixture(dir) {
  return normativeFixture(dir);
}
function normativeFixture(dir) {
  const f = legacyFixture(dir);
  write(
    dir,
    "README.md",
    "# Replay the authored scenario\n\nRun the named procedure using its recorded revision. Requires authored fixtures only. No live effects or product acceptance.\n",
  );
  write(dir, "source-manifest.json", {
    "src/authored.ts": { bytes: 8, sha256: hash("authored") },
    "package-lock.json": { bytes: 3, sha256: hash("{}\n") },
  });
  write(dir, "synthetic/fixture.json", { source: "authored body" });
  const sourceHash = hash(readFileSync(join(dir, "source-manifest.json")));
  const c = f.receipt.cases[0];
  f.receipt.schema = 3;
  f.receipt.timestamp = "2026-10-23T00:00:00+08:00";
  f.receipt.source = {
    revision: "authored-fixture-v1",
    manifest: { file: "source-manifest.json", sha256: sourceHash },
  };
  f.receipt.lockSha256 = hash("{}\n");
  f.receipt.tools = [
    {
      name: "node",
      version: process.version,
      sha256: hash("authored tool identity"),
    },
  ];
  const na = {
    status: "not-applicable",
    name: null,
    version: null,
    detail: "No browser or manager in this synthetic CLI fixture.",
  };
  f.receipt.runtime = {
    os: {
      status: "observed",
      name: "Authored fixture OS",
      version: "1",
      detail: "Fixture architecture",
    },
    browser: { ...na },
    manager: { ...na },
  };
  c.reference = {
    kind: "playwright",
    file: c.declaration.file,
    case: c.declaration.title,
    sha256: hash(readFileSync(join(dir, c.declaration.file))),
    entry: null,
  };
  delete c.declaration;
  c.fixtures = [
    {
      file: "synthetic/fixture.json",
      sha256: hash(readFileSync(join(dir, "synthetic/fixture.json"))),
    },
  ];
  c.capabilities = ["Authored fixture storage and effect ledger"];
  c.expected = "Store the complete authored body with one effect.";
  c.observed = "Complete authored body and one effect independently observed.";
  c.limits = [
    "Authored CLI fixture only; no application or installed acceptance.",
  ];
  c.readback.result =
    "Complete stored source and one effect independently inspected.";
  for (const path of [
    "README.md",
    "source-manifest.json",
    "synthetic/fixture.json",
  ])
    f.policy.files.push({
      path,
      kind: path.startsWith("synthetic/")
        ? "synthetic-artifact"
        : "authored-summary",
      reviewed: true,
    });
  write(dir, "receipt.json", f.receipt);
  write(dir, "public-files.json", f.policy);
  return f;
}
function contractScenario(name, change, pattern) {
  const dir = join(output, name),
    f = normativeFixture(dir);
  change?.(f, dir);
  manifest(dir);
  run(
    name,
    "scripts/verify-evidence.mjs",
    [dir, "--public"],
    pattern ? 1 : 0,
    pattern,
  );
}
if (slice === "identity") {
  contractScenario("identity-coverage-control");
  contractScenario(
    "missing-inherited-identity-coverage",
    (f, d) => {
      f.coverage.requirements = f.coverage.requirements.filter(
        (r) => r.id !== "F7-identity",
      );
      write(d, "coverage.json", f.coverage);
    },
    /Missing required coverage: F7-identity/,
  );
}

if (slice === "contract") {
  const old = join(output, "old-control");
  legacyFixture(old);
  manifest(old);
  run(
    "legacy-public-shape-is-incomplete",
    "scripts/verify-evidence.mjs",
    [old, "--public"],
    1,
    /schema|receipt|README/i,
  );
  contractScenario("normative-public-receipt");
  for (const field of ["timestamp", "source", "lockSha256", "tools", "runtime"])
    contractScenario(
      `missing-${field}`,
      (f, d) => {
        delete f.receipt[field];
        write(d, "receipt.json", f.receipt);
      },
      /schema|missing/i,
    );
  for (const field of [
    "reference",
    "fixtures",
    "capabilities",
    "expected",
    "observed",
    "limits",
  ])
    contractScenario(
      `missing-case-${field}`,
      (f, d) => {
        delete f.receipt.cases[0][field];
        write(d, "receipt.json", f.receipt);
      },
      /schema|missing/i,
    );
  contractScenario(
    "missing-readback-result",
    (f, d) => {
      delete f.receipt.cases[0].readback.result;
      write(d, "receipt.json", f.receipt);
    },
    /readback|schema/i,
  );
  contractScenario(
    "stale-source-manifest",
    (f, d) => {
      f.receipt.source.manifest.sha256 = "f".repeat(64);
      write(d, "receipt.json", f.receipt);
    },
    /source|hash|revision/i,
  );
  contractScenario(
    "lock-identity-mismatch",
    (f, d) => {
      f.receipt.lockSha256 = "f".repeat(64);
      write(d, "receipt.json", f.receipt);
    },
    /lock/i,
  );
  contractScenario("unknown-runtime-honest", (f, d) => {
    f.receipt.runtime.os = {
      status: "unknown",
      name: null,
      version: null,
      detail: "Unavailable in this retained authored scenario.",
    };
    write(d, "receipt.json", f.receipt);
  });
  contractScenario(
    "fabricated-nonapplicable-runtime",
    (f, d) => {
      f.receipt.runtime.browser.version = "999";
      write(d, "receipt.json", f.receipt);
    },
    /runtime|nonapplicable|identity/i,
  );
  contractScenario(
    "stale-case-source",
    (f, d) => {
      f.receipt.cases[0].reference.sha256 = "f".repeat(64);
      write(d, "receipt.json", f.receipt);
    },
    /reference|hash|revision/i,
  );
  contractScenario(
    "stale-fixture",
    (f, d) => {
      f.receipt.cases[0].fixtures[0].sha256 = "f".repeat(64);
      write(d, "receipt.json", f.receipt);
    },
    /fixture|hash|revision/i,
  );
  const source = join(output, "normative-export-input");
  normativeFixture(source);
  manifest(source);
  const dest = join(output, "normative-export");
  run(
    "normative-export",
    "scripts/package-evidence.mjs",
    [source, dest],
    0,
    null,
    () => {
      assert(existsSync(join(dest, "README.md")));
      const r = JSON.parse(readFileSync(join(dest, "receipt.json")));
      assert.equal(r.timestamp, "2026-10-23T00:00:00+08:00");
      assert.equal(
        r.cases[0].observed,
        "Complete authored body and one effect independently observed.",
      );
    },
  );
  run(
    "normative-export-verification",
    "scripts/verify-evidence.mjs",
    [dest, "--public", "--require-pass"],
    0,
  );
}

function alternateReference(f, d, kind) {
  const c = f.receipt.cases[0];
  if (kind === "cli") {
    const source =
      "import assert from 'node:assert/strict';\nconst results=[];\nasync function consumerCase(name,run){await run();results.push({name,status:'passed'});}\nawait consumerCase('portable authored fixture',async()=>assert.equal(JSON.parse('{\"stored\":true}').stored,true));\nconsole.log(JSON.stringify(results));\n";
    write(d, "synthetic/consumer.mjs", source);
    const executed = spawnSync(
      process.execPath,
      [join(d, "synthetic/consumer.mjs")],
      { encoding: "utf8" },
    );
    assert.equal(executed.status, 0, executed.stderr);
    assert.equal(
      JSON.parse(executed.stdout)[0].name,
      "portable authored fixture",
    );
    c.reference = {
      kind: "cli",
      file: "synthetic/consumer.mjs",
      case: "portable authored fixture",
      sha256: hash(source),
      entry: "consumerCase",
    };
    c.evidenceLevel = "clean-node-consumer";
    f.policy.files.push({
      path: "synthetic/consumer.mjs",
      kind: "synthetic-artifact",
      reviewed: true,
    });
  } else {
    const procedure =
      "# Authored installed procedure\n\nFixture procedure only, not an actual installed run.\n\n## source-identity\n\nExport the manager-stored source, compute its SHA256 and compare with the candidate before continuing. Record the observation and any unavailable step. No forum effects.\n";
    write(d, "procedures/installed.md", procedure);
    c.reference = {
      kind: "manual",
      file: "procedures/installed.md",
      case: "source-identity",
      sha256: hash(procedure),
      entry: null,
    };
    c.evidenceLevel = kind === "live" ? "live" : "installed";
    if (kind !== "live") c.installedSha256 = candidate;
    f.receipt.runtime.browser = {
      status: "observed",
      name: "Authored browser fixture",
      version: "1",
      detail: "Synthetic shape only, not a real installed observation.",
    };
    f.receipt.runtime.manager = {
      status: "observed",
      name: "Authored manager fixture",
      version: "1",
      detail: "Synthetic shape only, not a real installed observation.",
    };
    f.policy.files.push({
      path: "procedures/installed.md",
      kind: "authored-procedure",
      reviewed: true,
    });
  }
  f.coverage.requirements.forEach(
    (r) => (r.requiredLevels = [c.evidenceLevel]),
  );
  write(d, "receipt.json", f.receipt);
  write(d, "coverage.json", f.coverage);
  write(d, "public-files.json", f.policy);
}
if (slice === "references") {
  contractScenario("reference-positive-playwright");
  for (const kind of ["cli", "installed", "live"]) {
    contractScenario(`reference-positive-${kind}`, (f, d) =>
      alternateReference(f, d, kind),
    );
    const source = join(output, `${kind}-export-input`);
    const f = normativeFixture(source);
    alternateReference(f, source, kind);
    manifest(source);
    const dest = join(output, `${kind}-export`);
    run(
      `${kind}-export`,
      "scripts/package-evidence.mjs",
      [source, dest],
      0,
      null,
      () => {
        const r = JSON.parse(readFileSync(join(dest, "receipt.json")));
        assert.equal(
          r.cases[0].reference.kind,
          kind === "cli" ? "cli" : "manual",
        );
        assert.equal(
          r.cases[0].reference.sha256,
          hash(readFileSync(join(dest, r.cases[0].reference.file))),
        );
      },
    );
    run(
      `${kind}-export-verification`,
      "scripts/verify-evidence.mjs",
      [dest, "--public", "--require-pass"],
      0,
    );
  }
  for (const kind of ["cli", "installed"]) {
    for (const defect of ["stale", "missing", "wrong-case", "wrong-entry"])
      contractScenario(
        `${kind}-${defect}`,
        (f, d) => {
          alternateReference(f, d, kind);
          const r = f.receipt.cases[0].reference;
          if (defect === "stale") r.sha256 = "f".repeat(64);
          if (defect === "missing") r.file = "synthetic/missing.mjs";
          if (defect === "wrong-case") r.case = "not a real subcase";
          if (defect === "wrong-entry") r.entry = "notTheEmitter";
          write(d, "receipt.json", f.receipt);
        },
        /reference|case|entry|revision|hash/i,
      );
  }
  contractScenario(
    "cli-comment-not-case",
    (f, d) => {
      alternateReference(f, d, "cli");
      const body = "// portable authored fixture\nconsole.log('no case');\n";
      write(d, "synthetic/consumer.mjs", body);
      f.receipt.cases[0].reference.sha256 = hash(body);
      write(d, "receipt.json", f.receipt);
    },
    /case|reference/i,
  );
  contractScenario(
    "installed-without-source-identity",
    (f, d) => {
      alternateReference(f, d, "installed");
      f.receipt.cases[0].installedSha256 = null;
      write(d, "receipt.json", f.receipt);
    },
    /Missing or wrong installed identity/i,
  );
}

if (slice === "installed-accounting") {
  contractScenario("h4-passed-control", (f, d) =>
    alternateReference(f, d, "installed"),
  );
  for (const [status, installed] of [
    ["blocked", null],
    ["not-run", null],
    ["failed", "b".repeat(64)],
    ["inconclusive", "b".repeat(64)],
  ]) {
    const dir = join(output, `h4-${status}`),
      f = normativeFixture(dir);
    alternateReference(f, dir, "installed");
    f.receipt.status = status;
    const c = f.receipt.cases[0];
    c.status = status;
    c.installedSha256 = installed;
    c.expected =
      "The manager-stored source hash equals the intended candidate.";
    c.observed =
      installed === null
        ? "Source readback was unavailable; installed identity is unverified."
        : "The observed installed source hash differs from the intended candidate.";
    c.readback.result = c.observed;
    c.limits = [
      "Authored fixture only; no real installed run.",
      "Identity remains unverified; qualification is blocked.",
    ];
    write(dir, "synthetic/observed.json", {
      status,
      installedSha256: installed,
      candidateSha256: candidate,
    });
    f.coverage.requirements.forEach((r) => {
      r.status = status;
      r.gap = "Installed identity remains unverified.";
    });
    write(dir, "receipt.json", f.receipt);
    write(dir, "coverage.json", f.coverage);
    manifest(dir);
    run(
      `h4-${status}-validate`,
      "scripts/verify-evidence.mjs",
      [dir, "--public"],
      0,
    );
    const dest = join(output, `h4-${status}-export`);
    run(
      `h4-${status}-export`,
      "scripts/package-evidence.mjs",
      [dir, dest],
      0,
      null,
      () => {
        const r = JSON.parse(readFileSync(join(dest, "receipt.json")));
        assert.equal(r.cases[0].status, status);
        assert.equal(r.cases[0].installedSha256, installed);
        assert.equal(r.cases[0].candidateSha256, candidate);
        assert.equal(r.cases[0].observed, c.observed);
      },
    );
    run(
      `h4-${status}-export-validate`,
      "scripts/verify-evidence.mjs",
      [dest, "--public"],
      0,
    );
    run(
      `h4-${status}-qualification-refused`,
      "scripts/verify-evidence.mjs",
      [dir, "--public", "--require-pass"],
      1,
      /Required coverage is not all passed/,
    );
    run(
      `h4-${status}-qualified-export-refused`,
      "scripts/package-evidence.mjs",
      [dir, join(output, `h4-${status}-qualified`), "--require-pass"],
      1,
      /Required coverage is not all passed/,
    );
  }
  for (const installed of [null, "b".repeat(64)])
    contractScenario(
      `h4-passed-${installed === null ? "missing" : "mismatch"}`,
      (f, d) => {
        alternateReference(f, d, "installed");
        f.receipt.cases[0].installedSha256 = installed;
        write(d, "receipt.json", f.receipt);
      },
      /Missing or wrong installed identity/,
    );
  for (const status of [
    "passed",
    "failed",
    "blocked",
    "not-run",
    "inconclusive",
  ])
    contractScenario(
      `h4-malformed-${status}`,
      (f, d) => {
        alternateReference(f, d, "installed");
        f.receipt.status = status;
        f.receipt.cases[0].status = status;
        f.receipt.cases[0].installedSha256 = "not-a-sha";
        f.coverage.requirements.forEach((r) => {
          r.status = status;
          r.gap = status === "passed" ? "" : "Identity unverified.";
        });
        write(d, "receipt.json", f.receipt);
        write(d, "coverage.json", f.coverage);
      },
      /installed identity|installed SHA256/,
    );
  contractScenario(
    "h4-noninstalled-identity-unchanged",
    (f, d) => {
      f.receipt.cases[0].installedSha256 = candidate;
      write(d, "receipt.json", f.receipt);
    },
    /installed identity/,
  );
}
if (slice === "replay-material") {
  for (const [name, file, text, expected] of [
    [
      "nested-helper",
      "synthetic/tests/combined-authoring.ts",
      "export const fixture = 'authored';\n",
      0,
    ],
    [
      "synthetic-form-query",
      "synthetic/notices.spec.ts",
      "const query = 'formhash=SYNTHETIC_PUBLIC_FORM_TOKEN&view=all';\n",
      0,
    ],
    [
      "synthetic-form-object",
      "synthetic/consumer.mjs",
      'const expected = { formhash: "SYNTHETIC_PUBLIC_FORM_TOKEN" };\n',
      0,
    ],
    [
      "genuine-favorite-template-source",
      "synthetic/replay/tests/e2e/favorites.spec.ts",
      readFileSync("tests/e2e/favorites.spec.ts", "utf8"),
      0,
    ],
    [
      "genuine-new-thread-source",
      "synthetic/replay/tests/e2e/new-thread.spec.ts",
      readFileSync("tests/e2e/new-thread.spec.ts", "utf8"),
      0,
    ],
    [
      "genuine-notices-source",
      "synthetic/replay/tests/e2e/notices.spec.ts",
      readFileSync("tests/e2e/notices.spec.ts", "utf8"),
      0,
    ],
    [
      "sentinel-template-suffix",
      "synthetic/consumer.mjs",
      "const query = `formhash=SYNTHETIC_PUBLIC_FORM_TOKEN_PRIVATE`;\n",
      1,
    ],
    [
      "unmarked-form-token",
      "synthetic/consumer.mjs",
      "const query = 'formhash=UNREVIEWED-VALUE';\n",
      1,
    ],
    [
      "sentinel-suffix",
      "synthetic/consumer.mjs",
      "const query = 'formhash=SYNTHETIC_PUBLIC_FORM_TOKEN_PRIVATE';\n",
      1,
    ],
    [
      "sentinel-summary",
      "synthetic/observation.json",
      '{"formhash":"SYNTHETIC_PUBLIC_FORM_TOKEN"}\n',
      1,
    ],
    [
      "sentinel-plus-cookie",
      "synthetic/consumer.mjs",
      'const expected = { formhash: "SYNTHETIC_PUBLIC_FORM_TOKEN", cookie: "private" };\n',
      1,
    ],
    ["nested-traversal", "synthetic/../outside.ts", "authored", 1],
  ]) {
    const d = join(output, name),
      f = normativeFixture(d);
    write(d, file, text);
    f.policy.files.push({
      path: file,
      kind: "synthetic-artifact",
      reviewed: true,
    });
    write(d, "public-files.json", f.policy);
    manifest(d);
    run(
      name,
      "scripts/verify-evidence.mjs",
      [d, "--public"],
      expected,
      expected
        ? /Sensitive|Unsafe|allowlisted|Manifest does not cover exactly/
        : null,
    );
    if (expected === 0)
      run(
        name + "-export",
        "scripts/package-evidence.mjs",
        [d, join(output, name + "-export")],
        0,
      );
  }
}
if (slice === "real-references") {
  for (const [name, title] of [
    ["normalization-template", "stored normalization cannot hide ${name}"],
    ["callback-template", "callback refuses ${name}"],
    [
      "delayed-template",
      "delayed ${phase} cannot overwrite a newer actor observation",
    ],
    [
      "price-template",
      "disabled blank price omitted from command with stored ${JSON.stringify(storedPrice)}",
    ],
  ]) {
    const d = join(output, name),
      f = normativeFixture(d);
    const file = "synthetic/publication.mjs";
    const content = readFileSync("tests/consumer/publication.mjs", "utf8");
    write(d, file, content);
    f.policy.files.push({
      path: file,
      kind: "synthetic-artifact",
      reviewed: true,
    });
    const c = f.receipt.cases[0];
    c.evidenceLevel = "clean-node-consumer";
    c.reference = {
      kind: "cli",
      file,
      case: title,
      sha256: hash(content),
      entry: "publicationCase",
    };
    f.coverage.requirements.forEach(
      (r) => (r.requiredLevels = ["clean-node-consumer"]),
    );
    write(d, "receipt.json", f.receipt);
    write(d, "coverage.json", f.coverage);
    write(d, "public-files.json", f.policy);
    manifest(d);
    run(name, "scripts/verify-evidence.mjs", [d, "--public"], 0);
  }
}
if (slice === "freeze") {
  const npm = process.env.npm_execpath;
  assert(npm, "Set npm_execpath to the pinned npm CLI");
  function git(dir, ...args) {
    const r = spawnSync("git", args, { cwd: dir, encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr);
    return r.stdout.trim();
  }
  const script = `// ==UserScript==\n// @name TSDM Workspace\n// @namespace https://github.com/Benson-mk/tsdm-ui\n// @version 0.4.0\n// @match https://www.tsdm39.com/*\n// @exclude https://www.tsdm39.com/*tsdm-native=1*\n// @grant GM_registerMenuCommand\n// @run-at document-end\n// ==/UserScript==\nconsole.log('authored package fixture');\n`;
  function checkout(name, variant = "normal") {
    const dir = join(output, name, "checkout");
    mkdirSync(dir, { recursive: true });
    const pkg = {
      name: "authored-freeze-fixture",
      version: "0.4.0",
      private: true,
      type: "module",
      engines: { node: process.version.slice(1), npm: "11.21.1" },
      scripts: { build: "node build.mjs" },
    };
    write(dir, "package.json", pkg);
    write(dir, "package-lock.json", {
      name: pkg.name,
      version: pkg.version,
      lockfileVersion: 3,
      requires: true,
      packages: {
        "": { name: pkg.name, version: pkg.version, engines: pkg.engines },
      },
    });
    write(dir, ".gitignore", "node_modules/\ndist/\n");
    write(dir, "src/input.ts", "export const authored = true;\n");
    write(
      dir,
      "build.mjs",
      `import { mkdirSync, writeFileSync } from 'node:fs';\nconst put=(p,b)=>{mkdirSync(new URL('./dist/'+p+'/../',import.meta.url),{recursive:true});writeFileSync('dist/'+p,b);};\nput('tsdm-workspace.user.js',${JSON.stringify(script)});\nput('forum-client/index.js',"export const authored = true;\\n");\nput('forum-client/index.d.ts',"export declare const authored: boolean;\\n");\nput('forum-client/types.d.ts',"export type Authored = boolean;\\n");\nput('forum-client/package.json',JSON.stringify({name:'@tsdm/forum-client',version:'0.4.0',type:'module',exports:{'.':{types:'./index.d.ts',import:'./index.js'}}}));\nput('forum-client/README.md','Authored package fixture');\nput('THIRD_PARTY_NOTICES.md','Authored fixture has no third-party dependencies.');\n` +
        ({
          drift: "writeFileSync('src/input.ts','changed during build');\n",
          missing: "writeFileSync('dist/forum-client/index.d.ts','');\n",
          metadata:
            "writeFileSync('dist/tsdm-workspace.user.js'," +
            JSON.stringify(
              script.replace(
                "@grant GM_registerMenuCommand",
                "@grant GM_xmlhttpRequest",
              ),
            ) +
            ");\n",
          cdn:
            "writeFileSync('dist/tsdm-workspace.user.js'," +
            JSON.stringify(
              script.replace(
                "// @version",
                "// @require https://cdn.example.invalid/code.js\n// @version",
              ),
            ) +
            ");\n",
          notices: "writeFileSync('dist/THIRD_PARTY_NOTICES.md','');\n",
          failed: "process.exitCode=4;\n",
        }[variant] ?? ""),
    );
    git(dir, "init", "-q");
    git(dir, "add", ".");
    git(
      dir,
      "-c",
      "user.name=Authored Fixture",
      "-c",
      "user.email=fixture@example.invalid",
      "commit",
      "-qm",
      "Authored fixture input",
    );
    return dir;
  }
  function freeze(name, variant, modify, expected = 1, pattern) {
    const dir = checkout(name, variant);
    modify?.(dir);
    const dest = join(output, name, "frozen");
    run(
      name,
      "scripts/freeze-release.mjs",
      [dir, dest, npm],
      expected,
      pattern,
      expected === 0
        ? () => {
            const r = JSON.parse(readFileSync(join(dest, "freeze.json")));
            assert.equal(r.mode, "release");
            assert.equal(r.cleanCommitted, true);
            assert.equal(r.releaseEligible, false);
            assert.equal(r.packagingEligible, true);
            assert.equal(r.tools.node, process.version);
            assert.equal(r.tools.npm, "11.21.1");
            assert.equal(
              r.inputs["src/input.ts"].sha256,
              hash("export const authored = true;\n"),
            );
            assert(r.outputs["tsdm-workspace.user.js"].bytes > 0);
            assert(r.outputs["tsdm-workspace.user.js"].gzipBytes > 0);
          }
        : undefined,
    );
    return { dir, dest };
  }
  const valid = freeze("clean-freeze", "normal", null, 0);
  freeze(
    "independent-library-version",
    "normal",
    (dir) => {
      const build = readFileSync(join(dir, "build.mjs"), "utf8");
      write(
        dir,
        "build.mjs",
        build.replace(
          "version:'0.4.0',type:'module'",
          "version:'0.12.0',type:'module'",
        ),
      );
      git(dir, "add", "build.mjs");
      git(
        dir,
        "-c",
        "user.name=Authored Fixture",
        "-c",
        "user.email=fixture@example.invalid",
        "commit",
        "-qm",
        "Independent public library version",
      );
    },
    0,
  );
  run("verify-frozen-bytes", "scripts/verify-release.mjs", [valid.dest], 0);
  const originalFreeze = readFileSync(join(valid.dest, "freeze.json"));
  const originalManifest = readFileSync(join(valid.dest, "manifest.json"));
  const missingTooling = JSON.parse(originalFreeze);
  delete missingTooling.toolingInputs;
  write(valid.dest, "freeze.json", missingTooling);
  const missingToolManifest = JSON.parse(originalManifest);
  const missingToolBytes = readFileSync(join(valid.dest, "freeze.json"));
  missingToolManifest["freeze.json"] = {
    bytes: missingToolBytes.length,
    sha256: hash(missingToolBytes),
  };
  write(valid.dest, "manifest.json", missingToolManifest);
  run(
    "missing-external-tooling-provenance",
    "scripts/verify-release.mjs",
    [valid.dest],
    1,
    /tooling|provenance/i,
  );
  writeFileSync(join(valid.dest, "freeze.json"), originalFreeze);
  writeFileSync(join(valid.dest, "manifest.json"), originalManifest);
  const malformedFreeze = JSON.parse(originalFreeze);
  malformedFreeze.tools.node = "";
  write(valid.dest, "freeze.json", malformedFreeze);
  const changedManifest = JSON.parse(originalManifest);
  const changedFreeze = readFileSync(join(valid.dest, "freeze.json"));
  changedManifest["freeze.json"] = {
    bytes: changedFreeze.length,
    sha256: hash(changedFreeze),
  };
  write(valid.dest, "manifest.json", changedManifest);
  run(
    "malformed-freeze-tools",
    "scripts/verify-release.mjs",
    [valid.dest],
    1,
    /tool|schema/i,
  );
  writeFileSync(join(valid.dest, "freeze.json"), originalFreeze);
  writeFileSync(join(valid.dest, "manifest.json"), originalManifest);
  write(valid.dest, "tsdm-workspace.user.js", "changed");
  run(
    "reject-output-tamper",
    "scripts/verify-release.mjs",
    [valid.dest],
    1,
    /mismatch/i,
  );
  freeze(
    "dirty-source",
    "normal",
    (d) => write(d, "src/input.ts", "dirty"),
    1,
    /clean|dirty/i,
  );
  freeze(
    "staged-source",
    "normal",
    (d) => {
      write(d, "src/input.ts", "staged");
      git(d, "add", "src/input.ts");
    },
    1,
    /clean|dirty/i,
  );
  freeze(
    "untracked-source",
    "normal",
    (d) => write(d, "src/untracked.ts", "untracked"),
    1,
    /clean|dirty|untracked/i,
  );
  freeze(
    "ignored-source",
    "normal",
    (d) => {
      write(d, ".gitignore", "node_modules/\ndist/\nsrc/ignored.ts\n");
      git(d, "add", ".gitignore");
      git(
        d,
        "-c",
        "user.name=Fixture",
        "-c",
        "user.email=fixture@example.invalid",
        "commit",
        "-qm",
        "Ignore fixture source",
      );
      write(d, "src/ignored.ts", "unexpected");
    },
    1,
    /ignored|untracked|input/i,
  );
  freeze(
    "stale-dist",
    "normal",
    (d) => write(d, "dist/stale.js", "previous output"),
    1,
    /existing|output|dist/i,
  );
  freeze("drift-during-build", "drift", null, 1, /drift|changed/i);
  freeze("missing-declaration", "missing", null, 1, /missing|empty|output/i);
  freeze("bad-grant", "metadata", null, 1, /metadata|grant/i);
  freeze("external-cdn", "cdn", null, 1, /metadata|external|require/i);
  freeze("empty-notices", "notices", null, 1, /notices|empty/i);
  freeze("build-failed", "failed", null, 1, /build|command/i);
  freeze(
    "wrong-node",
    "normal",
    (d) => {
      const p = JSON.parse(readFileSync(join(d, "package.json")));
      p.engines.node = "1.0.0";
      write(d, "package.json", p);
      git(d, "add", ".");
      git(
        d,
        "-c",
        "user.name=Fixture",
        "-c",
        "user.email=fixture@example.invalid",
        "commit",
        "-qm",
        "Wrong tools fixture",
      );
    },
    1,
    /Node|node|runtime/i,
  );
  freeze(
    "lock-mismatch",
    "normal",
    (d) => {
      const p = JSON.parse(readFileSync(join(d, "package-lock.json")));
      p.version = "9.9.9";
      write(d, "package-lock.json", p);
      git(d, "add", ".");
      git(
        d,
        "-c",
        "user.name=Fixture",
        "-c",
        "user.email=fixture@example.invalid",
        "commit",
        "-qm",
        "Wrong lock fixture",
      );
    },
    1,
    /lock/i,
  );
  const dev = checkout("development");
  write(dev, "src/input.ts", "development overlay");
  const dest = join(output, "development", "frozen");
  run(
    "development-is-not-release",
    "scripts/freeze-release.mjs",
    [dev, dest, npm, "--development-snapshot"],
    0,
    null,
    () => {
      const r = JSON.parse(readFileSync(join(dest, "freeze.json")));
      assert.equal(r.mode, "development-snapshot");
      assert.equal(r.cleanCommitted, false);
      assert.equal(r.releaseEligible, false);
    },
  );
  run(
    "no-output-overwrite",
    "scripts/freeze-release.mjs",
    [dev, dest, npm, "--development-snapshot"],
    1,
    /exists/i,
  );
}

if (slice === "notices") {
  const dir = join(output, "package");
  mkdirSync(dir, { recursive: true });
  write(dir, "package.json", {
    name: "authored-notice-fixture",
    version: "0.4.0",
    dependencies: { "authored-dependency": "1.0.0" },
  });
  write(dir, "package-lock.json", {
    lockfileVersion: 3,
    packages: {
      "": {},
      "node_modules/authored-dependency": { version: "1.0.0", license: "MIT" },
      "node_modules/authored-transitive": { version: "2.0.0", license: "MIT" },
      "node_modules/dev-only": { version: "3.0.0", dev: true, license: "MIT" },
    },
  });
  for (const name of [
    "authored-dependency",
    "authored-transitive",
    "dev-only",
  ]) {
    write(dir, `node_modules/${name}/package.json`, {
      name,
      version:
        name === "authored-transitive"
          ? "2.0.0"
          : name === "dev-only"
            ? "3.0.0"
            : "1.0.0",
    });
    write(
      dir,
      `node_modules/${name}/LICENSE`,
      "Authored fixture permission notice.\n",
    );
  }
  write(dir, "dist/tsdm-workspace.user.js", "// Authored fixture\n");
  write(dir, "dist/forum-client/index.js", "export const example = 1;\n");
  write(dir, "dist/forum-client/package.json", {
    name: "@tsdm/forum-client",
    version: "0.12.0",
    files: ["index.js"],
  });
  write(dir, "dist/build-manifest.json", { forumClientVersion: "0.12.0" });
  const cli = resolve("scripts/package-notices.mjs");
  function check(name, expected, pattern, inspect) {
    const r = spawnSync(process.execPath, [cli], {
      cwd: dir,
      encoding: "utf8",
    });
    let error = null;
    try {
      assert.equal(r.status, expected);
      if (pattern) assert.match(r.stderr, pattern);
      inspect?.();
    } catch (e) {
      error = e.message;
    }
    cases.push({
      name,
      status: error ? "failed" : "passed",
      error,
      output: (r.stdout + r.stderr).replaceAll(dir, "[fixture]"),
    });
  }
  check("public-package-notices", 0, null, () => {
    const text = readFileSync(join(dir, "dist/THIRD_PARTY_NOTICES.md"), "utf8");
    assert.match(text, /authored-dependency/);
    assert.match(text, /authored-transitive/);
    assert.match(text, /Authored fixture permission notice/);
    assert(!text.includes("dev-only"));
    assert.equal(
      readFileSync(
        join(dir, "dist/forum-client/THIRD_PARTY_NOTICES.md"),
        "utf8",
      ),
      text,
    );
    const p = JSON.parse(
      readFileSync(join(dir, "dist/forum-client/package.json")),
    );
    assert(p.files.includes("THIRD_PARTY_NOTICES.md"));
    const m = JSON.parse(readFileSync(join(dir, "dist/build-manifest.json")));
    assert.equal(
      m.noticeInputs["node_modules/authored-transitive/LICENSE"].sha256,
      hash("Authored fixture permission notice.\n"),
    );
  });
  write(dir, "node_modules/authored-dependency/LICENSE", "");
  check("empty-license-refused", 1, /license|notice/i);
}
if (
  slice !== "identity" &&
  slice !== "evidence" &&
  slice !== "freeze" &&
  slice !== "notices" &&
  slice !== "contract" &&
  slice !== "references" &&
  slice !== "installed-accounting" &&
  slice !== "real-references" &&
  slice !== "replay-material"
)
  throw new Error("Unknown slice");
const receipt = {
  schema: 1,
  mode: "release-tooling-synthetic",
  slice,
  node: process.version,
  status: cases.every((c) => c.status === "passed") ? "passed" : "failed",
  cases,
};
write(output, "receipt.json", receipt);
write(
  output,
  "report.md",
  `# Release tooling CLI replay\n\n${receipt.status}; ${cases.length} scenarios. Synthetic fixture semantics only.\n\n` +
    cases.map((c) => `- ${c.name}: ${c.status}`).join("\n") +
    "\n",
);
console.log(
  JSON.stringify({
    status: receipt.status,
    cases: cases.length,
    failed: cases.filter((c) => c.status === "failed").map((c) => c.name),
  }),
);
process.exitCode = receipt.status === "passed" ? 0 : 1;
