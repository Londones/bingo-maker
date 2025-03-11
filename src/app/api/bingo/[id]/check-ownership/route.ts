import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { APIError, APIErrorCode } from "@/lib/errors";
import { handleAPIError } from "@/lib/api-utils";

type ParamsType = Promise<{ id: string }>;

export async function POST(req: Request, { params }: { params: ParamsType }) {
  try {
    const { id } = await params;
    const session = await auth();
    const { authorToken } = await req.json();

    const bingo = await prisma.bingo.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        authorToken: true,
      },
    });

    if (!bingo) {
      throw new APIError("Bingo not found", APIErrorCode.BINGO_NOT_FOUND, 444);
    }

    const isOwner =
      (session?.user?.id && bingo.userId === session.user.id) ||
      (authorToken && bingo.authorToken === authorToken);

    return NextResponse.json({ isOwner });
  } catch (error) {
    return handleAPIError(error);
  }
}
