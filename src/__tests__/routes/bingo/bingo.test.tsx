import { NextRequest } from "next/server";
import { GET, PATCH, DELETE } from "@/app/api/bingo/[id]/route";
import { prisma } from "@/lib/prisma";
import { Bingo, Error } from "@/types/test-types";
import { auth } from "@/lib/auth";
import { mockSession } from "@/__mocks__/auth";
import { APIError } from "@/lib/errors";

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
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe("Bingo API Routes", () => {
  const mockBingo = {
    id: "1",
    title: "Test Bingo",
    cells: [{ id: "1", content: "Test Cell", position: 0 }],
    isAuthor: false,
  } as Bingo;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/bingo/[id]", () => {
    it("should return bingo when found", async () => {
      // Arrange
      (prisma.bingo.findUnique as jest.Mock).mockResolvedValue(mockBingo);
      const asyncParams = Promise.resolve({ id: "1" });

      // Act
      const response = await GET(new NextRequest(`${TEST_URL}/api/bingo`), { params: asyncParams });

      // Assert
      expect(response.status).toBe(200);
      const data = (await response.json()) as Bingo;
      expect(data).toEqual(mockBingo);
    });

    it("should return 445 when missing ID", async () => {
      // Arrange
      const asyncParams = Promise.resolve({ id: "" });

      // Act
      const error = await GET(new NextRequest(`${TEST_URL}/api/bingo`), { params: asyncParams }).catch(
        (error: APIError) => error
      );

      if (error instanceof APIError) {
        // Assert
        expect(error.message).toBe("Missing ID");
        expect(error.code).toBe("MISSING_ID_OR_SHARE_TOKEN");
        expect(error.status).toBe(445);
      }
    });

    it("should return 404 when bingo not found", async () => {
      // Arrange
      (prisma.bingo.findUnique as jest.Mock).mockResolvedValue(null);
      const asyncParams = Promise.resolve({ id: "999" });

      // Act
      const error = await GET(new NextRequest(`${TEST_URL}/api/bingo`), { params: asyncParams }).catch(
        (error: APIError) => error
      );

      // Assert
      if (error instanceof APIError) {
        expect(error.status).toBe(444);
        expect(error.message).toBe("Bingo not found");
        expect(error.code).toBe("BINGO_NOT_FOUND");
      }
    });
  });

  describe("PATCH /api/bingo/[id]", () => {
    it("should update bingo when authorized", async () => {
      // Arrange
      //(auth as jest.Mock).mockResolvedValue(mockSession);
      (prisma.bingo.findUnique as jest.Mock).mockResolvedValue({
        ...mockBingo,
        userId: "1",
      });
      const asyncParams = Promise.resolve({ id: "1" });

      const updateData = { title: "Updated Title" };
      (prisma.bingo.update as jest.Mock).mockResolvedValue({ ...mockBingo, ...updateData });

      // Act
      const response = await PATCH(
        new NextRequest(`${TEST_URL}/api/bingo`, {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }),
        { params: asyncParams }
      );

      // Assert
      expect(response.status).toBe(200);
    });

    it("should return 444 when bingo not found", async () => {
      // Arrange
      (prisma.bingo.findUnique as jest.Mock).mockResolvedValue(null);
      const asyncParams = Promise.resolve({ id: "999" });

      // Act
      const response = await PATCH(
        new NextRequest(`${TEST_URL}/api/bingo`, {
          method: "PATCH",
          body: JSON.stringify({ title: "Test" }),
        }),
        { params: asyncParams }
      );

      // Assert
      expect(response.status).toBe(444);
      const data = (await response.json()) as Error;
      expect(data.code).toBe("BINGO_NOT_FOUND");
    });

    it("should return 401 when unauthorized", async () => {
      // Arrange
      const localMockedSession = { user: { id: "2" } };
      (auth as jest.Mock).mockResolvedValue(localMockedSession);
      (prisma.bingo.findUnique as jest.Mock).mockResolvedValue({
        ...mockBingo,
        userId: "1",
      });
      const asyncParams = Promise.resolve({ id: "1" });

      // Act
      const response = await PATCH(
        new NextRequest(`${TEST_URL}/api/bingo`, {
          method: "PATCH",
          body: JSON.stringify({ title: "Test" }),
        }),
        { params: asyncParams }
      );

      // Assert
      expect(response.status).toBe(401);
      const data = (await response.json()) as Error;
      expect(data.code).toBe("UNAUTHORIZED");
    });
  });

  describe("DELETE /api/bingo/[id]", () => {
    it("should delete bingo when authorized", async () => {
      // Arrange
      const mockSession = { user: { id: "1" } };
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (prisma.bingo.findUnique as jest.Mock).mockResolvedValue({
        ...mockBingo,
        userId: "1",
      });
      const asyncParams = Promise.resolve({ id: "1" });

      // Act
      const response = await DELETE(new NextRequest(`${TEST_URL}/api/bingo`), { params: asyncParams });

      // Assert
      expect(response.status).toBe(200);
    });

    it("should return 444 when bingo not found", async () => {
      // Arrange
      (prisma.bingo.findUnique as jest.Mock).mockResolvedValue(null);
      const asyncParams = Promise.resolve({ id: "999" });

      // Act
      const response = await DELETE(new NextRequest(`${TEST_URL}/api/bingo`), { params: asyncParams });

      // Assert
      expect(response.status).toBe(444);
      const data = (await response.json()) as Error;
      expect(data.code).toBe("BINGO_NOT_FOUND");
    });

    it("should return 401 when unauthorized", async () => {
      // Arrange
      const mockSession = { user: { id: "2" } };

      (auth as jest.Mock).mockResolvedValue(mockSession);
      (prisma.bingo.findUnique as jest.Mock).mockResolvedValue({
        ...mockBingo,
        userId: "1",
      });
      const asyncParams = Promise.resolve({ id: "1" });

      // Act
      const response = await DELETE(new NextRequest(`${TEST_URL}/api/bingo`), { params: asyncParams });

      // Assert
      expect(response.status).toBe(401);
      const data = (await response.json()) as Error;
      expect(data.code).toBe("UNAUTHORIZED");
    });
  });
});
