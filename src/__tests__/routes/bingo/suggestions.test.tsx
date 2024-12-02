import { NextRequest } from "next/server";
import { GET, PATCH, POST } from "@/app/api/bingo/[id]/suggestions/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { Suggestion, Error } from "@/types/test-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

jest.mock("@/lib/prisma", () => ({
    prisma: {
        suggestion: {
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    },
}));

jest.mock("next-auth", () => ({
    getServerSession: jest.fn(),
}));

describe("Bingo Suggestions API Routes", () => {
    const mockSuggestion = {
        id: "1",
        content: "Test Suggestion",
        status: "pending",
    } as Suggestion;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /api/bingo/[id]/suggestions", () => {
        it("should return suggestions when found", async () => {
            // Arrange
            (prisma.suggestion.findMany as jest.Mock).mockResolvedValue([mockSuggestion]);

            // Act
            const response = await GET(new NextRequest(`${API_URL}/api/bingo/1/suggestions`), { params: { id: "1" } });

            // Assert
            expect(response.status).toBe(200);
            const data = (await response.json()) as Suggestion[];
            expect(data).toEqual([mockSuggestion]);
        });
    });

    describe("POST /api/bingo/[id]/suggestions", () => {
        it("should create suggestion successfully", async () => {
            // Arrange
            (prisma.suggestion.create as jest.Mock).mockResolvedValue(mockSuggestion);

            // Act
            const response = await POST(
                new NextRequest(`${API_URL}/api/bingo/1/suggestions`, {
                    method: "POST",
                    body: JSON.stringify({ content: mockSuggestion.content }),
                }),
                { params: { id: "1" } }
            );

            // Assert
            expect(response.status).toBe(200);
            const data = (await response.json()) as Suggestion;
            expect(data).toEqual(mockSuggestion);
        });

        it("should return 559 when failed to create suggestion", async () => {
            // Arrange
            (prisma.suggestion.create as jest.Mock).mockResolvedValue(null);

            // Act
            const response = await POST(
                new NextRequest(`${API_URL}/api/bingo/1/suggestions`, {
                    method: "POST",
                    body: JSON.stringify({ content: mockSuggestion.content }),
                }),
                { params: { id: "1" } }
            );

            // Assert
            expect(response.status).toBe(559);
            const data = (await response.json()) as Error;
            expect(data.code).toBe("FAILED_TO_CREATE_SUGGESTION");
        });
    });

    describe("PATCH /api/bingo/[id]/suggestions", () => {
        it("should update suggestion successfully", async () => {
            // Arrange
            const mockSession = { user: { id: "1" } };
            (getServerSession as jest.Mock).mockResolvedValue(mockSession);
            (prisma.suggestion.update as jest.Mock).mockResolvedValue(mockSuggestion);

            // Act
            const response = await PATCH(
                new NextRequest(`${API_URL}/api/bingo/1/suggestions`, {
                    method: "PATCH",
                    body: JSON.stringify({ suggestionId: mockSuggestion.id, status: "approved" }),
                }),
                { params: { id: "1" } }
            );

            // Assert
            expect(response.status).toBe(200);
            const data = (await response.json()) as Suggestion;
            expect(data).toEqual(mockSuggestion);
        });

        it("should return 560 when failed to update suggestion", async () => {
            // Arrange
            (prisma.suggestion.update as jest.Mock).mockResolvedValue(null);

            // Act
            const response = await PATCH(
                new NextRequest(`${API_URL}/api/bingo/1/suggestions`, {
                    method: "PATCH",
                    body: JSON.stringify({ suggestionId: mockSuggestion.id, status: "added" }),
                }),
                { params: { id: "1" } }
            );

            // Assert
            expect(response.status).toBe(560);
            const data = (await response.json()) as Error;
            expect(data.code).toBe("FAILED_TO_UPDATE_SUGGESTION");
        });

        it("should return 401 when unauthorized", async () => {
            // Arrange
            (getServerSession as jest.Mock).mockResolvedValue(null);

            // Act
            const response = await PATCH(
                new NextRequest(`${API_URL}/api/bingo/1/suggestions`, {
                    method: "PATCH",
                    body: JSON.stringify({ suggestionId: mockSuggestion.id, status: "added" }),
                }),
                { params: { id: "1" } }
            );

            // Assert
            expect(response.status).toBe(401);
            const data = (await response.json()) as Error;
            expect(data.code).toBe("UNAUTHORIZED");
        });

        it("should return 444 when bingo not found", async () => {
            // Arrange
            (prisma.bingo.findUnique as jest.Mock).mockResolvedValue(null);

            // Act
            const response = await PATCH(
                new NextRequest(`${API_URL}/api/bingo/1/suggestions`, {
                    method: "PATCH",
                    body: JSON.stringify({ suggestionId: mockSuggestion.id, status: "added" }),
                }),
                { params: { id: "1" } }
            );

            // Assert
            expect(response.status).toBe(444);
            const data = (await response.json()) as Error;
            expect(data.code).toBe("BINGO_NOT_FOUND");
        });
    });
});
