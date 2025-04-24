import { NextRequest } from "next/server";
import { GET, LatestBingosResponse } from "@/app/api/bingo/latest/route";
import { prisma } from "@/lib/prisma";
import { BingoPreview } from "@/types/types";
import { APIError } from "@/lib/errors";

const API_URL = "http://localhost:3000";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    bingo: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe("Latest Bingos API Route", () => {
  const mockBingos: BingoPreview[] = Array.from({ length: 15 }, (_, i) => ({
    id: `${i + 1}`,
    title: `Test Bingo ${i + 1}`,
    status: i % 2 === 0 ? "draft" : "published",
    background: {
      value: "#ffffff",
      backgroundImage: `image${i + 1}.jpg`,
      backgroundImageOpacity: 0.5,
      backgroundImagePosition: "center",
      backgroundImageSize: 50,
    },
    createdAt: new Date(2023, 0, i + 1),
  }));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/bingo/latest", () => {
    it("should return paginated bingos", async () => {
      // Arrange
      (prisma.bingo.findMany as jest.Mock).mockResolvedValue(mockBingos.slice(0, 11));
      (prisma.bingo.count as jest.Mock).mockResolvedValue(15);

      // Act
      const response = await GET(new NextRequest(`${API_URL}/api/bingo/latest?limit=10`));

      // Assert
      const data = (await response.json()) as LatestBingosResponse;
      expect(data.items).toHaveLength(10);
      expect(data.hasMore).toBe(true);
      expect(data.nextCursor).toBe("10");
      expect(data.total).toBe(15);
    });

    it("should handle less than limit entries correctly", async () => {
      // Arrange
      const smallDataset = mockBingos.slice(0, 5);
      (prisma.bingo.findMany as jest.Mock).mockResolvedValue(smallDataset);
      (prisma.bingo.count as jest.Mock).mockResolvedValue(5);

      // Act
      const response = await GET(new NextRequest(`${API_URL}/api/bingo/latest?limit=10`));

      // Assert
      const data = (await response.json()) as LatestBingosResponse;
      expect(data.items).toHaveLength(5);
      expect(data.hasMore).toBe(false);
      expect(data.nextCursor).toBeUndefined();
      expect(data.total).toBe(5);
    });

    it("should return paginated bingos with cursor", async () => {
      // Arrange
      (prisma.bingo.findUnique as jest.Mock).mockResolvedValue(mockBingos[4]); // Cursor exists check
      (prisma.bingo.findMany as jest.Mock).mockResolvedValue(mockBingos.slice(5, 11));
      (prisma.bingo.count as jest.Mock).mockResolvedValue(15);

      // Act
      const response = await GET(new NextRequest(`${API_URL}/api/bingo/latest?limit=5&cursor=5`));

      // Assert
      const data = (await response.json()) as LatestBingosResponse;
      expect(data.items).toHaveLength(5);
      expect(data.hasMore).toBe(true);
      expect(data.nextCursor).toBe("10");
      expect(data.total).toBe(15);
    });

    it("should filter by status", async () => {
      // Arrange
      const draftBingos = mockBingos.filter((bingo) => bingo.status === "draft");
      (prisma.bingo.findMany as jest.Mock).mockResolvedValue(draftBingos.slice(0, 6));
      (prisma.bingo.count as jest.Mock).mockResolvedValue(8); // Assuming 8 draft bingos in total

      // Act
      const response = await GET(new NextRequest(`${API_URL}/api/bingo/latest?limit=5&status=draft`));

      // Assert
      const data = (await response.json()) as LatestBingosResponse;
      expect(data.items).toHaveLength(5);
      expect(data.hasMore).toBe(true);
      expect(data.nextCursor).toBeDefined();
      expect(data.total).toBe(8);
      expect(data.items.every((item) => item.status === "draft")).toBe(true);
    });

    it("should return 400 with invalid cursor", async () => {
      // Arrange
      (prisma.bingo.findUnique as jest.Mock).mockResolvedValue(null); // Cursor doesn't exist

      // Act
      const error = await GET(new NextRequest(`${API_URL}/api/bingo/latest?cursor=999`)).catch(
        (error: APIError) => error
      );

      // Assert
      if (error instanceof APIError) {
        expect(error.status).toBe(400);
        expect(error.code).toBe("INVALID_REQUEST");
      } else {
        const response = await error.json();
        expect(response.code).toBe("INVALID_REQUEST");
        expect(response.status).toBe(400);
      }
    });

    it("should handle server error when no bingos returned", async () => {
      // Arrange
      (prisma.bingo.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.bingo.count as jest.Mock).mockResolvedValue(10); // There should be bingos but none returned

      // Act
      const error = await GET(new NextRequest(`${API_URL}/api/bingo/latest`)).catch((error: APIError) => error);

      // Assert
      if (error instanceof APIError) {
        expect(error.status).toBe(500);
        expect(error.code).toBe("FAILED_TO_GET_BINGOS");
      } else {
        const response = await error.json();
        expect(response.code).toBe("FAILED_TO_GET_BINGOS");
        expect(response.status).toBe(500);
      }
    });
  });
});
