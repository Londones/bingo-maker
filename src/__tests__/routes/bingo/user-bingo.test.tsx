import { NextRequest } from "next/server";
import { GET } from "@/app/api/bingo/user/route";
import { prisma } from "@/lib/prisma";
import { BingoPreview } from "@/types/types";
import { auth } from "@/lib/auth";
import { APIError } from "@/lib/errors";

const TEST_URL = "http://localhost:3000";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    bingo: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(() => Promise.resolve({ user: { id: "test-user-id", email: "test@example.com" } })),
}));

describe("User Bingo API Route", () => {
  const mockBingos: BingoPreview[] = [
    {
      id: "1",
      title: "Test Bingo 1",
      background: {
        value: "test",
        backgroundImage: "image1.jpg",
        backgroundImageOpacity: 0.5,
        backgroundImagePosition: "center",
        backgroundImageSize: 50,
      },
      createdAt: new Date(),
    },
    {
      id: "2",
      title: "Test Bingo 2",
      background: {
        value: "test",
        backgroundImage: "image2.jpg",
        backgroundImageOpacity: 0.5,
        backgroundImagePosition: "center",
        backgroundImageSize: 50,
      },
      createdAt: new Date("2023-01-01"),
    },
  ];

  const mockTotalCount = 2;
  const mockPage = 1;
  const mockUserId = "1";
  const mockSkip = (mockPage - 1) * 10; // Assuming ITEMS_PER_PAGE is 10
  const mockTake = 10;
  const mockResponse = {
    bingos: JSON.parse(JSON.stringify(mockBingos)),
    totalPages: Math.ceil(mockTotalCount / mockTake),
    hasMore: mockSkip + mockBingos.length < mockTotalCount,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockImplementation(() => Promise.resolve({ user: { id: mockUserId } }));
  });

  it("should return user bingo data", async () => {
    // Arrange
    (prisma.bingo.findMany as jest.Mock).mockResolvedValue(mockBingos);
    (prisma.bingo.count as jest.Mock).mockResolvedValue(mockTotalCount);

    // Act
    const response = await GET(new NextRequest(`${TEST_URL}/api/bingo/user?page=${mockPage}&userId=${mockUserId}`));

    // Assert
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockResponse);
  });

  it("should return false for hasMore if no more bingos", async () => {
    // Arrange
    (prisma.bingo.findMany as jest.Mock).mockResolvedValue(mockBingos);
    (prisma.bingo.count as jest.Mock).mockResolvedValue(mockTotalCount);

    // Act
    const response = await GET(new NextRequest(`${TEST_URL}/api/bingo/user?page=${mockPage}&userId=${mockUserId}`));

    // Assert
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.hasMore).toBe(false);
  });

  it("should return 2nd page of bingos", async () => {
    // Arrange
    // Clear the existing mockBingos array and create a new one with 12 items (for pagination testing)
    mockBingos.length = 0;

    // Add first 2 standard bingos back
    mockBingos.push({
      id: "1",
      title: "Test Bingo 1",
      background: {
        value: "test",
        backgroundImage: "image1.jpg",
        backgroundImageOpacity: 0.5,
        backgroundImagePosition: "center",
        backgroundImageSize: 50,
      },
      createdAt: new Date(),
    });

    mockBingos.push({
      id: "2",
      title: "Test Bingo 2",
      background: {
        value: "test",
        backgroundImage: "image2.jpg",
        backgroundImageOpacity: 0.5,
        backgroundImagePosition: "center",
        backgroundImageSize: 50,
      },
      createdAt: new Date("2023-01-01"),
    });

    // Add 10 more bingos for pagination testing
    for (let i = 0; i < 10; i++) {
      mockBingos.push({
        id: `${i + 3}`,
        title: `Test Bingo ${i + 3}`,
        background: {
          value: "test",
          backgroundImage: `image${i + 3}.jpg`,
          backgroundImageOpacity: 0.5,
          backgroundImagePosition: "center",
          backgroundImageSize: 50,
        },
        createdAt: new Date("2023-01-01"),
      });
    }

    // Mock that findMany returns only the items for page 2 (items 10-19)
    const page2Items = mockBingos.slice(10, 20);
    (prisma.bingo.findMany as jest.Mock).mockResolvedValue(page2Items);

    const totalCount = mockBingos.length;
    (prisma.bingo.count as jest.Mock).mockResolvedValue(totalCount);

    const newPage = 2;
    const newResponse = {
      bingos: JSON.parse(JSON.stringify(page2Items)),
      totalPages: Math.ceil(totalCount / 10),
      hasMore: false, // Since we have 12 items total, page 2 is the last page
    };

    // Act
    const response = await GET(new NextRequest(`${TEST_URL}/api/bingo/user?page=${newPage}&userId=${mockUserId}`));

    // Assert
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(newResponse);
  });

  it("should return 400 if userId is not provided", async () => {
    // Arrange
    (auth as jest.Mock).mockImplementationOnce(() => Promise.resolve({ user: null }));

    // Act
    const error = await GET(new NextRequest(`${TEST_URL}/api/bingo/user?page=${mockPage}`)).catch(
      (error: APIError) => error
    );

    // Assert
    if (error instanceof APIError) {
      expect(error.message).toBe("User ID is required");
      expect(error.code).toBe("INVALID_REQUEST");
      expect(error.status).toBe(400);
    }
  });

  it("should return 404 if user is not found", async () => {
    // Arrange
    (prisma.bingo.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.bingo.count as jest.Mock).mockResolvedValue(0);

    // Act
    const error = await GET(
      new NextRequest(`${TEST_URL}/api/bingo/user?page=${mockPage}&userId=invalid-user-id`)
    ).catch((error: APIError) => error);

    // Assert
    if (error instanceof APIError) {
      expect(error.message).toBe("User not found");
      expect(error.code).toBe("INVALID_REQUEST");
      expect(error.status).toBe(404);
    }
  });
});
