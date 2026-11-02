import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  lstatSync,
  realpathSync,
} from "node:fs";
import { join, resolve, relative, dirname, basename } from "node:path";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const [input, output, npmCli, ...flags] = process.argv.slice(2);
if (
  !input ||
  !output ||
  !npmCli ||
  flags.some((f) => f !== "--development-snapshot")
)
  throw new Error(
    "Usage: node scripts/freeze-release.mjs <checkout> <new-output> <npm-cli> [--development-snapshot]",
  );
const root = realpathSync(resolve(input)),
  destination = join(realpathSync(dirname(resolve(output))), basename(output)),
  npm = realpathSync(resolve(npmCli));
if (existsSync(destination))
  throw new Error("Output already exists; preserve the earlier candidate");
if (!relative(root, destination).startsWith(".."))
  throw new Error("Freeze output must be outside the input checkout");
const development = flags.includes("--development-snapshot");
const commands = [];
function run(command, args) {
  commands.push([
    command === process.execPath ? "node" : command,
    ...args.map((a) =>
      a === npm
        ? "[npm-cli]"
        : toolingPaths?.includes(a)
          ? `[tooling]/${basename(a)}`
          : a,
    ),
  ]);
  try {
    return execFileSync(command, args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    throw new Error(
      `Command failed: ${command === process.execPath ? "node" : command} ${args.map((a) => (a === npm ? "[npm-cli]" : a)).join(" ")}\n${String(error.stderr ?? "").replaceAll(root, "[checkout]")}`,
      { cause: error },
    );
  }
}
const git = (...args) => run("git", args).trim();
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
function identity(path) {
  const st = lstatSync(path);
  if (!st.isFile() || st.isSymbolicLink())
    throw new Error(`Unsupported source/output entry: ${relative(root, path)}`);
  const bytes = readFileSync(path);
  return { bytes: bytes.length, sha256: sha(bytes), mode: st.mode & 0o777 };
}
function trackedNames() {
  return run("git", ["ls-files", "-z"]).split("\0").filter(Boolean).sort();
}
function inputs() {
  const tracked = trackedNames(),
    names = new Set(tracked);
  for (const name of run("git", [
    "ls-files",
    "--others",
    "--exclude-standard",
    "-z",
  ])
    .split("\0")
    .filter(Boolean))
    names.add(name);
  // These source trees cannot hide ignored files from the locked input set.
  function walk(dir) {
    if (!existsSync(join(root, dir))) return;
    for (const e of readdirSync(join(root, dir), { withFileTypes: true })) {
      const name = dir ? `${dir}/${e.name}` : e.name;
      if (name === "evidence/runs") continue;
      if (e.isDirectory()) walk(name);
      else names.add(name);
    }
  }
  for (const dir of ["src", "scripts", "tests", "docs", "evidence"]) walk(dir);
  if (!development)
    for (const name of names)
      if (!tracked.includes(name))
        throw new Error(`Untracked or ignored relevant input: ${name}`);
  return Object.fromEntries(
    [...names].sort().map((name) => [name, identity(join(root, name))]),
  );
}
const toolingPaths = ["freeze-release.mjs", "package-notices.mjs"].map((name) =>
  fileURLToPath(new URL(name, import.meta.url)),
);
const toolingInputs = Object.fromEntries(
  toolingPaths.map((path) => [basename(path), identity(path)]),
);
const head = git("rev-parse", "HEAD");
const status = () =>
  run("git", ["status", "--porcelain=v1", "--untracked-files=all"]);
const beforeStatus = status();
if (!development && beforeStatus)
  throw new Error(
    "Release requires a clean committed checkout; dirty or untracked input found",
  );
const before = inputs();
if (existsSync(join(root, "dist")))
  throw new Error(
    "Existing dist output must be preserved elsewhere before freeze; a fresh build must not reuse stale artifacts",
  );
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const lock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8"));
if (process.version !== `v${pkg.engines?.node}`)
  throw new Error("Node runtime does not match package engines");
const npmVersion = run(process.execPath, [npm, "--version"]).trim();
if (npmVersion !== pkg.engines?.npm)
  throw new Error("npm runtime does not match package engines");
if (
  lock.lockfileVersion !== 3 ||
  lock.name !== pkg.name ||
  lock.version !== pkg.version ||
  lock.packages?.[""]?.version !== pkg.version
)
  throw new Error("Lock identity does not match package");
const stable = () => {
  if (
    git("rev-parse", "HEAD") !== head ||
    status() !== beforeStatus ||
    JSON.stringify(inputs()) !== JSON.stringify(before) ||
    JSON.stringify(
      Object.fromEntries(
        toolingPaths.map((path) => [basename(path), identity(path)]),
      ),
    ) !== JSON.stringify(toolingInputs)
  )
    throw new Error("Input drift: checkout changed during installation/build");
};
run(process.execPath, [npm, "ci", "--offline"]);
stable();
run(process.execPath, [npm, "run", "build"]);
stable();
const dist = join(root, "dist");
if (!existsSync(join(dist, "THIRD_PARTY_NOTICES.md"))) {
  run(process.execPath, [toolingPaths[1]]);
  stable();
}
const artifacts = {};
function collect(dir = "") {
  for (const e of readdirSync(join(dist, dir), { withFileTypes: true })) {
    const name = dir ? `${dir}/${e.name}` : e.name;
    if (e.isDirectory()) collect(name);
    else {
      const id = identity(join(dist, name));
      artifacts[name] = {
        ...id,
        gzipBytes: gzipSync(readFileSync(join(dist, name))).length,
      };
    }
  }
}
if (!existsSync(dist)) throw new Error("Missing build output directory");
collect();
for (const name of [
  "tsdm-workspace.user.js",
  "forum-client/index.js",
  "forum-client/index.d.ts",
  "forum-client/types.d.ts",
  "forum-client/package.json",
  "forum-client/README.md",
  "THIRD_PARTY_NOTICES.md",
])
  if (!artifacts[name]?.bytes)
    throw new Error(`Missing or empty required output: ${name}`);
const library = JSON.parse(
  readFileSync(join(dist, "forum-client/package.json"), "utf8"),
);
if (
  library.name !== "@tsdm/forum-client" ||
  !/^\d+\.\d+\.\d+$/.test(library.version) ||
  library.type !== "module" ||
  library.exports?.["."]?.types !== "./index.d.ts" ||
  library.exports?.["."]?.import !== "./index.js"
)
  throw new Error("Library package identity/exports mismatch");
const buildManifest = existsSync(join(dist, "build-manifest.json"))
  ? JSON.parse(readFileSync(join(dist, "build-manifest.json"), "utf8"))
  : null;
if (buildManifest && buildManifest.forumClientVersion !== library.version)
  throw new Error("Library version differs from committed build manifest");
const script = readFileSync(join(dist, "tsdm-workspace.user.js"), "utf8");
const block = script.match(
  /^\/\/ ==UserScript==\r?\n([\s\S]*?)^\/\/ ==\/UserScript==/m,
)?.[1];
if (!block) throw new Error("Missing userscript metadata");
const meta = new Map();
for (const m of block.matchAll(/^\/\/\s+@(\S+)\s+(.+)$/gm)) {
  const key = m[1];
  meta.set(key, [...(meta.get(key) ?? []), m[2].trim()]);
}
const expected = {
  name: ["TSDM Workspace"],
  namespace: ["https://github.com/Benson-mk/tsdm-ui"],
  version: [pkg.version],
  match: ["https://www.tsdm39.com/*"],
  exclude: ["https://www.tsdm39.com/*tsdm-native=1*"],
  grant: ["GM_registerMenuCommand"],
  "run-at": ["document-end"],
};
for (const [key, value] of Object.entries(expected))
  if (JSON.stringify(meta.get(key)) !== JSON.stringify(value))
    throw new Error(`Unexpected userscript metadata ${key}`);
for (const key of meta.keys())
  if (![...Object.keys(expected), "description"].includes(key))
    throw new Error(`Unapproved userscript metadata ${key}`);
if (
  /\bimport\s*(?:\([^)]*https?:|[^;]*from\s*["']https?:)|<script\b[^>]*src\s*=\s*["']https?:/i.test(
    script,
  )
)
  throw new Error("External runtime/CDN script found");
const notices = readFileSync(join(dist, "THIRD_PARTY_NOTICES.md"), "utf8");
for (const name of Object.keys(pkg.dependencies ?? {}))
  if (!notices.includes(name))
    throw new Error(`Missing bundled dependency notice: ${name}`);
// Buffer every final output before writing; detect mutation during capture too.
const contents = Object.entries(artifacts).map(([name, id]) => {
  const bytes = readFileSync(join(dist, name));
  if (sha(bytes) !== id.sha256)
    throw new Error(`Output hash mismatch during capture: ${name}`);
  return [name, bytes];
});
stable();
const receipt = {
  schema: 1,
  mode: development ? "development-snapshot" : "release",
  releaseEligible: false,
  packagingEligible: !development,
  cleanCommitted: !beforeStatus && !development,
  gitHead: head,
  tools: {
    node: process.version,
    npm: npmVersion,
    nodeSha256: sha(readFileSync(process.execPath)),
    npmCliSha256: sha(readFileSync(npm)),
  },
  lock: before["package-lock.json"],
  toolingInputs,
  provenance:
    "Git HEAD and inputs identify committed product checkout; toolingInputs independently pin the external packaging commands, which may be uncommitted during development qualification.",
  applicationVersion: pkg.version,
  libraryVersion: library.version,
  noticeInputs: buildManifest?.noticeInputs ?? {},
  reka: {
    version: pkg.dependencies?.["reka-ui"] ?? null,
    imports: Object.keys(before)
      .filter((name) => name.startsWith("src/") && /\.(?:ts|vue)$/.test(name))
      .flatMap((name) =>
        [
          ...readFileSync(join(root, name), "utf8").matchAll(
            /import\s*\{([^}]+)\}\s*from\s*["']reka-ui["']/g,
          ),
        ].map((match) => ({
          file: name,
          names: match[1]
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        })),
      ),
    measurement:
      "Output byte/gzip identities below are the actual complete emitted artifacts, including selected Reka imports. No dependency-only probe, startup guarantee or byte budget is inferred.",
  },
  commands,
  inputs: before,
  outputs: artifacts,
  metadata: Object.fromEntries(meta),
  limits: [
    "Freeze establishes immutable packaging only. Required consumer, installed, platform and evidence qualification remain separate.",
  ],
};
mkdirSync(destination, { recursive: true });
for (const [name, bytes] of contents) {
  mkdirSync(join(destination, name, ".."), { recursive: true });
  writeFileSync(join(destination, name), bytes);
}
writeFileSync(
  join(destination, "freeze.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
const manifest = Object.fromEntries(
  [
    ...contents,
    ["freeze.json", readFileSync(join(destination, "freeze.json"))],
  ].map(([name, bytes]) => [name, { bytes: bytes.length, sha256: sha(bytes) }]),
);
writeFileSync(
  join(destination, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  `Frozen ${contents.length} outputs as ${receipt.mode}; qualification is separate.`,
);
