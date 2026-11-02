import type { Plugin } from "vite";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

// ProseMirror 1.42.3 mistakes keyboard navigation to the document start just
// after focus for a browser selection reset. Keep its browser repair only when
// no keyboard selection has occurred since focus. See the #24 integration note.
export function editorFocusPatch(): Plugin {
  const entry = createRequire(import.meta.url).resolve("prosemirror-view");
  const metadata = JSON.parse(
    readFileSync(resolve(dirname(entry), "../package.json"), "utf8"),
  );
  if (metadata.version !== "1.42.3")
    throw new Error(
      "Requalify the editor focus patch for this ProseMirror version.",
    );
  const original =
    "if (from < 0 && newSel && view.input.lastFocus > Date.now() - 200 &&";
  return {
    name: "editor-focus-keyboard-selection",
    enforce: "pre",
    transform(code, id) {
      if (
        !/\/prosemirror-view\/dist\/index\.js(?:\?.*)?$/.test(
          id.replaceAll("\\", "/"),
        )
      )
        return;
      if (code.split(original).length !== 2)
        throw new Error(
          "Review the ProseMirror focus patch before changing the pinned editor dependency.",
        );
      return {
        code: code.replace(
          original,
          original +
            '\n            !(view.input.lastSelectionOrigin === "key" && view.input.lastSelectionTime >= view.input.lastFocus) &&',
        ),
        map: null,
      };
    },
  };
}
