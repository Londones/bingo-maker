import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleAPIError } from "@/lib/api-utils";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
      },
    });

    if (!user) {
      return NextResponse.json({ name: "Anonymous" });
    }

    return NextResponse.json(user);
  } catch (error) {
    return handleAPIError(error);
  }
}
