import { buildBackground, buildStamp, buildCellUpdate, buildStyle } from "@/lib/builders";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { APIError, APIErrorCode } from "@/lib/errors";
import { handleAPIError } from "@/lib/api-utils";
import { BingoPatch } from "@/types/types";

type ParamsType = Promise<{ id: string }>;

export async function GET(req: Request, { params }: { params: ParamsType }) {
  const { id } = await params;
  const session = await auth();

  if (!id) {
    throw new APIError("Missing ID", APIErrorCode.MISSING_ID_OR_SHARE_TOKEN, 445);
  }

  try {
    const bingo = await prisma.bingo.findUnique({
      where: { id },
      include: {
        cells: { include: { cellStyle: true } },
        background: true,
        stamp: true,
        style: true,
      },
    });

    if (!bingo) {
      throw new APIError("Bingo not found", APIErrorCode.BINGO_NOT_FOUND, 444);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { authorToken, ...bingoWithoutToken } = bingo;

    const isAuthor = session?.user?.id === bingo.userId || false;

    return NextResponse.json({
      ...bingoWithoutToken,
      isAuthor,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function PATCH(req: Request, { params }: { params: ParamsType }) {
  const session = await auth();
  const data = (await req.json()) as BingoPatch;
  const { id } = await params;
  const clientToken = data.authorToken;

  delete data.authorToken;

  try {
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
      (session?.user?.id && bingo.userId === session.user.id) || (clientToken && bingo.authorToken === clientToken);

    if (!isOwner) {
      throw new APIError("Unauthorized", APIErrorCode.UNAUTHORIZED, 401);
    }

    const updateData = {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.style !== undefined && { style: { update: buildStyle(data.style) } }),
      ...(data.background !== undefined && {
        background: { update: buildBackground(data.background) },
      }),
      ...(data.stamp !== undefined && { stamp: { update: buildStamp(data.stamp) } }),
      ...(data.cells !== undefined && { cells: { update: buildCellUpdate(data.cells) } }),
      ...(data.status !== undefined && { status: data.status }),
    };

    const updated = await prisma.bingo.update({
      where: { id },
      data: updateData,
      include: {
        cells: {
          include: { cellStyle: true },
        },
        background: true,
        stamp: true,
        style: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    //console.error("Error updating bingo:", error instanceof Error ? error.stack : "Unknown error");
    return handleAPIError(error instanceof Error ? error : new Error("Unknown error occurred"));
  }
}

export async function DELETE(req: Request, { params }: { params: ParamsType }) {
  const session = await auth();
  const { id } = await params;

  try {
    const bingo = await prisma.bingo.findUnique({
      where: { id: id },
    });

    if (!bingo) {
      throw new APIError("Bingo not found", APIErrorCode.BINGO_NOT_FOUND, 444);
    }

    if (bingo.userId !== session?.user?.id) {
      throw new APIError("Unauthorized", APIErrorCode.UNAUTHORIZED, 401);
    }

    await prisma.bingo.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAPIError(error);
  }
}
