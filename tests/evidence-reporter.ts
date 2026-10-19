import type {
  Reporter,
  TestCase,
  TestResult,
  FullResult,
} from "@playwright/test/reporter";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
import { stripVTControlCharacters } from "node:util";

type FileIdentity = { bytes: number; sha256: string };
function fileIdentity(path: string): FileIdentity {
  const bytes = readFileSync(path);
  return {
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}
function digest(path: string): string | null {
  return existsSync(path)
    ? createHash("sha256").update(readFileSync(path)).digest("hex")
    : null;
}
export default class EvidenceReporter implements Reporter {
  private cases: Record<string, unknown>[] = [];
  private started = new Date().toISOString();
  private directory = `evidence/runs/${this.started.replaceAll(":", "-")}`;
  onBegin() {
    mkdirSync(`${this.directory}/synthetic`, { recursive: true });
  }
  onTestEnd(test: TestCase, result: TestResult) {
    const attachments: string[] = [];
    for (const [index, attachment] of result.attachments.entries()) {
      const extensions: Record<string, string> = {
        "image/png": "png",
        "text/plain": "txt",
        "application/json": "json",
        "application/octet-stream": "bin",
      };
      const extension = extensions[attachment.contentType];
      if (!extension || !attachment.body) continue;
      const name = `synthetic/${test.id.replace(/[^a-zA-Z0-9-]/g, "_")}-${index}.${extension}`;
      writeFileSync(join(this.directory, name), attachment.body);
      attachments.push(name);
    }
    this.cases.push({
      name: test.title,
      expected: test.title,
      observed: result.status,
      mode: "synthetic-network-edge",
      status: result.status,
      durationMs: result.duration,
      retry: result.retry,
      attachments,
      annotations: test.annotations,
      independentReadback:
        "Network-edge request ledger asserted in application E2E where relevant.",
      failures: result.errors.map((error) =>
        stripVTControlCharacters(error.message ?? "Unknown failure").replaceAll(
          process.cwd(),
          "[checkout]",
        ),
      ),
    });
  }
  onEnd(result: FullResult) {
    const files: Record<string, FileIdentity | null> = {};
    const collect = (dir: string) => {
      if (!existsSync(dir)) return;
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const name = `${dir}/${entry.name}`;
        if (entry.isDirectory()) collect(name);
        else files[name] = fileIdentity(name);
      }
    };
    collect("src");
    collect("tests");
    collect("scripts");
    collect("docs/implementation");
    collect("docs/adr");
    for (const file of [
      "package.json",
      "package-lock.json",
      "vite.config.ts",
      "vite.library.config.ts",
      "tsconfig.json",
      "playwright.config.ts",
    ])
      files[file] = existsSync(file) ? fileIdentity(file) : null;
    const receipt = {
      schema: 1,
      runId: this.started,
      timezone: "Asia/Hong_Kong",
      evidence: "synthetic",
      mode: "application-synthetic",
      preconditions: [
        "Built self-contained userscript",
        "Isolated Chrome context",
        "Only external HTTP responses replaced",
      ],
      runtime: {
        node: process.version,
        openssl: execFileSync("openssl", ["version"], {
          encoding: "utf8",
        }).trim(),
        npmUserAgent: process.env.npm_config_user_agent ?? null,
        platform: process.platform,
        architecture: process.arch,
        playwright: JSON.parse(
          readFileSync("node_modules/@playwright/test/package.json", "utf8"),
        ).version,
      },
      candidate: {
        userscriptSha256: digest("dist/tsdm-workspace.user.js"),
        installedSha256: null,
      },
      sourceManifest: files,
      status: result.status,
      cases: this.cases,
      limits: [
        "No installed manager qualification.",
        "No live forum data, writes or effects.",
        "Synthetic screenshots only.",
      ],
    };
    writeFileSync(
      `${this.directory}/receipt.json`,
      JSON.stringify(receipt, null, 2) + "\n",
    );
    writeFileSync(
      `${this.directory}/report.md`,
      `# Workspace synthetic replay\n\nResult: **${result.status}**. Node ${process.version}.\n\n${this.cases.map((c) => `- ${c.name}: ${c.status}`).join("\n")}\n\nAuthored fixture and scenario snapshots are retained in synthetic/*.spec.ts. Replay with npm run test:e2e from the source checkout identified by this run's receipt. Installed identity, lifecycle, live semantics and full release qualification remain separate. Failures and retries are preserved in receipt.json.\n`,
    );
    writeFileSync(
      `${this.directory}/synthetic/foundation.spec.ts`,
      readFileSync("tests/e2e/foundation.spec.ts"),
    );
    for (const file of readdirSync("tests/e2e")) {
      if (file.endsWith(".spec.ts"))
        writeFileSync(
          `${this.directory}/synthetic/${file}`,
          readFileSync(`tests/e2e/${file}`),
        );
    }
    writeFileSync(
      `${this.directory}/synthetic/http-redirect-fixture.ts`,
      readFileSync("tests/http-redirect-fixture.ts"),
    );
    const manifest: Record<string, FileIdentity> = {};
    for (const file of [
      "receipt.json",
      "report.md",
      ...readdirSync(`${this.directory}/synthetic`).map(
        (name) => `synthetic/${name}`,
      ),
    ])
      manifest[file] = fileIdentity(join(this.directory, file));
    writeFileSync(
      `${this.directory}/manifest.json`,
      JSON.stringify(manifest, null, 2) + "\n",
    );
    console.log(`Authored synthetic evidence: ${this.directory}`);
  }
}
