import { NextRequest } from "next/server";
import { GET, PATCH, POST } from "@/app/api/bingo/[id]/suggestions/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { Suggestion, Error } from "@/types/test-types";
//import { APIError } from "@/lib/errors";
import { mockSession } from "@/__mocks__/auth";

const API_URL = "http://localhost:3000";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        suggestion: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        bingo: {
            findUnique: jest.fn(),
        },
    },
}));

jest.mock("@auth/prisma-adapter", () => ({
    PrismaAdapter: jest.fn(),
}));

jest.mock("next-auth", () => ({
    getServerSession: jest.fn(() => Promise.resolve(mockSession)),
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
        let mockWriter: { write: jest.Mock; close: jest.Mock };
        let mockStream: { readable: ReadableStream; writable: { getWriter: jest.Mock } };

        beforeEach(() => {
            mockWriter = {
                write: jest.fn(),
                close: jest.fn().mockResolvedValue(undefined),
            };

            mockStream = {
                readable: new ReadableStream(),
                writable: { getWriter: jest.fn().mockReturnValue(mockWriter) },
            };

            global.TransformStream = jest.fn().mockImplementation(() => mockStream);
        });

        it("should send initial suggestions", async () => {
            // Arrange
            jest.useFakeTimers();
            const suggestions = [mockSuggestion];
            (prisma.suggestion.findMany as jest.Mock).mockResolvedValueOnce(suggestions);
            const controller = new AbortController();

            try {
                // Act
                const response = await GET(
                    new NextRequest(`${API_URL}/api/bingo/1/suggestions`, {
                        signal: controller.signal,
                    }),
                    { params: { id: "1" } }
                );

                // Assert
                expect(response.status).toBe(200);
                expect(response.headers.get("Content-Type")).toBe("text/event-stream");
                expect(mockWriter.write).toHaveBeenCalledWith(`data: ${JSON.stringify(suggestions)}\n\n`);
            } finally {
                // Cleanup
                controller.abort();
                jest.clearAllTimers();
                jest.useRealTimers();
            }
        });

        it("should handle polling for new suggestions", async () => {
            // Arrange
            jest.useFakeTimers();
            const newSuggestions = [{ ...mockSuggestion, id: "2" }];
            (prisma.suggestion.findMany as jest.Mock).mockResolvedValueOnce([]).mockResolvedValueOnce(newSuggestions);

            // Act
            await GET(new NextRequest(`${API_URL}/api/bingo/1/suggestions`), { params: { id: "1" } });

            jest.advanceTimersByTime(5000);
            await Promise.resolve();

            // Assert
            expect(mockWriter.write).toHaveBeenCalledWith(`data: ${JSON.stringify(newSuggestions)}\n\n`);

            jest.useRealTimers();
        });

        it("should cleanup on abort", async () => {
            // Arrange
            const controller = new AbortController();

            // Act
            await GET(
                new NextRequest(`${API_URL}/api/bingo/1/suggestions`, {
                    signal: controller.signal,
                }),
                { params: { id: "1" } }
            );

            controller.abort();

            // Assert
            expect(mockWriter.close).toHaveBeenCalled();
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

        it("should return 402 when content is missing", async () => {
            // Act
            const response = await POST(
                new NextRequest(`${API_URL}/api/bingo/1/suggestions`, {
                    method: "POST",
                    body: JSON.stringify({}),
                }),
                { params: { id: "1" } }
            );

            // Assert
            expect(response.status).toBe(402);
            const data = (await response.json()) as Error;
            expect(data.code).toBe("CONTENT_REQUIRED");
        });
    });

    describe("PATCH /api/bingo/[id]/suggestions", () => {
        it("should update suggestion successfully", async () => {
            // Arrange
            const mockSession = { user: { id: "1" } };
            (getServerSession as jest.Mock).mockResolvedValue(mockSession);
            (prisma.suggestion.update as jest.Mock).mockResolvedValue(mockSuggestion);
            (prisma.bingo.findUnique as jest.Mock).mockResolvedValue({ userId: "1" });

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
            (prisma.bingo.findUnique as jest.Mock).mockResolvedValue({ userId: "1" });
            (getServerSession as jest.Mock).mockResolvedValue(mockSession);

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
            (prisma.bingo.findUnique as jest.Mock).mockResolvedValue({ userId: "2" });

            // Act
            const response = await PATCH(
                new NextRequest(`${API_URL}/api/bingo/1/suggestions`, {
                    method: "PATCH",
                    body: JSON.stringify({ suggestionId: mockSuggestion.id, status: "added", position: 1 }),
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
            const id = "1";

            // Act
            const error = await PATCH(
                new NextRequest(`${API_URL}/api/bingo/${id}/suggestions`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ suggestionId: mockSuggestion.id, status: "added", position: 1 }),
                }),
                { params: { id: "1" } }
            );

            // Assert
            expect(error.status).toBe(444);
            const data = (await error.json()) as Error;
            expect(data.code).toBe("BINGO_NOT_FOUND");
        });
    });
});
