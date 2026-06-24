import { type Ticket } from "../models/Ticket";

import { useProject } from "../hooks/useProject";
import { getEpicColor } from "../utils/getEpicColor";

interface TicketCardProps {
    ticket: Ticket;
    selected?: boolean;
    onSelect?: () => void;
}

export default function TicketCard({
    ticket,
    selected = false,
    onSelect,
}: TicketCardProps) {
    const { project } = useProject();

    if (!project) {
        return null;
    }

    const epicColor = getEpicColor(
        project,
        ticket.epicId
    );

    const epic = project.epics.find(
        item => item.id === ticket.epicId
    );

    const statusLabel = {
        Backlog: "Backlog",
        Todo: "To Do",
        InProgress: "In Progress",
        Done: "Done",
    }[ticket.status];

    return (
        <button
            type="button"
            className={`ticket-row${selected ? " ticket-row--selected" : ""}`}
            onClick={onSelect}
            aria-pressed={selected}
            style={{
                borderLeft: `6px solid ${epicColor}`,
            }}
        >
            <div className="ticket-row__left">
                <div className="ticket-row__title">
                    {ticket.title || "Untitled Ticket"}
                </div>

                {ticket.description && (
                    <div className="ticket-row__description">
                        {ticket.description}
                    </div>
                )}
            </div>

            <div className="ticket-row__meta">
                <span
                    className="ticket-row__chip"
                    style={{
                        backgroundColor: `${epicColor}1A`,
                        color: epicColor,
                    }}
                >
                    {epic?.name ?? "Unassigned"}
                </span>

                <span className="ticket-row__chip ticket-row__chip--muted">
                    C {ticket.complexity}
                </span>

                <span className="ticket-row__status">
                    {statusLabel}
                </span>
            </div>
        </button>
    );
}
