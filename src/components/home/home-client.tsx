"use client";

import { useRouter } from "next/navigation";
import HomeDeck from "@/components/home/home-deck";
import { LatestBingosData } from "@/components/home/latest-bingos-section";

interface HomeClientProps {
  initialLatestBingos: LatestBingosData;
}

export default function HomeClient({ initialLatestBingos }: HomeClientProps) {
  const router = useRouter();

  const handleCreateBingo = () => {
    router.push("/editor");
  };

  return <HomeDeck onCreateBingo={handleCreateBingo} latestBingos={initialLatestBingos} />;
}
