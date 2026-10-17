import js from "@eslint/js";
import ts from "typescript-eslint";
import vue from "eslint-plugin-vue";
import prettier from "eslint-config-prettier/flat";
export default ts.config(
  {
    ignores: [
      "dist/**",
      "evidence/runs/**",
      "node_modules/**",
      "test-results/**",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...vue.configs["flat/recommended"],
  {
    files: ["**/*.vue"],
    rules: { "no-undef": "off", "no-useless-assignment": "off" },
    languageOptions: { parserOptions: { parser: ts.parser } },
  },
  prettier,
  { rules: { "vue/multi-word-component-names": "off" } },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        URL: "readonly",
      },
    },
  },
);
