import { NextRequest } from "next/server";
import { POST } from "@/app/api/bingo/[id]/check-ownership/route";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { mockSession } from "@/__mocks__/auth";

const TEST_URL = "http://localhost:3000";

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
      findUnique: jest.fn(),
    },
  },
}));

describe("Check Ownership API Route", () => {
  const mockBingo = {
    id: "1",
    userId: "1",
    authorToken: "valid-token",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/bingo/[id]/check-ownership", () => {
    it("should return true when user is owner", async () => {
      // Arrange
      const mockSession = { user: { id: "1" } };
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (prisma.bingo.findUnique as jest.Mock).mockResolvedValue(mockBingo);
      const asyncParams = Promise.resolve({ id: "1" });

      // Act
      const response = await POST(
        new NextRequest(`${TEST_URL}/api/bingo/1/check-ownership`, {
          method: "POST",
          body: JSON.stringify({ authorToken: "" }),
        }),
        { params: asyncParams }
      );

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.isOwner).toBe(true);
    });

    it("should return true when authorToken matches", async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue(null);
      (prisma.bingo.findUnique as jest.Mock).mockResolvedValue(mockBingo);
      const asyncParams = Promise.resolve({ id: "1" });

      // Act
      const response = await POST(
        new NextRequest(`${TEST_URL}/api/bingo/1/check-ownership`, {
          method: "POST",
          body: JSON.stringify({ authorToken: "valid-token" }),
        }),
        { params: asyncParams }
      );

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.isOwner).toBe(true);
    });

    it("should return false when not owner", async () => {
      // Arrange
      const mockSession = { user: { id: "2" } };
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (prisma.bingo.findUnique as jest.Mock).mockResolvedValue(mockBingo);
      const asyncParams = Promise.resolve({ id: "1" });

      // Act
      const response = await POST(
        new NextRequest(`${TEST_URL}/api/bingo/1/check-ownership`, {
          method: "POST",
          body: JSON.stringify({ authorToken: "wrong-token" }),
        }),
        { params: asyncParams }
      );

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.isOwner).toBe(false);
    });

    it("should return 444 when bingo not found", async () => {
      // Arrange
      (prisma.bingo.findUnique as jest.Mock).mockResolvedValue(null);
      const asyncParams = Promise.resolve({ id: "999" });

      // Act
      const response = await POST(
        new NextRequest(`${TEST_URL}/api/bingo/999/check-ownership`, {
          method: "POST",
          body: JSON.stringify({ authorToken: "" }),
        }),
        { params: asyncParams }
      );

      // Assert
      expect(response.status).toBe(444);
      const data = await response.json();
      expect(data.code).toBe("BINGO_NOT_FOUND");
    });
  });
});
