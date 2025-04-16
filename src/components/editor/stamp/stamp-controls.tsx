import React, { useState, useEffect, useCallback } from "react";
import { useEditor } from "@/hooks/useEditor";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

// Define the type for emoji-mart click data
type EmojiMartClickData = {
  native: string;
  unified: string;
  names: string[];
};

// Define the emoji style enum
export enum EmojiStyle {
  NATIVE = "native",
  APPLE = "apple",
  TWITTER = "twitter",
  GOOGLE = "google",
  FACEBOOK = "facebook",
}

// Type for emoji click data
export type EmojiClickData = {
  emoji: string;
  native: string;
  unified: string;
  names?: string[];
  imageUrl?: string;
};

// Function to get the image URL for a specific emoji style
const getEmojiImageUrl = (unified: string, style: EmojiStyle): string => {
  if (style === EmojiStyle.NATIVE) return ""; // Native doesn't need URL

  // Convert style names to match emoji-mart naming convention
  const styleMap: Record<string, string> = {
    [EmojiStyle.APPLE]: "apple",
    [EmojiStyle.GOOGLE]: "google",
    [EmojiStyle.TWITTER]: "twitter",
    [EmojiStyle.FACEBOOK]: "facebook",
  };

  const emojiStyle = styleMap[style] || "apple";
  return `https://cdn.jsdelivr.net/npm/emoji-datasource-${emojiStyle}/img/${emojiStyle}/64/${unified.toLowerCase()}.png`;
};

const StampControls = () => {
  const { state, actions } = useEditor();
  const [emojiStyle, setEmojiStyle] = useState<EmojiStyle>(EmojiStyle.NATIVE);
  const [currentEmoji, setCurrentEmoji] = useState<EmojiClickData | undefined>(undefined);

  const lastEmojiRef = React.useRef<{ emoji?: EmojiClickData; style?: EmojiStyle }>({});
  // Process emoji updates when either the emoji or style changes
  const updateStampWithEmoji = useCallback(
    (emoji: EmojiClickData, style: EmojiStyle) => {
      const imageUrl = style === EmojiStyle.NATIVE ? "" : getEmojiImageUrl(emoji.unified, style);

      actions.updateStamp({
        ...state.stamp,
        type: style === EmojiStyle.NATIVE ? "text" : "image",
        value: style === EmojiStyle.NATIVE ? emoji.native : imageUrl,
      });
    },
    [state.stamp, actions]
  );

  // Single effect to handle both emoji and style changes
  useEffect(() => {
    // Skip if no emoji is selected yet
    if (!currentEmoji) return;

    // Only update if the emoji or style actually changed
    const emojiChanged = currentEmoji !== lastEmojiRef.current.emoji;
    const styleChanged = emojiStyle !== lastEmojiRef.current.style && lastEmojiRef.current.emoji;

    if (emojiChanged || styleChanged) {
      // Update our ref to track the current values
      lastEmojiRef.current.emoji = currentEmoji;
      lastEmojiRef.current.style = emojiStyle;

      // Only call updateStamp once per change
      updateStampWithEmoji(currentEmoji, emojiStyle);
    }
  }, [currentEmoji, emojiStyle, updateStampWithEmoji]);
  // Handle emoji selection from emoji-mart picker
  const handleEmojiSelect = useCallback((emojiData: EmojiMartClickData) => {
    const formattedEmoji: EmojiClickData = {
      emoji: emojiData.native,
      native: emojiData.native,
      unified: emojiData.unified,
      names: emojiData.names,
    };

    setCurrentEmoji(formattedEmoji);
  }, []);
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
          </PopoverTrigger>{" "}
          <PopoverContent className="p-1">
            <Picker
              data={data}
              onEmojiSelect={handleEmojiSelect}
              set="native"
              theme="auto"
              previewPosition="none"
              skinTonePosition="none"
              autoFocus={true}
              navPosition="top"
              maxFrequentRows={0}
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
