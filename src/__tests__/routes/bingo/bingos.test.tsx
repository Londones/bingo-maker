import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/bingo/route";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Bingo, Error, PaginatedResponse } from "@/types/test-types";
import { mockSession } from "@/__mocks__/auth";

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
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe("Bingos API Routes", () => {
  const mockBingo = {
    id: "1",
    title: "Test Bingo",
    cells: [
      {
        id: "1",
        content: "Test Cell",
        position: 0,
        validated: false,
      },
    ],
    style: {
      fontSize: 16,
      fontFamily: "Arial",
      color: "#000000",
      cellSize: 100,
      gap: 8,
    },
    background: {
      type: "color",
      value: "#ffffff",
    },
    stamp: {
      type: "emoji",
      value: "✓",
      size: 24,
      opacity: 1,
    },
    status: "draft",
  } as Bingo;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/bingo", () => {
    it("should create bingo", async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue({ user: { id: "1" } });
      (prisma.bingo.create as jest.Mock).mockResolvedValue(mockBingo);

      // Act
      const response = await POST(
        new NextRequest(`${API_URL}/api/bingo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mockBingo),
        })
      );

      // Assert
      expect(response.status).toBe(200);
      const data = (await response.json()) as Bingo;
      expect(data).toEqual(mockBingo);
    });

    it("should return 557 when failed to create bingo", async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue({ user: { id: "1" } });
      (prisma.bingo.create as jest.Mock).mockResolvedValue(null);

      // Act
      const response = await POST(
        new NextRequest(`${API_URL}/api/bingo`, {
          method: "POST",
          body: JSON.stringify(mockBingo),
        })
      );

      // Assert
      expect(response.status).toBe(557);
      const data = (await response.json()) as Error;
      expect(data.code).toBe("FAILED_TO_CREATE_BINGO");
    });
  });

  describe("GET /api/bingo", () => {
    it("should return paginated bingos", async () => {
      // Arrange
      const mockBingos = Array.from({ length: 11 }, (_, i) => ({
        id: `${i}`,
        createdAt: new Date(),
        cells: [],
      }));

      (prisma.bingo.findMany as jest.Mock).mockResolvedValue(mockBingos);

      // Act
      const response = await GET(new NextRequest(`${API_URL}/api/bingo?limit=10`));

      // Assert
      const data = (await response.json()) as PaginatedResponse<Bingo>;
      expect(data.items).toHaveLength(10);
      expect(data.hasMore).toBe(true);
      expect(data.nextCursor).toBe("9");
    });

    it("handles less than limit entries correctly", async () => {
      // Arrange
      const smallDataset = Array.from({ length: 5 }, (_, i) => ({
        id: `${i}`,
        createdAt: new Date(),
        cells: [],
      }));

      (prisma.bingo.findMany as jest.Mock).mockResolvedValue(smallDataset);

      // Act
      const response = await GET(new NextRequest(`${API_URL}/api/bingo?limit=10`));

      // Assert
      const data = (await response.json()) as PaginatedResponse<Bingo>;
      expect(data.items).toHaveLength(5);
      expect(data.hasMore).toBe(false);
      expect(data.nextCursor).toBeUndefined();
    });

    it("should return second page of bingos", async () => {
      // Arrange
      const mockBingos = Array.from({ length: 11 }, (_, i) => ({
        id: `${i + 5}`,
        createdAt: new Date(),
        cells: [],
      })) as Bingo[];

      (prisma.bingo.findMany as jest.Mock).mockResolvedValue(mockBingos.slice(0, 5));
      (prisma.bingo.count as jest.Mock).mockResolvedValue(11);
      (prisma.bingo.findUnique as jest.Mock).mockResolvedValue(mockBingos[4]);

      // Act
      const response = await GET(new NextRequest(`${API_URL}/api/bingo?limit=10&cursor=5`));

      // Assert
      const data = (await response.json()) as PaginatedResponse<Bingo>;
      expect(data).toBeDefined();
      expect(Array.isArray(data.items)).toBeTruthy();
      expect(data.items).toHaveLength(5);
      expect(data.hasMore).toBe(false);
      expect(data.nextCursor).toBeUndefined();
    });
  });
});
