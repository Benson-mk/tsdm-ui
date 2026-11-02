import { defineConfig } from "vite";
export default defineConfig({
  build: {
    outDir: "dist/forum-client",
    emptyOutDir: true,
    lib: {
      entry: "src/forum-client/index.ts",
      formats: ["es"],
      fileName: "index",
    },
  },
});
