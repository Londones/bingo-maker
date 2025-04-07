import React from "react";
import Link from "next/link";
import { Card, CardFooter } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { BingoPreview } from "@/types/types";

type BingoPreviewCardProps = {
  bingo: BingoPreview;
};

const BingoPreviewCard = ({ bingo }: BingoPreviewCardProps) => {
  const bgStyle = bingo.background
    ? {
        backgroundImage: bingo.background.backgroundImage ? `url(${bingo.background.backgroundImage})` : undefined,
        backgroundSize: bingo.background.backgroundImageSize || undefined,
        backgroundPosition: bingo.background.backgroundImagePosition || undefined,
        opacity: bingo.background.backgroundImageOpacity || undefined,
      }
    : {};

  return (
    <Link href={`/bingo/${bingo.id}`} className="w-full">
      <Card className="hover:shadow-lg transition-shadow">
        <div className="h-40 relative overflow-hidden rounded-t-lg">
          <div className="absolute inset-0" style={bgStyle} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 flex items-end p-4">
            <h3 className="text-white font-medium text-xl truncate">{bingo.title}</h3>
          </div>
        </div>
        <CardFooter className="py-3 text-sm text-gray-500">
          Created {formatDistanceToNow(new Date(bingo.createdAt))} ago
        </CardFooter>
      </Card>
    </Link>
  );
};

export default BingoPreviewCard;
