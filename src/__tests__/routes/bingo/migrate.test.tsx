import { NextRequest } from "next/server";
import { POST } from "@/app/api/bingo/migrate/route";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Bingo, Error, MigrationStatus } from "@/types/test-types";
import { mockSession } from "@/__mocks__/auth";
import { APIError } from "@/lib/errors";

const API_URL = "http://localhost:3000";

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(() => Promise.resolve(mockSession)),
  GoogleProvider: jest.fn(),
}));

jest.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    bingo: {
      updateMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe("Bingo Migration API Routes", () => {
  const mockBingo = {
    id: "1",
    authorToken: "test-token",
    userId: null,
  } as Bingo;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/bingo/migrate", () => {
    it("should migrate bingos successfully", async () => {
      // Arrange
      const mockSession = { user: { id: "1" } };
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (prisma.bingo.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      // Act
      const response = await POST(
        new NextRequest(`${API_URL}/api/bingo/migrate`, {
          method: "POST",
          body: JSON.stringify({
            bingoIds: [mockBingo.id],
            authorToken: mockBingo.authorToken,
            userId: mockSession.user.id,
          }),
        })
      );

      // Assert
      expect(response.status).toBe(200);
      const data = (await response.json()) as MigrationStatus;
      expect(data).toEqual({
        success: true,
        migratedCount: 1,
      });
    });

    it("should return 401 when unauthorized", async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue(null);

      // Act
      const error = (await POST(
        new NextRequest(`${API_URL}/api/bingo/migrate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bingoIds: [mockBingo.id],
            authorToken: mockBingo.authorToken,
            userId: "1",
          }),
        })
      ).catch((err: APIError) => err)) as APIError;

      // Assert
      expect(error.message).toBe("Unauthorized");
      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.status).toBe(401);
    });

    it("should return 444 when no bingos found to migrate", async () => {
      // Arrange
      const mockSession = { user: { id: "1" } };
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (prisma.bingo.count as jest.Mock).mockResolvedValue(0);
      (prisma.bingo.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      // Act
      const response = await POST(
        new NextRequest(`${API_URL}/api/bingo/migrate`, {
          method: "POST",
          body: JSON.stringify({
            bingoIds: [mockBingo.id],
            authorToken: mockBingo.authorToken,
            userId: mockSession.user.id,
          }),
        })
      );

      // Assert
      expect(response.status).toBe(444);
      const data = (await response.json()) as Error;
      expect(data.code).toBe("BINGO_NOT_FOUND");
    });
  });
});
