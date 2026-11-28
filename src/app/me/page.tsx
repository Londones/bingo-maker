"use server";
import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ITEMS_PER_PAGE } from "@/utils/constants";
import MeDashboard from "@/components/me/me-dashboard";
import { BingoPreview } from "@/types/types";

const getUserPreviewBingos = async (userId: string, page: number = 1) => {
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const [bingos, totalCount, publishedCount] = await Promise.all([
    prisma.bingo.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        status: true,
        gridSize: true,
        style: true,
        stamp: true,
        background: true,
        cells: {
          select: {
            position: true,
            content: true,
            validated: true,
          },
          orderBy: { position: "asc" },
        },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: ITEMS_PER_PAGE,
    }),
    prisma.bingo.count({
      where: { userId },
    }),
    prisma.bingo.count({
      where: { userId, status: "published" },
    }),
  ]);

  return {
    bingos: bingos as unknown as BingoPreview[],
    totalCount,
    publishedCount,
    draftCount: Math.max(0, totalCount - publishedCount),
    totalPages: Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE)),
    hasMore: skip + bingos.length < totalCount,
  };
};

const migrateBingos = async (bingoIds: string[], authorToken: string, userId: string) => {
  const bingoCount = await prisma.bingo.count({
    where: {
      id: { in: bingoIds },
      authorToken: authorToken,
      userId: null,
    },
  });

  if (bingoCount === 0) {
    return {
      success: false,
      migratedCount: 0,
      message: "No bingos found to migrate",
    };
  }

  const updated = await prisma.bingo.updateMany({
    where: {
      id: { in: bingoIds },
      authorToken: authorToken,
      userId: null,
    },
    data: {
      userId: userId,
    },
  });

  return {
    success: true,
    migratedCount: updated.count,
  };
};

export default async function MePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; bingoIds?: string; authorToken?: string; migrated?: string }>;
}) {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    redirect("/signin");
  }

  const { bingoIds, authorToken, page, migrated } = await searchParams;

  if (bingoIds && authorToken) {
    try {
      const bingoIdsArray = JSON.parse(bingoIds) as string[];
      if (bingoIdsArray.length > 0) {
        const migrationResult = await migrateBingos(bingoIdsArray, authorToken, user.id);

        if (migrationResult.success && migrationResult.migratedCount > 0) {
          const redirectParams = new URLSearchParams();
          if (page) {
            redirectParams.append("page", page);
          }
          redirectParams.append("migrated", migrationResult.migratedCount.toString());
          return redirect(`/me?${redirectParams.toString()}`);
        }
      }
    } catch (error) {
      if (!(error instanceof Error && error.message.includes("NEXT_REDIRECT"))) {
        console.error("Error migrating bingos:", error);
      }
    }
  }

  const migratedCount = migrated ? parseInt(migrated) : 0;
  const initialPage = page ? Math.max(1, parseInt(page) || 1) : 1;
  const { bingos, totalPages, totalCount, publishedCount, draftCount } = await getUserPreviewBingos(
    user.id,
    initialPage
  );

  return (
    <MeDashboard
      initialBingos={bingos}
      initialPage={initialPage}
      initialTotalPages={totalPages}
      totalCount={totalCount}
      publishedCount={publishedCount}
      draftCount={draftCount}
      userId={user.id}
      userName={user.name}
      migratedCount={migratedCount}
    />
  );
}
