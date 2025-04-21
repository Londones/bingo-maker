/*
  Warnings:

  - You are about to drop the column `type` on the `Background` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Background" DROP COLUMN "type",
ADD COLUMN     "backgroundImage" TEXT,
ADD COLUMN     "backgroundImageOpacity" INTEGER,
ADD COLUMN     "backgroundImagePosition" TEXT,
ADD COLUMN     "backgroundImageSize" INTEGER;

-- AlterTable
ALTER TABLE "Bingo" ADD COLUMN     "titleWidth" INTEGER;

-- AlterTable
ALTER TABLE "CellStyle" ADD COLUMN     "cellBackgroundImagePosition" TEXT,
ADD COLUMN     "cellBackgroundImageSize" INTEGER;
