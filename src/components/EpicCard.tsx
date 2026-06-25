import { type Epic } from "../models/Epic";

import { useProject } from "../hooks/useProject";

interface Props {
    epic: Epic;
    expanded: boolean;
    onToggle: () => void;
    onSelect?: () => void;
}

export default function EpicCard({
    epic,
    expanded,
    onToggle,
    onSelect,
}: Props) {
    const { project } =
        useProject();

    const epicTickets =
        project?.tickets.filter(
            ticket => ticket.epicId === epic.id
        ) ?? [];

    const ticketCount = epicTickets.length;

    const totalComplexity = epicTickets.reduce(
        (sum, ticket) => sum + ticket.complexity,
        0
    );

    const doneTickets = epicTickets.filter(
        ticket => ticket.status === "Done"
    );

    const doneComplexity = doneTickets.reduce(
        (sum, ticket) => sum + ticket.complexity,
        0
    );

    const ticketCompletion =
        ticketCount > 0
            ? Math.round((doneTickets.length / ticketCount) * 100)
            : 0;

    const complexityCompletion =
        totalComplexity > 0
            ? Math.round((doneComplexity / totalComplexity) * 100)
            : 0;

    return (
        <div
            className="epic-card"
            style={{
                borderLeftColor: epic.color,
            }}
        >
            <div
                className="epic-card__header"
                onClick={onToggle}
                style={{ cursor: "pointer" }}
            >
                <div>
                    <span className="epic-card__eyebrow">
                        Epic
                    </span>
                    <span style={{marginLeft:"8px"}} className="epic-card__meta">
                        Tickets: {ticketCount} 
                    </span>
                    <span style={{marginLeft:"8px"}} className="epic-card__meta">
                        Complexity: {totalComplexity}
                    </span>
                    <span style={{marginLeft:"8px", paddingLeft:"8px", borderLeft:"1px solid #e4e8f2"}} className="epic-card__meta">
                        <b>Percent Complete:</b>
                    </span>
                    <span style={{marginLeft:"8px"}} className="epic-card__meta">
                        Tickets: {ticketCompletion}% 
                    </span>
                    <span style={{marginLeft:"8px"}} className="epic-card__meta">
                        Complexity: {complexityCompletion}% 
                    </span>
                    <h2 className="epic-card__title">
                        {epic.name}
                    </h2>
                </div>

                <div className="epic-card__actions">
                    {onSelect && (
                        <button
                            type="button"
                            onClick={event => {
                                event.stopPropagation();
                                onSelect();
                            }}
                        >
                            Edit
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
