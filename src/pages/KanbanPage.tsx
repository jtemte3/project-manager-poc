import { useEffect, useState } from "react";

import TicketCard from "../components/TicketCard";
import TicketEditor from "../components/TicketEditor";
import { useProject } from "../hooks/useProject";

function formatDate(date: string | null | undefined) {
    return date ?? "—";
}

function sumComplexity(
    tickets: Array<{ complexity: number }>
) {
    return tickets.reduce(
        (sum, ticket) => sum + ticket.complexity,
        0
    );
}

export default function KanbanPage() {
    const { project } = useProject();
    const [selectedTicketId, setSelectedTicketId] =
        useState<string | null>(null);

    const activeSprint =
        project?.sprints.find(
            sprint =>
                sprint.active && !sprint.archived
        ) ?? null;

    const activeSprintTickets =
        project && activeSprint
            ? project.tickets.filter(
                ticket =>
                    ticket.sprintId === activeSprint.id ||
                    activeSprint.ticketIds.includes(
                        ticket.id
                    )
            )
            : [];

    const selectedTicket =
        project?.tickets.find(
            ticket =>
                ticket.id === selectedTicketId
        ) ?? null;

    const todoTickets = activeSprintTickets.filter(
        ticket =>
            ticket.status === "Backlog" ||
            ticket.status === "Todo"
    );
    const inProgressTickets = activeSprintTickets.filter(
        ticket => ticket.status === "InProgress"
    );
    const doneTickets = activeSprintTickets.filter(
        ticket => ticket.status === "Done"
    );

    useEffect(() => {
        setSelectedTicketId(null);
    }, [activeSprint?.id]);

    useEffect(() => {
        if (
            selectedTicketId &&
            !activeSprintTickets.some(
                ticket =>
                    ticket.id === selectedTicketId
            )
        ) {
            setSelectedTicketId(null);
        }
    }, [activeSprintTickets, selectedTicketId]);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setSelectedTicketId(null);
            }
        }

        if (selectedTicket) {
            window.addEventListener(
                "keydown",
                handleKeyDown
            );
        }

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [selectedTicket]);

    if (!project) {
        return null;
    }

    const ticketCount = activeSprintTickets.length;
    const doneTicketCount = doneTickets.length;
    const totalComplexity = sumComplexity(
        activeSprintTickets
    );
    const doneComplexity = sumComplexity(doneTickets);

    return (
        <div className="kanban-page">
            <header className="kanban-summary">
                <div className="kanban-summary__title-group">
                    <div className="backlog-eyebrow">
                        Kanban Board
                    </div>
                    <h1 className="kanban-summary__title">
                        {activeSprint?.title ??
                            "No Sprint Active"}
                    </h1>
                </div>

                <div className="kanban-metrics">
                    <div className="kanban-metric">
                        <span>Tickets</span>
                        <strong>{ticketCount}</strong>
                    </div>

                    <div className="kanban-metric">
                        <span>Done</span>
                        <strong>{doneTicketCount}</strong>
                    </div>

                    <div className="kanban-metric">
                        <span>Complexity</span>
                        <strong>{totalComplexity}</strong>
                    </div>

                    <div className="kanban-metric">
                        <span>Done Complexity</span>
                        <strong>{doneComplexity}</strong>
                    </div>

                    <div className="kanban-metric">
                        <span>State</span>
                        <strong>
                            {activeSprint
                                ? "Active"
                                : "No Sprint Active"}
                        </strong>
                    </div>

                    <div className="kanban-metric">
                        <span>End Date</span>
                        <strong>
                            {activeSprint
                                ? formatDate(
                                    activeSprint.endDate
                                )
                                : "—"}
                        </strong>
                    </div>
                </div>
            </header>

            {selectedTicket && (
                <div
                    className="ticket-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Ticket details"
                    onClick={() =>
                        setSelectedTicketId(null)
                    }
                >
                    <div
                        className="ticket-modal__surface"
                        onClick={event =>
                            event.stopPropagation()
                        }
                    >
                        <TicketEditor
                            ticket={selectedTicket}
                            onClose={() =>
                                setSelectedTicketId(null)
                            }
                        />
                    </div>
                </div>
            )}

            <section className="kanban-board">
                <div className="kanban-lane">
                    <div className="kanban-lane__header">
                        <span>To-Do</span>
                        <strong>{todoTickets.length}</strong>
                    </div>

                    <div className="kanban-lane__body">
                        {todoTickets.map(ticket => (
                            <TicketCard
                                key={ticket.id}
                                ticket={ticket}
                                selected={
                                    ticket.id ===
                                    selectedTicketId
                                }
                                onSelect={() =>
                                    setSelectedTicketId(
                                        current =>
                                            current === ticket.id
                                                ? null
                                                : ticket.id
                                    )
                                }
                            />
                        ))}
                    </div>
                </div>

                <div className="kanban-lane">
                    <div className="kanban-lane__header">
                        <span>In-Progress</span>
                        <strong>
                            {inProgressTickets.length}
                        </strong>
                    </div>

                    <div className="kanban-lane__body">
                        {inProgressTickets.map(ticket => (
                            <TicketCard
                                key={ticket.id}
                                ticket={ticket}
                                selected={
                                    ticket.id ===
                                    selectedTicketId
                                }
                                onSelect={() =>
                                    setSelectedTicketId(
                                        current =>
                                            current === ticket.id
                                                ? null
                                                : ticket.id
                                    )
                                }
                            />
                        ))}
                    </div>
                </div>

                <div className="kanban-lane">
                    <div className="kanban-lane__header">
                        <span>Done</span>
                        <strong>{doneTickets.length}</strong>
                    </div>

                    <div className="kanban-lane__body">
                        {doneTickets.map(ticket => (
                            <TicketCard
                                key={ticket.id}
                                ticket={ticket}
                                selected={
                                    ticket.id ===
                                    selectedTicketId
                                }
                                onSelect={() =>
                                    setSelectedTicketId(
                                        current =>
                                            current === ticket.id
                                                ? null
                                                : ticket.id
                                    )
                                }
                            />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
