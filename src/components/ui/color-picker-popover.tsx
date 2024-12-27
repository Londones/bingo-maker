import React from "react";
import { HslStringColorPicker } from "react-colorful";

type ColorPickerPopoverProps = {
    color: string;
    onChange: (color: string) => void;
    onClose: () => void;
};

const ColorPickerPopover = ({ color, onChange, onClose }: ColorPickerPopoverProps) => (
    <div className='absolute top-0 right-0 p-2 bg-white rounded-lg shadow-lg'>
        <HslStringColorPicker color={color} onChange={onChange} />
        <button className='mt-2 px-4 py-2 bg-gray-200 rounded' onClick={onClose}>
            Close
        </button>
    </div>
);

export default ColorPickerPopover;
