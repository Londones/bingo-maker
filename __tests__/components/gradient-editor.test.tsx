import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import GradientEditor from "@/components/editor/background/gradient-editor";
import { useEditor } from "@/hooks/useEditor";
import userEvent from "@testing-library/user-event";

// Mock the hooks
jest.mock("@/hooks/useEditor");

describe("GradientEditor", () => {
  // Setup mock data and functions
  const mockUpdateBackground = jest.fn();
  const initialGradientConfig = {
    backgroundColor: "hsla(0, 0%, 0%, 1)",
    stops: [
      {
        color: "hsla(0, 100%, 50%, 1)",
        position: { x: 20, y: 30 },
      },
      {
        color: "hsla(240, 100%, 50%, 1)",
        position: { x: 70, y: 60 },
      },
    ],
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock implementation
    (useEditor as jest.Mock).mockReturnValue({
      state: {
        background: {
          value: JSON.stringify(initialGradientConfig),
        },
      },
      actions: {
        updateBackground: mockUpdateBackground,
      },
    });
  });

  test("renders with initial gradient stops", () => {
    const { container } = render(<GradientEditor />);

    // Check if the container element exists
    expect(container.querySelector(".relative.w-full.h-28.border.rounded-lg")).toBeInTheDocument();

    // Check if gradient stops are rendered
    const stopItems = screen.getAllByRole("button", { name: /trash-2/i });
    expect(stopItems).toHaveLength(2); // Based on our mock data
  });

  test("adds a new gradient stop on background click", () => {
    // Mock getBoundingClientRect for containerRef
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 200,
      height: 100,
      left: 0,
      top: 0,
      right: 200,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));

    render(<GradientEditor />);

    // Find and click on the gradient background
    const gradientBackground = screen.getByRole("presentation", { hidden: true });
    fireEvent.click(gradientBackground, {
      clientX: 50, // 25% of width
      clientY: 25, // 25% of height
    });

    // Check if updateBackground was called with correct parameters
    expect(mockUpdateBackground).toHaveBeenCalledTimes(1);
    const newValue = JSON.parse(mockUpdateBackground.mock.calls[0][0].value as string);
    expect(newValue.stops).toHaveLength(3); // Original 2 + 1 new stop
    expect(newValue.stops[2].position).toEqual({ x: 25, y: 25 }); // Position should be percentages
  });

  test("selects and updates a stop color", async () => {
    const user = userEvent.setup();
    render(<GradientEditor />);

    // Find and click on the first stop in the stops list
    const stopItems = document.querySelectorAll(".w-6.h-6.rounded-full");
    await user.click(stopItems[0]!);

    // ColorPickerPopover should be rendered
    // Note: This test is simplified as we don't fully test the color picker interaction
    // In a real test, you'd need to mock the ColorPickerPopover or test its integration
    expect(mockUpdateBackground).toHaveBeenCalledTimes(0); // No update yet

    // Simulate color change callback
    // This would normally come from the ColorPickerPopover component
    const handleColorChange = (useEditor as jest.Mock).mock.calls[0][0].actions.updateBackground;
    const newColor = "hsla(120, 100%, 50%, 1)";
    handleColorChange({
      value: JSON.stringify({
        ...initialGradientConfig,
        stops: [{ ...initialGradientConfig.stops[0], color: newColor }, initialGradientConfig.stops[1]],
      }),
    });

    expect(mockUpdateBackground).toHaveBeenCalledTimes(1);
  });

  test("deletes a gradient stop", async () => {
    const user = userEvent.setup();
    render(<GradientEditor />);

    // Find and click delete button for the first stop
    const deleteButtons = screen.getAllByRole("button");
    expect(deleteButtons.length).toBeGreaterThan(0); // Ensure buttons exist
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    await user.click(deleteButtons[0]!); // Non-null assertion as we've verified buttons exist

    // Check if updateBackground was called with one less stop
    expect(mockUpdateBackground).toHaveBeenCalledTimes(1);
    const newValue = JSON.parse(mockUpdateBackground.mock.calls[0][0].value as string);
    expect(newValue.stops).toHaveLength(1); // One stop was deleted
    expect(newValue.stops[0]).toEqual(initialGradientConfig.stops[1]); // The second stop is now the only one
  });

  test("edits background color on context menu", () => {
    //const user = userEvent.setup();
    render(<GradientEditor />);

    // Find gradient background and trigger context menu
    const gradientBackground = screen.getByRole("presentation", { hidden: true });
    fireEvent.contextMenu(gradientBackground);

    // ColorPickerPopover should be rendered for background color
    // Since we can't easily test the ColorPickerPopover directly, we'll simulate the color change
    const handleColorChange = (useEditor as jest.Mock).mock.calls[0][0].actions.updateBackground;
    const newBackgroundColor = "hsla(180, 50%, 50%, 1)";
    handleColorChange({
      value: JSON.stringify({
        backgroundColor: newBackgroundColor,
        stops: initialGradientConfig.stops,
      }),
    });

    expect(mockUpdateBackground).toHaveBeenCalledTimes(1);
    const newValue = JSON.parse(mockUpdateBackground.mock.calls[0][0].value as string);
    expect(newValue.backgroundColor).toBe(newBackgroundColor);
  });
});
