# Prepare exact Post replies without a permanent button — #130

## Failure inventory before changing the UI

- A dedicated Reply to this post footer button still appears on every Post
  with a qualified Board. Removing it must not remove the ordinary Thread
  Reply entry, add a Thread gesture, or remove the rest of the Post footer.
- Empty-space double-click, right-click → Reply and the labelled menu must
  prepare the same exact Post. A nested text double-click must still select a
  word. Selecting text, using links, media, scrollable content or operating
  another control must not accidentally prepare a reply or take over its
  native gesture.
- Keyboard users must be able to find the labelled trigger, reach Reply and
  dismiss the menu back to the trigger. Touch users must be able to hit the
  trigger and Reply without clipping or another surface intercepting them.
- A newly targeted dock must name the author and Post, offer the exact URL and
  the supported excerpt and explicit quote action, and expose only one Send.
  Retargeting or removing a target must preserve literal source, form options
  and local attachment intent without inserting quote text. A refused or
  superseded preparation must not change the current target or send anything.
- Author filter, permalink/clipboard fallback, Edit, Rate and Report must keep
  their exact capability and permission boundaries. Menu opening/dismissal may
  not fetch a form; preparing Reply may only read the qualified form and must
  not publish, upload, or navigate.

The agreed seam is the built production userscript in Edge with only forum
HTTP substituted for the ticket journeys. Browser events, menus, focus, text
selection, writer, and navigation are real. Installed and live checks are out
of scope; Chrome is reserved for #134.

## Replay

From the ticket worktree, install the locked dependencies and build the
production userscript. Run the browser command with shell escalation on this
machine. The ticket fixtures use Playwright's offline mode and refuse every
request outside their ordered allowlist. The existing native redirect tests
use a loopback-only proxy.

```sh
export PATH=/Users/benson/Documents/code/tsdm-ui/evidence/runs/38-edge-20261101/toolchain/node_modules/.bin:$PATH
npm ci --offline --no-audit --no-fund --logs-dir="$PWD/.npm-logs"
npm run build
TSDM_E2E_CHANNEL=msedge npm run test:e2e -- tests/e2e/post-actions.spec.ts --grep 'POST130|UX101\.retarget' --timeout=15000
npm run evidence:verify -- evidence/runs/<run-directory>
```

For the red, use the production tree at `fcbd9d5` with only
`tests/e2e/post-actions.spec.ts` replaced by the red receipt's archived
`synthetic/post-actions.spec.ts` (checksummed by its manifest). Build that tree
and run the same command; the four entry journeys and the native-content
journey should fail while retarget/removal passes. The regular regression
journeys are not required for the red replay.

For the scoped acceptance and regression receipt, use the same build with:

```sh
TSDM_E2E_CHANNEL=msedge npm run test:e2e -- \
  tests/e2e/{post-actions,reply-layout,rating,report,post-permalink,edit-post,board-reader-controls,attachment-authoring,pending-replies,design-fidelity,navigation-history,task-canvas,replies,reader-hierarchy,thread-refresh,writing-presentation,integrated-ui-ux,browser-edges,safe-area-edges,visual-viewport}.spec.ts \
  --grep 'POST130|UX101\.|UI105\.|UX102\.(cancel|keyboard|unavailable)|UX103\.(cancel|keyboard-narrow|unavailable)|UX104\.(completion|refused|absent|touch|destination)|J4\.(edit-preservation|edit-reply-source|integrated-rich-upload-quote|quote-target|reply-preparation|reply-mention-context|reply-send-.*-addressed)|J11\.edit-ownership|CONTROLS129\.row|UX111\.(target-navigation|blank-intent-edit)|DESIGN\.cover|J124\.combined|CANVAS128\.search|UX55\.|F79\.public-(actions|visible-follow|first-timestamp)|IM71\.follow-|UX112\.owner-toolbar-shortcut|IM72\.review-shortcut-reply|UI92\.(external-edges|wide-bottom)|IM73\.(edges|bottom-owner-public)|IM74\.viewport-pan' \
  --timeout=20000 --workers=2 --output=test-results/post-reply-final
```

## Evidence

