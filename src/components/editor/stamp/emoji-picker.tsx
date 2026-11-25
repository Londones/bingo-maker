"use client";

import React from "react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

export type EmojiMartClickData = {
  native: string;
  unified: string;
  names: string[];
};

interface LazyEmojiPickerProps {
  onEmojiSelect: (emojiData: EmojiMartClickData) => void;
}

export default function LazyEmojiPicker({ onEmojiSelect }: LazyEmojiPickerProps) {
  return (
    <Picker
      data={data}
      onEmojiSelect={onEmojiSelect}
      set="native"
      theme="auto"
      previewPosition="none"
      skinTonePosition="none"
      autoFocus={true}
      navPosition="top"
      maxFrequentRows={0}
    />
  );
}
