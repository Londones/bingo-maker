import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import editorReducer, { setBingo } from "@/store/slices/editorSlice";
import type { Bingo } from "@/types/types";

export function createTestEditorStore(initialBingo?: Partial<Bingo>) {
  const store = configureStore({
    reducer: {
      editor: editorReducer,
    },
  });

  if (initialBingo) {
    const base = store.getState().editor.history.present;
    store.dispatch(
      setBingo({
        ...base,
        ...initialBingo,
        style: { ...base.style, ...initialBingo.style },
        background: { ...base.background, ...initialBingo.background },
        stamp: { ...base.stamp, ...initialBingo.stamp },
        cells: initialBingo.cells ?? base.cells,
      })
    );
  }

  return store;
}

export function renderWithEditorStore(ui: React.ReactElement, initialBingo?: Partial<Bingo>) {
  const store = createTestEditorStore(initialBingo);
  const result = render(<Provider store={store}>{ui}</Provider>);
  return { store, ...result };
}
