"use server";
import React from "react";
import { Button } from "@/components/ui/button";
import { signout } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ITEMS_PER_PAGE } from "@/utils/constants";
import UserBingoList from "@/components/user-bingo-list";

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

  if (!user) {
    redirect("/signin");
  }

  const initialPage = searchParams.page ? parseInt(searchParams.page) : 1;
  const { bingos, hasMore } = await getUserPreviewBingos(user.id, initialPage);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-8">My Bingos</h1>

      <UserBingoList initialBingos={bingos} initialPage={initialPage} hasMore={hasMore} userId={user.id} />

      <div className="mt-8">
        <Button variant="destructive" onClick={() => void signout()}>
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default MePage;
