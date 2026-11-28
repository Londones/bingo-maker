import { useMemo, useRef } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store/index";
import {
    undo,
    redo,
    setBingo,
    setTitle,
    switchStatus,
    setGridSize,
    updateCell,
    updateStyle,
    updateBackground,
    updateStamp,
    toggleStamp,
    resetEditor,
    resetEditorState,
    setImageUrls,
    setSelectedCell,
    extractChanges,
    clearFutureHistory,
    selectChanges,
    resetValidatedCells,
} from "@/store/slices/editorSlice";
import { Bingo, BingoCell, Style, Background, Stamp, ImageUploadResponse, BingoPatch } from "@/types/types";

export const useEditorActions = () => {
    const dispatch = useDispatch();

    return useMemo(
        () => ({
            undo: () => dispatch(undo()),
            redo: () => dispatch(redo()),
            clearFutureHistory: () => dispatch(clearFutureHistory()),
            setBingo: (bingo: Bingo) => dispatch(setBingo(bingo)),
            setTitle: (title: string) => dispatch(setTitle(title)),
            switchStatus: (status: "draft" | "published") => dispatch(switchStatus(status)),
            setGridSize: (size: number) => dispatch(setGridSize(size)),
            updateCell: (index: number, cell: Partial<BingoCell>) => dispatch(updateCell({ index, cell })),
            updateStyle: (style: Partial<Style>) => dispatch(updateStyle(style)),
            updateBackground: (background: Partial<Background>) => dispatch(updateBackground(background)),
            updateStamp: (stamp: Partial<Stamp>) => dispatch(updateStamp(stamp)),
            toggleStamp: (index: number) => dispatch(toggleStamp(index)),
            setSelectedCell: (index: number | null) => dispatch(setSelectedCell(index)),
            setImageUrls: (urls: ImageUploadResponse) => dispatch(setImageUrls(urls)),
            resetEditor: () => dispatch(resetEditor()),
            resetEditorState: () => dispatch(resetEditorState()),
            resetValidatedCells: () => dispatch(resetValidatedCells()),
        }),
        [dispatch]
    );
};

export const useEditorStyle = () => useSelector((state: RootState) => state.editor.history.present.style);

export const useEditorBackground = () => useSelector((state: RootState) => state.editor.history.present.background);

export const useEditorStamp = () => useSelector((state: RootState) => state.editor.history.present.stamp);

export const useEditorGridSize = () => useSelector((state: RootState) => state.editor.history.present.gridSize);

export const useEditorCells = () => useSelector((state: RootState) => state.editor.history.present.cells);

export const useEditorCell = (index: number) =>
    useSelector((state: RootState) => state.editor.history.present.cells[index]);

export const useEditorSelectedCell = () =>
    useSelector((state: RootState) => state.editor.selectedCellIndex ?? null);

export const useEditorTitle = () =>
    useSelector(
        (state: RootState) => ({
            title: state.editor.history.present.title,
            titleWidth: state.editor.history.present.titleWidth,
        }),
        shallowEqual
    );

export const useEditorMeta = () =>
    useSelector(
        (state: RootState) => ({
            id: state.editor.history.present.id,
            status: state.editor.history.present.status,
            canUndo: state.editor.canUndo,
            canRedo: state.editor.canRedo,
            canSave: state.editor.canSave,
        }),
        shallowEqual
    );

export const useEditor = () => {
    const dispatch = useDispatch();
    const editorState = useSelector((state: RootState) => state.editor);
    const editorStateRef = useRef(editorState);
    editorStateRef.current = editorState;
    const baseActions = useEditorActions();

    const actions = useMemo(
        () => ({
            ...baseActions,
            extractChanges: (): BingoPatch => {
                const changes = selectChanges(editorStateRef.current);
                dispatch(extractChanges());
                return changes;
            },
        }),
        [baseActions, dispatch]
    );

    return {
        state: editorState.history.present,
        canUndo: editorState.canUndo,
        canRedo: editorState.canRedo,
        canSave: editorState.canSave,
        actions,
    };
};
