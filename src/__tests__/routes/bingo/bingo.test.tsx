/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { GET, PATCH, DELETE } from "@/app/api/bingo/[id]/route";
import { prisma } from "@/lib/prisma";
import { Bingo, Error } from "@/types/test-types";
import { getServerSession } from "next-auth";
import { mockSession } from "@/__mocks__/auth";

const API_URL = "http://localhost:3000";

jest.mock("next-auth", () => ({
    getServerSession: jest.fn(() => Promise.resolve(mockSession)),
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
        },
    },
}));

describe("Bingo API Routes", () => {
    const mockBingo = {
        id: "1",
        title: "Test Bingo",
        cells: [{ id: "1", content: "Test Cell", position: 0 }],
    } as Bingo;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /api/bingo/[id]", () => {
        it("should return bingo when found", async () => {
            // Arrange
            (prisma.bingo.findUnique as jest.Mock).mockResolvedValue(mockBingo);

            // Act
            const response = await GET(new NextRequest(`${API_URL}/api/bingo/1`), { params: { id: "1" } });

            // Assert
            expect(response.status).toBe(200);
            const data = (await response.json()) as Bingo;
            expect(data).toEqual(mockBingo);
        });

        it("should return 445 when missing ID", async () => {
            // Act
            const response = await GET(new NextRequest(`${API_URL}/api/bingo/`), { params: { id: "" } });

            // Assert
            expect(response.status).toBe(445);
            const data = (await response.json()) as Error;
            expect(data.code).toBe("MISSING_ID_OR_SHARE_TOKEN");
        });

        it("should return 404 when bingo not found", async () => {
            // Arrange
            (prisma.bingo.findUnique as jest.Mock).mockResolvedValue(null);

            // Act
            const response = await GET(new NextRequest(`${API_URL}/api/bingo/999`), { params: { id: "999" } });

            // Assert
            expect(response.status).toBe(444);
            const data = (await response.json()) as Error;
            expect(data.code).toBe("BINGO_NOT_FOUND");
        });
    });

    describe("PATCH /api/bingo/[id]", () => {
        it("should update bingo when authorized", async () => {
            // Arrange
            //const mockSession = { user: { id: "1" } };
            (getServerSession as jest.Mock).mockResolvedValue(mockSession);
            (prisma.bingo.findUnique as jest.Mock).mockResolvedValue({
                ...mockBingo,
                userId: "1",
            });

            const updateData = { title: "Updated Title" };

            // Act
            const response = await PATCH(
                new NextRequest(`${API_URL}/api/bingo/1`, {
                    method: "PATCH",
                    body: JSON.stringify(updateData),
                }),
                { params: { id: "1" } }
            );

            // Assert
            expect(response.status).toBe(200);
        });

        it("should return 444 when bingo not found", async () => {
            // Arrange
            (prisma.bingo.findUnique as jest.Mock).mockResolvedValue(null);

            // Act
            const response = await PATCH(
                new NextRequest(`${API_URL}/api/bingo/999`, {
                    method: "PATCH",
                    body: JSON.stringify({ title: "Test" }),
                }),
                { params: { id: "999" } }
            );

            // Assert
            expect(response.status).toBe(444);
            const data = (await response.json()) as Error;
            expect(data.code).toBe("BINGO_NOT_FOUND");
        });

        it("should return 401 when unauthorized", async () => {
            // Arrange
            //const mockSession = { user: { id: "2" } };
            (getServerSession as jest.Mock).mockResolvedValue(mockSession);
            (prisma.bingo.findUnique as jest.Mock).mockResolvedValue({
                ...mockBingo,
                userId: "1",
            });

            // Act
            const response = await PATCH(
                new NextRequest(`${API_URL}/api/bingo/1`, {
                    method: "PATCH",
                    body: JSON.stringify({ title: "Test" }),
                }),
                { params: { id: "1" } }
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
            (getServerSession as jest.Mock).mockResolvedValue(mockSession);
            (prisma.bingo.findUnique as jest.Mock).mockResolvedValue({
                ...mockBingo,
                userId: "1",
            });

            // Act
            const response = await DELETE(new NextRequest(`${API_URL}/api/bingo/1`), { params: { id: "1" } });

            // Assert
            expect(response.status).toBe(200);
        });

        it("should return 444 when bingo not found", async () => {
            // Arrange
            (prisma.bingo.findUnique as jest.Mock).mockResolvedValue(null);

            // Act
            const response = await DELETE(new NextRequest(`${API_URL}/api/bingo/999`), { params: { id: "999" } });

            // Assert
            expect(response.status).toBe(444);
            const data = (await response.json()) as Error;
            expect(data.code).toBe("BINGO_NOT_FOUND");
        });

        it("should return 401 when unauthorized", async () => {
            // Arrange
            const mockSession = { user: { id: "2" } };
            (getServerSession as jest.Mock).mockResolvedValue(mockSession);
            (prisma.bingo.findUnique as jest.Mock).mockResolvedValue({
                ...mockBingo,
                userId: "1",
            });

            // Act
            const response = await DELETE(new NextRequest(`${API_URL}/api/bingo/1`), { params: { id: "1" } });

            // Assert
            expect(response.status).toBe(401);
            const data = (await response.json()) as Error;
            expect(data.code).toBe("UNAUTHORIZED");
        });
    });
});
