# Clean public Node consumer on the fully evolved API

This #34 continuation starts at accepted integration `14c4f2de9b15013924b2a1cfb8494e64a68b12d9`, after #33. It qualifies the exact current `@tsdm/forum-client@0.12.0` artifact. Earlier work against 0.4.0 remains historical provenance and is not current acceptance evidence. No forum-client source, application behavior, public version, dependencies or lockfile changed.

## Failure inventory and confirmed boundary

The accepted separate consumer boundary installs the public artifact outside the UI checkout, supplies only a synthetic forum transport, and exercises actual parsing and operations. It is not a unit-test layer or a CLI/MCP product. The inventory was recorded before tooling changes; the historical fixtures also retain their own failure-first inventories.

| Reachable failure                                                               | Named expectation                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Incorrect/missing exports or accidentally exposed internals                     | Import public package; reject private `index.js`, `types`, `prepare-writing` and `package.json` subpaths.                                                                                                                |
| Missing or transitive declarations, undeclared dependencies                     | Install exact tarball and its own pinned TypeScript compiler in a fresh directory; strict typecheck with ES2023 only and no DOM or ambient types.                                                                        |
| Vue, Reka, editor, GM or browser coupling                                       | No runtime, peer or optional package dependencies; consumer supplies no window/document/HTMLElement/DOMParser/GM/Vue globals. The public entry's source graph remains independent of UI code.                            |
| Runtime/compiler drift                                                          | Require exact selected Node/npm, record TypeScript/platform/architecture, use an independently installed compiler.                                                                                                       |
| Nonserializable models or exported form tokens                                  | JSON round-trip representative read, prepare, attempt and result models; exclude authored form tokens from returned models. Binary downloads retain their typed byte contract.                                           |
| Account changes, pending duplication, lost response, later edits or source loss | Reuse the accepted 32 publication cases, current reply/edit/draft/favorite cases and independent synthetic effect/readback assertions unchanged.                                                                         |
| New API declarations absent or funded behavior silently weakened                | Typecheck current reply/edit/draft/favorite/packet contracts; run direct packet and funded save/resume/publish paths, require explicit funding consent, keep credit attribution unknown and exactly one funding command. |
| Replay inputs omitted or artifact bytes differ                                  | Retain exact package, JavaScript, TypeScript, configuration, package/lock and executable replay; verify installed package bytes and all retained hashes.                                                                 |
| Qualification inputs change during a run                                        | Snapshot all 39 source/tool/case inputs and built artifact files, then compare after execution.                                                                                                                          |
| Replay resolves checkout dependencies or changes observations                   | Fresh temporary install from retained tarball/lock; own compiler; compare complete deterministic observations and each named case family.                                                                                |
| Failure misrepresented as qualification                                         | Separate failed receipts/reports, including missing inputs and deliberately changed retained bytes.                                                                                                                      |
| Later artifact changes inherit old qualification                                | Rerun against the current fully evolved artifact; later frozen release artifacts still need their own consumer qualification.                                                                                            |

## Reuse and current scope

All four source identities in the initial #34 handoff and all seven in its frontier follow-up were verified by byte length and SHA-256 before reuse. The initial runner was reconciled with the accepted current runner using its actual historical base. The only merge conflict was the human-readable report; the current implementation retains the fuller replay instructions and current family coverage.

Current accepted `publication.mjs`, `replies.mjs`, `editing.mjs`, `drafts.mjs` and `favorites.mjs` remain byte-identical. They already include the later edit-confirmation and favorite-uncertainty corrections; the provisional historical frontend-family fixtures were not overlaid or duplicated. The public boundary fixture is retained from the verified handoff. The historical public signature probe is extended for the current packet observation and explicit funded consent types. Its `.txt` source is concatenated into the retained, strictly compiled `consume.ts` so the UI TypeScript project does not resolve a separate uninstalled package.

Two representative packet flows add direct publication and funded Save → list/resume → same-target publication → read-only check. The latter refuses preparation without `fundingReviewed`, retires creation controls on resume, sends funding once and verifies separate source, marker, packet-state and ledger observations. Credit attribution remains `unknown`. Missing upload policy retains the current public refusal coverage; successful upload grammar and broader specialized failure cases remain covered by accepted application E2Es.

The UI creates the client from `src/forum-client/index.ts` through its directory import, and the library build names that same entry. No alternate implementation, registry publication, browser installation, live forum action or service is added.

## Failure evidence and current verification

The unchanged baseline consumer passed, but independent replay failed because `consume.ts` was absent. This current-baseline RED is `consumer-2026-10-24T09-50-11.234Z-replay-2026-10-24T09-50-59.529Z`, before runner changes. The historical replay script used for this experiment had verified source identity.

