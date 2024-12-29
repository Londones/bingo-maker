"use client";
import React from "react";
import { HslStringColorPicker } from "react-colorful";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type ColorPickerPopoverProps = {
    color: string;
    onChange: (color: string) => void;
    onClose: () => void;
};

const ColorPickerPopover = ({ color, onChange, onClose }: ColorPickerPopoverProps) => (
    <div className='p-2 relative bg-white rounded-lg shadow-lg'>
        <HslStringColorPicker color={color} onChange={onChange} />
        <Button onClick={onClose} className='absolute rounded-full p-2 -top-4 -right-2'>
            <X />
        </Button>
    </div>
);

export default ColorPickerPopover;