- **Pre-edit red:** `evidence/runs/2026-11-28T19-26-54.335Z-msedge-M7CX77`,
  Edge `158.0.4370.45`, userscript SHA-256
  `e2f8bdc70cdbcdb3aaf35613a4f16d96d2494cd7950ee3317fa91ba33ac724d4`.
  Two permanent Reply controls were visible in each of the four entry
  journeys. The native-content case also found the Post context menu on an
  image, a selected word and a disclosure, plus an unintended reply-form GET
  from blank space in a scrollable code block. The fixture refused that GET.
- **Focused green:** `evidence/runs/2026-11-28T19-29-06.690Z-msedge-PPI1Vv`,
  Edge `158.0.4370.45`, userscript SHA-256
  `7f652ccdee0f013e9c811e2a9eeee10be810fdba11ed70f2f0d6b90f18eb7ce7`.
  All four entries addressed `Other author · Post 101`, in Thread `42`,
  with exact link `mod=redirect&goto=findpost&ptid=42&pid=101`. Each
  activation made exactly one
  `GET /forum.php?mod=post&action=reply&fid=5&tid=42&tsdmapp=json&reppost=101`
  and no navigation, upload or POST. The native-content case made no
  request after loading its image.
- **Final Edge:** `evidence/runs/2026-11-28T19-36-05.763Z-msedge-16Fopn`,
  Edge `158.0.4370.45`, userscript SHA-256
  `c140331634e37f1d72bafbdd9c470309cb3550e60458fb8cd2d3c179a4e41a11`.
  All 98 scoped cases passed, including the five ticket journeys, strict
  retarget/removal, explicit quote and Send, permission refusals, native
  permalink and clipboard fallback, ordinary Thread activation, and both
  Reader follow boundaries. Build, typecheck, lint and format passed.
- **Baseline deviation:** the five legacy `IM66.redirect-*` journeys in
  `drawer-redirect-guard.spec.ts` timed out before reaching their redirect
  assertions in the exploratory candidate sweep and on unchanged `fcbd9d5`.
  The baseline receipt is
  `evidence/runs/replay-base-fcbd9d5/evidence/runs/2026-11-28T19-34-51.992Z-msedge-M1Ywss`.
  Those cases are outside the scoped gate; the exact Post link's real native
  redirect, Thread activation, and retained navigation passed separately.

The receipts attach exact method, URL, body and navigation flags; allowlist
verdicts; screenshots; and accessible names, focus, hit tests and geometry.
Keyboard Escape returned to the labelled trigger; ArrowDown focused Reply;
successful preparation moved focus into the ordinary editor. The emulated
390 × 844 touch viewport at 150% text had an unobscured 44 × 44 trigger and a
fully bounded menu. These are browser observations, not physical touch or
screen-reader qualification.

## Trade-offs

- Removing the repeated Post Reply button saves space and a tab stop on
  every Post, at the cost of one extra menu activation on touch/keyboard and
  less mouse discoverability than an always-visible button.
- Prefer native actions on interactive content and within selected text.
  This makes fewer Post pixels actionable, but the labelled menu remains
  available from every Post; selected text remains copyable. The range check
  uses browser-rendered geometry, including the workspace Shadow DOM, rather
  than assuming an element's rectangle is all text; a legacy range fallback
  is best effort and unqualified here.
- Keep Edit and the native author-filter links in their existing places.
  Posts with those controls can still have a footer; removing or
  consolidating them would broaden the ticket and change their access paths.
- Keep the public Reader's existing body-relative latest boundary for Threads
  with a qualified parent Board or trailing actions, even where removing Reply
  eliminates the footer. Other views still follow the scroll extent. This
  retains the 64/65 px behavioral boundary at the cost of separate rules for
  those surfaces rather than one generic end calculation.
- Keep the existing target strip, exact-link rules and ordinary Reply
  workflow instead of introducing a second editor, quote action or target
  model. A fresh exact target can still require a form read and existing
  refusal/guard flows; zero publishing requests does not mean zero reads.
- Keep the older snapshot replay on its original button while migrating
  candidate regressions to the labelled menu. The strict ticket fixtures
  add allowlist and evidence maintenance, but expose unintended reads and
  writes without live effects.
- Qualify the scoped changed workflows and adjoining regressions instead of
  the entire suite. Existing clipboard regressions exercise completion and
  refusal at their clipboard boundary, not the system clipboard. Chrome,
  installed, and live verification remain deferred.

These are reversible layout and test decisions; no API, storage, authority,
or other one-way change needed a BDFL review.
