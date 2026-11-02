import { prepareReleaseNotes } from "./release-notes.mjs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const preview = args.includes("--preview");
const [tag, output, ...extra] = args.filter((arg) => arg !== "--preview");
const versionTag = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
if (!tag || !versionTag.test(tag) || !output || extra.length)
  throw new Error(
    "Usage: node scripts/prepare-tag-release.mjs vMAJOR.MINOR.PATCH [--preview] NEW_OUTPUT",
  );
const version = tag.slice(1);
const destination = resolve(output);
if (existsSync(destination))
  throw new Error("Output already exists; preserve the earlier candidate");
const git = (...values) =>
  execFileSync("git", values, { encoding: "utf8" }).trim();
const commit = git("rev-parse", "HEAD");
if (!preview && git("rev-parse", `refs/tags/${tag}^{commit}`) !== commit)
  throw new Error("Tag does not identify the checked-out commit");
const repository = process.env.RELEASE_REPOSITORY ?? "Benson-mk/tsdm-ui";
if (!/^[\w.-]+\/[\w.-]+$/.test(repository))
  throw new Error("Invalid release repository");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const script = readFileSync("dist/tsdm-ui.user.js");
const manifest = JSON.parse(readFileSync("dist/build-manifest.json", "utf8"));
const library = JSON.parse(
  readFileSync("dist/forum-client/package.json", "utf8"),
);
if (
  manifest.version !== version ||
  script.toString("utf8").match(/^\/\/\s+@version\s+(\S+)\s*$/m)?.[1] !==
    version
)
  throw new Error("Tag version differs from the built userscript or manifest");
if (
  manifest.userscript.sha256 !== hash(script) ||
  manifest.userscript.bytes !== script.length
)
  throw new Error("Userscript differs from its build manifest");
if (
  library.name !== "@tsdm/forum-client" ||
  library.version !== manifest.forumClientVersion
)
  throw new Error("Library identity differs from the build manifest");
for (const name of [
  "dist/THIRD_PARTY_NOTICES.md",
  "dist/forum-client/index.js",
  "dist/forum-client/index.d.ts",
])
  if (!readFileSync(name).length)
    throw new Error(`Empty required artifact: ${name}`);
const npm = process.env.npm_execpath;
if (!npm)
  throw new Error(
    "Run through npm run release:prepare so the selected npm runtime is recorded",
  );

const candidates = git("tag", "--merged", "HEAD")
  .split("\n")
  .filter((name) => name !== tag && versionTag.test(name));
const previousTag = candidates.length
  ? git(
      "describe",
      "--tags",
      "--abbrev=0",
      ...candidates.flatMap((name) => ["--match", name]),
      "HEAD",
    )
  : null;
const notes = prepareReleaseNotes({
  tag,
  commit,
  previousTag,
  repository,
  github: process.env.RELEASE_GITHUB_NOTES === "true",
});

mkdirSync(destination, { recursive: true });
for (const name of [
  "tsdm-ui.user.js",
  "THIRD_PARTY_NOTICES.md",
  "build-manifest.json",
])
  copyFileSync(join("dist", name), join(destination, name));
copyFileSync(
  fileURLToPath(new URL("../docs/releases/INSTALL.md", import.meta.url)),
  join(destination, "INSTALL.md"),
);
const [packed] = JSON.parse(
  execFileSync(
    process.execPath,
    [
      npm,
      "pack",
      "./dist/forum-client",
      "--ignore-scripts",
      "--pack-destination",
      destination,
      "--json",
    ],
    { encoding: "utf8" },
  ),
);
if (packed.name !== library.name || packed.version !== library.version)
  throw new Error("Packed library identity mismatch");
writeFileSync(join(destination, "RELEASE_NOTES.md"), notes);
const assets = ["tsdm-ui.user.js"];
const receipt = {
  schema: 1,
  tag,
  version,
  commit,
  previousTag,
  preview,
  libraryVersion: library.version,
  node: process.version,
  npm: execFileSync(process.execPath, [npm, "--version"], {
    encoding: "utf8",
  }).trim(),
  installedQualification: "not-assessed",
  assets,
};
writeFileSync(
  join(destination, "release.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
writeFileSync(
  join(destination, "SHA256SUMS"),
  readdirSync(destination)
    .sort()
    .map((name) => `${hash(readFileSync(join(destination, name)))}  ${name}\n`)
    .join(""),
);
console.log(
  `Prepared ${tag} at ${commit}; ${preview ? "preview only" : "owner approval required"}. No Release created.`,
);