The first expanded consumer run, `consumer-2026-10-24T09-52-21.143Z`, failed because the new fixture incorrectly required optional `DraftAttempt.observation.packetMarker` after publication. That observation is present on the saved draft; published packet presence is independently available from `readThread`. Only the fixture expectation was corrected to check the published state and returned post marker. No product correction or API guarantee was attributed to this harness failure.

The final build and consumer run is `consumer-2026-10-24T09-54-18.524Z`, using Node **24.22.0**, npm **11.21.1**, TypeScript **6.0.3**, darwin arm64. It passes all **48 named family cases**: 32 publication, two reply, one owned edit, one ordinary draft, ten favorites and two packet cases, alongside the existing populated read/search/notices/download/preparation assertions and strict public declarations.

The complete ten-file evidence directory was copied outside the checkout. Its standalone replay passed from that copy as `consumer-2026-10-24T09-54-18.524Z-replay-2026-10-24T09-55-02.334Z`, installing into another fresh temporary consumer. All observations reproduced exactly and all seven installed artifact files matched. The original ten-file and replay two-file manifests were independently verified. All 39 qualification-input identities still matched after the final run.

A separate copy with an intentionally altered `consume.ts` failed hash verification before installation. Its distinct failed receipt is `consumer-authored-hash-mismatch-replay-2026-10-24T09-56-18.290Z`. Failed replay manifests also pass integrity verification; their verdict remains failed. Typecheck, lint, repository format, consumer-fixture formatting and whitespace checks passed. This final documentation was added afterward without changing executable inputs.

Exact package: **94,364 bytes**, SHA-256 `f64b4a6a93ab89b9de804d86dab1b34e23c4690be4183fbb9c6c506f3d167bba`.

The rebuilt application and public client remain exactly accepted #33 bytes:

- Userscript: **1,691,018 bytes**, SHA-256 `c1d7b4e5d3e23971d0101ff19f39655aa43f5ba1fd6f9e400cddb23de7edd7ce`.
- Public client JavaScript: **353,658 bytes**, SHA-256 `bb72534009eb51fd27d6f79089c26189b91ad7989d7215673252d6e52a041d39`.

No browser journeys were repeated for unchanged application bytes. This evidence is synthetic library qualification; it makes no live or installed claim.

## Repeatable commands and acceptance ledger

With the selected Node/npm installed, run `npm run build`, then `npm run test:consumer`. The primary consumer installs its pinned compiler from the existing npm cache. Copy the resulting evidence directory outside the checkout and, inside that copy, run `npm exec -- node replay-consumer.mjs .`. Replay can use cache or the configured registry for the integrity-locked compiler. It writes a separate sibling receipt/report/manifest without changing the original evidence. Run `npm run evidence:verify -- <directory>` from the repository for independent manifest verification.

- [x] AC1: isolated-fixture failures and named expectations enumerated before tooling code.
- [x] AC2: exact versioned artifact/declarations installed in a clean supported Node consumer, public exports only, serializable representative results and no UI dependencies.
- [x] AC3: actual read/prepare/write/check behavior and required account/pending/loss/later-edit/raw-source guards pass through authored external transport.
- [x] AC4: artifact, runtime, compiler, cases and source identities retained with independently executed replay; UI and library use the same public implementation.
- [x] AC5: rerun completed against the current fully evolved 0.12.0 artifact after every API feature ticket through #33. This does not waive later frozen-release library qualification under #36 and ADR0002.

These marks describe development evidence. Completed Standards/Spec/BDFL review, final scoped commit and tracker acceptance remain root-owned. No unmet API dependency is hidden behind the historical 0.4.0 handoff.

## Actual trade-offs

The following ledger carries forward the relevant historical decisions and records the current additional decision once.

1. Reuse accepted contract fixtures rather than duplicate their scenarios. This preserves one behavioral oracle while retaining authored transport limits.
2. Install the exact compiler in the clean consumer rather than call the checkout compiler. This makes declarations independently replayable at the cost of another installation.
3. Retain the exact tarball and executable/type/configuration inputs. Evidence is larger, but package and replay identities are directly verifiable.
4. Require selected exact Node/npm and an offline primary compiler install. This avoids runtime drift and a network-dependent primary run, but requires pinned tools and a populated cache. Independent replay may fetch the locked compiler.
5. Snapshot qualification inputs and compare artifact bytes without rebuilding inside the consumer runner. This keeps build orchestration separate; the fresh build and its source identity must accompany acceptance, and a snapshot cannot retroactively prove an unrelated earlier build.
6. Write replay results beside the original evidence. This preserves passing and failed original observations but needs a writable parent and retains small extra packages.
7. Preserve the evolved reply/edit/draft/favorite fixtures and add two representative packet flows instead of duplicating every feature failure. This bounds consumer maintenance while application E2Es retain specialized breadth.
8. Compare the entire deterministic replay observation and installed-file identities in addition to named family results. This catches drift outside the case arrays, at the cost of requiring fixture observations to remain deterministic.
