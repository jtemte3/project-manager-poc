import { type Sprint } from "../models/Sprint";
import { type Ticket } from "../models/Ticket";

export type BurndownMode = "tickets" | "complexity";

export interface BurndownPoint {
    day: number;
    actual: number;
    ideal: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function getUnits(
    ticket: Ticket,
    mode: BurndownMode
) {
    return mode === "tickets" ? 1 : ticket.complexity;
}

function toMidnight(date: string) {
    return new Date(`${date}T00:00:00`);
}

function getCompletionDay(
    sprint: Sprint,
    ticket: Ticket
) {
    if (!sprint.startDate || !ticket.doneAt) {
        return null;
    }

    const start = toMidnight(sprint.startDate).getTime();
    const done = new Date(ticket.doneAt).getTime();
    const totalDays = Math.max(
        sprint.durationWeeks * 7,
        1
    );
    const day = Math.floor((done - start) / DAY_MS);

    return Math.max(0, Math.min(totalDays, day));
}

export function buildBurndownData(
    sprint: Sprint,
    tickets: Ticket[],
    mode: BurndownMode
): BurndownPoint[] {
    const totalDays = Math.max(
        sprint.durationWeeks * 7,
        1
    );

    const units = tickets.map(ticket => ({
        units: getUnits(ticket, mode),
        completionDay: getCompletionDay(sprint, ticket),
    }));

    const totalUnits = units.reduce(
        (sum, item) => sum + item.units,
        0
    );

    return Array.from(
        { length: totalDays + 1 },
        (_, day) => {
            const completed = units.reduce(
                (sum, item) =>
                    item.completionDay !== null &&
                    item.completionDay <= day
                        ? sum + item.units
                        : sum,
                0
            );

            const actual = Math.max(
                totalUnits - completed,
                0
            );
            const ideal = Math.max(
                totalUnits - (totalUnits * day) / totalDays,
                0
            );

            return {
                day,
                actual: Number(actual.toFixed(2)),
                ideal: Number(ideal.toFixed(2)),
            };
        }
    );
}
