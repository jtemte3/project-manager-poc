import { useEffect, useState } from "react";

import TicketCard from "../components/TicketCard";
import FormField from "../components/FormField";
import { useProject } from "../hooks/useProject";
import { getEpicColor } from "../utils/getEpicColor";
import { type Sprint } from "../models/Sprint";

function formatDateRange(
    startDate: string | null,
    endDate: string | null
) {
    if (!startDate || !endDate) {
        return "Not started";
    }

    return `${startDate} to ${endDate}`;
}

export default function SprintPlanningPage() {
    const {
        project,
        addSprint,
        updateSprint,
        startSprint,
        endSprint,
        deleteSprint,
        assignTicketToSprint,
        removeTicketFromSprint,
    } = useProject();

    const [selectedSprintId, setSelectedSprintId] =
        useState<string | null>(null);
    const [selectedBacklogTicketId, setSelectedBacklogTicketId] =
        useState<string | null>(null);
    const [selectedSprintTicketId, setSelectedSprintTicketId] =
        useState<string | null>(null);

    useEffect(() => {
        if (!project) {
            return;
        }

        if (!project.sprints.length) {
            setSelectedSprintId(null);
            return;
        }

        if (selectedSprintId === null) {
            return;
        }

        const sprintExists =
            project.sprints.some(
                sprint =>
                    sprint.id === selectedSprintId
            );

        if (!sprintExists) {
            setSelectedSprintId(
                project.sprints.find(
                    sprint => sprint.active
                )?.id ?? null
            );
        }
    }, [project, selectedSprintId]);

    useEffect(() => {
        setSelectedBacklogTicketId(null);
        setSelectedSprintTicketId(null);
    }, [selectedSprintId]);

    if (!project) {
        return null;
    }

    const selectedSprint =
        selectedSprintId
            ? project.sprints.find(
                sprint =>
                    sprint.id === selectedSprintId
            ) ?? null
            : null;

    const visibleBacklogTickets =
        selectedSprint
            ? project.tickets.filter(
                ticket =>
                    ticket.status !== "Done" &&
                    ticket.sprintId !==
                        selectedSprint.id &&
                    !selectedSprint.ticketIds.includes(
                        ticket.id
                    )
            )
            : project.tickets.filter(
                ticket => ticket.status !== "Done"
            );

    const selectedSprintTickets =
        selectedSprint
            ? project.tickets.filter(
                ticket =>
                    ticket.sprintId ===
                        selectedSprint.id ||
                    selectedSprint.ticketIds.includes(
                        ticket.id
                    )
            )
            : [];

    const selectedBacklogTicket =
        project.tickets.find(
            ticket =>
                ticket.id ===
                selectedBacklogTicketId
        ) ?? null;

    const selectedSprintTicket =
        project.tickets.find(
            ticket =>
                ticket.id ===
                selectedSprintTicketId
        ) ?? null;

    const backlogGroups = project.epics.map(
        epic => ({
            epic,
            color: getEpicColor(project, epic.id),
            tickets: visibleBacklogTickets.filter(
                ticket =>
                    ticket.epicId === epic.id
            ),
        })
    );

    const unassignedTickets =
        visibleBacklogTickets.filter(
            ticket =>
                !ticket.epicId
        );

    function handleCreateSprint() {
        if (!project) {
            return;
        }

        const title =
            `New Sprint ${project.sprints.length + 1}`;

        const sprintId = addSprint(
            title,
            2
        );

        setSelectedSprintId(sprintId);
    }

    function handleSprintToggle() {
        if (!selectedSprint) {
            return;
        }

        if (selectedSprint.active) {
            endSprint(selectedSprint.id);
            return;
        }

        startSprint(selectedSprint.id);
    }

    function handleDeleteSprint() {
        if (!selectedSprint) {
            return;
        }

        deleteSprint(selectedSprint.id);
        setSelectedSprintId(null);
        setSelectedBacklogTicketId(null);
        setSelectedSprintTicketId(null);
    }

    function handleAddSelectedTicket() {
        if (
            !selectedSprint ||
            selectedSprint.archived ||
            !selectedBacklogTicket
        ) {
            return;
        }

        assignTicketToSprint(
            selectedBacklogTicket.id,
            selectedSprint.id
        );
        setSelectedBacklogTicketId(null);
    }

    function handleRemoveSelectedTicket() {
        if (
            !selectedSprint ||
            selectedSprint.archived ||
            !selectedSprintTicket
        ) {
            return;
        }

        removeTicketFromSprint(
            selectedSprintTicket.id
        );
        setSelectedSprintTicketId(null);
    }

    return (
        <div className="backlog-page sprint-page">
            <section className="sprint-list-panel">
                <div className="backlog-header">
                    <div>
                        <div className="backlog-eyebrow">
                            Sprint Planning
                        </div>
                        <h1 className="backlog-title">
                            {project.name}
                        </h1>
                        <div className="backlog-subtitle">
                            Select backlog tickets and move them into a sprint.
                        </div>
                    </div>

                    <button
                        className="icon-button"
                        type="button"
                        aria-label="More actions"
                    >
                        ...
                    </button>
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
                                <div className="sprint-epic-header">
                                    <span
                                        className="sprint-epic-swatch"
                                        style={{
                                            backgroundColor:
                                                color,
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
                                </div>

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
                                                    setSelectedBacklogTicketId(
                                                        ticket.id
                                                    );
                                                    setSelectedSprintTicketId(
                                                        null
                                                    );
                                                }}
                                            />
                                        )
                                    )}
                                </div>
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
                                        setSelectedBacklogTicketId(
                                            ticket.id
                                        );
                                        setSelectedSprintTicketId(
                                            null
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
                                    setSelectedSprintId(
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
                            onClick={handleCreateSprint}
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
                                    updateSprint(
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
                                    updateSprint(
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
                                    onClick={handleSprintToggle}
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
                                            !selectedBacklogTicket
                                        }
                                        onClick={
                                            handleAddSelectedTicket
                                        }
                                    >
                                        Add Selected Ticket
                                    </button>

                                    <button
                                        type="button"
                                        disabled={
                                            !selectedSprint ||
                                            !selectedSprintTicket
                                        }
                                        onClick={
                                            handleRemoveSelectedTicket
                                        }
                                    >
                                        Remove Selected Ticket
                                    </button>
                                </>
                            )}

                            <button
                                type="button"
                                className="ticket-detail__danger"
                                onClick={handleDeleteSprint}
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
                                                setSelectedSprintTicketId(
                                                    ticket.id
                                                );
                                                setSelectedBacklogTicketId(
                                                    null
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
        </div>
    );
}
