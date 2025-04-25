"use server";
import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ITEMS_PER_PAGE } from "@/utils/constants";
import UserBingoList from "@/components/user-bingo-list";
import SignOutButton from "@/components/sign-out-button";
import MigrationToast from "@/components/migration-toast";

const getUserPreviewBingos = async (userId: string, page: number = 1) => {
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const bingos = await prisma.bingo.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      background: {
        select: {
          value: true,
          backgroundImage: true,
          backgroundImageOpacity: true,
          backgroundImagePosition: true,
          backgroundImageSize: true,
        },
      },
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: ITEMS_PER_PAGE,
  });

  const totalCount = await prisma.bingo.count({
    where: { userId },
  });

  return {
    bingos,
    totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE),
    hasMore: skip + bingos.length < totalCount,
  };
};

/**
 * Migrate bingos from anonymous author token to a logged-in user
 */
const migrateBingos = async (bingoIds: string[], authorToken: string, userId: string) => {
  // Check if there are any bingos matching these criteria
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

const MePage = async ({
  searchParams,
}: {
  searchParams: { page?: string; bingoIds?: string; authorToken?: string; migrated?: string };
}) => {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    redirect("/signin");
  }
  // Handle migration if bingoIds and authorToken are provided
  // eslint-disable-next-line @typescript-eslint/await-thenable
  const { bingoIds, authorToken, page, migrated } = await searchParams;

  let migrationResult = null;

  if (bingoIds && authorToken) {
    try {
      const bingoIdsArray = JSON.parse(bingoIds) as string[];
      if (bingoIdsArray.length > 0) {
        migrationResult = await migrateBingos(bingoIdsArray, authorToken, user.id);

        // If we have migrated any bingos, we'll add a success parameter to the redirect
        if (migrationResult.success && migrationResult.migratedCount > 0) {
          const redirectParams = new URLSearchParams();
          if (page) {
            redirectParams.append("page", page);
          }
          redirectParams.append("migrated", migrationResult.migratedCount.toString());
          redirect(`/me?${redirectParams.toString()}`);
        }
      }
    } catch (error) {
      console.error("Error migrating bingos:", error);
    }
  }
  // Show the migration success message if we have the 'migrated' parameter
  const migratedCount = migrated ? parseInt(migrated) : 0;

  const initialPage = page ? parseInt(page) : 1;
  const { bingos, hasMore } = await getUserPreviewBingos(user.id, initialPage);
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Bingos</h1>
        <SignOutButton />
      </div>
      <MigrationToast count={migratedCount || migrationResult?.migratedCount} />
      <UserBingoList initialBingos={bingos} initialPage={initialPage} hasMore={hasMore} userId={user.id} />
    </div>
  );
};

export default MePage;
