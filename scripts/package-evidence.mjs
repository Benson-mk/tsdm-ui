import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import { validatePublicEvidence, regularFile } from "./public-evidence.mjs";

const [input, output, ...flags] = process.argv.slice(2);
if (!input || !output || flags.some((f) => f !== "--require-pass"))
  throw new Error(
    "Usage: node scripts/package-evidence.mjs <authored-input> <new-output> [--require-pass]",
  );
const root = resolve(input),
  destination = resolve(output);
if (existsSync(destination))
  throw new Error("Output already exists; preserve previous evidence");
const files = validatePublicEvidence(root, flags.includes("--require-pass"));
// Read/validate all bytes before publishing any output; copy only the allowlist.
const contents = files.map((file) => [file, regularFile(root, file)]);
const manifest = Object.fromEntries(
  contents.map(([file, bytes]) => [
    file,
    {
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    },
  ]),
);
mkdirSync(destination, { recursive: true });
for (const [file, bytes] of contents) {
  mkdirSync(join(destination, file, ".."), { recursive: true });
  writeFileSync(join(destination, file), bytes);
}
writeFileSync(
  join(destination, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  `Packaged ${files.length} authored files; no unlisted input copied. Inspect public contents before publication.`,
);
