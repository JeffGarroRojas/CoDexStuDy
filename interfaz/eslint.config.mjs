import eslint from "@eslint/js";
import tseslintParser from "@typescript-eslint/parser";
import globals from "globals";

export default [
  eslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslintParser,
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.serviceworker,
        React: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "off",
      "no-explicit-any": "off",
    },
  },
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.serviceworker,
      },
    },
    rules: {
      "no-unused-vars": "off",
    },
  },
  {
    ignores: ["node_modules", ".next", "dist", "out"],
  },
];
