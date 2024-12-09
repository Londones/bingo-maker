import { PrismaClient } from "@prisma/client";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";

import prisma from "./client";

// Mock PrismaClient
jest.mock("./client", () => ({
    __esModule: true,
    default: mockDeep<PrismaClient>(),
}));

// beforeEach(() => {
//     mockReset(PrismaClient);
// });

export const prismaMock: DeepMockProxy<PrismaClient> = prisma as DeepMockProxy<PrismaClient>;
