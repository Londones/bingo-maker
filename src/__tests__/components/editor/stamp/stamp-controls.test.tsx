import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import StampControls from "@/components/editor/stamp/stamp-controls";
import { renderWithEditorStore } from "../../../../../jest/helpers/render-with-editor";

jest.mock("next/dynamic", () => () => {
  const MockEmojiPicker = ({
    onEmojiSelect,
  }: {
    onEmojiSelect: (emoji: { native: string; unified: string; names: string[] }) => void;
  }) => (
    <button
      data-testid="mock-emoji-btn"
      onClick={() => onEmojiSelect({ native: "🔥", unified: "1f525", names: ["fire"] })}
    >
      Pick Fire
    </button>
  );
  return MockEmojiPicker;
});

describe("StampControls (real Redux store)", () => {
  test("renders current text stamp and opacity input", () => {
    renderWithEditorStore(<StampControls />);

    expect(screen.getByText("Stamp")).toBeInTheDocument();
    expect(screen.getByText("✔️")).toBeInTheDocument();
    expect(screen.getByLabelText("Opacity")).toHaveValue(100);
  });

  test("updates stamp opacity in Redux store", () => {
    const { store } = renderWithEditorStore(<StampControls />);

    const opacityInput = screen.getByLabelText("Opacity");
    fireEvent.change(opacityInput, { target: { value: "50" } });

    expect(store.getState().editor.history.present.stamp.opacity).toBe(0.5);
  });

  test("opens emoji picker popover and updates stamp value in Redux store", () => {
    const { store } = renderWithEditorStore(<StampControls />);

    const trigger = screen.getByRole("button", { name: "✔️" });
    fireEvent.click(trigger);

    const emojiBtn = screen.getByTestId("mock-emoji-btn");
    fireEvent.click(emojiBtn);

    const stamp = store.getState().editor.history.present.stamp;
    expect(stamp.type).toBe("text");
    expect(stamp.value).toBe("🔥");
  });
});
