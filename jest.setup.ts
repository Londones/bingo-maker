import { loadEnvConfig } from "@next/env";
import "@testing-library/jest-dom";
import { expect, jest } from "@jest/globals";

global.expect = expect;
global.jest = jest;

loadEnvConfig(process.cwd());
