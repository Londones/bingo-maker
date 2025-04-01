import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CellContextMenu from "@/components/editor/cell/cell-context-menu";
import { useEditor } from "@/hooks/useEditor";
import { convertFileToBase64 } from "@/lib/utils";
import { ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent } from "@/__mocks__/components/ui-components";

// Mock the dependencies
jest.mock("@/hooks/useEditor", () => ({
  useEditor: jest.fn(),
}));

jest.mock("@/lib/utils", () => ({
  cn: jest.fn((...args) => args.filter(Boolean).join(" ")),
  convertFileToBase64: jest.fn(),
}));

jest.mock("react-colorful", () => ({
  HexColorPicker: jest.fn(() => <div data-testid="color-picker" />),
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
  },
}));

// Mock the context menu components using ES6 import
jest.mock("@/components/ui/context-menu", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ContextMenuSub: (props: any) => <ContextMenuSub {...props} />,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ContextMenuSubTrigger: (props: any) => <ContextMenuSubTrigger {...props} />,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ContextMenuSubContent: (props: any) => <ContextMenuSubContent {...props} />,
}));

const mockState = {
  cells: [
    { id: "1", text: "Cell 1", cellStyle: { fontFamily: "Arial" } },
    { id: "2", text: "Cell 2", cellStyle: null },
  ],
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
    cellBackgroundImage: null,
    cellBackgroundImageOpacity: 100,
    cellBackgroundImagePosition: "50% 50%",
    cellBackgroundImageSize: 100,
  },
  localImages: [],
  stamp: { size: 100 },
};

const mockActions = {
  updateCell: jest.fn(),
  setLocalImage: jest.fn(),
  removeCellLocalImage: jest.fn(),
};

describe("CellContextMenu Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useEditor as jest.Mock).mockReturnValue({
      state: mockState,
      actions: mockActions,
    });
  });

  test("renders the component", () => {
    render(<CellContextMenu index={0} />);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /style/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /image/i })).toBeInTheDocument();
  });

  test("updates font family when selected", () => {
    render(<CellContextMenu index={0} />);

    const fontFamilySelect = screen.getByRole("combobox", { name: "" });
    fireEvent.click(fontFamilySelect);

    const option = screen.getByRole("option", { name: "Roboto" });
    fireEvent.click(option);

    expect(mockActions.updateCell).toHaveBeenCalledWith(0, {
      cellStyle: {
        fontFamily: "Roboto",
      },
    });
  });

  test("toggles bold formatting", () => {
    render(<CellContextMenu index={0} />);

    const boldButton = screen.getAllByRole("button")[1]; // Bold button
    fireEvent.click(boldButton!);

    expect(mockActions.updateCell).toHaveBeenCalledWith(0, {
      cellStyle: {
        fontFamily: "Arial",
        fontWeight: "bold",
      },
    });
  });

  test("toggles italic formatting", () => {
    render(<CellContextMenu index={0} />);

    const italicButton = screen.getAllByRole("button")[2]; // Italic button
    fireEvent.click(italicButton!);

    expect(mockActions.updateCell).toHaveBeenCalledWith(0, {
      cellStyle: {
        fontFamily: "Arial",
        fontStyle: "italic",
      },
    });
  });

  test("handles color picker interactions", () => {
    render(<CellContextMenu index={0} />);

    // Find and click the context menu trigger
    const contextMenuTrigger = screen.getAllByTestId("mock-context-menu-sub-trigger")[0];
    fireEvent.click(contextMenuTrigger!);

    // Find the context menu sub which should now be opened
    const contextMenuSub = screen.getAllByTestId("mock-context-menu-sub")[0];
    expect(contextMenuSub).toHaveAttribute("data-open", "true");

    // Find color picker within the context menu content
    const colorPicker = screen.getByTestId("color-picker");
    expect(colorPicker).toBeInTheDocument();
  });

  test("handles file upload for cell background image", async () => {
    const user = userEvent.setup();
    const mockBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcG";
    (convertFileToBase64 as jest.Mock).mockResolvedValue(mockBase64);

    render(<CellContextMenu index={1} />);

    // Switch to the image tab
    const imageTab = screen.getByRole("tab", { name: /image/i });
    fireEvent.click(imageTab);

    const fileInput = screen.getByLabelText(/file/i);

    const file = new File(["dummy content"], "test.png", { type: "image/png" });
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(convertFileToBase64).toHaveBeenCalled();
      expect(mockActions.setLocalImage).toHaveBeenCalledWith(
        expect.objectContaining({
          url: mockBase64,
          position: 1,
        })
      );
    });
  });

  test("removes cell styling", () => {
    render(<CellContextMenu index={0} />);

    const resetButton = screen.getByRole("button", { name: /reset style/i });
    fireEvent.click(resetButton);

    expect(mockActions.updateCell).toHaveBeenCalledWith(0, {
      cellStyle: null,
    });
  });

  test("displays image controls when cell has background image", () => {
    const cellWithImage = {
      ...mockState,
      cells: [
        {
          id: "1",
          text: "Cell 1",
          cellStyle: {
            fontFamily: "Arial",
            cellBackgroundImage: "data:image/jpeg;base64,/9j/4AAQSkZJRgAB",
            cellBackgroundImageOpacity: 80,
            cellBackgroundImagePosition: "50% 50%",
            cellBackgroundImageSize: 100,
          },
        },
      ],
    };

    (useEditor as jest.Mock).mockReturnValue({
      state: cellWithImage,
      actions: mockActions,
    });

    render(<CellContextMenu index={0} />);

    // Switch to the image tab
    const imageTab = screen.getByRole("tab", { name: /image/i });
    fireEvent.click(imageTab);

    expect(screen.getByText(/image opacity/i)).toBeInTheDocument();
    expect(screen.getByText(/zoom/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove image/i })).toBeInTheDocument();
  });

  test("removes background image", () => {
    const cellWithImage = {
      ...mockState,
      cells: [
        {
          id: "1",
          text: "Cell 1",
          cellStyle: {
            fontFamily: "Arial",
            cellBackgroundImage: "data:image/jpeg;base64,/9j/4AAQSkZJRgAB",
          },
        },
      ],
    };

    (useEditor as jest.Mock).mockReturnValue({
      state: cellWithImage,
      actions: mockActions,
    });

    render(<CellContextMenu index={0} />);

    // Switch to the image tab
    const imageTab = screen.getByRole("tab", { name: /image/i });
    fireEvent.click(imageTab);

    const removeButton = screen.getByRole("button", { name: /remove image/i });
    fireEvent.click(removeButton);

    expect(mockActions.updateCell).toHaveBeenCalledWith(0, {
      cellStyle: {
        fontFamily: "Arial",
        cellBackgroundImage: null,
        cellBackgroundImageOpacity: null,
        cellBackgroundImagePosition: null,
        cellBackgroundImageSize: null,
      },
    });
  });
});
