// eslint.config.js
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**"]
  },

  eslint.configs.recommended,

  ...tseslint.configs.recommended,

  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module",
        ecmaVersion: "latest"
      }
    },

    rules: {
      semi: ["error", "always"],
      eqeqeq: "error",
      curly: "error",

      // TypeScript
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" }
      ],

      // Para backend no solemos prohibir console.log
      "no-console": "off"
    }
  }
);
