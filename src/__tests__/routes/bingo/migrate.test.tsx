import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { APIError, APIErrorCode } from "@/lib/errors";
import { handleAPIError } from "@/lib/api-utils";
import { POST } from "@/app/api/bingo/migrate/route";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

jest.mock("next-auth");
jest.mock("@/lib/prisma");
jest.mock("@/lib/api-utils");

describe("POST /api/bingo/migrate", () => {
    const mockSession = {
        user: {
            id: "user-id",
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return unauthorized if session is not found", async () => {
        // Arrange
        (getServerSession as jest.Mock).mockResolvedValue(null);

        // Act
        const response = await POST(
            new Request(`${API_URL}/api/bingo/migrate`, {
                body: JSON.stringify({ bingoIds: [], authorToken: "", userId: "" }),
            })
        );

        // Assert
        expect(response.status).toBe(401);
        await expect(response).rejects.toThrow("Unauthorized");
    });

    it("should return success if bingos are migrated", async () => {
        // Arrange
        (getServerSession as jest.Mock).mockResolvedValue(mockSession);
        (prisma.bingo.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

        // Act
        const req = new Request(`${API_URL}/api/bingo/migrate`, {
            method: "POST",
            body: JSON.stringify({ bingoIds: [1], authorToken: "token", userId: "user-id" }),
        });

        const response = await POST(req);
        const jsonResponse = await response.json();

        // Assert
        expect(jsonResponse).toEqual({
            success: true,
            migratedCount: 1,
        });
    });

    it("should return error if no bingos are found to migrate", async () => {
        // Arrange
        (getServerSession as jest.Mock).mockResolvedValue(mockSession);
        (prisma.bingo.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

        // Act
        const req = new Request(`${API_URL}/api/bingo/migrate`, {
            method: "POST",
            body: JSON.stringify({ bingoIds: [1], authorToken: "token", userId: "user-id" }),
        });

        // Assert
        await expect(POST(req)).rejects.toThrow(APIError);
        await expect(POST(req)).rejects.toThrow("No bingos found to migrate");
    });
});
