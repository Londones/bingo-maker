import { TextEncoder, TextDecoder } from "util";

// Polyfills needed for Node environment
global.TextEncoder = TextEncoder;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.TextDecoder = TextDecoder as any;

// Mock modules commonly used in API tests
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(() => Promise.resolve({ user: { id: "test-user-id", email: "test@example.com" } })),
  GoogleProvider: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    bingo: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    user: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
    suggestion: { findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  },
}));

// Import any shared singleton setup if needed
import "../singleton";
