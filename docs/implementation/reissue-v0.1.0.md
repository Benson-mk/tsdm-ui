# Reissue the withdrawn v0.1.0

On 2026-11-02 the owner reported removing the old v0.1.0 and explicitly requested
redoing the Release. Remote inspection confirmed both the Release and its tag
were absent, and main already contained the side-conversation changes through
75277f0. The local old tag still pointed at 4d00a7d; its identity and the original
publication evidence are retained before replacing that local tag.

The replacement uses the completed TSDM UI naming and presentation policy: one
public `tsdm-ui.user.js` attachment, PR-aware release notes, and README Quick
Start/Acknowledgments. The complete review artifact still contains the library,
notices, provenance and checksums. No dependency or application logic changes
are part of this reissue. Hosted build verification and normal owner approval
must precede publication; published bytes must match the approved artifact.

## Documentation acceptance

- Correct Quick Start's claim that every v0.1.0 uses the old name.
- Explain manual replacement of the withdrawn TSDM Workspace installation.
- Preserve historical candidate, checksum and publication records.
- Describe this explicit reissue as an exception, not a general tag-moving policy.

## Actual trade-offs

1. Reuse v0.1.0 as explicitly requested instead of allocating another version:
   old downloads can share the version label with different bytes. Retain source
   and checksum identities and identify the withdrawn build in Quick Start.
2. Apply the completed renamed build and single-download presentation: fewer
   public attachments, but complete notices/provenance remain in the linked
   README and review artifact; users of the old script must disable it manually.

3. Recreating the remote tag can leave other existing clones with the withdrawn
   local tag; ordinary fetches may refuse to replace it. Those clones must
   deliberately reconcile their tag against the replacement source commit.

Fresh installed Tampermonkey migration/qualification is not claimed. The earlier
local verification is retained rather than repeated without a new concern; the
tag workflow provides the previously missing hosted check for these changes.
