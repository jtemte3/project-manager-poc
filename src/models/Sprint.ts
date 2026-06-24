export interface Sprint {
    id: string;

    title: string;

    durationWeeks: 1 | 2 | 3 | 4;

    startDate: string | null;

    endDate: string | null;

    active: boolean;

    archived: boolean;

    ticketCount: number;

    totalComplexity: number;

    doneTicketCount: number;

    doneComplexity: number;

    ticketIds: string[];
}
