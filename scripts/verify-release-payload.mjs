import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { gunzipSync } from "node:zlib";

// This assembly contract can account for accepted historical evidence without
// relabelling it as execution of the current candidate. Original run receipts
// and the immutable packaging-only freeze keep their original formats/verdicts.
const [input, ...flags] = process.argv.slice(2);
assert(
  input && flags.every((f) => f === "--require-qualified"),
  "Usage: node verify-release-payload.mjs PAYLOAD [--require-qualified]",
);
const root = resolve(input);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const digest = /^[a-f0-9]{64}$/;
const expectedCandidate =
  "9a0ec8af6c8feb95745db5fc801081e3bd2b62f6d19227ec9bf989848509b2ea";
const expectedChrome =
  "a3de680f5120fea3db559a404a0c35a68a22aee1d6a36dbf488d63edd449367c";
const expectedCommit = "33c32655f583aa3c0738d22fbd081fce39df69c5";
const expectedLibrary =
  "551e305d61997a05e326079ec9ab1e45b47d8cda9d6b29279d0331ce232e5cdd";
const requiredIds = [
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
  ...Array.from({ length: 8 }, (_, i) => `38.${i + 1}`),
  ...Array.from({ length: 6 }, (_, i) => `40.${i + 1}`),
];
function safePath(name) {
  assert(
    typeof name === "string" &&
      /^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/.test(name) &&
      !name.split("/").some((s) => s === "." || s === ".."),
    `Unsafe relative path: ${name}`,
  );
  return name;
}
function inventory(directory, prefix = "") {
  assert(
    lstatSync(directory).isDirectory() &&
      !lstatSync(directory).isSymbolicLink(),
    "Unsupported linked payload root",
  );
  return readdirSync(directory)
    .sort()
    .flatMap((name) => {
      const relative = safePath(prefix + name),
        path = join(directory, name),
        stat = lstatSync(path);
      assert(!stat.isSymbolicLink(), `Linked public entry: ${relative}`);
      if (stat.isDirectory()) return inventory(path, relative + "/");
      assert(stat.isFile(), `Not a regular public file: ${relative}`);
      return [relative];
    });
}
const names = inventory(root);
const cache = new Map();
function bytes(name) {
  safePath(name);
  assert(names.includes(name), `Missing public reference: ${name}`);
  if (!cache.has(name)) cache.set(name, readFileSync(join(root, name)));
  return cache.get(name);
}
const read = (name) => JSON.parse(bytes(name).toString("utf8"));
function checkIdentity(data, identity, label) {
  assert(
    identity &&
      Number.isSafeInteger(identity.bytes) &&
      identity.bytes >= 0 &&
      digest.test(identity.sha256),
    `Invalid file identity: ${label}`,
  );
  assert(
    data.length === identity.bytes && hash(data) === identity.sha256,
    `File hash/identity mismatch: ${label}`,
  );
}
function sameNames(actual, expected, label) {
  assert.deepEqual(
    [...actual].sort(),
    [...expected].sort(),
    `Exact inventory mismatch: ${label}`,
  );
}
const manifest = read("manifest.json");
sameNames(
  Object.keys(manifest),
  names.filter((n) => n !== "manifest.json"),
  "public manifest",
);
for (const [name, id] of Object.entries(manifest))
  checkIdentity(bytes(name), id, name);
const policy = read("public-files.json");
assert(
  policy.schema === 1 && Array.isArray(policy.files),
  "Invalid public allowlist",
);
sameNames(
  policy.files.map((f) => f.path),
  names.filter((n) => !["manifest.json", "public-files.json"].includes(n)),
  "reviewed allowlist",
);
const kinds = new Set([
  "authored-text",
  "synthetic-source",
  "synthetic-image",
  "qualified-output",
  "replay-archive",
  "verifier",
]);
const sensitive =
  /(?:\/Users\/|\/home\/|\/private\/(?:tmp|var)\/|[A-Za-z]:\\Users\\)|\b(?:ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{24,})/i;
