import { type Sprint } from "../models/Sprint";
import { type Ticket } from "../models/Ticket";
import TicketCard from "../components/TicketCard";
import FormField from "../components/FormField";

interface SprintManagerProps {
    project: {
        name: string;
        sprints: Sprint[];
    };
    selectedSprint: Sprint | null;
    selectedSprintId: string | null;
    selectedSprintTicketId: string | null;
    selectedBacklogTicketId: string | null;
    selectedSprintTickets: Ticket[];
    formatDateRange: (startDate: string | null, endDate: string | null) => string;
    onCreateSprint: () => void;
    onSelectSprint: (sprintId: string | null) => void;
    onToggleSprint: () => void;
    onDeleteSprint: () => void;
    onAddSelectedTicket: () => void;
    onRemoveSelectedTicket: () => void;
    onSelectSprintTicket: (ticketId: string | null) => void;
    onUpdateSprint: (
        sprintId: string,
        updates: Partial<Sprint>
    ) => void;
}

export default function SprintManager({
    project,
    selectedSprint,
    selectedSprintId,
    selectedSprintTicketId,
    selectedBacklogTicketId,
    selectedSprintTickets,
    formatDateRange,
    onCreateSprint,
    onSelectSprint,
    onToggleSprint,
    onDeleteSprint,
    onAddSelectedTicket,
    onRemoveSelectedTicket,
    onSelectSprintTicket,
    onUpdateSprint,
}: SprintManagerProps) {
    return (
        <aside className="sprint-manager-panel">
            <div className="sprint-manager__header">
                <div>
                    <div className="backlog-eyebrow">
                        Sprint Manager
                    </div>
                    <h2 className="sprint-manager__title">
                        Plan the active sprint
                    </h2>
                </div>
            </div>

            <div className="sprint-manager__section">
                <div className="sprint-manager__create-row">
                    <label className="sprint-manager__field sprint-manager__field--grow">
                        <span>Selected sprint</span>
                        <select
                            value={selectedSprintId ?? ""}
                            onChange={e =>
                                onSelectSprint(
                                    e.target.value || null
                                )
                            }
                        >
                            <option value="">
                                Select a sprint
                            </option>

                            {project.sprints.map(
                                sprint => (
                                    <option
                                        key={sprint.id}
                                        value={sprint.id}
                                    >
                                        {sprint.title}
                                        {sprint.archived
                                            ? " (Archived)"
                                            : ""}
                                        {sprint.active
                                            ? " (Active)"
                                            : ""}
                                    </option>
                                )
                            )}
                        </select>
                    </label>

                    <button
                        type="button"
                        className="sprint-manager__create-button"
                        onClick={onCreateSprint}
                    >
                        Create Sprint
                    </button>
                </div>
            </div>

            {selectedSprint ? (
                <div className="sprint-manager__selected">
                    <div className="sprint-manager__status-row">
                        <span
                            className={`sprint-status-badge${selectedSprint.active ? " sprint-status-badge--active" : ""}`}
                        >
                            {selectedSprint.archived
                                ? "Archived"
                                : selectedSprint.active
                                    ? "Active"
                                    : "Planned"}
                        </span>
                        {(selectedSprint.active ||
                            selectedSprint.archived) && (
                            <span className="sprint-manager__range">
                                {formatDateRange(
                                    selectedSprint.startDate,
                                    selectedSprint.endDate
                                )}
                            </span>
                        )}
                    </div>

                    <FormField
                        label="Title"
                        helpText="Give the sprint a clear name."
                    >
                        <input
                            value={selectedSprint.title}
                            onChange={e =>
                                onUpdateSprint(
                                    selectedSprint.id,
                                    {
                                        title:
                                            e.target.value,
                                    }
                                )
                            }
                        />
                    </FormField>

                    <FormField
                        label="Duration"
                        helpText="Choose a 1-4 week sprint length."
                    >
                        <select
                            value={selectedSprint.durationWeeks}
                            onChange={e =>
                                onUpdateSprint(
                                    selectedSprint.id,
                                    {
                                        durationWeeks:
                                            Number(
                                                e.target.value
                                            ) as Sprint["durationWeeks"],
                                    }
                                )
                            }
                        >
                            <option value={1}>
                                1 week
                            </option>
                            <option value={2}>
                                2 weeks
                            </option>
                            <option value={3}>
                                3 weeks
                            </option>
                            <option value={4}>
                                4 weeks
                            </option>
                        </select>
                    </FormField>

                    <div className="sprint-manager__actions">
                        {!selectedSprint.archived && (
                            <button
                                type="button"
                                onClick={onToggleSprint}
                            >
                                {selectedSprint.active
                                    ? "End Sprint"
                                    : "Start Sprint"}
                            </button>
                        )}

                        {!selectedSprint.archived && (
                            <>
                                <button
                                    type="button"
                                    disabled={
                                        !selectedSprint ||
                                        !selectedBacklogTicketId
                                    }
                                    onClick={
                                        onAddSelectedTicket
                                    }
                                >
                                    Add Selected Ticket
                                </button>

                                <button
                                    type="button"
                                    disabled={
                                        !selectedSprint ||
                                        !selectedSprintTicketId
                                    }
                                    onClick={
                                        onRemoveSelectedTicket
                                    }
                                >
                                    Remove Selected Ticket
                                </button>
                            </>
                        )}

                        <button
                            type="button"
                            className="ticket-detail__danger"
                            onClick={onDeleteSprint}
                        >
                            Delete Sprint
                        </button>
                    </div>

                    <div className="sprint-ticket-column">
                        <div className="sprint-ticket-column__header">
                            Tickets in Sprint
                            <span>
                                {selectedSprintTickets.length}
                            </span>
                        </div>

                        <div className="sprint-ticket-scroll">
                            {selectedSprintTickets.map(
                                ticket => (
                                    <TicketCard
                                        key={ticket.id}
                                        ticket={ticket}
                                        selected={
                                            ticket.id ===
                                            selectedSprintTicketId
                                        }
                                        onSelect={() => {
                                            onSelectSprintTicket(
                                                ticket.id
                                            );
                                        }}
                                    />
                                )
                            )}

                            {!selectedSprintTickets.length && (
                                <div className="sprint-empty-state">
                                    No tickets in this sprint yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="sprint-empty-state sprint-empty-state--panel sprint-manager__instructions">
                    <div className="backlog-detail-empty__eyebrow">
                        Sprint instructions
                    </div>
                    <h3>Pick or create a sprint</h3>
                    <p>
                        Use the sprint dropdown to open an existing sprint, or create a new one to start planning work.
                    </p>
                    <p>
                        Once a sprint is selected, tickets from the backlog on the left can be added into the sprint column on the right.
                    </p>
                </div>
            )}
        </aside>
    );
}
