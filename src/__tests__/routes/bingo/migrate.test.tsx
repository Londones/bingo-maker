import { NextRequest } from "next/server";
import { POST } from "@/app/api/bingo/migrate/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { Bingo, Error, MigrationStatus } from "@/types/test-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

jest.mock("@/lib/prisma", () => ({
    prisma: {
        bingo: {
            updateMany: jest.fn(),
        },
    },
}));

jest.mock("next-auth", () => ({
    getServerSession: jest.fn(),
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
            (getServerSession as jest.Mock).mockResolvedValue(mockSession);
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
            (getServerSession as jest.Mock).mockResolvedValue(null);

            // Act
            const response = await POST(
                new NextRequest(`${API_URL}/api/bingo/migrate`, {
                    method: "POST",
                    body: JSON.stringify({
                        bingoIds: [mockBingo.id],
                        authorToken: mockBingo.authorToken,
                        userId: "1",
                    }),
                })
            );

            // Assert
            expect(response.status).toBe(401);
            const data = (await response.json()) as Error;
            expect(data.code).toBe("UNAUTHORIZED");
        });

        it("should return 444 when no bingos found to migrate", async () => {
            // Arrange
            const mockSession = { user: { id: "1" } };
            (getServerSession as jest.Mock).mockResolvedValue(mockSession);
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
