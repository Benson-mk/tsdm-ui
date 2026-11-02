# Manual-tag release automation

The owner chooses the application version by pushing a tag. Commit counts and
Conventional Commit types never select or increment that version. A tag builds
the userscript and the independently versioned forum-client package, prepares
release-page changelog text, and waits for Benson-mk's explicit approval before
creating any GitHub Release, including a draft. This task creates no release tag.

## Plan and acceptance criteria

- [x] A selected tag supplies the userscript metadata, About text and build
      manifest version without modifying committed package versions.
- [x] Package the actual build, library tarball, notices, installation guidance,
      provenance and SHA-256 checksums; include all commits since the previous
      reachable version tag (all history for the first release).
- [x] The build job has read-only repository permissions. The publication job
      requires the protected `github-release` environment, with Benson-mk as
      required reviewer and administrator bypass disabled.
- [x] A manual preview builds inspectable artifacts but cannot create a Release.
- [x] Publication consumes the reviewed artifact without rebuilding, checks its
      hashes and tag target, and fails rather than overwriting an existing release.
- [x] Verify the complete packaging CLI, affected built-application E2Es,
      clean library consumer and workflow syntax. Preserve repeatable receipts
      and report the limits of unexecuted publication.

After committing and installing the locally verified workflow, exercise its
manual hosted preview. This installation check cannot precede the commit that
makes the new workflow available on GitHub; it never authorizes publication.

No irreversible design choice needs early advisor consultation. The designated
gpt-6.1-sol/xhigh BDFL advisor will apply validate-gpt-code-review after completion.

## Failure inventory before implementation

The complete CLI and built application are the testing boundaries, not unit tests.

| Failure                                                                   | Expected observation                                                                                                                           |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 100 fixes silently choose a different version                             | A fixture with 100 fixes still packages the owner's v0.1.1 and lists all 100 changes.                                                          |
| First release has no prior tag                                            | Generate notes from the entire reachable history.                                                                                              |
| Tag differs from the built script or manifest                             | Refuse packaging.                                                                                                                              |
| Tag resolves to a different commit                                        | Refuse packaging.                                                                                                                              |
| Missing or malformed tag                                                  | Refuse normal packaging; an explicitly labelled preview alone permits an absent tag.                                                           |
| Artifact was changed after its build manifest                             | Refuse packaging.                                                                                                                              |
| Required executable or notices are absent                                 | Refuse packaging.                                                                                                                              |
| A rerun overwrites retained evidence                                      | Refuse an existing output directory.                                                                                                           |
| UI About text retains the old development version                         | Built-application E2E checks About against the selected release tag.                                                                           |
| Tag push or preview publishes without approval                            | Separate read-only build and protected publish jobs; inspect environment and preview's skipped publication job.                                |
| Tag moves while approval is pending                                       | Recheck the remote tag's peeled commit against the prepared source before publication.                                                         |
| A rebuild substitutes bytes after approval                                | Download this run's immutable artifact and verify its checksum inventory; never rebuild in the publishing job.                                 |
| A previously prepared qualified release is confused with a new CI build   | New provenance explicitly records that build checks do not establish installed qualification. Historical 0.4.0 evidence is unchanged.          |
| A clean hosted npm cache has tarballs but no TypeScript registry metadata | Warm the pinned TypeScript package metadata before the existing offline consumer E2E; retain the first hosted failure and a cold-cache replay. |

## Scope and trade-offs

This is new release automation, not a modification of completed issue #40 or
authorization to publish its retained payload. ADR0002's qualification and
public-content review still apply before approval. New CI bytes do not inherit
the installed qualification of historical bytes. The release page holds the
changelog; no bot commit updates a root CHANGELOG.md.

The owner approved starting public versions at 0.1.0. The root package and lock
metadata now agree; historical development records remain unchanged.

## Verified implementation

- Pinned Node 24.22.0/npm 11.21.1 clean-source installation, typecheck, lint,
  formatting, both builds and the complete external library consumer passed.
- The CLI suite has 10 passing full-process scenarios, including 100 fixes in
  the single owner-selected v0.1.1 release, first-release history, mismatched or
  absent tags, corrupted/missing files and preservation of prior output.
- A version-specific About E2E failed before implementation, then passed along
  with four affected reading/search/locale checks on the v0.1.1 build. The clean
  default 0.1.0 build passed all 26 foundation E2Es in Edge.
- actionlint 1.7.12 accepted the workflow. Publication control flow, immutable
  artifact selection, checksum coverage and remote tag recheck were inspected;
  no actual publication is claimed as an executed test.
