# Improve board discovery and thread navigation

User request: improve obvious UX friction, navigation, and forum/thread readability on a new feature branch. No matching open GitHub ticket exists. Branch: `feat/improve-ui-ux`.

## Context and plan

The current directory exposes many boards with no local filtering. Every word in a board card is underlined, making descriptions compete with titles. Thread pagination exists only after all posts, requiring a long scroll before changing pages. Keep the established pane layout, typography, navigation owner, recovery schema and forum-client contracts.

Before implementation, enumerate these reachable failures and cover them through complete-application E2Es:

1. Filtering issues network requests, changes browser history, drops board destinations, or hides directory pagination.
2. Whitespace/case/CJK input behaves unexpectedly; matching a group or description fails; empty groups remain; no matches has no explanation or escape.
3. Clearing loses keyboard focus; returning from a board unexpectedly discards the in-page filter; refresh falsely promises retained filter state.
4. Enlarged translated controls overflow a narrow pane, or card styling removes focus/hover affordances or theme contrast.
5. Top pagination points at a reconstructed URL, duplicates bottom navigation's accessible name, scrolls out of reach, or changes the existing bottom pagination.
6. Moving between thread pages or Back loses the actual page, restored content or reading position, or adds automatic reads/writes.

## Acceptance criteria

- [x] Filter loaded directory boards by board name, description or group, with trimmed case-insensitive matching, a visible count, no-match state and keyboard-accessible clear action; no filtering requests/history changes.
- [x] Keep the filter when returning within the mounted workspace; clearly label its current-page scope, preserve board links and directory paging, and verify English/Simplified/Traditional Chinese and narrow/enlarged layouts.
- [x] Make board titles visually distinct from descriptions with complete card targets and visible keyboard/hover feedback in existing themes.
- [x] Expose returned thread page links above posts and keep bottom pagination, current-page context and Back restoration; single-page threads have no redundant top pager.
- [x] Run affected application E2Es and static checks; retain repeatable screenshots, report, receipt and source identity. Complete final advisor validation.
- [ ] Exercise affected installed behavior in Edge and Chrome against the same candidate as required by ADR0002, or report this as an unmet acceptance criterion.

## Trade-offs

1. Filtering only already-loaded directory boards is immediate and has no forum search effects, but cannot find boards on unloaded directory pages. Label this scope and leave directory pagination available.
2. Keep the filter as transient layout state. This preserves it during ordinary in-page navigation without adding recovery-schema or storage work; full reload starts unfiltered.
3. Add a second, distinctly labelled thread pager above posts. This removes the long-scroll prerequisite at the cost of a little additional vertical space on multipage threads. Place their current-page text only in this pager to avoid repetition, removing its second copy from the colored heading; single-page threads keep the heading text.
4. Retain existing layout tracks, type scale, weights and palette while separating board titles from descriptions. This bounds regression risk, with a smaller visual change than a redesign.

## Verification

The final production userscript SHA-256 is `547aa6ce4e42bcb20dab90d96087369bf32a297617e5302ea13c23b84202dc1f`. Built with the pinned Node 24.22.0 and npm 11.21.1 toolchain. Build, typecheck, formatting and diff checks pass. ESLint passes with `--ignore-pattern '.local/**'`; ordinary `npm run lint` encounters pre-existing archived checkouts and their conflicting tsconfig roots in `.local`. No lint configuration was changed for this feature.

The full affected Edge run passes **81/81** application E2Es: `evidence/runs/2026-11-03T03-59-31.081Z/`. The advisor-requested strengthened thread-page case passes **1/1** in `evidence/runs/2026-11-03T04-01-26.569Z/`, adding independent nonzero reading-offset and request-ledger readback to the existing top-pager scenario. Both runs identify the same production bytes. Each directory retains `report.md`, `receipt.json`, `manifest.json`, fixture/test snapshots and synthetic screenshots. These local evidence directories are Git-ignored; replay generates fresh artifacts.

```sh
npm run build
npm run typecheck
npm exec eslint -- . --ignore-pattern '.local/**' --max-warnings 0
npm run test:e2e -- tests/e2e/ui-ux.spec.ts tests/e2e/navigation.spec.ts tests/e2e/appearance.spec.ts
```

E2E expectations preceded feature code. The unchanged baseline failed at the absent filter/top pager (`2026-11-03T03-54-51.413Z`). A fixture initially used an unsupported directory `page` parameter; it was corrected to the repository's existing returned `gid` contract. The first broad run exposed duplicate current-page text, corrected by giving it one location. Failed and successful receipts remain separate. No unit tests were added.

## Advisor and remaining acceptance

On 2026-11-03 the user loaded the candidate in the Codex built-in browser and authorized live testing. Filtering/keyboard clear, same-account Back retention, top and bottom thread paging, exact nonzero scroll restoration (3582px), narrow enlarged Traditional Chinese/Dark controls, Simplified Chinese labels and reload reset were observed successfully. Original appearance preferences and viewport were restored. The local report, receipt, screenshots and manifest are in `evidence/runs/ui-ux-iab-2026-11-03/`. This supplements synthetic evidence; it does not establish installed Edge/Chrome or manager-stored source identity. No implementation change or new design trade-off was introduced during this verification.

The requested gpt-6.1-sol advisor at xhigh reasoning applied `validate-gpt-code-review` after implementation. It found no confirmed implementation defect or egregious decision. It validated local filtering, returned pagination URLs and existing navigation ownership, and card focus/theme contracts. Its sole additional evidence request was nonzero thread reading-position restoration, now covered by the passing strengthened E2E. Its current-page placement trade-off is included once in item 3 above.

Installed Edge/Chrome acceptance remains **unverified**. Browser URL policy rejected observing the `chrome-extension://` Tampermonkey editor and explicitly prohibited alternate surfaces or indirect workarounds. The Tampermonkey Editors connector is disconnected. No installed userscript source was changed. Synthetic tests cannot establish installed-manager compatibility under ADR0002. On 2026-11-03, after the built-in-browser results and outstanding installed-browser check were reported, the owner requested committing this work. The commit retains that criterion unchecked; this approval permits the commit without claiming installed-browser qualification.
