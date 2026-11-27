import { Prisma } from "@prisma/client";
import editorReducer, { setBingo, setSelectedCell, setTitle } from "@/store/slices/editorSlice";
import { buildCellUpdate } from "@/lib/builders";
import { DEFAULT_GRADIENT_CONFIG_STRING, DEFAULT_STAMP, DEFAULT_STYLE } from "@/utils/constants";
import type { Bingo, CellStyle } from "@/types/types";

describe("editorSlice and builders", () => {
  test("caps undo history at 50 entries", () => {
    let state = editorReducer(undefined, { type: "@@INIT" });

    for (let i = 0; i < 65; i++) {
      state = editorReducer(state, setTitle(`Title ${i}`));
    }

    expect(state.history.past).toHaveLength(50);
    expect(state.history.present.title).toBe("Title 64");
  });

  test("setSelectedCell updates selection without pushing undo history", () => {
    let state = editorReducer(undefined, { type: "@@INIT" });
    expect(state.selectedCellIndex).toBeNull();
    expect(state.canUndo).toBe(false);

    state = editorReducer(state, setSelectedCell(4));
    expect(state.selectedCellIndex).toBe(4);
    expect(state.canUndo).toBe(false);
    expect(state.history.past).toHaveLength(0);
  });

  test("setBingo sorts cells safely even when input array is frozen", () => {
    const frozenCells = Object.freeze([
      { id: "b", content: "Second", position: 1, validated: false },
      { id: "a", content: "First", position: 0, validated: false },
    ]);

    const bingo: Bingo = {
      id: "bingo-1",
      title: "Frozen Test",
      gridSize: 3,
      status: "draft",
      style: DEFAULT_STYLE,
      background: { value: DEFAULT_GRADIENT_CONFIG_STRING },
      stamp: DEFAULT_STAMP,
      cells: frozenCells as unknown as Bingo["cells"],
    };

    const initial = editorReducer(undefined, { type: "@@INIT" });
    const next = editorReducer(initial, setBingo(bingo));

    expect(next.history.present.cells[0]?.content).toBe("First");
    expect(next.history.present.cells[1]?.content).toBe("Second");
    expect(next.selectedCellIndex).toBeNull();
  });

  test("buildCellUpdate merges partial cellStyle and supports null reset", () => {
    const existing = new Map<string, CellStyle | null>([
      ["cell-1", { fontWeight: "bold", color: "#ff0000" }],
      ["cell-2", { fontStyle: "italic" }],
    ]);

    const updates = buildCellUpdate(
      [
        { id: "cell-1", cellStyle: { fontSize: 20 } },
        { id: "cell-2", cellStyle: null },
      ],
      existing
    );

    expect(updates[0]?.data.cellStyle).toEqual({
      fontWeight: "bold",
      color: "#ff0000",
      fontSize: 20,
    });
    expect(updates[1]?.data.cellStyle).toBe(Prisma.JsonNull);
  });
});
