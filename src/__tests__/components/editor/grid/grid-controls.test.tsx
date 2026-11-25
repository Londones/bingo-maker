import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import GridControls from "@/components/editor/grid/grid-controls";
import { renderWithEditorStore } from "../../../../../jest/helpers/render-with-editor";

describe("GridControls (real Redux store)", () => {
  test("renders grid size options and cells matching current gridSize", () => {
    const { store } = renderWithEditorStore(<GridControls />, { gridSize: 3 });

    expect(screen.getByText("Grid Size")).toBeInTheDocument();
    expect(screen.getByLabelText("3x3")).toBeInTheDocument();
    expect(screen.getByLabelText("5x5")).toBeInTheDocument();
    expect(store.getState().editor.history.present.gridSize).toBe(3);
  });

  test("changes grid size from 5x5 to 3x3 in Redux store", () => {
    const { store } = renderWithEditorStore(<GridControls />);
    expect(store.getState().editor.history.present.gridSize).toBe(5);
    expect(store.getState().editor.history.present.cells).toHaveLength(25);

    fireEvent.click(screen.getByLabelText("3x3"));

    const present = store.getState().editor.history.present;
    expect(present.gridSize).toBe(3);
    expect(present.cells).toHaveLength(9);
  });

  test("toggles cell validation when clicking a mini grid square", () => {
    const { store, container } = renderWithEditorStore(<GridControls />, {
      gridSize: 3,
      cells: Array.from({ length: 9 }, (_, position) => ({
        content: `Cell ${position}`,
        position,
        validated: false,
      })),
    });

    const squares = container.querySelectorAll("div.aspect-square");
    expect(squares).toHaveLength(9);

    fireEvent.click(squares[2]!);
    expect(store.getState().editor.history.present.cells[2]?.validated).toBe(true);

    fireEvent.click(squares[2]!);
    expect(store.getState().editor.history.present.cells[2]?.validated).toBe(false);
  });

  test("resets all validated cells when reset button is clicked", () => {
    const { store } = renderWithEditorStore(<GridControls />, {
      gridSize: 3,
      cells: Array.from({ length: 9 }, (_, position) => ({
        content: `Cell ${position}`,
        position,
        validated: position < 3,
      })),
    });

    const resetButton = document.getElementById("reset-validated-cells-btn");
    expect(resetButton).not.toBeNull();
    fireEvent.click(resetButton!);

    const cells = store.getState().editor.history.present.cells;
    expect(cells.every((c) => !c.validated)).toBe(true);
  });
});