- The live `github-release` environment has only Benson-mk as required reviewer,
  self-approval permitted, administrator bypass disabled, and a v* tag policy.
  No remote tag or Release was created during preparation.
- The designated gpt-6.1-sol/xhigh BDFL advisor applied validate-gpt-code-review
  and found no actionable correctness issues.

Retained local artifacts (repository-relative paths):

- `evidence/runs/tag-release-cli-red-2/`: expected missing-command RED before implementation.
- `evidence/runs/2026-11-02T07-36-35.786Z/`: actual version-mismatch E2E RED.
- `evidence/runs/tag-release-cli-green-2/`: 10 passing CLI scenarios and payloads.
- `evidence/runs/2026-11-02T07-40-34.198Z/`: five tagged-build E2Es.
- `evidence/runs/tag-release-clean/`: clean 0.1.0 consumer and 26 foundation E2Es.
- `evidence/runs/tag-release-v0.1.0-preview/`: locally prepared files and verified checksums.

The original working directory's broad lint command encounters pre-existing
ignored `.local/` archives with nested tsconfig files. An exported source tree
passes the unchanged lint command; unrelated historical files were preserved.
The first hosted preview (run 41408676037) passed the protection-gate check,
typecheck, lint and builds, then exposed a cold-cache assumption in the existing
offline consumer check: npm ci caches tarballs without necessarily caching the
TypeScript registry metadata. A fresh isolated cache reproduced the failure;
warming the exact pinned TypeScript package made the unchanged consumer pass.
The workflow now performs that warming during dependency installation. The
failed preview skipped publication and created no Release.

GitHub's main-branch rules refused replacement of the already-installed setup
commit. The owner explicitly approved a separate corrective commit for the
cold-cache integration issue, preserving protected remote history.

Initial sandbox cache/browser failures were retained and rerun with a writable
cache or the required process permission; they are not reported as product
failures. Hosted preview follows installation. Publication, downloaded-release
verification and new installed qualification remain unexecuted by design.

## Actual trade-offs

1. Start public versions at 0.1.0 while preserving historical 0.4.0 identities:
   development installations need deliberate manual replacement/downgrade.
2. Let the tag control built application identity: no version-bump commit is
   needed, but package.json remains the development default and can differ.
3. Keep the library independently versioned: application releases do not imply
   library API changes; consumers must track its separate version and hash.
4. Store changelog text on the Release page rather than committing CHANGELOG.md:
   no bot writes the branch, but tagged source does not contain a cumulative log.
5. List all non-merge commit subjects since the nearest reachable stable tag:
   traceable and independent of commit conventions, but less polished than
   curated notes and bounded by tags even when a prior tag was never published.
6. Accept stable numeric tags only: simple, explicit behavior; prerelease policy
   is deliberately not implemented.
7. Use an owner-reviewed GitHub environment: publication needs a separate click;
   self-approval allows the owner to approve their own tag without requiring a
   second maintainer. Protection is remote configuration that must be maintained
   when migrating/forking, and repository admins can still edit configuration.
8. Reuse immutable uploaded files rather than rebuilding after approval: review
   applies to the published bytes, but the 30-day retention window requires
   timely approval or a new reviewed build.
9. Pin Node, npm and Action commits, with Ubuntu 24.04: reduces unexpected tool
   changes but requires intentional maintenance; runner images still evolve.
10. Exercise focused synthetic journeys and the consumer during preparation:
    useful packaging checks without repeating every unchanged live behavior;
    approval must still follow applicable installed qualification and review.
11. Ship directly installable userscript and library tarball assets with separate
    instructions and checksums: convenient individual downloads rather than an
    additional all-in-one release archive.
12. Use small repository-owned packaging code instead of version-selection
    plugins: no extra dependency or automatic version policy, but the project
    owns the packaging and changelog code.
13. Verify lint in a clean source tree instead of altering unrelated local
    archives: preserves earlier evidence, while the original broad local lint
    invocation remains affected by those archives.
14. Use GitHub's short-lived built-in token: no personal secret maintenance, but
    its release events do not launch downstream event-triggered workflows.
15. Install current stable Edge for synthetic checks: exercises a current browser
    while its exact version varies; each evidence receipt records what ran.
16. Warm pinned TypeScript metadata during installation: adds a registry/cache
    preparation request while preserving the consumer's offline verification.
17. Preserve the protected, already-pushed setup commit and add the separately
    authorized CI correction: respects the repository's no-force-push rule at
    the cost of two commits for the setup and its discovered integration fix.
