"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GRID_SIZES } from "@/utils/constants";
import { useEditor } from "@/hooks/useEditor";
import { Card } from "@/components/ui/card";

const GridControls = () => {
    const { state, actions } = useEditor();

    const handleGridSizeChange = (size: string) => {
        actions.setGridSize(parseInt(size, 10));
    };

    return (
        <div className='space-y-6'>
            <div className='space-y-2'>
                <h1 className='text-lg '>Grid Size</h1>
                <RadioGroup
                    value={state.gridSize.toString()}
                    onValueChange={handleGridSizeChange}
                    className='flex gap-4'
                >
                    {GRID_SIZES.map((size) => (
                        <div key={size} className='flex items-center space-x-2'>
                            <RadioGroupItem value={size.toString()} id={`size-${size}`} />
                            <Label htmlFor={`size-${size}`} className=''>
                                {size}x{size}
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>
            <div
                className={`grid gap-2`}
                style={{
                    gridTemplateColumns: `repeat(${state.gridSize}, minmax(0, 1fr))`,
                }}
            >
                {state.cells.map((cell, index) => (
                    <Card
                        key={index}
                        className={`aspect-square flex items-center justify-center p-2 text-sm cursor-pointer transition-all hover:bg-accent ${
                            cell.validated ? "bg-accent" : ""
                        }`}
                        onClick={() => actions.toggleStamp(index)}
                    >
                        {cell.content}
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default GridControls;
