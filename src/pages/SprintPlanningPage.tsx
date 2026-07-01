import { useEffect, useState, useCallback } from "react";

import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    type DragEndEvent,
} from "@dnd-kit/core";

import SprintBacklog from "../modules/SprintBacklog";
import SprintManager from "../modules/SprintManager";
import { useProject } from "../hooks/useProject";
import { getEpicColor } from "../utils/getEpicColor";
import { type Ticket } from "../models/Ticket";
import TicketCard from "../components/TicketCard";
import { DND_DELAY_MS, DND_TOLERANCE_PX } from "../utils/dndConstants";

function formatDateRange(
    startDate: string | null,
    endDate: string | null
) {
    if (!startDate || !endDate) {
        return "Not started";
    }

    return `${startDate} to ${endDate}`;
}

/**
 * Special drop ID indicating the ticket was dropped outside of any valid target
 * (e.g., dropped back into the backlog area).
 */
const BACKLOG_DROP_ID = "backlog-drop-zone";

export default function SprintPlanningPage() {
    const {
        project,
        addSprint,
        updateSprint,
        startSprint,
        endSprint,
        deleteSprint,
        assignTicketToSprint,
        assignTicketToSprintAtPosition,
        removeTicketFromSprint,
    } = useProject();

    const [selectedSprintId, setSelectedSprintId] =
        useState<string | null>(null);
    const [selectedBacklogTicketId, setSelectedBacklogTicketId] =
        useState<string | null>(null);
    const [selectedSprintTicketId, setSelectedSprintTicketId] =
        useState<string | null>(null);
    const [selectedEpicId, setSelectedEpicId] =
        useState<string | null>(null);
    const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());

    // Active ticket being dragged (for DragOverlay)
    const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

    // Dnd-kit sensors for drag activation constraints
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                delay: DND_DELAY_MS,
                tolerance: DND_TOLERANCE_PX,
            },
        })
    );

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
                    selectedSprint.ticketIds.includes(
                        ticket.id
                    )
            )
            : [];

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
            !selectedBacklogTicketId
        ) {
            return;
        }

        assignTicketToSprint(
            selectedBacklogTicketId,
            selectedSprint.id
        );
        setSelectedBacklogTicketId(null);
    }

    function handleRemoveSelectedTicket() {
        if (
            !selectedSprint ||
            selectedSprint.archived ||
            !selectedSprintTicketId
        ) {
            return;
        }

        removeTicketFromSprint(
            selectedSprintTicketId
        );
        setSelectedSprintTicketId(null);
    }

    function handleSelectBacklogTicket(ticketId: string | null) {
        setSelectedBacklogTicketId(ticketId);
        setSelectedSprintTicketId(null);
    }

    function handleSelectSprintTicket(ticketId: string | null) {
        setSelectedSprintTicketId(ticketId);
        setSelectedBacklogTicketId(null);
    }

    // -------------------------
    // Drag and Drop Handlers
    // -------------------------

    const handleDragStart = useCallback(
        (event: any) => {
            const id = event.active.id;

            const ticket = project?.tickets.find(
                t => t.id === id
            );

            setActiveTicket(ticket ?? null);
        },
        [project]
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;

            setActiveTicket(null);

            if (!over || !selectedSprint || selectedSprint.archived) {
                return;
            }

            const activeId = active.id as string;
            const overId = over.id as string;

            // Check if the active ticket is from the backlog or from the sprint
            const isFromSprint = selectedSprint.ticketIds.includes(activeId);

            // Case 1: Ticket dropped onto the backlog drop zone (remove from sprint)
            if (overId === BACKLOG_DROP_ID) {
                if (isFromSprint) {
                    removeTicketFromSprint(activeId);
                    setSelectedSprintTicketId(null);
                }
                return;
            }

            // Check if the drop target is within the sprint's ticket list
            const isOverSprintTicket = selectedSprint.ticketIds.includes(overId);

            // Case 2: Backlog ticket dropped into sprint onto another ticket (add at position)
            if (!isFromSprint && isOverSprintTicket) {
                const targetIndex = selectedSprint.ticketIds.indexOf(overId);
                assignTicketToSprintAtPosition(activeId, selectedSprint.id, targetIndex);
                return;
            }

            // Case 3: Backlog ticket dropped into empty sprint area (append to end)
            if (!isFromSprint && !isOverSprintTicket) {
                // The over target might be the sprint drop zone itself
                if (overId === "sprint-ticket-list") {
                    assignTicketToSprintAtPosition(
                        activeId,
                        selectedSprint.id,
                        selectedSprint.ticketIds.length
                    );
                }
                return;
            }

            // Case 4: Sprint ticket reordered within sprint
            if (isFromSprint && isOverSprintTicket) {
                const sourceIndex = selectedSprint.ticketIds.indexOf(activeId);
                const targetIndex = selectedSprint.ticketIds.indexOf(overId);

                if (sourceIndex === -1 || targetIndex === -1) {
                    return;
                }

                // Use assignTicketToSprintAtPosition to handle the reordering
                // This will remove from old position and insert at new position
                assignTicketToSprintAtPosition(activeId, selectedSprint.id, targetIndex);

                return;
            }

            // Case 5: Ticket dropped outside valid targets (no action needed)
        },
        [selectedSprint, assignTicketToSprintAtPosition, removeTicketFromSprint]
    );

    const handleDragCancel = useCallback(() => {
        setActiveTicket(null);
    }, []);

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="backlog-page sprint-page">
                <SprintBacklog
                    projectName={project.name}
                    backlogGroups={backlogGroups}
                    unassignedTickets={unassignedTickets}
                    selectedBacklogTicketId={selectedBacklogTicketId}
                    selectedEpicId={selectedEpicId}
                    expandedEpics={expandedEpics}
                    onToggleEpic={(epicId) => {
                        setSelectedEpicId(epicId);
                        toggleEpic(epicId);
                    }}
                    onSelectBacklogTicket={handleSelectBacklogTicket}
                />

                <SprintManager
                    project={project}
                    selectedSprint={selectedSprint}
                    selectedSprintId={selectedSprintId}
                    selectedSprintTicketId={selectedSprintTicketId}
                    selectedBacklogTicketId={selectedBacklogTicketId}
                    selectedSprintTickets={selectedSprintTickets}
                    formatDateRange={formatDateRange}
                    onCreateSprint={handleCreateSprint}
                    onSelectSprint={setSelectedSprintId}
                    onToggleSprint={handleSprintToggle}
                    onDeleteSprint={handleDeleteSprint}
                    onAddSelectedTicket={handleAddSelectedTicket}
                    onRemoveSelectedTicket={handleRemoveSelectedTicket}
                    onSelectSprintTicket={handleSelectSprintTicket}
                    onUpdateSprint={updateSprint}
                />
            </div>

            <DragOverlay>
                {activeTicket ? (
                    <TicketCard ticket={activeTicket} />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
