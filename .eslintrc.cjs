/** @type { import("eslint").Linter.Config } */
module.exports = {
  root: true,
  ignorePatterns: [
    "node_modules/",
    "dist/",
    ".next/",
    "out/",
    "*.tsbuildinfo",
    ".yarn/",
  ],
  overrides: [
    // API plain JS (migrations, seeders, config)
    {
      files: ["apps/api/**/*.js"],
      env: { node: true, es2022: true },
      parserOptions: { ecmaVersion: 2022, sourceType: "script" },
    },
    // Next.js app (apps/web): Next + TypeScript + Prettier
    {
      files: ["apps/web/**/*.{js,jsx,ts,tsx}"],
      extends: [
        "next/core-web-vitals",
        "plugin:@typescript-eslint/recommended",
        "prettier",
      ],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      plugins: ["@typescript-eslint"],
      settings: {
        react: { version: "detect" },
      },
      rules: {
        "no-html-link-for-pages": "off",
      },
    },
    // NestJS API (apps/api): TypeScript + Prettier
    {
      files: ["apps/api/**/*.ts"],
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier",
      ],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: "./apps/api/tsconfig.json",
        tsconfigRootDir: __dirname,
      },
      plugins: ["@typescript-eslint"],
      env: { node: true, es2022: true },
    },
    // Root config files (e.g. .eslintrc.cjs)
    {
      files: ["*.{js,cjs,mjs}"],
      excludedFiles: ["apps/**/*"],
      extends: ["eslint:recommended", "prettier"],
      env: { node: true, es2022: true },
    },
  ],
};
