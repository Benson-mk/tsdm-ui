# #91 palette and soft boundaries: failure-first plan

The approved seam is the complete built application in Microsoft Edge, with only external HTTP substituted. Read-only DOM/computed-style observations, native input and the actual prepared Review are the public interface. No unit tests or internal mocks are introduced. Installed Edge remains a separate gate; Chrome is deferred to #93.

Before feature code, reachable failures are:

- UI91.quote-review: rich quotes remain transparent while reading and real Review differ; named-quote metadata becomes muted on a pastel; Dark inherits white text on pastels; table headings lack the exact cool role; source, selection, undo or frozen Review changes during theme transitions; preview references fetch remote media or a social write occurs.
- UI91.category-retention: browsing Creative after composing for Anime changes the writer's category or target; minimized and real Review lose the original label; source filters and existing avatars remain unrelated to their board; unknown groups gain guessed semantics; hover replaces category fills.
- UI91.controls: selected actions lose monochrome fill on hover; inactive controls appear actionable; native accents escape the palette; generated tints survive in protected text or table selections; Dark focus becomes invisible on colored or inverse surfaces; text stack changes.
- UI91.boundaries: decorative pane/header/card/dock outlines remain; removing boundaries makes Dark and forced-colors controls indistinguishable; menus paint under adjacent panes or resize targets; focus gets clipped; flat posts acquire elevation or default/Compact density changes; modal scrim/elevation deviates from pinned effects.

Implement one vertical E2E slice at a time. Each case retains screenshots and computed color/geometry/source/request observations through the existing receipt/report/source manifest reporter. Retain red and superseded receipts unchanged. Exact palette literals come from #81 decision 16, and shadow literals from decision 17. Supporting #84 category identity and #87 writing lifecycle remain the owners. No portable contract, server route or persistence change is planned.
