/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src", "<rootDir>/libs", "<rootDir>/app", "<rootDir>/lib"],
  testMatch: ["**/__tests__/**/*.test.[jt]s?(x)"],
  moduleNameMapper: {
    "^@/features/(.*)$": "<rootDir>/src/features/$1",
    "^@/libs/(.*)$": "<rootDir>/libs/$1",
    "^@/(.*)$": "<rootDir>/$1",
    "^@shiftsync/shared$": "<rootDir>/../../packages/shared/src/index.ts",
  },
  transform: {
    "^.+\\.(t|j)sx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          module: "commonjs",
          esModuleInterop: true,
          strict: true,
          skipLibCheck: true,
          moduleResolution: "node",
          isolatedModules: true,
          resolveJsonModule: true,
          lib: ["dom", "dom.iterable", "esnext"],
        },
        useESM: false,
      },
    ],
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
};
