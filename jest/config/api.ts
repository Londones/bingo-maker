import type { Config } from "jest";
import { baseConfig } from "./base";
import path from "path";

const rootDir = path.resolve(__dirname, "../..");

const config: Config = {
  ...baseConfig,

  // Set rootDir explicitly to the project root
  rootDir,

  // Use node environment for API tests
  testEnvironment: "node",

  // API tests setup - use absolute paths
  setupFilesAfterEnv: [path.join(rootDir, "jest/setup/api.ts")],
  // Match API test patterns but exclude component and integration tests
  testMatch: ["**/__tests__/routes/**/*.[jt]s?(x)", "**/__tests__/!(components|integration)/**/*.[jt]s?(x)"],
  testPathIgnorePatterns: [...(baseConfig.testPathIgnorePatterns || []), "integration", ".*integration.*"],
};

export default config;
