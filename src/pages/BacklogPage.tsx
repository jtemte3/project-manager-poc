import { useEffect, useState } from "react";

import TicketCard from "../components/TicketCard";
import EpicCard from "../components/EpicCard";
import AddTicketCard from "../components/AddTicketCard";
import TicketEditor from "../components/TicketEditor";
import { useProject } from "../hooks/useProject";

export default function BacklogPage() {
    const {
        project,
        addEpic,
        addTicket,
        editingTicketId,
        setEditingTicketId,
    } = useProject();

    const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());

    const toggleEpic = (epicId: string) => {
        setExpandedEpics(prev => {
            const next = new Set(prev);
            if (next.has(epicId)) {
                next.delete(epicId);
            } else {
                next.add(epicId);
            }
            return next;
        });
    };

    const selectedTicket =
        project?.tickets.find(
            ticket => ticket.id === editingTicketId
        ) ?? null;

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setEditingTicketId(null);
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
    }, [selectedTicket, setEditingTicketId]);

    if (!project) {
        return null;
    }

    const unassignedTickets =
        project.tickets.filter(
            ticket => !ticket.epicId
        );

    return (
        <div className="backlog-page backlog-page--full">
            <section className="backlog-list-panel">
                <div className="backlog-header">
                    <div>
                        <div className="backlog-eyebrow">
                            Backlog
                        </div>
                        <h1 className="backlog-title">
                            {project.name}
                        </h1>
                        <div className="backlog-subtitle">
                            {project.epics.length} epics
                            {" "}
                            -
                            {" "}
                            {project.tickets.length} tickets
                        </div>
                    </div>

                    {/* <button
                        className="icon-button"
                        type="button"
                        aria-label="More actions"
                    >
                        ...
                    </button> */}
                </div>

                <div className="backlog-toolbar">
                    <button
                        type="button"
                        onClick={addEpic}
                    >
                        Add Epic
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            addTicket()
                        }
                    >
                        Add Ticket
                    </button>
                </div>

                <div className="backlog-scroll">
                    {project.epics.map(
                        epic => {
                            const epicTickets =
                                project.tickets.filter(
                                    ticket =>
                                        ticket.epicId ===
                                        epic.id
                                );

                            return (
                                <div
                                    key={epic.id}
                                    className="backlog-epic-group"
                                >
                                    <EpicCard
                                        epic={epic}
                                        expanded={expandedEpics.has(epic.id)}
                                        onToggle={() => toggleEpic(epic.id)}
                                    />

                                    {expandedEpics.has(epic.id) && (
                                        <div className="backlog-ticket-list">
                                            {epicTickets.map(
                                                ticket => (
                                                    <TicketCard
                                                        key={ticket.id}
                                                        ticket={ticket}
                                                        selected={
                                                            ticket.id ===
                                                            editingTicketId
                                                        }
                                                        onSelect={() =>
                                                            setEditingTicketId(
                                                                ticket.id
                                                            )
                                                        }
                                                    />
                                                )
                                            )}

                                            <AddTicketCard
                                                onClick={() =>
                                                    addTicket(
                                                        epic.id
                                                    )
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        }
                    )}

                    <div className="backlog-unassigned">
                        <div className="backlog-section-label">
                            Unassigned Tickets
                        </div>

                        {unassignedTickets.map(
                            ticket => (
                                <TicketCard
                                    key={ticket.id}
                                    ticket={ticket}
                                    selected={
                                        ticket.id ===
                                        editingTicketId
                                    }
                                    onSelect={() =>
                                        setEditingTicketId(
                                            ticket.id
                                        )
                                    }
                                />
                            )
                        )}

                        <AddTicketCard
                            onClick={() =>
                                addTicket()
                            }
                        />
                    </div>
                </div>
            </section>

            {selectedTicket && (
                <div
                    className="ticket-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Ticket details"
                    onClick={() =>
                        setEditingTicketId(null)
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
                                setEditingTicketId(null)
                            }
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
