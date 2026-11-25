import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import CellsToolbar from "@/components/editor/cell/cells-controls";
import { renderWithEditorStore } from "../../../../../jest/helpers/render-with-editor";

jest.mock("react-colorful", () => ({
  HexColorPicker: ({ onChange }: { onChange: (c: string) => void }) => (
    <button data-testid="mock-color-picker" onClick={() => onChange("#ff00aa")}>
      Pick Color
    </button>
  ),
}));

describe("CellsToolbar (real Redux store)", () => {
  test("renders cell styling controls", () => {
    renderWithEditorStore(<CellsToolbar />);
    expect(screen.getByText(/font family/i)).toBeInTheDocument();
    expect(screen.getByText(/font size/i)).toBeInTheDocument();
    expect(screen.getByText(/cell size/i)).toBeInTheDocument();
    expect(screen.getByText(/cell gap/i)).toBeInTheDocument();
    expect(screen.getByText(/border width/i)).toBeInTheDocument();
  });

  test("toggles bold and italic in Redux store", () => {
    const { store } = renderWithEditorStore(<CellsToolbar />);

    const boldButton = screen.getByText("Bold").nextElementSibling as HTMLButtonElement;
    fireEvent.click(boldButton);
    expect(store.getState().editor.history.present.style.fontWeight).toBe("bold");

    fireEvent.click(boldButton);
    expect(store.getState().editor.history.present.style.fontWeight).toBe("normal");

    const italicButton = screen.getByText("Italic").nextElementSibling as HTMLButtonElement;
    fireEvent.click(italicButton);
    expect(store.getState().editor.history.present.style.fontStyle).toBe("italic");
  });

  test("updates cell size and keeps stamp size in sync", () => {
    const { store } = renderWithEditorStore(<CellsToolbar />);

    const cellSizeInput = screen.getByText("Cell Size").nextElementSibling?.querySelector("input") as HTMLInputElement;
    fireEvent.change(cellSizeInput, { target: { value: "160" } });

    const present = store.getState().editor.history.present;
    expect(present.style.cellSize).toBe(160);
    expect(present.stamp.size).toBe(140);
  });

  test("updates gap and border width in Redux store", () => {
    const { store } = renderWithEditorStore(<CellsToolbar />);

    const gapInput = screen.getByDisplayValue("10");
    fireEvent.change(gapInput, { target: { value: "16" } });
    expect(store.getState().editor.history.present.style.gap).toBe(16);

    const borderWidthInput = screen.getByDisplayValue("1");
    fireEvent.change(borderWidthInput, { target: { value: "3" } });
    expect(store.getState().editor.history.present.style.cellBorderWidth).toBe(3);
  });
});
