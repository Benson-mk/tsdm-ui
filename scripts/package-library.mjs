import { writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const metadata = {
  name: "@tsdm/forum-client",
  version: "0.7.0",
  type: "module",
  engines: { node: ">=24" },
  exports: { ".": { types: "./index.d.ts", import: "./index.js" } },
  files: [
    "index.js",
    "index.d.ts",
    "types.d.ts",
    "prepare-writing.d.ts",
    "edit-post.d.ts",
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
  "# TSDM forum client 0.7.0\n\nPortable directory, board and thread reads, current-form writing preparation, account-bound ordinary publication, replies and one addressed Quick Quote, owned-post source edits with explicit conflict review, accessible attachment downloads and explicit search. Confirmation means independently verified stored publication; typed result.verification separately retains qualified normalization and unknown/not-requested creation effects. Compatible legacy results may lack verification; new results supply it. Requested creation delivery is not confirmed by a callback. Import createForumClient and supply a transport with optional POST/body support; no browser globals or UI dependencies. Search submission may consume forum credits or quota and must be deliberate. Version 0.6.0 widened PreparedWriting.action to new-thread | reply | quick-quote | edit-post and adds preparePostEdit/prepareEditPublication/savePostEdit/checkEditResult to ForumClient, plus the pure public editBaseline snapshot helper. Edit preparation returns complete source and a baseline; PublicationPreparationResult now includes a conflict with the latest source/options/references. Exhaustive action consumers and structural client implementations must handle the added cases/methods; pin this exact contract. Version 0.7.0 adds readDrafts/resumeDraft/prepareDraftSave/saveDraft/publishDraft/checkDraft and serializable draft identity, full-version and attempt types. A save must consume its exact one-use preparation after the caller acknowledges the immutable attempt; callback success alone never confirms storage. Check original attempts before a separately warned manual resend, and keep both identities. Structural ForumClient implementations must add the draft methods. The userscript application remains independently versioned at 0.4.0. Breaking changes require a version update. This package is an unpublished local artifact.\n",
);
const script = readFileSync("dist/tsdm-workspace.user.js", "utf8");
if (/^\/\/\s+@(?:require|resource|updateURL|downloadURL)\b/m.test(script))
  throw new Error("Unexpected external runtime or automatic update metadata");
writeFileSync(
  "dist/build-manifest.json",
  JSON.stringify(
    {
      version: "0.4.0",
      forumClientVersion: metadata.version,
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
