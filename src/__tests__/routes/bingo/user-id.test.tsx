import { NextRequest } from "next/server";
import { GET } from "@/app/api/bingo/user/[id]/route";
import { prisma } from "@/lib/prisma";

const TEST_URL = "http://localhost:3000";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe("User API Route", () => {
  const mockUser = {
    id: "1",
    name: "Test User",
    image: "https://example.com/image.jpg",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/bingo/user/[id]", () => {
    it("should return user when found", async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const response = await GET(new NextRequest(`${TEST_URL}/api/bingo/user/1`), { params: { id: "1" } });

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockUser);
    });

    it("should return 'Anonymous' when user not found", async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act
      const response = await GET(new NextRequest(`${TEST_URL}/api/bingo/user/999`), { params: { id: "999" } });

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ name: "Anonymous" });
    });

    it("should handle errors gracefully", async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error("Database error"));

      // Act
      const response = await GET(new NextRequest(`${TEST_URL}/api/bingo/user/1`), { params: { id: "1" } });

      // Assert
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });
});
