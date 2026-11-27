import { Prisma } from "@prisma/client";
import { Bingo, BingoCell, Background, Stamp, Style, CellStyle } from "@/types/types";

export const buildStyle = (style: Partial<Style>): Partial<Style> => ({
    ...(style.fontSize !== undefined && { fontSize: style.fontSize }),
    ...(style.fontFamily !== undefined && { fontFamily: style.fontFamily }),
    ...(style.fontWeight !== undefined && { fontWeight: style.fontWeight }),
    ...(style.fontStyle !== undefined && { fontStyle: style.fontStyle }),
    ...(style.cellBorderColor !== undefined && { cellBorderColor: style.cellBorderColor }),
    ...(style.cellBorderWidth !== undefined && { cellBorderWidth: style.cellBorderWidth }),
    ...(style.cellBackgroundColor !== undefined && { cellBackgroundColor: style.cellBackgroundColor }),
    ...(style.cellBackgroundOpacity !== undefined && { cellBackgroundOpacity: style.cellBackgroundOpacity }),
    ...(style.color !== undefined && { color: style.color }),
    ...(style.cellSize !== undefined && { cellSize: style.cellSize }),
    ...(style.gap !== undefined && { gap: style.gap }),
});

export const buildBackground = (background: Partial<Background>): Partial<Background> => ({
    ...(background.value !== undefined && { value: background.value }),
    ...(background.backgroundImage !== undefined && { backgroundImage: background.backgroundImage }),
    ...(background.backgroundImageOpacity !== undefined && {
        backgroundImageOpacity: background.backgroundImageOpacity,
    }),
    ...(background.backgroundImagePosition !== undefined && {
        backgroundImagePosition: background.backgroundImagePosition,
    }),
    ...(background.backgroundImageSize !== undefined && { backgroundImageSize: background.backgroundImageSize }),
});

export const buildStamp = (stamp: Partial<Stamp>): Partial<Stamp> => ({
    ...(stamp.type !== undefined && { type: stamp.type }),
    ...(stamp.value !== undefined && { value: stamp.value }),
    ...(stamp.size !== undefined && { size: stamp.size }),
    ...(stamp.opacity !== undefined && { opacity: stamp.opacity }),
});

export const buildCellUpdate = (
    cells: Partial<BingoCell>[],
    existingCellsMap?: Map<string, CellStyle | null>
) =>
    cells.map((cell) => {
        let nextCellStyle: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined;

        if (cell.cellStyle === null) {
            nextCellStyle = Prisma.JsonNull;
        } else if (cell.cellStyle !== undefined) {
            const existingStyle = cell.id ? existingCellsMap?.get(cell.id) ?? {} : {};
            nextCellStyle = {
                ...existingStyle,
                ...cell.cellStyle,
            } as Prisma.InputJsonValue;
        }

        return {
            where: {
                id: cell.id,
            },
            data: {
                ...(cell.content !== undefined && { content: cell.content }),
                ...(cell.position !== undefined && { position: cell.position }),
                ...(cell.validated !== undefined && { validated: cell.validated }),
                ...(nextCellStyle !== undefined && { cellStyle: nextCellStyle }),
            },
        };
    });

export const buildCellCreate = (cells: BingoCell[]) =>
    cells.map((cell) => ({
        content: cell.content,
        position: cell.position,
        validated: cell.validated,
        cellStyle: cell.cellStyle ? (cell.cellStyle as Prisma.InputJsonValue) : Prisma.JsonNull,
    }));

export const buildBingoCreate = (data: Bingo, userId: string) => ({
    title: data.title,
    titleWidth: data.titleWidth,
    gridSize: data.gridSize,
    status: data.status,
    cells: {
        create: buildCellCreate(data.cells),
    },
    style: buildStyle(data.style) as Prisma.InputJsonValue,
    background: buildBackground(data.background) as Prisma.InputJsonValue,
    stamp: buildStamp(data.stamp) as Prisma.InputJsonValue,
    authorToken: data.authorToken,
    userId,
});
