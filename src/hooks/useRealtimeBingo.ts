import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bingo } from "@/types/types";

interface BingoUpdateEvent {
    type: "connected" | "update" | "delete";
    bingoId: string;
    timestamp?: number;
    data?: Bingo;
}

export function useRealtimeBingo(bingoId: string) {
    const queryClient = useQueryClient();
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!bingoId) return;

        const connect = () => {
            console.log("Connecting to real-time updates for bingo:", bingoId);
            // Clean up existing connection
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }

            try {
                // Create EventSource connection
                const eventSource = new EventSource(`/api/bingo/${bingoId}/updates`);
                eventSourceRef.current = eventSource;

                eventSource.onopen = () => {
                    console.log("Connected to real-time updates for bingo:", bingoId);
                };

                eventSource.onmessage = (event) => {
                    try {
                        const updateEvent: BingoUpdateEvent = JSON.parse(event.data as string);

                        switch (updateEvent.type) {
                            case "connected":
                                console.log("Real-time connection established for bingo:", bingoId);
                                break;

                            case "update":
                                if (updateEvent.data) {
                                    // Update the bingo data in React Query cache
                                    queryClient.setQueryData<Bingo>(["bingo", bingoId], (oldData) => {
                                        if (!oldData) return updateEvent.data;

                                        // Merge the updated data with existing data
                                        return {
                                            ...oldData,
                                            ...updateEvent.data,
                                            // Ensure we preserve the full structure
                                            cells: updateEvent.data!.cells || oldData.cells,
                                            background: updateEvent.data!.background || oldData.background,
                                            style: updateEvent.data!.style || oldData.style,
                                            stamp: updateEvent.data!.stamp || oldData.stamp,
                                        };
                                    });
                                    console.log("Bingo updated via real-time");
                                }
                                break;

                            case "delete":
                                console.log("Bingo deleted via real-time");
                                // Optionally invalidate the query or redirect
                                queryClient.removeQueries({ queryKey: ["bingo", bingoId] });
                                break;
                        }
                    } catch (error) {
                        console.error("Error parsing real-time update:", error);
                    }
                };

                eventSource.onerror = (error) => {
                    console.error("EventSource error:", error);

                    // Attempt to reconnect after a delay
                    if (reconnectTimeoutRef.current) {
                        clearTimeout(reconnectTimeoutRef.current);
                    }

                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log("Attempting to reconnect to real-time updates...");
                        connect();
                    }, 5000); // Reconnect after 5 seconds
                };
            } catch (error) {
                console.error("Error creating EventSource:", error);
            }
        };

        // Initial connection
        connect();

        // Cleanup on unmount
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };
    }, [bingoId, queryClient]);
}
