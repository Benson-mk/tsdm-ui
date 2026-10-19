import { writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const metadata = {
  name: "@tsdm/forum-client",
  version: "0.3.0",
  type: "module",
  engines: { node: ">=24" },
  exports: { ".": { types: "./index.d.ts", import: "./index.js" } },
  files: [
    "index.js",
    "index.d.ts",
    "types.d.ts",
    "prepare-writing.d.ts",
    "README.md",
  ],
  private: true,
};
writeFileSync(
  "dist/forum-client/package.json",
  JSON.stringify(metadata, null, 2) + "\n",
);
writeFileSync(
  "dist/forum-client/README.md",
  "# TSDM forum client 0.3.0\n\nPortable directory, board and thread reads plus current-form writing preparation, accessible attachment downloads and explicit account-bound search. Import createForumClient and supply a transport with optional POST/body support; no browser globals or UI dependencies. Search submission may consume forum credits or quota and must be deliberate. Breaking changes require a version update. This package is an unpublished local artifact.\n",
);
const script = readFileSync("dist/tsdm-workspace.user.js", "utf8");
if (/^\/\/\s+@(?:require|resource|updateURL|downloadURL)\b/m.test(script))
  throw new Error("Unexpected external runtime or automatic update metadata");
writeFileSync(
  "dist/build-manifest.json",
  JSON.stringify(
    {
      version: "0.3.0",
      node: process.version,
      userscript: {
        file: "tsdm-workspace.user.js",
        sha256: createHash("sha256").update(script).digest("hex"),
        bytes: Buffer.byteLength(script),
      },
      lockSha256: createHash("sha256")
        .update(readFileSync("package-lock.json"))
        .digest("hex"),
    },
    null,
    2,
  ) + "\n",
);
