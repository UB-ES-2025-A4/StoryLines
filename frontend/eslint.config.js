import js from "@eslint/js";
import globals from "globals";
import vue from "eslint-plugin-vue";
import vitest from "eslint-plugin-vitest";  // 👈 IMPORT CORRECTO ESM
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.vite/**",
      "**/coverage/**",
      "vite.config.js"
    ]
  },

  {
    files: ["src/**/*.{js,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021
      }
    },
    extends: [
      js.configs.recommended,
      vue.configs["flat/essential"]
    ],
    plugins: { vue },
    rules: {
      "no-unused-vars": "warn",
      "vue/no-multiple-template-root": "off",
      "vue/multi-word-component-names": "off",
      "vue/html-self-closing": "off",
      "vue/max-attributes-per-line": "off",
      "vue/html-indent": "off",
      "vue/singleline-html-element-content-newline": "off",
      "vue/multiline-html-element-content-newline": "off",
      "vue/attributes-order": "off"
    }
  },

  // 🔥 BLOQUE PARA TESTS (ESM CORRECTO)
{
  files: ["src/tests/**/*.test.js", "src/tests/**/*.spec.js"],
  languageOptions: {
    globals: {
      ...globals.browser,
      ...globals.es2021,
      test: "readonly",
      expect: "readonly",
      describe: "readonly",
      beforeEach: "readonly",
      afterEach: "readonly",
    }
  },
  plugins: { vitest },
  rules: {
    ...vitest.configs.recommended.rules
  }
}

]);
