import { writeFileSync, readFileSync, readdirSync, lstatSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
const lockInput = JSON.parse(readFileSync("package-lock.json", "utf8"));
const noticeInputs = {};
const notices = [
  "# Third-party notices",
  "",
  "Conservative inventory of locked production dependencies, including transitive packages. This inventory does not claim every listed package contributes runtime bytes.",
  "",
];
for (const [directory, locked] of Object.entries(lockInput.packages ?? {})) {
  if (!directory || locked.dev) continue;
  if (
    !/^node_modules\/(?:[A-Za-z0-9@_.-]+\/)*[A-Za-z0-9@_.-]+$/.test(
      directory,
    ) ||
    directory.split("/").includes("..")
  )
    throw new Error("Unsafe locked dependency path");
  const dependency = JSON.parse(
    readFileSync(join(directory, "package.json"), "utf8"),
  );
  if (dependency.version !== locked.version)
    throw new Error(
      `Installed notice dependency differs from lock: ${directory}`,
    );
  const files = readdirSync(directory).filter((name) =>
    /^(?:licen[sc]e|copying|notice)(?:[.-].*)?$/i.test(name),
  );
  if (!files.length)
    throw new Error(`Missing dependency license/notice: ${directory}`);
  notices.push(
    `## ${dependency.name} ${dependency.version}`,
    "",
    `License: ${locked.license ?? "See original license below"}`,
    "",
  );
  for (const name of files.sort()) {
    const path = join(directory, name);
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink())
      throw new Error(`Invalid license/notice input: ${path}`);
    const bytes = readFileSync(path);
    if (!bytes.toString("utf8").trim())
      throw new Error(`Empty license/notice input: ${path}`);
    noticeInputs[path] = {
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
    notices.push(`### ${name}`, "", bytes.toString("utf8"), "");
  }
}
const noticeText = notices.join("\n") + "\n";
writeFileSync("dist/THIRD_PARTY_NOTICES.md", noticeText);
writeFileSync("dist/forum-client/THIRD_PARTY_NOTICES.md", noticeText);
// A packaging stage only: preserve the committed library API/version/README.
const metadata = JSON.parse(
  readFileSync("dist/forum-client/package.json", "utf8"),
);
metadata.files = [
  ...new Set([...(metadata.files ?? []), "THIRD_PARTY_NOTICES.md"]),
];
writeFileSync(
  "dist/forum-client/package.json",
  JSON.stringify(metadata, null, 2) + "\n",
);
const manifest = JSON.parse(readFileSync("dist/build-manifest.json", "utf8"));
manifest.noticeInputs = noticeInputs;
writeFileSync(
  "dist/build-manifest.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
