import React, { useState, useEffect } from "react";
import { useEditor } from "@/hooks/useEditor";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";
enum EmojiStyle {
  NATIVE = "native",
  APPLE = "apple",
  TWITTER = "twitter",
  GOOGLE = "google",
  FACEBOOK = "facebook",
}

const StampControls = () => {
  const { state, actions } = useEditor();
  const [emojiStyle, setEmojiStyle] = useState<EmojiStyle>(EmojiStyle.NATIVE);
  const [currentEmoji, setCurrentEmoji] = useState<EmojiClickData | undefined>(undefined);

  const lastEmojiRef = React.useRef<{ emoji?: EmojiClickData; style?: EmojiStyle }>({});

  useEffect(() => {
    if (currentEmoji && (currentEmoji !== lastEmojiRef.current.emoji || emojiStyle !== lastEmojiRef.current.style)) {
      lastEmojiRef.current = { emoji: currentEmoji, style: emojiStyle };

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
              {state.stamp.type === "text" ? (
                state.stamp.value
              ) : (
                <Image src={state.stamp.value} alt="Stamp" width={24} height={24} />
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent>
            <EmojiPicker
              lazyLoadEmojis
              theme={Theme.AUTO}
              emojiStyle={emojiStyle}
              onEmojiClick={(emoji) => {
                setCurrentEmoji(emoji);
              }}
            />
          </PopoverContent>
        </Popover>
        <Select
          disabled={!currentEmoji}
          value={emojiStyle}
          onValueChange={(value) => {
            setEmojiStyle(value.toLowerCase() as EmojiStyle);
          }}
        >
          <SelectTrigger className="w-auto">
            <SelectValue>{emojiStyle.charAt(0).toUpperCase() + emojiStyle.slice(1)}</SelectValue>
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
          onChange={(e) =>
            actions.updateStamp({
              ...state.stamp,
              opacity: Number(e.target.value) / 100,
            })
          }
          min={0}
          max={100}
          id="Stamp opacity"
          className="w-20"
        />
      </div>
    </div>
  );
};

export default StampControls;
