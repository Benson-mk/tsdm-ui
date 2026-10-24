import { readFileSync, lstatSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import ts from "typescript";

// Public evidence is deliberately authored. Existing raw execution receipts are
// retained unchanged and are not silently converted into qualification evidence.
export const requiredCoverageIds = [
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
const statuses = ["passed", "failed", "blocked", "not-run", "inconclusive"];
const levels = ["synthetic", "live", "installed", "clean-node-consumer"];
const safe = /^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/;
const digest = /^[a-f0-9]{64}$/;
function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}
function object(value, keys, label) {
  requireValue(
    value && typeof value === "object" && !Array.isArray(value),
    `Invalid ${label} schema`,
  );
  requireValue(
    Object.keys(value).length === keys.length &&
      keys.every((k) => Object.hasOwn(value, k)),
    `Unexpected or missing ${label} schema field`,
  );
}
function string(value, label) {
  requireValue(
    typeof value === "string" && value.trim().length > 0,
    `Missing ${label}`,
  );
}
function array(value, label) {
  requireValue(Array.isArray(value), `Invalid ${label} schema`);
}
export function publicPath(name) {
  requireValue(
    typeof name === "string" &&
      safe.test(name) &&
      !name.split("/").some((p) => p === "." || p === ".."),
    `Unsafe public path: ${name}`,
  );
  return name;
}
export function regularFile(root, name) {
  requireValue(
    !lstatSync(root).isSymbolicLink(),
    "Unsupported linked public root",
  );
  publicPath(name);
  let path = root;
  for (const part of name.split("/")) {
    path = join(path, part);
    requireValue(
      !lstatSync(path).isSymbolicLink(),
      `Unsupported linked public entry: ${name}`,
    );
  }
  requireValue(lstatSync(path).isFile(), `Unsupported public entry: ${name}`);
  return readFileSync(path);
}
const sensitive =
  /(?:\/Users\/|\/home\/|\/private\/|\/var\/folders\/|\/tmp\/|[A-Za-z]:\\(?:Users|Documents and Settings)\\)|(?:\b(?:authorization|cookie|set-cookie|formhash|password|access_token|refresh_token)\b\s*["']?\s*[:=])|(?:\bBearer\s+[A-Za-z0-9._~-]+)/i;
export function validatePublicEvidence(root, requirePass = false) {
  const read = (name) => JSON.parse(regularFile(root, name).toString("utf8"));
  const policy = read("public-files.json");
  object(policy, ["schema", "files"], "public allowlist");
  requireValue(policy.schema === 1, "Unknown public allowlist schema");
  array(policy.files, "public files");
  const names = new Set();
  for (const item of policy.files) {
    object(item, ["path", "kind", "reviewed"], "public file");
    publicPath(item.path);
    requireValue(!names.has(item.path), `Duplicate public path: ${item.path}`);
    names.add(item.path);
    requireValue(
      item.reviewed === true,
      `Public artifact needs authored-content review: ${item.path}`,
    );
    const summary = [
      "receipt.json",
      "coverage.json",
      "report.md",
      "README.md",
      "source-manifest.json",
    ].includes(item.path);
    const artifact =
      /^synthetic\/(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.(?:json|txt|md|ts|mjs|png)$/.test(
        item.path,
      );
    requireValue(
      (summary && item.kind === "authored-summary") ||
        (artifact && item.kind === "synthetic-artifact") ||
        (/^procedures\/[A-Za-z0-9_.-]+\.md$/.test(item.path) &&
          item.kind === "authored-procedure"),
      `Not an allowlisted public artifact: ${item.path}`,
    );
    const bytes = regularFile(root, item.path);
    if (item.path.endsWith(".png"))
      requireValue(
        bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
        `Malformed synthetic PNG: ${item.path}`,
      );
    else
      requireValue(
        !sensitive.test(
          /^synthetic\/.+\.(?:ts|mjs)$/.test(item.path)
            ? bytes
                .toString("utf8")
                .replace(
                  /\bformhash(?:=["']?SYNTHETIC_PUBLIC_FORM_TOKEN(?=[&"'`<>\s])|["']?\s*:\s*["']SYNTHETIC_PUBLIC_FORM_TOKEN["'])/g,
                  "authored-form-sentinel",
                )
            : bytes.toString("utf8"),
        ),
        `Sensitive/private content in public artifact: ${item.path}`,
      );
  }
  for (const name of [
    "receipt.json",
    "coverage.json",
    "report.md",
    "README.md",
    "source-manifest.json",
  ])
    requireValue(names.has(name), `Missing public artifact: ${name}`);
  const receipt = read("receipt.json");
  object(
    receipt,
    [
      "schema",
      "runId",
      "timestamp",
      "timezone",
      "status",
      "candidate",
      "source",
      "lockSha256",
      "tools",
      "runtime",
      "cases",
    ],
    "receipt",
  );
  requireValue(receipt.schema === 3, "Unknown public receipt schema");
  string(receipt.runId, "runId");
  requireValue(receipt.timezone === "Asia/Hong_Kong", "Invalid timezone");
  requireValue(statuses.includes(receipt.status), "Invalid receipt status");
  object(receipt.candidate, ["userscriptSha256"], "candidate");
  requireValue(
    digest.test(receipt.candidate.userscriptSha256),
    "Invalid candidate SHA256",
  );
  requireValue(
    typeof receipt.timestamp === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
        receipt.timestamp,
      ) &&
      Number.isFinite(Date.parse(receipt.timestamp)),
    "Invalid receipt timestamp",
  );
  function revision(reference, label) {
    object(reference, ["file", "sha256"], label);
    requireValue(names.has(reference.file), `Missing ${label} artifact`);
    requireValue(
      digest.test(reference.sha256) &&
        createHash("sha256")
          .update(regularFile(root, reference.file))
          .digest("hex") === reference.sha256,
      `${label} hash/revision mismatch`,
    );
  }
  object(receipt.source, ["revision", "manifest"], "source");
  string(receipt.source.revision, "source revision");
  revision(receipt.source.manifest, "source manifest");
  requireValue(
    receipt.source.manifest.file === "source-manifest.json",
    "Invalid source manifest reference",
  );
  const sourceManifest = read("source-manifest.json");
  requireValue(
    sourceManifest &&
      typeof sourceManifest === "object" &&
      !Array.isArray(sourceManifest) &&
      Object.keys(sourceManifest).length > 0,
    "Invalid source manifest",
  );
  for (const [file, id] of Object.entries(sourceManifest)) {
    publicPath(file);
    object(id, ["bytes", "sha256"], "source identity");
    requireValue(
      Number.isSafeInteger(id.bytes) && id.bytes >= 0 && digest.test(id.sha256),
      "Invalid source identity",
    );
  }
  requireValue(
    digest.test(receipt.lockSha256) &&
      sourceManifest["package-lock.json"]?.sha256 === receipt.lockSha256,
    "Lock identity mismatch",
  );
  array(receipt.tools, "tools");
  requireValue(receipt.tools.length > 0, "Missing tool identities");
  for (const tool of receipt.tools) {
    object(tool, ["name", "version", "sha256"], "tool");
    string(tool.name, "tool name");
    string(tool.version, "tool version");
    requireValue(digest.test(tool.sha256), "Invalid tool identity");
  }
  object(receipt.runtime, ["os", "browser", "manager"], "runtime");
  for (const observation of Object.values(receipt.runtime)) {
    object(
      observation,
      ["status", "name", "version", "detail"],
      "runtime observation",
    );
    requireValue(
      ["observed", "not-applicable", "unknown"].includes(observation.status),
      "Invalid runtime observation status",
    );
    string(observation.detail, "runtime observation detail");
    if (observation.status === "observed") {
      string(observation.name, "runtime name");
      string(observation.version, "runtime version");
    } else
      requireValue(
        observation.name === null && observation.version === null,
        "Unknown/nonapplicable runtime identity must not be fabricated",
      );
  }
  array(receipt.cases, "cases");
  const cases = new Map();
  for (const c of receipt.cases) {
    object(
      c,
      [
        "id",
        "name",
        "status",
        "evidenceLevel",
        "candidateSha256",
        "installedSha256",
        "reference",
        "fixtures",
        "capabilities",
        "expected",
        "observed",
        "limits",
        "readback",
        "artifacts",
      ],
      "case",
    );
    string(c.id, "case ID");
    string(c.name, "case name");
    requireValue(!cases.has(c.id), `Duplicate case: ${c.id}`);
    cases.set(c.id, c);
    requireValue(statuses.includes(c.status), `Invalid case status: ${c.id}`);
    requireValue(
      levels.includes(c.evidenceLevel),
      `Missing/invalid evidence level: ${c.id}`,
    );
    requireValue(
      c.candidateSha256 === receipt.candidate.userscriptSha256,
      `Wrong case candidate: ${c.id}`,
    );
    requireValue(
      c.evidenceLevel === "installed"
        ? c.status === "passed"
          ? c.installedSha256 === c.candidateSha256
          : c.installedSha256 === null ||
            (typeof c.installedSha256 === "string" &&
              digest.test(c.installedSha256))
        : c.installedSha256 === null,
      `Missing or wrong installed identity: ${c.id}`,
    );
    for (const field of ["expected", "observed"])
      string(c[field], `case ${field}`);
    for (const field of ["capabilities", "limits"]) {
      array(c[field], field);
      for (const value of c[field]) string(value, field);
    }
    requireValue(c.capabilities.length > 0, "Missing capability preconditions");
    array(c.fixtures, "fixtures");
    for (const fixture of c.fixtures) revision(fixture, "fixture");
    object(
      c.reference,
      ["kind", "file", "case", "sha256", "entry"],
      "reference",
    );
    string(c.reference.case, "reference case");
    revision(
      { file: c.reference.file, sha256: c.reference.sha256 },
      "case reference",
    );
    const ref = c.reference;
    requireValue(
      ["playwright", "cli", "manual"].includes(ref.kind),
      "Unknown case reference kind",
    );
    const text = regularFile(root, ref.file).toString("utf8");
    if (ref.kind === "manual") {
      requireValue(
        ["live", "installed"].includes(c.evidenceLevel) &&
          /^procedures\/.+\.md$/.test(ref.file) &&
          ref.entry === null,
        "Invalid manual reference kind/path/entry",
      );
      requireValue(
        text.split(/\r?\n/).filter((line) => line.trim() === `## ${ref.case}`)
          .length === 1,
        `Missing or ambiguous manual subcase: ${ref.case}`,
      );
    } else {
      const playwright = ref.kind === "playwright";
      requireValue(
        playwright
          ? ref.entry === null && /\.spec\.ts$/.test(ref.file)
          : ["synthetic", "clean-node-consumer"].includes(c.evidenceLevel) &&
              /\.mjs$/.test(ref.file) &&
              typeof ref.entry === "string" &&
              /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(ref.entry),
        `Invalid ${ref.kind} declaration reference entry/path/level`,
      );
      const source = ts.createSourceFile(
        ref.file,
        text,
        ts.ScriptTarget.Latest,
        true,
      );
      let found = false;
      const matches = (node) =>
        node &&
        (((ts.isStringLiteral(node) ||
          ts.isNoSubstitutionTemplateLiteral(node)) &&
          node.text === ref.case) ||
          (ts.isTemplateExpression(node) &&
            node.getText(source).slice(1, -1) === ref.case));
      function visit(node) {
        if (
          ts.isCallExpression(node) &&
          node.expression.getText(source) === (playwright ? "test" : ref.entry)
        ) {
          if (matches(node.arguments[0])) found = true;
          // Existing public consumer suites also emit named results through
          // draftCases.push({name: "...", status: ...}). Match that exact call.
          if (
            !playwright &&
            node.arguments[0] &&
            ts.isObjectLiteralExpression(node.arguments[0])
          ) {
            for (const property of node.arguments[0].properties)
              if (
                ts.isPropertyAssignment(property) &&
                property.name.getText(source).replace(/["']/g, "") === "name" &&
                matches(property.initializer)
              )
                found = true;
          }
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
      requireValue(
        found,
        `Nonexistent ${ref.kind} declaration case: ${ref.case}`,
      );
    }
    object(c.readback, ["kind", "artifact", "result"], "readback");
    requireValue(
      ["independent-state", "authored-observation", "not-applicable"].includes(
        c.readback.kind,
      ),
      `Invalid readback kind: ${c.id}`,
    );
    requireValue(
      names.has(c.readback.artifact),
      `Missing readback artifact: ${c.id}`,
    );
    string(c.readback.result, "independent readback result");
    array(c.artifacts, "case artifacts");
    requireValue(c.artifacts.length > 0, `Missing case artifacts: ${c.id}`);
    for (const file of c.artifacts)
      requireValue(names.has(file), `Missing case artifact: ${file}`);
  }
  const coverage = read("coverage.json");
  object(coverage, ["schema", "requirements"], "coverage");
  requireValue(coverage.schema === 1, "Unknown coverage schema");
  array(coverage.requirements, "requirements");
  const seen = new Set();
  for (const r of coverage.requirements) {
    object(
      r,
      ["id", "status", "cases", "gap", "requiredLevels"],
      "requirement",
    );
    string(r.id, "requirement ID");
    requireValue(!seen.has(r.id), `Duplicate requirement: ${r.id}`);
    seen.add(r.id);
    requireValue(
      statuses.includes(r.status),
      `Invalid requirement status: ${r.id}`,
    );
    array(r.cases, "requirement cases");
    array(r.requiredLevels, "required evidence levels");
    requireValue(
      r.requiredLevels.length > 0 &&
        r.requiredLevels.every((level) => levels.includes(level)),
      `Missing required evidence levels: ${r.id}`,
    );
    requireValue(typeof r.gap === "string", "Invalid requirement gap");
    for (const id of r.cases)
      requireValue(cases.has(id), `Unknown coverage case: ${id}`);
    if (r.status === "passed")
      requireValue(
        r.cases.length > 0 &&
          r.cases.every((id) => cases.get(id).status === "passed") &&
          r.gap === "",
        `Coverage pass contradicts case status: ${r.id}`,
      );
    if (r.status === "passed") {
      for (const level of r.requiredLevels)
        requireValue(
          r.cases.some(
            (id) =>
              cases.get(id).status === "passed" &&
              cases.get(id).evidenceLevel === level,
          ),
          `Missing passed required evidence level ${level}: ${r.id}`,
        );
    } else
      requireValue(
        r.gap.trim().length > 0,
        `Missing nonpassing coverage explanation: ${r.id}`,
      );
  }
  for (const id of requiredCoverageIds)
    requireValue(seen.has(id), `Missing required coverage: ${id}`);
  const allPassed =
    receipt.cases.length > 0 &&
    receipt.cases.every((c) => c.status === "passed") &&
    coverage.requirements.every((r) => r.status === "passed");
  requireValue(
    receipt.status !== "passed" || allPassed,
    "Receipt pass contradicts case/coverage status",
  );
  if (requirePass)
    requireValue(
      receipt.status === "passed" && allPassed,
      "Required coverage is not all passed; qualification remains blocked",
    );
  return [...names, "public-files.json"];
}
