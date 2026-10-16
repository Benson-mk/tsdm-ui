import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const stage = process.argv[2] || "bundled";
if (!["dev", "bundled"].includes(stage)) throw new Error("Use dev or bundled");
const reportPath = process.argv[3] || "test-results/results.json";
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const digest = (file) =>
  crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const tests = [];
let userAgent;
function readSuite(suite, parents = []) {
  for (const spec of suite.specs || [])
    for (const test of spec.tests) {
      const result = test.results.at(-1);
      const attachment = result.attachments.find(
        (item) => item.name === "source-and-runtime",
      );
      const runtime = attachment?.body
        ? JSON.parse(Buffer.from(attachment.body, "base64"))
        : attachment?.path
          ? JSON.parse(fs.readFileSync(attachment.path, "utf8"))
          : null;
      userAgent ||= runtime?.userAgent;
      tests.push({
        journey: [...parents, suite.title, spec.title].join(" / "),
        expectedStatus: test.expectedStatus,
        observedStatus: result.status,
        durationMs: result.duration,
        sourceSha256:
          runtime?.source == null
            ? null
            : crypto.createHash("sha256").update(runtime.source).digest("hex"),
        note:
          test.expectedStatus === "failed"
            ? "Intentional stock Radix focus failure; not a successful user journey."
            : undefined,
      });
    }
  for (const child of suite.suites || [])
    readSuite(child, [...parents, suite.title]);
}
for (const suite of report.suites) readSuite(suite);
const files = [];
function collect(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(file);
    else files.push({ file, sha256: digest(file) });
  }
}
collect("src");
collect("probes");
for (const file of [
  "package.json",
  "package-lock.json",
  "vite.config.ts",
  "tsconfig.json",
  "playwright.config.ts",
])
  files.push({ file, sha256: digest(file) });
const provenance = JSON.parse(
  fs.readFileSync("evidence/editor-provenance.json", "utf8"),
);
for (const item of provenance.files)
  if (digest(item.file) !== item.sha256)
    throw new Error(`Frozen editor changed: ${item.file}`);
const payloads = ["vue", "react"].map((framework) => {
  const file = `dist/${framework}/comparison-${framework}.user.js`;
  const data = fs.readFileSync(file, "utf8");
  const header = data.split("// ==/UserScript==")[0];
  if (/^\/\/\s*@(?:require|resource)\b/m.test(header))
    throw new Error(`External runtime in ${file}`);
  const matches = [...header.matchAll(/^\/\/\s*@match\s+(.+)$/gm)].map(
    (match) => match[1],
  );
  if (
    matches.length !== 2 ||
    matches.some(
      (value) => !/^http:\/\/(127\.0\.0\.1|localhost):4177\/\*$/.test(value),
    )
  )
    throw new Error(`Nonlocal match in ${file}`);
  return {
    file,
    bytes: fs.statSync(file).size,
    sha256: digest(file),
    matches,
    externalRuntimeMetadata: false,
  };
});
fs.mkdirSync("evidence/screenshots", { recursive: true });
function screenshots(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) screenshots(file);
    else if (/^(vue|react)-(desktop|narrow)\.png$/.test(entry.name))
      fs.copyFileSync(file, `evidence/screenshots/${stage}-${entry.name}`);
  }
}
screenshots(path.dirname(reportPath));
const receipt = {
  stage,
  evidenceLevel:
    stage === "dev"
      ? "Vite development server, synthetic browser fixture"
      : "Built userscript JS injected into a synthetic browser page; no userscript manager",
  startedAt: report.stats.startTime,
  node: process.versions.node,
  npm: execFileSync("npm", ["--version"], { encoding: "utf8" }).trim(),
  userAgent,
  dependencies: pkg.devDependencies,
  sourceManifest: files,
  payloads,
  actualPassed: tests.filter(
    (t) => t.expectedStatus === "passed" && t.observedStatus === "passed",
  ).length,
  expectedFailures: tests.filter(
    (t) => t.expectedStatus === "failed" && t.observedStatus === "failed",
  ).length,
  unexpected: tests.filter((t) => t.expectedStatus !== t.observedStatus).length,
  tests,
  limits: [
    "No live forum or installed Tampermonkey test",
    "No Tauri/mobile test",
    "No native Chinese IME or screen-reader qualification",
    "No full BBCode corpus or source/visual caret-mapping qualification",
    "No whole-project speed or framework performance ranking",
  ],
};
const output = `evidence/${stage}-receipt.json`;
fs.writeFileSync(output, JSON.stringify(receipt, null, 2) + "\n");
console.log(
  `${output}: ${receipt.actualPassed} passing journeys, ${receipt.expectedFailures} expected stock-library failure, ${receipt.unexpected} unexpected results`,
);
if (receipt.unexpected) process.exitCode = 1;
