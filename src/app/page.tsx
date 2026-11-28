import { prisma } from "@/lib/prisma";
import HomeClient from "@/components/home/home-client";
import { LatestBingosData } from "@/components/home/latest-bingos-section";

export const revalidate = 30;

async function getInitialLatestBingos(): Promise<LatestBingosData> {
  const limit = 6;
  try {
    const bingos = await prisma.bingo.findMany({
      take: limit + 1,
      where: { status: "published" },
      orderBy: { createdAt: "desc" },
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
    });

    const hasMore = bingos.length > limit;
    const items = (hasMore ? bingos.slice(0, limit) : bingos) as LatestBingosData["items"];
    const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

    return {
      items,
      hasMore,
      nextCursor,
      isLoading: false,
    };
  } catch (error) {
    console.error("Error fetching initial latest bingos:", error);
    return {
      items: [],
      hasMore: false,
      nextCursor: undefined,
      isLoading: false,
    };
  }
}

export default async function Home() {
  const initialLatestBingos = await getInitialLatestBingos();

  return <HomeClient initialLatestBingos={initialLatestBingos} />;
}
