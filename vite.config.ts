import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import monkey from "vite-plugin-monkey";
import { editorFocusPatch } from "./vite.editor-focus";
import metadata from "./package.json" with { type: "json" };
const releaseTag = process.env.RELEASE_TAG;
if (
  releaseTag &&
  !/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(releaseTag)
)
  throw new Error("RELEASE_TAG must be vMAJOR.MINOR.PATCH");
const applicationVersion = releaseTag?.slice(1) ?? metadata.version;
export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(applicationVersion) },
  optimizeDeps: { exclude: ["prosemirror-view"] },
  plugins: [
    editorFocusPatch(),
    vue(),
    monkey({
      entry: "src/main.ts",
      userscript: {
        name: "TSDM UI",
        namespace: "https://github.com/Benson-mk/tsdm-ui",
        version: applicationVersion,
        description:
          "Current-account forum workspace. Manual installation and updates.",
        match: ["https://www.tsdm39.com/*"],
        exclude: ["https://www.tsdm39.com/*tsdm-native=1*"],
        grant: ["GM_registerMenuCommand"],
        "run-at": "document-end",
      },
      build: { fileName: "tsdm-ui.user.js", externalGlobals: {} },
    }),
  ],
  build: { emptyOutDir: true },
});
