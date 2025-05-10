import { useState, useEffect, useRef } from "react";
import { BingoCell } from "@/types/types";

export function useBingoPatterns(cells: BingoCell[], gridSize: number, onNewBingoFound?: () => void) {
    const [bingoPatterns, setBingoPatterns] = useState<string[]>([]);
    const isFirstLoad = useRef(true);

    useEffect(() => {
        const checkBingo = () => {
            // Generate patterns
            const patterns = [
                // Horizontal
                ...Array.from({ length: gridSize }, (_, row) =>
                    Array.from({ length: gridSize }, (_, col) => row * gridSize + col)
                ),
                // Vertical
                ...Array.from({ length: gridSize }, (_, col) =>
                    Array.from({ length: gridSize }, (_, row) => row * gridSize + col)
                ),
                // Diagonal (top-left to bottom-right)
                Array.from({ length: gridSize }, (_, i) => i * gridSize + i),
                // Diagonal (top-right to bottom-left)
                Array.from({ length: gridSize }, (_, i) => (i + 1) * gridSize - i - 1),
            ];

            // Find completed patterns
            const completedPatterns = patterns
                .filter((pattern) => pattern.every((index) => cells[index]?.validated))
                .map((pattern) => pattern.map((i) => `cell-${i}`).join(","));

            // Check if we have any new patterns
            const newPatterns = completedPatterns.filter((pattern) => !bingoPatterns.includes(pattern));

            if (newPatterns.length > 0) {
                // Only trigger callback if we found new patterns and it's not the first load
                if (!isFirstLoad.current && onNewBingoFound) {
                    onNewBingoFound();
                }
                setBingoPatterns(completedPatterns);
            } else if (completedPatterns.length > 0 && completedPatterns.length !== bingoPatterns.length) {
                // Update patterns without triggering callback if the count changed but no new patterns
                setBingoPatterns(completedPatterns);
            } else if (completedPatterns.length === 0 && bingoPatterns.length > 0) {
                // Clear patterns if none are left
                setBingoPatterns([]);
            }

            // After the first check, mark that we're no longer in the first load
            isFirstLoad.current = false;
        };

        checkBingo();
    }, [cells, gridSize, bingoPatterns, onNewBingoFound]);

    return { bingoPatterns };
}
