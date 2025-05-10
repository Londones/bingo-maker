"use client";
import React, { useEffect, useRef } from "react";
import Editor from "@/components/editor/editor";
import { useEditorRoutePersistence } from "@/hooks/useEditorRoutePersistence";
import { useEditor } from "@/hooks/useEditor";

export default function EditorPage() {
    const { state, actions } = useEditor();
    const { isMainEditorPage, loadEditorState, saveEditorState, clearEditorState } = useEditorRoutePersistence();
    const isSavingRef = useRef(false);
    const initialLoadDoneRef = useRef(false);

    const setSaving = (isSaving: boolean) => {
        isSavingRef.current = isSaving;
    };

    useEffect(() => {
        if (isMainEditorPage && !initialLoadDoneRef.current) {
            const savedState = loadEditorState();
            if (!savedState || savedState.id) {
                actions.resetEditorState();
                clearEditorState();
            } else {
                try {
                    actions.setBingo(savedState);
                } catch (e) {
                    console.error("Failed to restore editor state", e);
                    actions.resetEditorState();
                    clearEditorState();
                }
            }

            initialLoadDoneRef.current = true;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMainEditorPage]);

    useEffect(() => {
        if (!isMainEditorPage || !state) return;

        if (!isSavingRef.current && !state.id) {
            saveEditorState(state);
        }

        return () => {
            if (!isSavingRef.current && !state.id) {
                saveEditorState(state);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMainEditorPage, state]);

    return <Editor setSaving={setSaving} />;
}
