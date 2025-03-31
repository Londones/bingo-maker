import type { Config } from "jest";
import { baseConfig } from "./base";
import path from "path";

const rootDir = path.resolve(__dirname, "../..");

const config: Config = {
  ...baseConfig,

  // Set rootDir explicitly to the project root
  rootDir,

  // Use JSDOM for component tests
  testEnvironment: "jsdom",

  // Component tests setup - use absolute paths
  setupFilesAfterEnv: [path.join(rootDir, "jest/setup/components.ts")],

  // Match only component tests
  testMatch: ["**/__tests__/components/**/*.[jt]s?(x)"],
};

export default config;
