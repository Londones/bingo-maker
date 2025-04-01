import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import GridControls from "@/components/editor/grid/grid-controls";
import { useEditor } from "@/hooks/useEditor";

// Mock the dependencies
jest.mock("@/hooks/useEditor", () => ({
  useEditor: jest.fn(),
}));

jest.mock("@/utils/constants", () => ({
  GRID_SIZES: [3, 5, 7],
}));

// Mock the UI components
jest.mock("@/components/ui/label", () => ({
  Label: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
    <label data-testid="mock-label" htmlFor={htmlFor}>
      {children}
    </label>
  ),
}));

jest.mock("@/components/ui/radio-group", () => ({
  RadioGroup: ({
    children,
    value,
    onValueChange,
    className,
  }: {
    children: React.ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
    className?: string;
  }) => (
    <div data-testid="mock-radio-group" data-value={value} className={className}>
      {children}
      {/* Adding a hidden input to properly simulate radio change events */}
      <input
        type="hidden"
        data-testid="mock-radio-input"
        onChange={(e) => {
          if (onValueChange && e.target.value) {
            onValueChange(e.target.value);
          }
        }}
      />
    </div>
  ),
  RadioGroupItem: ({ value, id }: { value: string; id?: string }) => (
    <input
      type="radio"
      value={value}
      id={id}
      data-testid={`mock-radio-group-item-${value}`}
      onClick={(e) => {
        // Get the parent element and find the hidden input
        const parent = (e.target as HTMLElement).closest('[data-testid="mock-radio-group"]');
        const hiddenInput = parent?.querySelector('[data-testid="mock-radio-input"]') as HTMLInputElement;
        if (hiddenInput) {
          hiddenInput.value = value;
          // Dispatch change event on the hidden input
          const event = new Event("change", { bubbles: true });
          hiddenInput.dispatchEvent(event);
        }
      }}
    />
  ),
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({
    children,
    className,
    onClick,
  }: {
    children?: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <div
      data-testid="mock-card"
      data-classname={className} // Store the full className as a data attribute
      className={className}
      onClick={onClick}
    >
      {children}
    </div>
  ),
}));

// Create mock cells based on grid size
const createMockCells = (size: number) => {
  const cellCount = size * size;
  return Array(cellCount)
    .fill(null)
    .map((_, index) => ({
      text: `Cell ${index}`,
      validated: index % 3 === 0,
    }));
};

const mockState = {
  gridSize: 5,
  cells: createMockCells(5),
};

const mockActions = {
  setGridSize: jest.fn(),
  toggleStamp: jest.fn(),
};

describe("GridControls Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useEditor as jest.Mock).mockReturnValue({
      state: mockState,
      actions: mockActions,
    });
  });

  test("renders the component", () => {
    render(<GridControls />);
    expect(screen.getByText("Grid Size")).toBeInTheDocument();
    expect(screen.getByText("3x3")).toBeInTheDocument();
    expect(screen.getByText("5x5")).toBeInTheDocument();
    expect(screen.getByText("7x7")).toBeInTheDocument();
  });

  //   test("changes grid size when a different option is selected", () => {
  //     render(<GridControls />);

  //     // Find the RadioGroup component
  //     const radioGroup = screen.getByTestId("mock-radio-group");

  //     // Get the 7x7 radio input element
  //     const radio7x7 = screen.getByTestId("mock-radio-group-item-7");

  //     // Click on the 7x7 option
  //     fireEvent.click(radio7x7);

  //     // Get the hidden input that's used to trigger change events
  //     const hiddenInput: HTMLInputElement = screen.getByTestId("mock-radio-input");

  //     // Manually set the value and trigger change event
  //     hiddenInput.value = "7";
  //     fireEvent.change(hiddenInput);

  //     // Check if the correct action was called
  //     expect(mockActions.setGridSize).toHaveBeenCalledWith(7);
  //   });

  test("displays the correct number of cells based on grid size", () => {
    render(<GridControls />);

    // For a 5x5 grid, there should be 25 cells
    const cards = screen.getAllByTestId("mock-card");
    expect(cards.length).toBe(25);
  });

  test("toggles cell validation when a cell is clicked", () => {
    render(<GridControls />);

    // Get all card elements
    const cards = screen.getAllByTestId("mock-card");

    // Click on the first cell
    fireEvent.click(cards[0]!);

    // Check if the toggle action was called with the correct index
    expect(mockActions.toggleStamp).toHaveBeenCalledWith(0);
  });

  test("updates displayed grid when grid size changes", () => {
    // First render with initial state (5x5 grid)
    const { unmount } = render(<GridControls />);

    // Clean up to avoid duplicate elements
    unmount();

    // Change the mock state to use a 3x3 grid
    const newState = {
      gridSize: 3,
      cells: createMockCells(3),
    };

    // Update useEditor mock implementation
    (useEditor as jest.Mock).mockReturnValue({
      state: newState,
      actions: mockActions,
    });

    // Render again with the new state
    render(<GridControls />);

    // Verify correct number of cells (9 for 3x3 grid)
    expect(screen.getAllByTestId("mock-card").length).toBe(9);
  });

  test("applies validation styling to validated cells", () => {
    render(<GridControls />);

    // Get all card elements
    const cards = screen.getAllByTestId("mock-card");

    // Check that validated cells have the correct class
    for (let i = 0; i < cards.length; i++) {
      const className = cards[i]?.getAttribute("data-classname") || "";

      if (i % 3 === 0) {
        // Validated cells should have the bg-accent class
        expect(className).toContain("bg-accent");
      } else {
        // Non-validated cells should not have the bg-accent class at the end
        expect(className).not.toMatch(/bg-accent$/);
      }
    }
  });
});
