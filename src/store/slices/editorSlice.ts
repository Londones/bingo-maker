import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { BingoState, BingoCell, Style, Background, Stamp, EditorState } from "@/types/types";
import { DEFAULT_STYLE, DEFAULT_STAMP, DEFAULT_GRADIENT_CONFIG_STRING } from "@/utils/constants";

const initialBingoState: BingoState = {
    id: "",
    title: "New Bingo",
    gridSize: 5,
    cells: Array(25)
        .fill(null)
        .map((_, index) => ({
            id: `temp-${index}`,
            content: "",
            position: index,
            validated: false,
        })),
    style: DEFAULT_STYLE,
    background: {
        type: "gradient",
        value: DEFAULT_GRADIENT_CONFIG_STRING,
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
};

const pushToHistory = (state: EditorState) => {
    state.history.past.push({ ...state.history.present });
    state.canUndo = true;
    state.history.future = [];
    state.canRedo = false;
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
        },
        setTitle: (state, action: PayloadAction<string>) => {
            pushToHistory(state);
            state.history.present.title = action.payload;
        },
        setGridSize: (state, action: PayloadAction<number>) => {
            pushToHistory(state);
            state.history.present.gridSize = action.payload;
            state.history.present.cells = Array(action.payload * action.payload).fill({
                content: "",
                isStamped: false,
            });
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
        resetEditor: () => initialState,
    },
});

export const {
    undo,
    redo,
    setTitle,
    setGridSize,
    updateCell,
    updateStyle,
    updateBackground,
    updateStamp,
    toggleStamp,
    resetEditor,
} = editorSlice.actions;

export default editorSlice.reducer;
