"use server";
import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ITEMS_PER_PAGE } from "@/utils/constants";
import UserBingoList from "@/components/user-bingo-list";
import SignOutButton from "@/components/sign-out-button";

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

const MePage = async ({ searchParams }: { searchParams: { page?: string } }) => {
  const session = await auth();
  const user = session?.user;
  // eslint-disable-next-line @typescript-eslint/await-thenable
  const { page } = await searchParams;

  if (!user) {
    console.log("User not authenticated, redirecting to sign-in page.");
    redirect("/signin");
  }

  const initialPage = page ? parseInt(page) : 1;
  const { bingos, hasMore } = await getUserPreviewBingos(user.id, initialPage);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Bingos</h1>
        <SignOutButton />
      </div>

      <UserBingoList initialBingos={bingos} initialPage={initialPage} hasMore={hasMore} userId={user.id} />
    </div>
  );
};

export default MePage;
