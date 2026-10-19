import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import monkey from "vite-plugin-monkey";
export default defineConfig({
  plugins: [
    vue(),
    monkey({
      entry: "src/main.ts",
      userscript: {
        name: "TSDM Workspace",
        namespace: "https://github.com/Benson-mk/tsdm-ui",
        version: "0.3.0",
        description:
          "Current-account forum workspace. Manual installation and updates.",
        match: ["https://www.tsdm39.com/*"],
        exclude: ["https://www.tsdm39.com/*tsdm-native=1*"],
        grant: ["GM_registerMenuCommand"],
        "run-at": "document-end",
      },
      build: { fileName: "tsdm-workspace.user.js", externalGlobals: {} },
    }),
  ],
  build: { emptyOutDir: true },
});
