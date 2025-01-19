import React from "react";
import { useEditor } from "@/hooks/useEditor";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import EmojiPicker from "emoji-picker-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const StampControls = () => {
    const { state, actions } = useEditor();
    return (
        <div className='flex flex-col p-2 gap-4'>
            <div className='flex items-center justify-between gap-4'>
                <span>Stamp</span>
                <Popover>
                    <PopoverTrigger asChild>
                        <div
                            className='px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer'
                            role='button'
                            tabIndex={0}
                        >
                            {state.stamp.value}
                        </div>
                    </PopoverTrigger>
                    <PopoverContent>
                        <EmojiPicker
                            theme='auto'
                            onEmojiClick={(emoji) =>
                                actions.updateStamp({
                                    ...state.stamp,
                                    value: emoji.emoji,
                                })
                            }
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <div className='flex items-center justify-between gap-4'>
                <Label htmlFor='Stamp opacity'>Opacity</Label>
                <Input
                    type='number'
                    defaultValue={state.stamp.opacity * 100}
                    onChange={(e) =>
                        actions.updateStamp({
                            ...state.stamp,
                            opacity: Number(e.target.value) / 100,
                        })
                    }
                    id='Stamp opacity'
                    className='w-20'
                />
            </div>
        </div>
    );
};

export default StampControls;
