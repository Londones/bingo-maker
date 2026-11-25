import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import CellContextMenu from "@/components/editor/cell/cell-context-menu";
import { renderWithEditorStore } from "../../../../../jest/helpers/render-with-editor";
import { ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent } from "@/__mocks__/components/ui-components";

jest.mock("@/hooks/useIsAuth", () => ({
  useIsAuth: jest.fn(() => true),
}));

jest.mock("react-colorful", () => ({
  HexColorPicker: () => <div data-testid="color-picker" />,
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock("@/lib/client-s3upload", () => ({
  uploadImagesToBingo: jest.fn().mockResolvedValue([{ type: "cell", url: "https://example.com/cell.jpg" }]),
}));

jest.mock("@/components/ui/context-menu", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ContextMenuSub: (props: any) => <ContextMenuSub {...props} />,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ContextMenuSubTrigger: (props: any) => <ContextMenuSubTrigger {...props} />,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ContextMenuSubContent: (props: any) => <ContextMenuSubContent {...props} />,
}));

describe("CellContextMenu (real Redux store)", () => {
  test("renders cell styling options for a specific cell", () => {
    renderWithEditorStore(<CellContextMenu index={0} />);
    expect(screen.getByText(/font family/i)).toBeInTheDocument();
    expect(screen.getByText(/font size/i)).toBeInTheDocument();
    expect(screen.getByText(/bold/i)).toBeInTheDocument();
    expect(screen.getByText(/italic/i)).toBeInTheDocument();
  });

  test("toggles bold on only the targeted cell in Redux store", () => {
    const { store } = renderWithEditorStore(<CellContextMenu index={1} />);

    const boldButton = screen.getByText("Bold").nextElementSibling as HTMLButtonElement;
    fireEvent.click(boldButton);

    const cells = store.getState().editor.history.present.cells;
    expect(cells[1]?.cellStyle?.fontWeight).toBe("bold");
    expect(cells[0]?.cellStyle).toBeUndefined();
  });
});