const sensitiveAssignment =
  /\b(?:authorization|cookie|set-cookie|password|access_token|refresh_token)\b["']?\s*[:=]\s*["']?(?:Bearer\s+)?[A-Za-z0-9._~-]{8,}/i;
const sensitiveCodeLiteral =
  /\b(?:authorization|cookie|set-cookie|password|access_token|refresh_token)\b["']?\s*[:=]\s*["'](?:Bearer\s+)?[A-Za-z0-9._~-]{8,}/i;
function scan(name, data) {
  if (
    /\.(?:md|json|ts|mjs|js|txt)$/.test(name) ||
    /(?:^|\/)\.npmrc$/.test(name)
  ) {
    const text = data.toString("utf8");
    // Type annotations such as authorization: Authorization are source syntax,
    // not credential assignments. Source literals still receive secret checks.
    const assignment = /\.(?:ts|mjs|js)$/.test(name)
      ? sensitiveCodeLiteral
      : sensitiveAssignment;
    assert(
      !sensitive.test(text) && !assignment.test(text),
      `Sensitive/private content: ${name}`,
    );
  }
  if (name.endsWith(".png"))
    assert(
      data
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
      `Invalid synthetic image: ${name}`,
    );
}
for (const file of policy.files) {
  assert(file.reviewed === true, `Public content needs review: ${file.path}`);
  assert(kinds.has(file.kind), `Unknown public content kind: ${file.path}`);
  if (file.path.endsWith(".png"))
    assert(
      file.kind === "synthetic-image" &&
        file.path.startsWith("synthetic/images/"),
      "Only authored synthetic images may be public",
    );
  scan(file.path, bytes(file.path));
}

// The prepared archives use regular ustar files only. Reject links, extended
// names and duplicate members instead of extracting an unchecked archive.
function archiveMembers(name, prefix) {
  const data = gunzipSync(bytes(name)),
    members = new Map();
  let offset = 0;
  while (offset + 512 <= data.length) {
    const header = data.subarray(offset, offset + 512);
    if (header.every((b) => b === 0)) break;
    const string = (start, end) =>
      header.subarray(start, end).toString("utf8").split("\0")[0];
    const type = string(156, 157),
      base = string(0, 100),
      directory = string(345, 500);
    const member = safePath(directory ? directory + "/" + base : base);
    assert(
      type === "0" || type === "",
      `Archive member is not a regular file: ${member}`,
    );
    assert(member.startsWith(prefix), `Unexpected archive root: ${member}`);
    const relative = safePath(member.slice(prefix.length));
    assert(!members.has(relative), `Duplicate archive member: ${relative}`);
    const sizeText = string(124, 136).trim();
    assert(/^[0-7]+$/.test(sizeText), `Invalid archive size: ${relative}`);
    const size = parseInt(sizeText, 8),
      start = offset + 512;
    assert(
      Number.isSafeInteger(size) && start + size <= data.length,
      `Truncated archive: ${relative}`,
    );
    const content = data.subarray(start, start + size);
    members.set(relative, content);
    scan(relative, content);
    if (relative.endsWith(".user.js.gz"))
      scan(relative.slice(0, -3), gunzipSync(content));
    offset = start + Math.ceil(size / 512) * 512;
  }
  assert(members.size > 0, `Empty archive: ${name}`);
  return members;
}
const receipt = read("receipt.json"),
  coverage = read("coverage.json");
const releaseRequest = read("release-request.json");
assert(
  releaseRequest.schema === 1 &&
    releaseRequest.repository === "Benson-mk/tsdm-ui" &&
    releaseRequest.targetCommit === expectedCommit &&
    releaseRequest.tag === "v0.4.0" &&
    releaseRequest.publicationAuthorized === false &&
    releaseRequest.publicationPerformed === false &&
    releaseRequest.downloadVerificationPerformed === false,
  "Release target must be the qualified source; publication remains separate",
);
sameNames(
  releaseRequest.assets,
  [
    "tsdm-workspace.user.js",
    "tsdm-forum-client-0.13.0.tgz",
    "THIRD_PARTY_NOTICES.md",
    "tsdm-workspace-0.4.0-release.zip",
    "SHA256SUMS",
  ],
  "prepared release assets",
);
bytes(releaseRequest.notesFile);
assert(
  receipt.schema === 1 &&
    receipt.kind === "release-reconciliation" &&
    receipt.ticket === 40,
  "Unknown release receipt schema",
);
assert(
  receipt.timezone === "Asia/Hong_Kong" &&
    Number.isFinite(Date.parse(receipt.timestamp)),
  "Missing receipt time",
);
assert(
  ["pending-review", "qualified-at-accepted-scope"].includes(receipt.status),
  "Invalid qualification status",
);
assert(
  receipt.candidate.sha256 === expectedCandidate &&
    receipt.candidate.sourceCommit === expectedCommit &&
    receipt.candidate.version === "0.4.0" &&
    receipt.candidate.bytes === 1710524,
  "Wrong qualified candidate identity",
);
const freeze = read("frozen/freeze.json");
assert(
  freeze.gitHead === expectedCommit &&
    freeze.cleanCommitted === true &&
    freeze.mode === "release" &&
    freeze.packagingEligible === true &&
    freeze.releaseEligible === false,
  "Invalid immutable freeze provenance",
);
checkIdentity(
  bytes("frozen/tsdm-workspace.user.js"),
  receipt.candidate,
  "qualified candidate",
);
sameNames(
  names.filter((n) => n.startsWith("frozen/")).map((n) => n.slice(7)),
  [...Object.keys(freeze.outputs), "freeze.json", "manifest.json"],
  "frozen outputs",
);
for (const [name, id] of Object.entries(freeze.outputs))
  checkIdentity(bytes("frozen/" + name), id, "freeze " + name);
for (const [name, id] of Object.entries(read("frozen/manifest.json")))
  checkIdentity(bytes("frozen/" + name), id, "frozen manifest " + name);
assert(
  receipt.library.sha256 === expectedLibrary &&
    receipt.library.version === "0.13.0",
  "Wrong qualified library identity",
);
checkIdentity(
  bytes(receipt.library.file),
  receipt.library,
  "original library tarball",
);
const library = archiveMembers(receipt.library.file, "package/");
sameNames(
  library.keys(),
  Object.keys(receipt.library.members),
  "library members",
);
for (const [name, content] of library) {
  checkIdentity(
    content,
    receipt.library.members[name],
    "library member " + name,
  );
  assert(
    content.equals(bytes("frozen/forum-client/" + name)),
    `Library/freeze mismatch: ${name}`,
  );
}
for (const type of ["workspace", "consumer"]) {
  const members = archiveMembers(`replay/${type}.tar.gz`, type + "/");
  const expected = read(`replay/${type}-inputs.json`);
  sameNames(members.keys(), Object.keys(expected), type + " replay members");
  if (type === "workspace") {
    for (const name of Object.keys(freeze.inputs)) {
      // Preserve the entire application/test graph and root TypeScript
      // configuration graph, not only files a packaging list remembered.
      if (
        name.startsWith("src/") ||
        name.startsWith("tests/") ||
        (!name.includes("/") && /\.(?:ts|json)$/.test(name))
      )
        assert(members.has(name), `Missing required replay input: ${name}`);
    }
  }
  for (const [name, content] of members) {
    checkIdentity(content, expected[name], type + " replay " + name);
    if (type === "workspace")
      checkIdentity(
        content,
        freeze.inputs[name],
        "committed replay input " + name,
      );
  }
  if (type === "consumer")
    assert(
      members.get(receipt.library.file)?.equals(bytes(receipt.library.file)),
      "Consumer replay library identity mismatch",
    );
}
const sources = new Map();
for (const source of receipt.sources) {
  assert(!sources.has(source.id), `Duplicate evidence source: ${source.id}`);
  sources.set(source.id, source);
  bytes(source.artifact);
  assert(
    source.runtime && Object.keys(source.runtime).length > 0,
    `Missing runtime: ${source.id}`,
  );
  if (source.relation === "current-candidate")
    assert(
      source.candidateSha256 === expectedCandidate,
      `Wrong current candidate: ${source.id}`,
    );
}
const chrome = sources.get("chrome-37");
assert(
  chrome?.relation === "historical" &&
    chrome.level === "accepted-historical" &&
    chrome.candidateSha256 === expectedChrome &&
    chrome.originalFinalBundleRetained === false &&
    chrome.authority ===
      "https://github.com/Benson-mk/tsdm-ui/issues/37#issuecomment-6528322104" &&
    chrome.acceptedReuse ===
      "https://github.com/Benson-mk/tsdm-ui/issues/9#issuecomment-6546788571",
  "Historical Chrome identity, authority or retention misrepresented",
);
assert(
  sources.get("edge-38")?.candidateSha256 === expectedCandidate &&
    sources.get("edge-38")?.level === "installed",
  "Missing current installed Edge source",
);
assert(
  sources.get("library-38")?.librarySha256 === expectedLibrary &&
    sources.get("library-38")?.relation === "unchanged-library",
  "Missing unchanged-library evidence",
);
sameNames(
  receipt.deferred.map((d) => String(d.issue)),
  ["39", "47"],
  "deferred checks",
);
for (const d of receipt.deferred)
  assert(
    d.status === "unverified" &&
      d.inReleaseGate === false &&
      d.detail?.length > 0,
    `Deferred #${d.issue} must remain unverified outside the gate`,
  );
assert(
  Object.values(receipt.publication).every((value) => value === false),
  "Preparation cannot claim publication, download or post-publication installation",
);
assert(
  receipt.publication.authorized === false &&
    receipt.publication.downloadVerified === false,
  "Missing publication/download boundary",
);
const statuses = new Set([
  "passed",
  "accepted-historical",
  "failed",
  "blocked",
  "not-run",
  "inconclusive",
]);
const cases = new Map();
for (const c of receipt.cases) {
  assert(!cases.has(c.id), `Duplicate case: ${c.id}`);
  cases.set(c.id, c);
  assert(
    sources.has(c.source) &&
      statuses.has(c.status) &&
      typeof c.required === "boolean",
    `Invalid case/source: ${c.id}`,
  );
  for (const key of ["name", "expected", "observed", "readback"])
    assert(
      typeof c[key] === "string" && c[key].trim(),
      `Missing case ${key}: ${c.id}`,
    );
  assert(
    Array.isArray(c.limits) && Array.isArray(c.artifacts) && c.artifacts.length,
    `Missing case limits/artifacts: ${c.id}`,
  );
  for (const artifact of c.artifacts) bytes(artifact);
  const reference = bytes(c.reference.file);
  if (c.reference.sha256)
    assert(
      hash(reference) === c.reference.sha256,
      `Wrong reference revision: ${c.id}`,
    );
  if (c.reference.heading)
    assert(
      reference
        .toString("utf8")
        .split(/\r?\n/)
        .filter((line) => line === "## " + c.reference.heading).length === 1,
      `Missing/ambiguous reference heading: ${c.id}`,
    );
  if (c.source === "shared-38") {
    const lines = reference.toString("utf8").split(/\r?\n/);
    assert(
      /^\s*test\(/.test(lines[c.reference.line - 1] ?? "") &&
        c.reference.declaration?.length,
      `Missing application declaration reference: ${c.id}`,
    );
  }
  if (c.status === "accepted-historical")
    assert(
      c.source === "chrome-37",
      `Unaccepted historical substitution: ${c.id}`,
    );
  if (c.required)
    assert(
      ["passed", "accepted-historical"].includes(c.status),
      `Required case is ${c.status}: ${c.id}`,
    );
}
const application = read("evidence/application.json");
assert(
  application.candidateSha256 === expectedCandidate &&
    application.cases.length === 1118,
  "Incomplete executed application case inventory",
);
sameNames(
  receipt.cases.filter((c) => c.source === "shared-38").map((c) => c.id),
  application.cases.map((c) => c.id),
  "executed application cases",
);
for (const observed of application.cases) {
  const c = cases.get(observed.id);
  assert(
    c.name === observed.name &&
      c.status === observed.status &&
      observed.status === "passed" &&
      observed.retry === 0 &&
      c.reference.sha256 === observed.reference.sha256,
    `Application case disagrees with retained observation: ${observed.id}`,
  );
}
const consumer = read("evidence/consumer.json");
assert(
  consumer.package.sha256 === expectedLibrary &&
    Object.keys(consumer.checks).length === 20 &&
    Object.values(consumer.checks).every((s) => s === "passed") &&
    consumer.cases.length === 50 &&
    consumer.cases.every((c) => c.status === "passed"),
  "Incomplete clean-consumer observations",
);
assert(
  coverage.schema === 1 && Array.isArray(coverage.requirements),
  "Invalid coverage schema",
);
sameNames(
  coverage.requirements.map((r) => r.id),
  requiredIds,
  "required coverage",
);
for (const row of coverage.requirements) {
  assert(
    ["satisfied", "pending"].includes(row.status) &&
      row.text?.length &&
      Array.isArray(row.cases) &&
      row.cases.length,
    `Invalid requirement coverage: ${row.id}`,
  );
  for (const id of row.cases) {
    const c = cases.get(id);
    assert(c, `Dangling coverage case reference: ${id}`);
    if (row.status === "satisfied")
      assert(
        ["passed", "accepted-historical"].includes(c.status),
        `Coverage contradicts case status: ${row.id}`,
      );
  }
  sameNames(
    row.evidenceSources,
    new Set(row.cases.map((id) => cases.get(id).source)),
    "coverage source references " + row.id,
  );
}
const mappedCases = new Set(coverage.requirements.flatMap((r) => r.cases));
for (const c of cases.values())
  if (c.required)
    assert(
      mappedCases.has(c.id),
      `Required case lacks a coverage reference: ${c.id}`,
    );
if (
  flags.includes("--require-qualified") ||
  receipt.status === "qualified-at-accepted-scope"
) {
  assert(
    receipt.status === "qualified-at-accepted-scope",
    "Qualification review is pending",
  );
  assert(
    coverage.requirements.every((r) => r.status === "satisfied"),
    "Required coverage remains pending",
  );
  for (const role of ["observer", "standards", "spec", "bdfl"]) {
    const signoff = receipt.signoffs[role];
    assert(signoff?.status === "passed", `Missing ${role} review sign-off`);
    if (role !== "observer") bytes(signoff.artifact);
  }
  assert(
    receipt.privacy.inspection === "passed" &&
      receipt.privacy.rawAuthenticatedCapturesIncluded === false,
    "Sanitation/public inspection incomplete",
  );
}
console.log(
  `Verified release payload: ${names.length - 1} manifest files, ${cases.size} cases, ${requiredIds.length} coverage rows; ${receipt.status}. Publication is separate.`,
);
