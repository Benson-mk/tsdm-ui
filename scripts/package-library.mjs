import { writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const script = readFileSync("dist/tsdm-ui.user.js", "utf8");
const applicationVersion = script.match(/^\/\/\s+@version\s+(\S+)\s*$/m)?.[1];
if (!applicationVersion) throw new Error("Missing built application version");
const metadata = {
  name: "@tsdm/forum-client",
  version: "0.20.0",
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
  "# TSDM forum client 0.20.0\n\nPortable directory, board and thread reads, current-form writing preparation, account-bound ordinary publication, replies and one addressed Quick Quote, owned-post source edits with explicit conflict review, accessible attachment downloads and explicit search. Confirmation means independently verified stored publication; typed result.verification separately retains qualified normalization and unknown/not-requested creation effects. Compatible legacy results may lack verification; new results supply it. Requested creation delivery is not confirmed by a callback. Import createForumClient and supply a transport with optional POST/body support; no browser globals or UI dependencies. Search submission may consume forum credits or quota and must be deliberate. Version 0.6.0 widened PreparedWriting.action to new-thread | reply | quick-quote | edit-post and adds preparePostEdit/prepareEditPublication/savePostEdit/checkEditResult to ForumClient, plus the pure public editBaseline snapshot helper. Edit preparation returns complete source and a baseline; PublicationPreparationResult now includes a conflict with the latest source/options/references. Exhaustive action consumers and structural client implementations must handle the added cases/methods; pin this exact contract. Version 0.7.0 adds readDrafts/resumeDraft/prepareDraftSave/saveDraft/publishDraft/checkDraft and serializable draft identity, full-version and attempt types. A save must consume its exact one-use preparation after the caller acknowledges the immutable attempt; callback success alone never confirms storage. Check original attempts before a separately warned manual resend, and keep both identities. Structural ForumClient implementations must add the draft methods. Version 0.8.0 adds required uploadAttachment/removeUploadedAttachment operations, UploadFile, UploadCancellation, WritingUpload and outcome types, optional ForumTransport.upload multipart/progress/cancellation support, and retained upload metadata. Structural ForumClient implementations must add the methods; hosts without upload support refuse explicitly. File bytes remain transient and cancellation uses a structural DOM-free contract. Upload success and inline source are not saved association; independently verify stored source/reference metadata. Explicit server-file removal acts immediately and is separate from source-tag removal or local discard. Version 0.9.0 enables the same attachment operations for forum drafts and adds optional DraftAttempt.observation separating observed draft/published state, content and attachment association. A result identity alone does not confirm the full save/publication. Existing consumers must keep their strict confirmed/published status gate; legacy attempts may lack observation. No new required client or host methods are added. Version 0.10.0 adds the favorite list, preparation, add/remove and result-check contracts. Favorite targets are distinct from record IDs; uncertainty must be checked before a deliberately authorized resend. Version 0.11.0 adds optional redPacket to prepareNewThread, native red-packet control limits, serializable packet observations on publication/edit attempts and packet markers on read posts. Thread confirmation, packet activity and credit attribution remain separate; current ledger rows do not prove a specific debit/refund identity. Existing ordinary calls remain compatible; exhaustive consumers must retain unknown packet and credit outcomes. Version 0.12.0 adds explicit fundingReviewed consent to charge-bearing DraftAttempt preparation, optional draft redPacket observations and observation.packetMarker, and supports current-form funded draft save/resume/publication without silently recreating funding. The caller must disclose immediate debit and packet activity before publication before supplying consent. Packet markers are not credit/activity confirmation; preserve independent unknown outcomes and exact original attempts. Existing ordinary draft calls remain compatible. Version 0.13.0 adds optional ThreadVerification.attachmentNormalizations using the existing AttachmentNormalization shape for independently observed enabled blank attachment-price fields stored as zero. Thread-price normalizations remain distinct; retain the immutable submission and disclose the attachment field separately. Legacy verification records without this optional evidence remain compatible. Qualified native inline-image/menu profiles now supply an offered attachment and render only the matching same-origin no-update image endpoint; native save/delete handlers are never executed. Version 0.14.0 adds optional Board.filterGroups with serializable native sourceId, optional sourceLabel for actual mixed-menu subgroups, category/order/type/time/unclassified kind and returned links in source order. Flat filters remain available. Existing structural Board models and recovery records may omit the field and must be presented as unclassified; do not infer semantics from translated labels or combine destinations. No required client or host methods change. Version 0.14.1 corrects native thread-layout table interpretation while preserving authored tables, sibling content and permission notices; author IDs require native same-origin profile URLs, and author filters require native control provenance rather than carried pager or authored-content parameters. The serializable contract and required methods are unchanged. Version 0.15.0 adds optional serializable validation source/issues and accountVerified metadata to publication preparation refusals. Field details do not authorize sending. Local validation does not observe an account; true accountVerified identifies the original actor from a fresh response even when its native form is refused. Unknown/missing verification is never proof of expiry. Existing result kinds and required client/host methods are unchanged; legacy structural failures may omit the new fields. Any deliberate preparation invalidates older same-context approval, including a locally refused revision. Version 0.16.0 adds optional Thread.history with native-provenance earlier/later links, qualified beginning/end boundaries, returned latest target and order. Absence means unknown boundaries; callers must not infer a last page from the maximum visible link. Legacy Thread models and recovery records remain compatible and no required methods change. Version 0.17.0 adds the explicit readMessages operation, Messages and MessagePeer serializable models, and the messages ReadResult/destination kind. Structural clients must add the method and exhaustive result consumers must handle the new kind. Private-list reads may clear the new-message prompt and must be deliberate; generic readPage refuses them. Native peer targets and returned pagination are preserved; results are previews, not full private history. The browser retains peers only in document memory and does not serialize them into recovery. Existing schema 2 writing and other recovery entries remain supported. Version 0.18.0 adds readPrivateConversation, serializable PrivateConversation/PrivateMessage models and the distinct private-conversation result/destination. Structural clients must implement the method and exhaustive readers handle the new kind. Opening/fetching private history may mark it read and must be deliberate; generic readPage refuses. Returned recipient/page/target identity stays explicit. Private body/range state remains document-memory only and never auto-loads after recovery. This contract adds no private send operation. Version 0.19.0 adds separate PreparedPrivateWriting/PrivateSubmission/PrivateReview/PrivateAttempt models and preparePrivateWriting/preparePrivateReview/sendPrivateMessage/checkPrivateMessage. Public PreparedWriting stays public-only. Private preparation and checks deliberately read recipient history and may mark it read; qualify one-to-one plaintext/newlines only. The caller must obtain explicit approval of the immutable review and supply an acknowledgement callback before the sender proceeds. Approval is transient and one-use; persisted attempts contain no form tokens or approval identity. Fresh sender/recipient/form/history checks precede POST; only independent unique stored sender/recipient/exact text confirms success. No automatic retry or resend exists. Unknown/partial history and unsupported current forms require native continuation; preserve uncertain original attempts and later local text. The browser uses schema3 once private-capable writing exists; older clients visibly refuse this record and new clients retain public schema1/2 compatibility. Structural clients must implement the new methods. Version 0.20.0 adds optional DirectoryGroup sourceId/sourceURL provenance from native group containers and scoped headings. Legacy groups remain valid; missing provenance never establishes category identity. No required methods change. The userscript application is independently versioned. Breaking changes require a version update. This package is an unpublished local artifact.\n",
);
if (/^\/\/\s+@(?:require|resource)\b/m.test(script))
  throw new Error("Unexpected external runtime metadata");
const userscriptMetadata = readFileSync("dist/tsdm-ui.meta.js", "utf8");
const header = script.match(
  /^\/\/ ==UserScript==\r?\n[\s\S]*?^\/\/ ==\/UserScript==/m,
)?.[0];
if (!header || userscriptMetadata.trimEnd() !== header)
  throw new Error("Update metadata differs from the userscript header");
writeFileSync(
  "dist/build-manifest.json",
  JSON.stringify(
    {
      version: applicationVersion,
      forumClientVersion: metadata.version,
      node: process.version,
      userscript: {
        file: "tsdm-ui.user.js",
        sha256: createHash("sha256").update(script).digest("hex"),
        bytes: Buffer.byteLength(script),
      },
      userscriptMetadata: {
        file: "tsdm-ui.meta.js",
        sha256: createHash("sha256").update(userscriptMetadata).digest("hex"),
        bytes: Buffer.byteLength(userscriptMetadata),
      },
      lockSha256: createHash("sha256")
        .update(readFileSync("package-lock.json"))
        .digest("hex"),
    },
    null,
    2,
  ) + "\n",
);
