# Integrated candidate and release evidence — #36

The accepted #35 product remains unchanged. This ticket adds integrated application/consumer assertions, current requirement mapping, bounded native procedures and immutable freeze/public-evidence commands. It delivers a development freeze; final stable installed qualification and public release remain subsequent work.

## Exact product and provenance

The clean product checkout is committed `f1f0e430f117030be21ed5144926d9a52d8dd939`. The initial ticket tools and tests are separately identified by source hashes; that checkout must not be described as the complete committed #36 tree. After the scoped ticket commit, revalidate its source/tool identities and confirm the executable remains identical before retaining the final package.

| Artifact                       | Version | Bytes   | SHA-256                                                            | gzip bytes         |
| ------------------------------ | ------- | ------- | ------------------------------------------------------------------ | ------------------ |
| Userscript                     | 0.4.0   | 1695255 | `fc22d695e968c742aa3425eea36f580ec336ba3ad0a713f6936125c90829aa6d` | 382210             |
| Public client JavaScript       | 0.12.0  | 353238  | `b9e7062c9aafd86e70c210125ff06e73aa851f09746d24962bd1cd7c97165f28` | 88644              |
| Notice-packaged client tarball | 0.12.0  | 106023  | `4949413a87c9689015f08deea5c692d390794f82a9ddaaa766142fc763dfcac5` | Already compressed |

The current local build and clean committed build match byte for byte for both executables. A prior shared-dependency-symlink build emitted different library `//#region` path comments (`bb725340…`, 353658 bytes). The candidate now uses its own offline locked install, and the exact clean library has its own consumer/replay evidence. The old hash is not misreported as unchanged.

The freeze records all tracked product inputs, lock identity, executable Node/npm CLI hashes and versions, actual commands, external packaging-tool identities, notice source hashes, metadata and all 30 output identities. The verifier checks the external-tool inventory as well as outputs. Notices are an explicit packaging stage preserving the accepted application/library version separation and package API. Frozen input drift, dirty input, stale output, missing declarations, forbidden metadata/CDN and absent/empty license inputs fail closed.

The actual emitted userscript includes Reka 2.11.0 dialog primitives selected by SettingsDialog and WorkspaceLayout: Root, Trigger, Portal, Overlay, Content, Title, Description and Close. The complete artifact measurements above include them. The full application timing case observed 153.095 ms to populated readiness and 42.261 ms to open the About dialog in Edge 156.0.4314.42. These single-run figures include fixture routing and automation overhead; they establish neither a startup guarantee nor a byte budget or additional release gate.

## Coverage and execution

[Coverage map](36-coverage-map.json) maps all 63 parent stories, J1–J11, Node, seven inherited failure groups, controlling framework/ownership/workflow/qualification resolutions, Text size/Reka follow-ups and all six #36 criteria. The parent groups six failure bullets; the controlling #9 resolution additionally names Identity, retained explicitly as F7. There are 490 actual current application declarations, including every one of the 443 historical IDs and 47 current additions. Every parameterized declaration maps to all its expanded receipt names; no declaration count substitutes for execution.

The complete deterministic application run `2026-10-24T12-09-01.965Z` passed **839/839 with zero retries**. The focused added/affected run `2026-10-24T12-01-31.190Z` passed 125/125. The unchanged broad appearance grid includes all nine text sizes, four themes, representative sizes/geometries/languages, derived 90↔100 spacing, preview/persistence/reset/fallback and reading/writing retention. Added combined assertions cover rich reply/edit ambiguity, ordinary uploaded draft lifecycle, direct and funded rich packet paths, account-copy isolation and narrow translated large-text controls. Only external HTTP is substituted; independent source/actor/options/association/funding/request assertions accompany visible outcomes.

The exact notice-packaged library run `consumer-2026-10-24T12-09-55.772Z` passed all existing populated read/search/notices/download/declaration checks and **50 named family cases**: 32 publication, two replies, one edit, two drafts, ten favorites, two packets and one package-boundary case. A fresh independent installation/replay at `2026-10-24T12-29-20.374Z` compared retained inputs, installed artifact files and all observed results successfully. It uses the public package only, with no DOM ambient types, private subpaths or runtime dependencies.

Failure-first CLI evidence retains missing command/schema contracts, notices absence, genuine reference failures, sentinel scanner rejection, external provenance rejection and inherited identity coverage. The initial absent-freeze attempt did not complete its scenario receipt; its log/fixtures remain an incomplete failure harness and are not counted as a passing or complete negative scenario. Two invocation mistakes (missing pinned npm environment) are preserved separately from corrected runs. Source typecheck, lint, formatting, build, evidence-integrity and whitespace checks accompany the results.

## Public evidence and replay

`package-evidence.mjs` accepts a new output directory and an authored input allowlist. `verify-evidence.mjs --public` validates schema 3 receipt, hashes, named real source declarations, independent readback references, runtime/source/lock/tool identities and complete requirement accounting. Existing raw receipt verification is preserved without silently promoting old evidence. `--require-pass` rejects missing, failed, blocked, not-run or inconclusive required release evidence.

The authored package contains exact genuine test/helper source hierarchy, all 839 expanded application and 50 consumer observations, real CLI package checks, and 13 named not-run final installed procedures. Its final-release status deliberately remains not-run. The Node package requirement passes on its exact current package. All other final installed/live obligations remain separately visible; this release ledger is not the root's #36 delivery verdict.

