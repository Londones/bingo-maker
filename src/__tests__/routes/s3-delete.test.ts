import { NextRequest } from "next/server";
import { POST } from "@/app/api/s3-delete/route";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { deleteFile } from "@/lib/s3upload";
import { mockSession } from "@/__mocks__/auth";

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(() => Promise.resolve(mockSession)),
  GoogleProvider: jest.fn(),
}));

jest.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: jest.fn(),
}));

jest.mock("@/lib/s3upload", () => ({
  deleteFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    bingo: {
      findFirst: jest.fn(),
    },
    bingoCell: {
      findFirst: jest.fn(),
    },
  },
}));

describe("POST /api/s3-delete", () => {
  const validUrl = "https://s3-starfire.s3.eu-west-3.amazonaws.com/123-bg.png";

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue(mockSession);
  });

  test("returns 401 when unauthenticated", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/s3-delete", {
      method: "POST",
      body: JSON.stringify({ url: validUrl }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(deleteFile).not.toHaveBeenCalled();
  });

  test("returns 400 for missing or invalid URL", async () => {
    const req = new NextRequest("http://localhost:3000/api/s3-delete", {
      method: "POST",
      body: JSON.stringify({ url: "not-a-url" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(deleteFile).not.toHaveBeenCalled();
  });

  test("returns 403 when user does not own the image", async () => {
    (prisma.bingo.findFirst as jest.Mock).mockResolvedValueOnce(null);
    (prisma.bingoCell.findFirst as jest.Mock).mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/s3-delete", {
      method: "POST",
      body: JSON.stringify({ url: validUrl }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(deleteFile).not.toHaveBeenCalled();
  });

  test("deletes S3 object when user owns the image via JSON column", async () => {
    (prisma.bingo.findFirst as jest.Mock).mockResolvedValueOnce({ id: "bingo-1" });
    (prisma.bingoCell.findFirst as jest.Mock).mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/s3-delete", {
      method: "POST",
      body: JSON.stringify({ url: validUrl }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(deleteFile).toHaveBeenCalledWith("123-bg.png");
  });

  test("skips DB ownership check when force is true", async () => {
    const req = new NextRequest("http://localhost:3000/api/s3-delete", {
      method: "POST",
      body: JSON.stringify({ url: validUrl, force: true }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.bingo.findFirst).not.toHaveBeenCalled();
    expect(deleteFile).toHaveBeenCalledWith("123-bg.png");
  });
});
