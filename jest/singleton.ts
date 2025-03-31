// This file is used to set up any shared test state or globals
// that should persist across all tests, regardless of environment

// Add any singleton setup code here
// For example, you might set up a global mock store or service
import { PrismaClient } from "@prisma/client";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";

import prisma from "@/lib/client";

// Mock PrismaClient
jest.mock("@/lib/client", () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

// beforeEach(() => {
//     mockReset(PrismaClient);
// });

export const prismaMock: DeepMockProxy<PrismaClient> = prisma as DeepMockProxy<PrismaClient>;
