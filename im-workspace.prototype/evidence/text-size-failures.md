# Text-size change: failure cases written before implementation

Confirmed proposal: issue #6, 2026-10-18. Exercise the selected A workspace through browser controls using synthetic content.

- The old density select remains, or the slider lacks a label, percentage, 70–150 range, 10-point steps, or reset.
- A change waits for blur/OK instead of previewing and saving on input.
- Only posts scale; headings, navigation, lists, metadata, code, dialogs, or composition retain fixed text sizes.
- Scaling compounds inherited sizes, replaces role weights, scales decorative images/icons, or overrides browser font preferences.
- Compact does not activate at 90%, remains at 100%, or shrinks pane widths or usable controls.
- Compact changes posts alone, leaves the 118px result-row minimum, or loses complete titles/metadata.
- Theme, viewport, language, picker, or section changes produce inconsistent scale/spacing or page-wide overflow.
- Text resizing rebuilds editor/posts/list nodes, loses writing/caret/spoilers, changes history, or moves the current reading anchor.
- Reload loses the size, malformed saved values break startup, or blocked storage prevents a usable session preference.
- Browser Back restores an obsolete size; Reset fails to persist 100% and restore Default spacing.
- Keyboard range controls switch the prototype variant, or cannot reach the endpoints/reset.
- Large text clips controls or removes access to Settings, navigation, reader, or writing.

Evidence: executable browser probe, failing baseline receipt, final receipt, source hashes and screenshots. This is local prototype evidence, not installed-browser/manager or live-forum qualification.
