module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src", "<rootDir>/libs"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/app/$1",
    "^@/libs/(.*)$": "<rootDir>/libs/$1",
    "^@/features/(.*)$": "<rootDir>/src/features/$1",
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
};

