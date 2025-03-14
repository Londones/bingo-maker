"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GRID_SIZES } from "@/utils/constants";
import { useEditor } from "@/hooks/useEditor";
import { Card } from "@/components/ui/card";
import React, { memo, useCallback, useMemo } from "react";

const GridSizeOption = memo(({ size }: { size: number }) => {
  return (
    <div className="flex items-center space-x-2">
      <RadioGroupItem value={size.toString()} id={`size-${size}`} />
      <Label htmlFor={`size-${size}`} className="">
        {size}x{size}
      </Label>
    </div>
  );
});

GridSizeOption.displayName = "GridSizeOption";

const CellItem = memo(
  ({
    index,
    validated,
    onToggle,
  }: {
    index: number;
    validated: boolean;
    onToggle: (index: number) => void;
  }) => {
    return (
      <Card
        className={`aspect-square flex items-center justify-center p-2 text-sm cursor-pointer transition-all hover:bg-accent ${
          validated ? "bg-accent" : ""
        }`}
        onClick={() => onToggle(index)}
      />
    );
  }
);

CellItem.displayName = "CellItem";

const GridControls = () => {
  const { state, actions } = useEditor();

  const handleGridSizeChange = useCallback(
    (size: string) => {
      actions.setGridSize(parseInt(size, 10));
    },
    [actions]
  );

  const handleCellToggle = useCallback(
    (index: number) => {
      actions.toggleStamp(index);
    },
    [actions]
  );

  const gridStyle = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${state.gridSize}, minmax(0, 1fr))`,
    }),
    [state.gridSize]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-lg ">Grid Size</h1>
        <RadioGroup
          value={state.gridSize.toString()}
          onValueChange={handleGridSizeChange}
          className="flex gap-4"
        >
          {GRID_SIZES.map((size) => (
            <GridSizeOption key={size} size={size} />
          ))}
        </RadioGroup>
      </div>
      <div className="grid gap-2" style={gridStyle}>
        {state.cells.map((cell, index) => (
          <CellItem
            key={index}
            index={index}
            validated={cell.validated}
            onToggle={handleCellToggle}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(GridControls);
