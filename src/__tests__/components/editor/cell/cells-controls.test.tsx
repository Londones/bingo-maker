import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CellsToolbar from "@/components/editor/cell/cells-controls";
import { useEditor } from "@/hooks/useEditor";

// Mock the dependencies
jest.mock("@/hooks/useEditor", () => ({
  useEditor: jest.fn(),
}));

jest.mock("@/lib/utils", () => ({
  cn: jest.fn((...args) => args.filter(Boolean).join(" ")),
}));

jest.mock("react-colorful", () => ({
  HexColorPicker: jest.fn(() => <div data-testid="color-picker" />),
}));

const mockState = {
  style: {
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "normal",
    fontStyle: "normal",
    color: "#000000",
    cellBackgroundColor: "#ffffff",
    cellBorderColor: "#000000",
    cellBorderWidth: 1,
    cellBackgroundOpacity: 100,
    cellSize: 150,
    gap: 5,
  },
  gridSize: 5,
  stamp: {
    size: 130,
  },
};

const mockActions = {
  updateStyle: jest.fn(),
  updateStamp: jest.fn(),
};

describe("CellsToolbar Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useEditor as jest.Mock).mockReturnValue({
      state: mockState,
      actions: mockActions,
    });
  });

  test("renders the component", () => {
    render(<CellsToolbar />);
    expect(screen.getByText(/font family/i)).toBeInTheDocument();
    expect(screen.getByText(/font size/i)).toBeInTheDocument();
    expect(screen.getByText(/bold/i)).toBeInTheDocument();
    expect(screen.getByText(/italic/i)).toBeInTheDocument();
    expect(screen.getByText(/cell size/i)).toBeInTheDocument();
    expect(screen.getByText(/cell gap/i)).toBeInTheDocument();
  });

  test("updates font family when selected", () => {
    render(<CellsToolbar />);

    // Find font family select by looking for the container with the text "Font Family"
    // and then getting the combobox within it
    const fontFamilyContainer = screen.getByText("Font Family").closest("div");
    const fontFamilySelect = fontFamilyContainer?.querySelector('[role="combobox"]');

    expect(fontFamilySelect).toBeInTheDocument();
    fireEvent.click(fontFamilySelect!);

    const option = screen.getByRole("option", { name: "Arial" });
    fireEvent.click(option);

    expect(mockActions.updateStyle).toHaveBeenCalledWith({
      fontFamily: "Arial",
    });
  });

  test("updates font size when selected", () => {
    render(<CellsToolbar />);

    // Find font size select by looking for the container with the text "Font Size"
    // and then getting the combobox within it
    const fontSizeContainer = screen.getByText("Font Size").closest("div");
    const fontSizeSelect = fontSizeContainer?.querySelector('[role="combobox"]');

    expect(fontSizeSelect).toBeInTheDocument();
    fireEvent.click(fontSizeSelect!);

    const option = screen.getByRole("option", { name: "20px" });
    fireEvent.click(option);

    expect(mockActions.updateStyle).toHaveBeenCalledWith({
      fontSize: 20,
    });
  });

  test("toggles bold formatting", () => {
    render(<CellsToolbar />);

    // Find bold button by looking for the container with "Bold" text
    const boldContainer = screen.getByText("Bold").closest("div");
    const boldButton = boldContainer?.querySelector("button");

    expect(boldButton).toBeInTheDocument();
    fireEvent.click(boldButton!);

    expect(mockActions.updateStyle).toHaveBeenCalledWith({
      fontWeight: "bold",
    });
  });

  test("toggles italic formatting", () => {
    render(<CellsToolbar />);

    // Find italic button by looking for the container with "Italic" text
    const italicContainer = screen.getByText("Italic").closest("div");
    const italicButton = italicContainer?.querySelector("button");

    expect(italicButton).toBeInTheDocument();
    fireEvent.click(italicButton!);

    expect(mockActions.updateStyle).toHaveBeenCalledWith({
      fontStyle: "italic",
    });
  });

  test("updates cell background opacity", () => {
    render(<CellsToolbar />);

    // Find cell background opacity input by looking for the container with the correct text
    const opacityContainer = screen.getByText("Cell Background Opacity").closest("div");
    const opacityInput = opacityContainer?.querySelector("input");

    expect(opacityInput).toBeInTheDocument();
    fireEvent.change(opacityInput!, { target: { value: "80" } });

    expect(mockActions.updateStyle).toHaveBeenCalledWith({
      cellBackgroundOpacity: 80,
    });
  });

  test("updates cell size and stamp size", () => {
    render(<CellsToolbar />);

    // Find cell size input by looking for the container with "Cell Size" text
    const cellSizeContainer = screen.getByText("Cell Size").closest("div");
    const cellSizeInput = cellSizeContainer?.querySelector("input");

    expect(cellSizeInput).toBeInTheDocument();
    fireEvent.change(cellSizeInput!, { target: { value: "180" } });

    expect(mockActions.updateStyle).toHaveBeenCalledWith({
      cellSize: 180,
    });

    expect(mockActions.updateStamp).toHaveBeenCalledWith({
      size: 160,
    });
  });

  test("updates cell gap", () => {
    render(<CellsToolbar />);

    // Find cell gap input by looking for the container with "Cell Gap" text
    const gapContainer = screen.getByText("Cell Gap").closest("div");
    const gapInput = gapContainer?.querySelector("input");

    expect(gapInput).toBeInTheDocument();
    fireEvent.change(gapInput!, { target: { value: "10" } });

    expect(mockActions.updateStyle).toHaveBeenCalledWith({
      gap: 10,
    });
  });

  test("updates border width", () => {
    render(<CellsToolbar />);

    // Find border width input by looking for the container with "Border Width" text
    const borderWidthContainer = screen.getByText("Border Width").closest("div");
    const borderWidthInput = borderWidthContainer?.querySelector("input");

    expect(borderWidthInput).toBeInTheDocument();
    fireEvent.change(borderWidthInput!, { target: { value: "2" } });

    expect(mockActions.updateStyle).toHaveBeenCalledWith({
      cellBorderWidth: 2,
    });
  });

  test("prevents cell size from exceeding maximum based on grid size", () => {
    // Set up a grid size of 3, which has a different maximum
    (useEditor as jest.Mock).mockReturnValue({
      state: {
        ...mockState,
        gridSize: 3,
        style: {
          ...mockState.style,
          cellSize: 400,
        },
      },
      actions: mockActions,
    });

    render(<CellsToolbar />);

    // The useEffect should fire and limit the cell size
    expect(mockActions.updateStyle).toHaveBeenCalledWith({
      cellSize: 350,
    });

    expect(mockActions.updateStamp).toHaveBeenCalledWith({
      size: 330,
    });
  });

  test("handles color picker interactions", () => {
    render(<CellsToolbar />);

    // Find text color button by looking for the container with "Text Color" text
    const textColorContainer = screen.getByText("Text Color").closest("div");
    const popoverTrigger = textColorContainer?.querySelector("button");

    expect(popoverTrigger).toBeInTheDocument();

    // Click the text color popover trigger
    fireEvent.click(popoverTrigger!);

    // Check that the color picker is rendered
    const colorPicker = screen.getByTestId("color-picker");
    expect(colorPicker).toBeInTheDocument();
  });
});
