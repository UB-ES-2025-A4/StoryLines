import js from "@eslint/js";
import globals from "globals";
import vue from "eslint-plugin-vue";
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
    files: ["src/**/*.{js,vue}"],   // 👈 SOLO tu código real
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
      vue.configs["flat/essential"]   // 👈 más flexible, menos errores
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
  }
]);
