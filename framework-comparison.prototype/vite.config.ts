import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import react from "@vitejs/plugin-react";
import monkey from "vite-plugin-monkey";

export default defineConfig(({ command, mode }) => ({
  plugins: [
    vue(),
    react(),
    ...(command === "build"
      ? [
          monkey({
            entry: `src/entry-${mode}.${mode === "vue" ? "ts" : "tsx"}`,
            userscript: {
              name: `TSDM ${mode} comparison — LOCAL PROTOTYPE`,
              namespace: "tsdm-framework-comparison",
              version: "0.0.0",
              description:
                "Synthetic framework comparison; no forum or account access.",
              match: ["http://127.0.0.1:4177/*", "http://localhost:4177/*"],
              grant: [],
              noframes: true,
            },
            build: {
              fileName: `comparison-${mode}.user.js`,
              externalGlobals: {},
              externalResource: {},
              systemjs: "inline",
            },
          }),
        ]
      : []),
  ],
  build: { outDir: `dist/${mode}`, emptyOutDir: true, minify: true },
}));
