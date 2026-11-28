import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import GradientEditor from "@/components/editor/background/gradient-editor";
import { renderWithEditorStore } from "../../../../../jest/helpers/render-with-editor";
import { deserializeGradientConfig } from "@/lib/utils";

describe("GradientEditor (real Redux store)", () => {
  const initialGradient = {
    backgroundColor: "hsla(0, 0%, 0%, 1)",
    stops: [
      { color: "hsla(0, 100%, 50%, 1)", position: { x: 20, y: 30 } },
      { color: "hsla(240, 100%, 50%, 1)", position: { x: 70, y: 60 } },
    ],
  };

  beforeEach(() => {
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
  });

  test("renders initial gradient stops from Redux store", () => {
    const { container } = renderWithEditorStore(<GradientEditor />, {
      background: { value: JSON.stringify(initialGradient) },
    });

    const bg = container.querySelector("#gradient-background");
    expect(bg).toBeInTheDocument();
    expect(container.querySelectorAll('[data-drag-stop="true"]')).toHaveLength(2);
  });

  test("adds a new gradient stop via Add button and updates Redux store", () => {
    const { store } = renderWithEditorStore(<GradientEditor />, {
      background: { value: JSON.stringify(initialGradient) },
    });

    fireEvent.click(screen.getByLabelText("Add gradient spot"));

    const updated = deserializeGradientConfig(store.getState().editor.history.present.background.value);
    expect(updated.stops).toHaveLength(3);
  });

  test("adds a new gradient stop on double-click on the pad", () => {
    const { store, container } = renderWithEditorStore(<GradientEditor />, {
      background: { value: JSON.stringify(initialGradient) },
    });

    const bg = container.querySelector("#gradient-background")!;
    fireEvent.doubleClick(bg, { clientX: 100, clientY: 50 });

    const updated = deserializeGradientConfig(store.getState().editor.history.present.background.value);
    expect(updated.stops).toHaveLength(3);
    expect(updated.stops[2]?.position).toEqual({ x: 50, y: 50 });
  });

  test("deletes the selected gradient stop and updates Redux store", () => {
    const { store } = renderWithEditorStore(<GradientEditor />, {
      background: { value: JSON.stringify(initialGradient) },
    });

    fireEvent.click(screen.getByLabelText("Delete selected spot"));

    const updated = deserializeGradientConfig(store.getState().editor.history.present.background.value);
    expect(updated.stops).toHaveLength(1);
    expect(updated.stops[0]?.color).toBe("hsla(240, 100%, 50%, 1)");
  });

  test("applies a curated preset to Redux store", () => {
    const { store } = renderWithEditorStore(<GradientEditor />, {
      background: { value: JSON.stringify(initialGradient) },
    });

    fireEvent.click(screen.getByLabelText("Apply Highway preset"));

    const updated = deserializeGradientConfig(store.getState().editor.history.present.background.value);
    expect(updated.backgroundColor).toBe("hsla(175, 36%, 8%, 1)");
    expect(updated.stops).toHaveLength(2);
  });
});
