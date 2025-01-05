import { Bingo, BingoCell, Background, Stamp, Style } from "@/types/types";

export const buildStyle = (style: Partial<Style>) => ({
    ...(style.fontSize && { fontSize: style.fontSize }),
    ...(style.fontFamily && { fontFamily: style.fontFamily }),
    ...(style.fontWeight && { fontWeight: style.fontWeight }),
    ...(style.fontStyle && { fontStyle: style.fontStyle }),
    ...(style.cellBorderColor && { cellBorderColor: style.cellBorderColor }),
    ...(style.cellBorderWidth && { cellBorderWidth: style.cellBorderWidth }),
    ...(style.cellBackgroundColor && { cellBackgroundColor: style.cellBackgroundColor }),
    ...(style.color && { color: style.color }),
    ...(style.cellSize && { cellSize: style.cellSize }),
    ...(style.gap && { gap: style.gap }),
});

export const buildCellUpdate = (cells: Partial<BingoCell>[]) =>
    cells.map((cell) => ({
        where: { id: cell.id },
        data: {
            ...(cell.content && { content: cell.content }),
            ...(cell.position && { position: cell.position }),
            ...(cell.validated !== undefined && { validated: cell.validated }),
            ...(cell.cellStyle && {
                cellStyle: {
                    update: {
                        ...(cell.cellStyle.color && { color: cell.cellStyle.color }),
                        ...(cell.cellStyle.fontSize && { fontSize: cell.cellStyle.fontSize }),
                        ...(cell.cellStyle.fontFamily && { fontFamily: cell.cellStyle.fontFamily }),
                        ...(cell.cellStyle.fontWeight && { fontWeight: cell.cellStyle.fontWeight }),
                        ...(cell.cellStyle.fontStyle && { fontStyle: cell.cellStyle.fontStyle }),
                        ...(cell.cellStyle.cellBorderColor && { cellBorderColor: cell.cellStyle.cellBorderColor }),
                        ...(cell.cellStyle.cellBorderWidth && { cellBorderWidth: cell.cellStyle.cellBorderWidth }),
                        ...(cell.cellStyle.cellBackgroundColor && {
                            cellBackgroundType: cell.cellStyle.cellBackgroundColor,
                        }),
                        ...(cell.cellStyle.cellBackgroundImage && {
                            cellBackgroundValue: cell.cellStyle.cellBackgroundImage,
                        }),
                        ...(cell.cellStyle.cellBackgroundOpacity && {
                            cellBackgroundOpacity: cell.cellStyle.cellBackgroundOpacity,
                        }),
                        ...(cell.cellStyle.cellBackgroundImageOpacity && {
                            cellBackgroundImageOpacity: cell.cellStyle.cellBackgroundImageOpacity,
                        }),
                    },
                },
            }),
        },
    }));

export const buildBackground = (background: Partial<Background>) => ({
    ...(background.type && { type: background.type }),
    ...(background.value && { value: background.value }),
});

export const buildStamp = (stamp: Partial<Stamp>) => ({
    ...(stamp.type && { type: stamp.type }),
    ...(stamp.value && { value: stamp.value }),
    ...(stamp.size && { size: stamp.size }),
    ...(stamp.opacity && { opacity: stamp.opacity }),
});

export const buildCellCreate = (cells: BingoCell[]) =>
    cells.map((cell) => ({
        content: cell.content,
        position: cell.position,
        validated: cell.validated,
        cellStyle: cell.cellStyle
            ? {
                  create: {
                      color: cell.cellStyle.color,
                      fontSize: cell.cellStyle.fontSize,
                      fontFamily: cell.cellStyle.fontFamily,
                      fontWeight: cell.cellStyle.fontWeight,
                      fontStyle: cell.cellStyle.fontStyle,
                      cellBorderColor: cell.cellStyle.cellBorderColor,
                      cellBorderWidth: cell.cellStyle.cellBorderWidth,
                      cellBackgroundType: cell.cellStyle.cellBackgroundColor,
                      cellBackgroundValue: cell.cellStyle.cellBackgroundImage,
                      cellBackgroundOpacity: cell.cellStyle.cellBackgroundOpacity,
                      cellBackgroundImageOpacity: cell.cellStyle.cellBackgroundImageOpacity,
                  },
              }
            : undefined,
    }));

export const buildBingoCreate = (data: Bingo, userId: string) => ({
    title: data.title,
    gridSize: data.gridSize,
    status: data.status,
    cells: {
        create: buildCellCreate(data.cells),
    },
    style: {
        create: buildStyle(data.style),
    },
    background: {
        create: buildBackground(data.background),
    },
    stamp: {
        create: buildStamp(data.stamp),
    },
    authorToken: data.authorToken,
    userId,
});
