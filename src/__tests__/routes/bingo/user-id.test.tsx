import { NextRequest } from "next/server";
import { GET } from "@/app/api/bingo/user-check/[id]/route";
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

    describe("GET /api/bingo/user-check/[id]", () => {
        it("should return user when found", async () => {
            // Arrange
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            const asyncParams = Promise.resolve({ id: "1" });

            // Act
            const response = await GET(new NextRequest(`${TEST_URL}/api/bingo/user-check/1`), { params: asyncParams });

            // Assert
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toEqual(mockUser);
        });

        it("should return 'Anonymous' when user not found", async () => {
            // Arrange
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            const asyncParams = Promise.resolve({ id: "999" });

            // Act
            const response = await GET(new NextRequest(`${TEST_URL}/api/bingo/user-check/999`), {
                params: asyncParams,
            });

            // Assert
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toEqual({ name: "Anonymous" });
        });

        it("should handle errors gracefully", async () => {
            // Arrange
            (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error("Database error"));
            const asyncParams = Promise.resolve({ id: "1" });

            // Act
            const response = await GET(new NextRequest(`${TEST_URL}/api/bingo/user-check/1`), { params: asyncParams });

            // Assert
            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data.error).toBeDefined();
        });
    });
});
