import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  clearMocks: true,
  coverageDirectory: "coverage",
  collectCoverageFrom: ["src/api/**/*.ts", "src/services/**/*.ts"],
};

export default config;
