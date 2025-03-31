import type { Config } from "jest";
import { pathsToModuleNameMapper } from "ts-jest";
import path from "path";
import { compilerOptions } from "../../tsconfig.json";

const rootDir = path.resolve(__dirname, "../..");

export const baseConfig: Config = {
  preset: "ts-jest",
  rootDir,
  moduleFileExtensions: ["js", "mjs", "cjs", "jsx", "ts", "tsx", "json", "node"],

  // Map TypeScript paths to Jest paths
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths || {}, { prefix: `${rootDir}/` }),
  },

  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: path.join(rootDir, "tsconfig.jest.json"),
        useESM: true,
      },
    ],
  },

  transformIgnorePatterns: ["node_modules/(?!(@auth/prisma-adapter|next/dist/client|next/dist/shared|@swc/helpers))"],

  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
};
