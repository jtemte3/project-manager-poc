import { useEffect, useState } from "react";

import { type Board } from "../models/Board";
import { type Ticket } from "../models/Ticket";
import { buildBoardFromTickets } from "../utils/buildBoardFromTickets";

export function useBoard(
    sprintId: string | null,
    tickets: Ticket[]
) {
    const [board, setBoard] = useState<Board | null>(null);

    useEffect(() => {
        if (!sprintId) {
            setBoard(null);
            return;
        }

        setBoard(previous => {
            // First load
            if (!previous) {
                return buildBoardFromTickets(
                    tickets
                );
            }

            // Same sprint, preserve ordering
            return previous;
        });
    }, [sprintId]);

    return {
        board,
        setBoard,
    };
}