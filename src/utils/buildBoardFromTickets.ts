import { type Board } from "../models/Board";
import { type Ticket } from "../models/Ticket";

export function buildBoardFromTickets(
    tickets: Ticket[]
): Board {
    const todo: string[] = [];
    const inProgress: string[] = [];
    const done: string[] = [];

    for (const t of tickets) {
        if (t.status === "Todo" || t.status === "Backlog") {
            todo.push(t.id);
        } else if (t.status === "InProgress") {
            inProgress.push(t.id);
        } else if (t.status === "Done") {
            done.push(t.id);
        }
    }

    return {
        laneOrder: {
            todo,
            inProgress,
            done,
        },
    };
}