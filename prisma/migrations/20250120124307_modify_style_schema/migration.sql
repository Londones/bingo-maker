/*
  Warnings:

  - The `cellBackgroundOpacity` column on the `CellStyle` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `cellBackgroundImageOpacity` column on the `CellStyle` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `cellBackgroundOpacity` to the `Style` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CellStyle" DROP COLUMN "cellBackgroundOpacity",
ADD COLUMN     "cellBackgroundOpacity" INTEGER,
DROP COLUMN "cellBackgroundImageOpacity",
ADD COLUMN     "cellBackgroundImageOpacity" INTEGER;

-- AlterTable
ALTER TABLE "Style" ADD COLUMN     "cellBackgroundOpacity" INTEGER NOT NULL;
