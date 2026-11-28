-- Non-destructive migration: flatten Style, Background, StampConfig, and CellStyle into Json columns

-- 1. Add nullable JSONB columns first
ALTER TABLE "Bingo"
  ADD COLUMN IF NOT EXISTS "style" JSONB,
  ADD COLUMN IF NOT EXISTS "background" JSONB,
  ADD COLUMN IF NOT EXISTS "stamp" JSONB;

ALTER TABLE "BingoCell"
  ADD COLUMN IF NOT EXISTS "cellStyle" JSONB;

-- 2. Backfill existing data from relational tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Style') THEN
    UPDATE "Bingo" b
    SET "style" = jsonb_build_object(
      'fontFamily', s."fontFamily",
      'fontSize', s."fontSize",
      'color', s."color",
      'cellSize', s."cellSize",
      'gap', s."gap",
      'fontWeight', s."fontWeight",
      'fontStyle', s."fontStyle",
      'cellBorderColor', s."cellBorderColor",
      'cellBorderWidth', s."cellBorderWidth",
      'cellBackgroundColor', s."cellBackgroundColor",
      'cellBackgroundOpacity', s."cellBackgroundOpacity"
    )
    FROM "Style" s
    WHERE s."bingoId" = b."id" AND b."style" IS NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Background') THEN
    UPDATE "Bingo" b
    SET "background" = jsonb_strip_nulls(jsonb_build_object(
      'value', bg."value",
      'backgroundImage', bg."backgroundImage",
      'backgroundImageOpacity', bg."backgroundImageOpacity",
      'backgroundImagePosition', bg."backgroundImagePosition",
      'backgroundImageSize', bg."backgroundImageSize"
    ))
    FROM "Background" bg
    WHERE bg."bingoId" = b."id" AND b."background" IS NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'StampConfig') THEN
    UPDATE "Bingo" b
    SET "stamp" = jsonb_build_object(
      'type', st."type",
      'value', st."value",
      'size', st."size",
      'opacity', st."opacity"
    )
    FROM "StampConfig" st
    WHERE st."bingoId" = b."id" AND b."stamp" IS NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'CellStyle') THEN
    UPDATE "BingoCell" c
    SET "cellStyle" = jsonb_strip_nulls(jsonb_build_object(
      'color', cs."color",
      'fontSize', cs."fontSize",
      'fontFamily', cs."fontFamily",
      'fontWeight', cs."fontWeight",
      'fontStyle', cs."fontStyle",
      'cellBorderColor', cs."cellBorderColor",
      'cellBorderWidth', cs."cellBorderWidth",
      'cellBackgroundImage', cs."cellBackgroundImage",
      'cellBackgroundColor', cs."cellBackgroundColor",
      'cellBackgroundOpacity', cs."cellBackgroundOpacity",
      'cellBackgroundImageOpacity', cs."cellBackgroundImageOpacity",
      'cellBackgroundImageSize', cs."cellBackgroundImageSize",
      'cellBackgroundImagePosition', cs."cellBackgroundImagePosition"
    ))
    FROM "CellStyle" cs
    WHERE cs."bingoCellId" = c."id" AND c."cellStyle" IS NULL;
  END IF;
END $$;

-- 3. Fill any remaining NULLs with safe defaults before setting NOT NULL
UPDATE "Bingo"
SET "style" = '{"fontFamily":"Arial","fontSize":16,"color":"#000000","cellSize":100,"gap":10,"cellBorderColor":"#000000","cellBorderWidth":1,"cellBackgroundColor":"#ffffff","fontWeight":"normal","fontStyle":"normal","cellBackgroundOpacity":100}'::jsonb
WHERE "style" IS NULL;

UPDATE "Bingo"
SET "background" = '{"value":"{\"backgroundColor\":\"hsla(258, 38%, 10%, 1)\",\"stops\":[]}"}'::jsonb
WHERE "background" IS NULL;

UPDATE "Bingo"
SET "stamp" = '{"type":"text","value":"✔️","size":80,"opacity":1}'::jsonb
WHERE "stamp" IS NULL;

ALTER TABLE "Bingo"
  ALTER COLUMN "style" SET NOT NULL,
  ALTER COLUMN "background" SET NOT NULL,
  ALTER COLUMN "stamp" SET NOT NULL;

-- 4. Drop old 1:1 style tables
DROP TABLE IF EXISTS "CellStyle";
DROP TABLE IF EXISTS "Style";
DROP TABLE IF EXISTS "Background";
DROP TABLE IF EXISTS "StampConfig";

-- 5. Ensure performance indexes exist
CREATE INDEX IF NOT EXISTS "Bingo_status_createdAt_idx" ON "Bingo"("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Bingo_userId_createdAt_idx" ON "Bingo"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "BingoCell_bingoId_idx" ON "BingoCell"("bingoId");
CREATE INDEX IF NOT EXISTS "Suggestion_bingoId_idx" ON "Suggestion"("bingoId");