Synthetic observations preserve test titles, statuses, retries, original artifact identities, numeric and boolean state/effect summaries and the exact assertions that independently compare full source and results. Executables, prior gzip candidate, full source/patch and complete private-free synthetic originals are separately hashed companions. Public readers can rerun genuine application/consumer cases with those inputs. No raw authenticated capture, member screenshot, credential or workstation path is exported. The conservative scanner and authored review are complementary; passing a scanner alone is not a privacy claim.

Repeatable command sequence, with operator-selected paths:

```sh
node scripts/freeze-release.mjs CLEAN_COMMITTED_SOURCE NEW_FREEZE PINNED_NPM_CLI
node scripts/verify-release.mjs NEW_FREEZE
npm exec -- node scripts/replay-consumer.mjs RETAINED_CONSUMER_RUN
node scripts/package-evidence.mjs AUTHORED_INPUT NEW_PUBLIC_OUTPUT
node scripts/check-frozen-evidence.mjs NEW_FREEZE NEW_PUBLIC_OUTPUT NEW_OBSERVATIONS
```

The last command independently verifies both actual packages and confirms the unresolved final matrix cannot satisfy `--require-pass`. Keep original failures and targeted reruns distinct. For immutable replay, use the exact companion executable instead of substituting a newly built one.

## Native procedures and early gates

[Native procedures](36-native-procedures.md) declare macOS as the primary full J1–J11 OS in both stable browsers, and Windows 11 host-sensitive repetition in both. Exact future stable OS/browser/manager identities are recorded at execution. Every consequential action requires its own capable account, target/revision, count, attachment and credit budget, narrow independent readback and cleanup/stop scope before use. Existing consumed budgets confer no authority.

All six early capability domains have accepted development evidence: page-session recovery (#17/#19/#20/#35), current forms/options (#19/#20/#26/#32/#33), populated notices (#31), redirects/remounts (#17/#19/#29/#31), attachment delivery (#28/#33), and independent Node imports (#34/#35 plus the exact current #36 consumer). Accepted evidence remains tied to its original candidate and runtime. The early-gate research map is retained with the implementation report and references accepted completion documents.

Authoritative native file-deletion absence remains unproved under #26/#27; #27's exception applies only to #27. Genuine manager software update remains unavailable under #47 and is a #40 dependency. Stable-manager/Windows/full frozen baseline remains required. No new capability conflict was found, no prior failure is relabelled a pass, and these limitations are not feature waivers. The retained #20 candidate gzip (`de1d92dc…`) remains available for replacement rehearsal; it is an earlier development candidate rather than a previous public release.

## Actual trade-offs

1. Public evidence is opt-in authored schema 3 while historical raw receipts retain their old verifier. This preserves provenance and compatibility at the cost of maintaining two explicit evidence contracts.
2. A reviewed allowlist and conservative sensitive-content scanner reject ambiguous material. This reduces accidental disclosure but requires manual inspection and keeps the sensitive-pattern rejection harness in the separately hashed source companion rather than copying it into ordinary public artifacts.
3. Freeze requires fresh output and an offline locked install using a prepared cache. This prevents stale output/lock drift but requires cache preparation. A real local install replaces the shared dependency symlink because bundler path comments otherwise make byte identity layout-dependent.
4. Packaging includes license material for every locked non-development transitive dependency. This is conservative and larger than a tree-shaken attribution set, but avoids silently omitting bundled notices.
5. Public case references use real Playwright declarations, named CLI calls/results or exact manual headings with source hashes. This improves auditability but needs explicit adapters for these three declaration shapes rather than accepting arbitrary prose.
6. Four consumer titles use equivalent template literals. This preserves behavior while allowing exact source references without an arbitrary JavaScript evaluator.
7. Only the exact noncredential `SYNTHETIC_PUBLIC_FORM_TOKEN` sentinel is allowed in synthetic source form-token assignments. This keeps genuine fixture replay possible while refusing other credential-shaped values; it is not a general secret-scanner exemption.
8. Genuine replay sources retain their nested hierarchy, while executable/tarball/gzip fixtures and complete source snapshots are hashed companions. This keeps the public text allowlist narrow at the cost of a multi-part replay distribution.
9. Combined application cases reuse existing complete application fixtures and authoring helpers. This covers cross-feature seams without introducing a new isolated/unit layer, while requiring reviewers to follow the existing fixture contracts.
10. The precommit freeze consumes clean committed accepted #35 product inputs with separately pinned external #36 tooling/tests. This avoids an incomplete ticket commit but requires postcommit identity revalidation and an explicit distinction between committed product provenance and tooling provenance.
11. Public per-case summaries extract numeric/boolean observations and original artifact hashes while retaining full assertions and complete originals as companions. This makes the public ledger reviewable without raw request-body dumps, but readers need replay or retained originals to independently inspect complete source comparisons.
12. Startup measurements use the real complete populated artifact and selected dialog interaction. This is representative of the integrated code but includes automation/routing overhead and makes no general performance guarantee.
13. Final installed/live obligations remain unexecuted in the public release ledger while development delivery is assessed separately. This preserves the accepted development cadence and consumed action budgets, at the cost of an intentionally non-passing release package until later qualification.
