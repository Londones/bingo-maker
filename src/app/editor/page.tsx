"use client";
import React, { useEffect } from "react";
import Editor from "@/components/editor/editor";
import { useEditorRoutePersistence } from "@/hooks/useEditorRoutePersistence";
import { useEditor } from "@/hooks/useEditor";

export default function EditorPage() {
  const { state, actions } = useEditor();
  const { isMainEditorPage, loadEditorState, saveEditorState } = useEditorRoutePersistence();

  useEffect(() => {
    if (isMainEditorPage) {
      const savedState = loadEditorState();
      if (savedState && !savedState.id) {
        try {
          actions.setBingo(savedState);
        } catch (e) {
          console.error("Failed to restore editor state", e);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isMainEditorPage || !state) return;

    // Save state when it changes
    saveEditorState(state);

    return () => {
      saveEditorState(state);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMainEditorPage, state]);

  return <Editor />;
}
