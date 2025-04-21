import { Bingo, BingoCell, Background, Stamp, Style } from "@/types/types";

export const buildStyle = (style: Partial<Style>) => ({
    ...(style.fontSize !== undefined && { fontSize: style.fontSize }),
    ...(style.fontFamily !== undefined && { fontFamily: style.fontFamily }),
    ...(style.fontWeight !== undefined && { fontWeight: style.fontWeight }),
    ...(style.fontStyle !== undefined && { fontStyle: style.fontStyle }),
    ...(style.cellBorderColor !== undefined && { cellBorderColor: style.cellBorderColor }),
    ...(style.cellBorderWidth !== undefined && { cellBorderWidth: style.cellBorderWidth }),
    ...(style.cellBackgroundColor !== undefined && {
        cellBackgroundColor: style.cellBackgroundColor,
    }),
    ...(style.cellBackgroundOpacity !== undefined && {
        cellBackgroundOpacity: style.cellBackgroundOpacity,
    }),
    ...(style.color !== undefined && { color: style.color }),
    ...(style.cellSize !== undefined && { cellSize: style.cellSize }),
    ...(style.gap !== undefined && { gap: style.gap }),
});

export const buildCellUpdate = (cells: Partial<BingoCell>[]) =>
    cells.map((cell) => ({
        where: {
            id: cell.id,
        },
        data: {
            ...(cell.content !== undefined && { content: cell.content }),
            ...(cell.position !== undefined && { position: cell.position }),
            ...(cell.validated !== undefined && { validated: cell.validated }),
            ...(cell.cellStyle !== undefined && {
                cellStyle:
                    cell.cellStyle === null
                        ? { delete: true }
                        : {
                              upsert: {
                                  create: {
                                      color: cell.cellStyle.color,
                                      fontSize: cell.cellStyle.fontSize,
                                      fontFamily: cell.cellStyle.fontFamily,
                                      fontWeight: cell.cellStyle.fontWeight,
                                      fontStyle: cell.cellStyle.fontStyle,
                                      cellBorderColor: cell.cellStyle.cellBorderColor,
                                      cellBorderWidth: cell.cellStyle.cellBorderWidth,
                                      cellBackgroundColor: cell.cellStyle.cellBackgroundColor,
                                      cellBackgroundImage: cell.cellStyle.cellBackgroundImage,
                                      cellBackgroundOpacity: cell.cellStyle.cellBackgroundOpacity,
                                      cellBackgroundImageOpacity: cell.cellStyle.cellBackgroundImageOpacity,
                                      cellBackgroundImagePosition: cell.cellStyle.cellBackgroundImagePosition,
                                      cellBackgroundImageSize: cell.cellStyle.cellBackgroundImageSize,
                                  },
                                  update: {
                                      ...(cell.cellStyle.color !== undefined && { color: cell.cellStyle.color }),
                                      ...(cell.cellStyle.fontSize !== undefined && {
                                          fontSize: cell.cellStyle.fontSize,
                                      }),
                                      ...(cell.cellStyle.fontFamily !== undefined && {
                                          fontFamily: cell.cellStyle.fontFamily,
                                      }),
                                      ...(cell.cellStyle.fontWeight !== undefined && {
                                          fontWeight: cell.cellStyle.fontWeight,
                                      }),
                                      ...(cell.cellStyle.fontStyle !== undefined && {
                                          fontStyle: cell.cellStyle.fontStyle,
                                      }),
                                      ...(cell.cellStyle.cellBorderColor !== undefined && {
                                          cellBorderColor: cell.cellStyle.cellBorderColor,
                                      }),
                                      ...(cell.cellStyle.cellBorderWidth !== undefined && {
                                          cellBorderWidth: cell.cellStyle.cellBorderWidth,
                                      }),
                                      ...(cell.cellStyle.cellBackgroundColor !== undefined && {
                                          cellBackgroundColor: cell.cellStyle.cellBackgroundColor,
                                      }),
                                      ...(cell.cellStyle.cellBackgroundImage !== undefined && {
                                          cellBackgroundImage: cell.cellStyle.cellBackgroundImage,
                                      }),
                                      ...(cell.cellStyle.cellBackgroundOpacity !== undefined && {
                                          cellBackgroundOpacity: cell.cellStyle.cellBackgroundOpacity,
                                      }),
                                      ...(cell.cellStyle.cellBackgroundImageOpacity !== undefined && {
                                          cellBackgroundImageOpacity: cell.cellStyle.cellBackgroundImageOpacity,
                                      }),
                                      ...(cell.cellStyle.cellBackgroundImagePosition !== undefined && {
                                          cellBackgroundImagePosition: cell.cellStyle.cellBackgroundImagePosition,
                                      }),
                                      ...(cell.cellStyle.cellBackgroundImageSize !== undefined && {
                                          cellBackgroundImageSize: cell.cellStyle.cellBackgroundImageSize,
                                      }),
                                  },
                              },
                          },
            }),
        },
    }));

export const buildBackground = (background: Partial<Background>) => ({
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

export const buildStamp = (stamp: Partial<Stamp>) => ({
    ...(stamp.type !== undefined && { type: stamp.type }),
    ...(stamp.value !== undefined && { value: stamp.value }),
    ...(stamp.size !== undefined && { size: stamp.size }),
    ...(stamp.opacity !== undefined && { opacity: stamp.opacity }),
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
                      cellBackgroundImagePosition: cell.cellStyle.cellBackgroundImagePosition,
                      cellBackgroundImageSize: cell.cellStyle.cellBackgroundImageSize,
                  },
              }
            : undefined,
    }));

export const buildBingoCreate = (data: Bingo, userId: string) => ({
    title: data.title,
    titleWidth: data.titleWidth,
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
