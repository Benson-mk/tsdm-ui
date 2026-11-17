// Throwaway local host. The userscript build does not reference this entry.
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { editorFocusPatch } from "./vite.editor-focus";

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify("prototype · memory only") },
  optimizeDeps: { exclude: ["prosemirror-view"] },
  plugins: [editorFocusPatch(), vue()],
});
