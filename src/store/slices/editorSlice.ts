import { ImageUploadResponse } from "./../../types/types";
import { isCellLocalImage } from "@/lib/utils";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Bingo, BingoCell, Style, Background, Stamp, EditorState, LocalImage } from "@/types/types";
import { DEFAULT_STYLE, DEFAULT_STAMP, DEFAULT_GRADIENT_CONFIG_STRING } from "@/utils/constants";

const initialBingoState: Bingo = {
    title: "New Bingo",
    gridSize: 5,
    cells: Array(25)
        .fill(null)
        .map((_, index) => {
            const baseCell: BingoCell = {
                content: "",
                position: index,
                validated: false,
            };

            if (index === 0) {
                return {
                    ...baseCell,
                    cellStyle: {
                        cellBackgroundImage:
                            "https://r6kb2iiay0.ufs.sh/f/d7e4677c-12c2-44da-98a7-2b375749e276-jcyyig.png",
                        cellBackgroundOpacity: 1,
                    },
                } as BingoCell;
            }

            return baseCell;
        }),
    style: DEFAULT_STYLE,
    background: {
        value: DEFAULT_GRADIENT_CONFIG_STRING,
        backgroundImage: "https://r6kb2iiay0.ufs.sh/f/d7e4677c-12c2-44da-98a7-2b375749e276-jcyyig.png",
        backgroundImageOpacity: 1,
    },
    stamp: DEFAULT_STAMP,
    status: "draft",
};

const initialState: EditorState = {
    history: {
        past: [],
        present: initialBingoState,
        future: [],
    },
    canUndo: false,
    canRedo: false,
    canSave: false,
};

const pushToHistory = (state: EditorState) => {
    state.history.past.push({ ...state.history.present });
    state.canUndo = true;
    state.history.future = [];
    state.canRedo = false;
    state.canSave = true;
};

export const editorSlice = createSlice({
    name: "editor",
    initialState,
    reducers: {
        undo: (state) => {
            if (state.history.past.length === 0) return;

            const previous = state.history.past[state.history.past.length - 1];
            const newPast = state.history.past.slice(0, -1);

            state.history.future = [state.history.present, ...state.history.future];
            state.history.past = newPast;
            if (previous) {
                state.history.present = previous;
            }

            state.canUndo = newPast.length > 0;
            state.canRedo = true;
            state.canSave = state.canRedo || state.canUndo;
        },
        redo: (state) => {
            if (state.history.future.length === 0) return;

            const next = state.history.future[0];
            const newFuture = state.history.future.slice(1);

            state.history.past = [...state.history.past, state.history.present];
            if (next) {
                state.history.present = next;
            }
            state.history.future = newFuture;

            state.canUndo = true;
            state.canRedo = newFuture.length > 0;
            state.canSave = state.canRedo || state.canUndo;
        },
        setBingo: (state, action: PayloadAction<Bingo>) => {
            const sortedCells = action.payload.cells.sort((a, b) => a.position - b.position);
            state.history.present = {
                ...action.payload,
                cells: sortedCells,
            };
            state.canSave = false;
        },
        setTitle: (state, action: PayloadAction<string>) => {
            pushToHistory(state);
            state.history.present.title = action.payload;
        },
        setGridSize: (state, action: PayloadAction<number>) => {
            pushToHistory(state);
            const newGridSize = action.payload;
            const oldCells = [...state.history.present.cells];
            const newCellCount = newGridSize * newGridSize;

            const newCells = Array(newCellCount)
                .fill(null)
                .map((_, index) => {
                    if (oldCells[index]) {
                        return oldCells[index];
                    }

                    return {
                        content: "",
                        validated: false,
                    } as BingoCell;
                });

            state.history.present.gridSize = newGridSize;
            state.history.present.cells = newCells;
        },
        updateCell: (state, action: PayloadAction<{ index: number; cell: Partial<BingoCell> }>) => {
            pushToHistory(state);
            state.history.present.cells[action.payload.index] = {
                ...state.history.present.cells[action.payload.index],
                ...action.payload.cell,
            } as BingoCell;
        },
        updateStyle: (state, action: PayloadAction<Partial<Style>>) => {
            pushToHistory(state);
            state.history.present.style = {
                ...state.history.present.style,
                ...action.payload,
            };
        },
        updateBackground: (state, action: PayloadAction<Partial<Background>>) => {
            pushToHistory(state);
            state.history.present.background = {
                ...state.history.present.background,
                ...(action.payload as Background),
            };
        },
        updateStamp: (state, action: PayloadAction<Partial<Stamp>>) => {
            pushToHistory(state);
            state.history.present.stamp = {
                ...state.history.present.stamp,
                ...(action.payload as Stamp),
            };
        },
        toggleStamp: (state, action: PayloadAction<number>) => {
            pushToHistory(state);
            const cell = state.history.present.cells[action.payload];
            if (cell) {
                cell.validated = !cell.validated;
            }
        },
        setLocalImage: (state, action: PayloadAction<LocalImage | undefined>) => {
            pushToHistory(state);
            if (!action.payload) {
                state.history.present.localImages = action.payload;
            } else if (action.payload) {
                state.history.present.localImages?.push(action.payload);
                const image = action.payload;

                if (isCellLocalImage(image)) {
                    const cell = state.history.present.cells[image.position];
                    if (!cell) {
                        console.error(`Cell at position ${image.position} does not exist`);
                        return;
                    } else {
                        cell.cellStyle = {
                            ...cell.cellStyle,
                            cellBackgroundImage: image.url,
                            cellBackgroundOpacity: 1,
                        };
                    }
                } else if (image.type === "background") {
                    state.history.present.background = {
                        ...state.history.present.background,
                        backgroundImage: image.url,
                        backgroundImageOpacity: 1,
                    };
                } else if (image.type === "stamp") {
                    state.history.present.stamp = {
                        ...state.history.present.stamp,
                        value: image.url,
                    };
                }
            }
        },
        setImageUrls: (state, action: PayloadAction<ImageUploadResponse>) => {
            const { cellImages, backgroundImage, stampImage } = action.payload;
            if (cellImages) {
                for (const image of cellImages) {
                    const cell = state.history.present.cells[image.position];
                    if (!cell) {
                        console.error(`Cell at position ${image.position} does not exist`);
                        return;
                    } else {
                        cell.cellStyle = {
                            ...cell.cellStyle,
                            cellBackgroundImage: image.url,
                            cellBackgroundOpacity: 1,
                        };
                    }
                }
                state.history.present.localImages = state.history.present.localImages?.filter(
                    (img) => !isCellLocalImage(img)
                );
            }

            if (backgroundImage) {
                state.history.present.background = {
                    ...state.history.present.background,
                    backgroundImage: backgroundImage,
                    backgroundImageOpacity: 1,
                };
                state.history.present.localImages = state.history.present.localImages?.filter(
                    (img) => img.type !== "background"
                );
            }

            if (stampImage) {
                state.history.present.stamp = {
                    ...state.history.present.stamp,
                    value: stampImage,
                };
                state.history.present.localImages = state.history.present.localImages?.filter(
                    (img) => img.type !== "stamp"
                );
            }

            if (state.history.present.localImages?.length === 0) {
                state.history.present.localImages = undefined;
            }
        },
        resetEditor: () => initialState,
    },
});

export const {
    undo,
    redo,
    setBingo,
    setTitle,
    setGridSize,
    updateCell,
    updateStyle,
    updateBackground,
    updateStamp,
    toggleStamp,
    setLocalImage,
    setImageUrls,
    resetEditor,
} = editorSlice.actions;

export default editorSlice.reducer;
