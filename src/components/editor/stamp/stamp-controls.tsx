import React, { useState, useEffect, useCallback, memo } from "react";
import { useEditor } from "@/hooks/useEditor";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

enum EmojiStyle {
  NATIVE = "native",
  APPLE = "apple",
  TWITTER = "twitter",
  GOOGLE = "google",
  FACEBOOK = "facebook",
}

const StampDisplay = memo(
  ({ type, value }: { type: string; value: string }) => {
    if (type === "text") {
      return value;
    }
    return <Image src={value} alt="Stamp" width={24} height={24} />;
  }
);

StampDisplay.displayName = "StampDisplay";

const StampControls = () => {
  const { state, actions } = useEditor();
  const [emojiStyle, setEmojiStyle] = useState<EmojiStyle>(EmojiStyle.NATIVE);
  const [currentEmoji, setCurrentEmoji] = useState<EmojiClickData | undefined>(
    undefined
  );

  useEffect(() => {
    if (currentEmoji) {
      actions.updateStamp({
        ...state.stamp,
        type: emojiStyle === EmojiStyle.NATIVE ? "text" : "image",
        value:
          emojiStyle === EmojiStyle.NATIVE
            ? currentEmoji.emoji
            : currentEmoji.getImageUrl?.(emojiStyle) ?? currentEmoji.imageUrl,
      });
    }
  }, [currentEmoji, emojiStyle, actions, state.stamp]);

  const handleEmojiClick = useCallback((emoji: EmojiClickData) => {
    setCurrentEmoji(emoji);
  }, []);

  const handleEmojiStyleChange = useCallback((value: string) => {
    setEmojiStyle(value.toLowerCase() as EmojiStyle);
  }, []);

  const handleOpacityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      actions.updateStamp({
        ...state.stamp,
        opacity: Number(e.target.value) / 100,
      });
    },
    [actions, state.stamp]
  );

  return (
    <div className="flex flex-col p-2 gap-4">
      <div className="flex items-center justify-between gap-4">
        <span>Stamp</span>
        <Popover>
          <PopoverTrigger asChild>
            <div
              className="px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer"
              role="button"
              tabIndex={0}
            >
              <StampDisplay type={state.stamp.type} value={state.stamp.value} />
            </div>
          </PopoverTrigger>
          <PopoverContent>
            <EmojiPicker
              lazyLoadEmojis
              theme={Theme.AUTO}
              emojiStyle={emojiStyle}
              onEmojiClick={handleEmojiClick}
            />
          </PopoverContent>
        </Popover>
        <Select
          disabled={!currentEmoji}
          value={emojiStyle}
          onValueChange={handleEmojiStyleChange}
        >
          <SelectTrigger className="w-auto">
            <SelectValue>
              {emojiStyle.charAt(0).toUpperCase() + emojiStyle.slice(1)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.values(EmojiStyle).map((style) => (
              <SelectItem value={style} key={style}>
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="Stamp opacity">Opacity</Label>
        <Input
          type="number"
          defaultValue={state.stamp.opacity * 100}
          onChange={handleOpacityChange}
          min={0}
          max={100}
          id="Stamp opacity"
          className="w-20"
        />
      </div>
    </div>
  );
};

export default memo(StampControls);
