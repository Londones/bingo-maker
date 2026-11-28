import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BingoView from "@/components/bingo/bingo-view";
import { exportBoardToPng } from "@/lib/export-bingo";
import { DEFAULT_GRADIENT_CONFIG_STRING, DEFAULT_STAMP, DEFAULT_STYLE } from "@/utils/constants";
import type { Bingo } from "@/types/types";

jest.mock("next/dynamic", () => () => () => null);

jest.mock("@/lib/export-bingo", () => ({
  exportBoardToPng: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const makeSampleBingo = (validatedIndices: number[] = [0, 1, 2]): Bingo => ({
  id: "bingo-123",
  title: "Movie Night Bingo",
  titleWidth: 320,
  gridSize: 3,
  status: "published",
  style: DEFAULT_STYLE,
  background: { value: DEFAULT_GRADIENT_CONFIG_STRING },
  stamp: DEFAULT_STAMP,
  cells: Array.from({ length: 9 }, (_, position) => ({
    id: `cell-${position}`,
    content: `Square ${position + 1}`,
    position,
    validated: validatedIndices.includes(position),
  })),
});

describe("BingoView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows stamped progress and completed bingo line count", () => {
    render(<BingoView bingo={makeSampleBingo([0, 1, 2])} isAuthor={false} onToggleCell={jest.fn()} />);

    expect(screen.getAllByText("Movie Night Bingo").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("3 / 9 stamped")).toBeInTheDocument();
    expect(screen.getByText("1 bingo line!")).toBeInTheDocument();
    expect(screen.queryByText("Edit board")).not.toBeInTheDocument();
  });

  test("lets editors click a square to toggle stamp and keeps viewers read-only", () => {
    const onToggleCell = jest.fn();
    const bingo = makeSampleBingo([]);

    const { rerender } = render(<BingoView bingo={bingo} isAuthor={true} onToggleCell={onToggleCell} />);

    expect(screen.getByText("Edit board")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Square 1"));
    expect(onToggleCell).toHaveBeenCalledTimes(1);
    expect(onToggleCell).toHaveBeenCalledWith(expect.objectContaining({ id: "cell-0", position: 0 }));

    onToggleCell.mockClear();
    rerender(<BingoView bingo={bingo} isAuthor={false} onToggleCell={onToggleCell} />);
    fireEvent.click(screen.getByText("Square 1"));
    expect(onToggleCell).not.toHaveBeenCalled();
  });

  test("triggers PNG export when Save PNG is clicked", async () => {
    render(<BingoView bingo={makeSampleBingo([0])} isAuthor={false} onToggleCell={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Save PNG/i }));

    await waitFor(() => {
      expect(exportBoardToPng).toHaveBeenCalledWith(expect.any(HTMLElement), "Movie Night Bingo");
    });
  });
});
