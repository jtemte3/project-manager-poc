import TicketCard from "../components/TicketCard";
import { type Epic } from "../models/Epic";
import { type Ticket } from "../models/Ticket";

interface BacklogGroup {
    epic: Epic;
    color: string;
    tickets: Ticket[];
}

interface SprintBacklogProps {
    projectName: string;
    backlogGroups: BacklogGroup[];
    unassignedTickets: Ticket[];
    selectedBacklogTicketId: string | null;
    selectedEpicId: string | null;
    expandedEpics: Set<string>;
    onToggleEpic: (epicId: string) => void;
    onSelectBacklogTicket: (ticketId: string | null) => void;
}

export default function SprintBacklog({
    projectName,
    backlogGroups,
    unassignedTickets,
    selectedBacklogTicketId,
    selectedEpicId,
    expandedEpics,
    onToggleEpic,
    onSelectBacklogTicket,
}: SprintBacklogProps) {
    return (
        <section className="sprint-list-panel">
            <div className="backlog-header">
                <div>
                    <div className="backlog-eyebrow">
                        Sprint Planning
                    </div>
                    <h1 className="backlog-title">
                        {projectName}
                    </h1>
                    <div className="backlog-subtitle">
                        Select backlog tickets and move them into a sprint.
                    </div>
                </div>
            </div>

            <div className="backlog-scroll">
                <div className="backlog-section-label">
                    Backlog
                </div>

                {backlogGroups.map(
                    ({ epic, color, tickets }) => (
                        <div
                            key={epic.id}
                            className="backlog-epic-group"
                        >
                            <button
                                type="button"
                                className={`sprint-epic-header${epic.id === selectedEpicId ? " sprint-epic-header--selected" : ""}`}
                                onClick={() => {
                                    onToggleEpic(epic.id);
                                }}
                            >
                                <span
                                    className="sprint-epic-swatch"
                                    style={{
                                        backgroundColor: color,
                                    }}
                                />
                                <div>
                                    <div className="sprint-epic-title">
                                        {epic.name}
                                    </div>
                                    <div className="sprint-epic-meta">
                                        {tickets.length} tickets
                                    </div>
                                </div>
                            </button>

                            {expandedEpics.has(epic.id) && (
                                <div className="backlog-ticket-list">
                                    {tickets.map(
                                        ticket => (
                                            <TicketCard
                                                key={ticket.id}
                                                ticket={ticket}
                                                selected={
                                                    ticket.id ===
                                                    selectedBacklogTicketId
                                                }
                                                onSelect={() => {
                                                    onSelectBacklogTicket(
                                                        ticket.id
                                                    );
                                                }}
                                            />
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    )
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
                                    selectedBacklogTicketId
                                }
                                onSelect={() => {
                                    onSelectBacklogTicket(
                                        ticket.id
                                    );
                                }}
                            />
                        )
                    )}

                    {!unassignedTickets.length &&
                        !backlogGroups.some(
                            group =>
                                group.tickets.length
                        ) && (
                            <div className="sprint-empty-state">
                                All tickets are already in the selected sprint.
                            </div>
                        )}
                </div>
            </div>
        </section>
    );
}
