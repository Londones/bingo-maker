import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store/index";
import {
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
} from "@/store/slices/editorSlice";
import { BingoCell, Style, Background, Stamp } from "@/types/types";

export const useEditor = () => {
    const dispatch = useDispatch();
    const editorState = useSelector((state: RootState) => state.editor);

    return {
        state: editorState.history.present,
        canUndo: editorState.canUndo,
        canRedo: editorState.canRedo,
        actions: {
            undo: () => dispatch(undo()),
            redo: () => dispatch(redo()),
            setTitle: (title: string) => dispatch(setTitle(title)),
            setGridSize: (size: number) => dispatch(setGridSize(size)),
            updateCell: (index: number, cell: Partial<BingoCell>) => dispatch(updateCell({ index, cell })),
            updateStyle: (style: Partial<Style>) => dispatch(updateStyle(style)),
            updateBackground: (background: Partial<Background>) => dispatch(updateBackground(background)),
            updateStamp: (stamp: Partial<Stamp>) => dispatch(updateStamp(stamp)),
            toggleStamp: (index: number) => dispatch(toggleStamp(index)),
            resetEditor: () => dispatch(resetEditor()),
        },
    };
};