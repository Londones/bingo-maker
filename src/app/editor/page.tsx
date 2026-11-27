"use client";
import React, { useEffect, useRef, useState } from "react";
import Editor from "@/components/editor/editor";
import { useEditorRoutePersistence } from "@/hooks/useEditorRoutePersistence";
import { useEditor } from "@/hooks/useEditor";

export default function EditorPage() {
    const { state, actions } = useEditor();
    const { isMainEditorPage, loadEditorState, saveEditorState, clearEditorState } = useEditorRoutePersistence();
    const isSavingRef = useRef(false);
    const initialLoadDoneRef = useRef(false);
    const [isReady, setIsReady] = useState(false);

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
        setIsReady(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMainEditorPage]);

    const latestStateRef = useRef(state);
    latestStateRef.current = state;

    useEffect(() => {
        if (!isReady || !isMainEditorPage || !state || isSavingRef.current || state.id) return;

        const timer = setTimeout(() => {
            if (!isSavingRef.current && !latestStateRef.current.id) {
                saveEditorState(latestStateRef.current);
            }
        }, 400);

        return () => {
            clearTimeout(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReady, isMainEditorPage, state]);

    useEffect(() => {
        return () => {
            if (isReady && isMainEditorPage && !isSavingRef.current && !latestStateRef.current.id) {
                saveEditorState(latestStateRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReady, isMainEditorPage]);

    if (!isReady) {
        return (
            <div className="fixed inset-0 w-screen h-screen bg-background/35 backdrop-blur-[2px] z-40" />
        );
    }

    return <Editor setSaving={setSaving} />;
}
