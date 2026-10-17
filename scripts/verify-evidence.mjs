import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";

const directory = process.argv[2];
if (!directory)
  throw new Error("Usage: npm run evidence:verify -- <package-directory>");
const root = resolve(directory);
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
  throw new Error(
    "Manifest must map relative file names to byte sizes and SHA-256 values.",
  );
}
const actual = [];
function collect(relative = "") {
  for (const entry of readdirSync(join(root, relative), {
    withFileTypes: true,
  })) {
    const name = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) collect(name);
    else if (entry.isFile()) {
      if (name !== "manifest.json") actual.push(name);
    } else throw new Error(`Unsupported package entry: ${name}`);
  }
}
collect();
const names = Object.keys(manifest).sort();
if (JSON.stringify(names) !== JSON.stringify(actual.sort())) {
  throw new Error(
    "Manifest does not cover exactly every package file except its own root manifest.json.",
  );
}
for (const name of names) {
  if (
    !/^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/.test(name) ||
    name.split("/").some((part) => part === "." || part === "..")
  ) {
    throw new Error(`Unsafe relative package path: ${name}`);
  }
  const identity = manifest[name];
  if (
    !identity ||
    typeof identity !== "object" ||
    !Number.isSafeInteger(identity.bytes) ||
    identity.bytes < 0 ||
    !/^[a-f0-9]{64}$/.test(identity.sha256)
  ) {
    throw new Error(`Missing or invalid byte size/SHA-256 identity: ${name}`);
  }
  const bytes = readFileSync(join(root, name));
  if (
    bytes.length !== identity.bytes ||
    createHash("sha256").update(bytes).digest("hex") !== identity.sha256
  ) {
    throw new Error(`Package byte size or SHA-256 mismatch: ${name}`);
  }
}
console.log(
  `Verified exact coverage, safe relative paths, byte sizes and SHA-256 for ${names.length} package files.`,
);
