import { type Project } from "../models/Project";
import { type Sprint } from "../models/Sprint";
import { type Ticket } from "../models/Ticket";

function normalizeTicket(ticket: Ticket): Ticket {
    return {
        ...ticket,
        doneAt: ticket.doneAt ?? null,
    };
}

function normalizeSprint(sprint: Sprint): Sprint {
    return {
        ...sprint,
        startDate: sprint.startDate ?? null,
        endDate: sprint.endDate ?? null,
        archived: sprint.archived ?? false,
        ticketCount: sprint.ticketCount ?? 0,
        totalComplexity: sprint.totalComplexity ?? 0,
        doneTicketCount: sprint.doneTicketCount ?? 0,
        doneComplexity: sprint.doneComplexity ?? 0,
        ticketIds: sprint.ticketIds ?? [],
    };
}

export function normalizeProjectState(
    project: Project
): Project {
    const tickets = project.tickets.map(normalizeTicket);
    const sprints = project.sprints.map(normalizeSprint);

    return syncSprintMetrics({
        ...project,
        tickets,
        sprints,
    });
}

export function syncSprintMetrics(
    project: Project
): Project {
    const sprints = project.sprints.map(sprint => {
        const sprintTickets = project.tickets.filter(
            ticket =>
                ticket.sprintId === sprint.id ||
                sprint.ticketIds.includes(ticket.id)
        );

        const ticketCount = sprintTickets.length;
        const totalComplexity = sprintTickets.reduce(
            (sum, ticket) => sum + ticket.complexity,
            0
        );
        const doneTickets = sprintTickets.filter(
            ticket => ticket.status === "Done"
        );
        const doneTicketCount = doneTickets.length;
        const doneComplexity = doneTickets.reduce(
            (sum, ticket) => sum + ticket.complexity,
            0
        );

        return {
            ...sprint,
            ticketCount,
            totalComplexity,
            doneTicketCount,
            doneComplexity,
        };
    });

    return {
        ...project,
        sprints,
    };
}
