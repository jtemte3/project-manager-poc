import { useEffect, useState, useCallback } from "react";

import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    useDndContext,
    useDroppable,
    type DragEndEvent,
} from "@dnd-kit/core";

import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import TicketCard from "../components/TicketCard";
import EpicCard from "../components/EpicCard";
import AddTicketCard from "../components/AddTicketCard";
import TicketEditor from "../components/TicketEditor";
import EpicEditor from "../components/EpicEditor";
import SortableTicketCard from "../components/SortableTicketCard";
import SortableEpicCard from "../components/SortableEpicCard";
import { useProject } from "../hooks/useProject";
import { type Ticket } from "../models/Ticket";
import { DND_DELAY_MS, DND_TOLERANCE_PX } from "../utils/dndConstants";

/**
 * Hook to get the active draggable item from the DnD context.
 * Used by the DragOverlay to know what to render.
 */
function useActiveTicket(ticketIds: string[]) {
    const { active } = useDndContext();

    if (!active) {
        return null;
    }

    const isActiveInList = ticketIds.includes(active.id as string);

    return isActiveInList ? active.id as string : null;
}

/**
 * Drop target for the "Add Ticket" button area.
 * Allows dropping tickets into an epic even when it's empty.
 */
function EpicDropTarget({
    epicId,
    onDrop,
    children,
}: {
    epicId: string;
    onDrop: (epicId: string) => void;
    children: React.ReactNode;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: `epic-drop-${epicId}`,
    });

    return (
        <div
            ref={setNodeRef}
            className={`epic-drop-target${isOver ? " epic-drop-target--over" : ""}`}
        >
            {children}
        </div>
    );
}

/**
 * Drop target for the unassigned tickets section.
 * Allows dropping tickets from epics back to unassigned.
 */
function UnassignedDropTarget({
    onDrop,
    children,
}: {
    onDrop: () => void;
    children: React.ReactNode;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: "unassigned-drop",
    });

    return (
        <div
            ref={setNodeRef}
            className={`unassigned-drop-target${isOver ? " unassigned-drop-target--over" : ""}`}
        >
            {children}
        </div>
    );
}

/**
 * Wrapper component that provides the active ticket ID to the DragOverlay.
 * This is needed because useDndContext must be used within a DndContext.
 */
function EpicTicketListWithOverlay({
    epic,
    epicTickets,
    ticketIds,
    editingTicketId,
    setEditingTicketId,
    setActiveTicketId,
    onDropToEpic,
}: {
    epic: { id: string; name: string };
    epicTickets: Ticket[];
    ticketIds: string[];
    editingTicketId: string | null;
    setEditingTicketId: (id: string | null) => void;
    setActiveTicketId: (id: string | null) => void;
    onDropToEpic: (epicId: string) => void;
}) {
    const activeTicketId = useActiveTicket(ticketIds);

    useEffect(() => {
        setActiveTicketId(activeTicketId);
    }, [activeTicketId, setActiveTicketId]);

    return (
        <>
            <SortableContext
                items={ticketIds}
                strategy={verticalListSortingStrategy}
            >
                {epicTickets.map(ticket => (
                    <SortableTicketCard
                        key={ticket.id}
                        ticket={ticket}
                        selected={ticket.id === editingTicketId}
                        onSelect={() => setEditingTicketId(ticket.id)}
                    />
                ))}
            </SortableContext>

            {/* Drop target for adding tickets (works even when epic is empty) */}
            <EpicDropTarget epicId={epic.id} onDrop={onDropToEpic}>
                <AddTicketCard
                    onClick={() => onDropToEpic(epic.id)}
                />
            </EpicDropTarget>
        </>
    );
}

/**
 * Wrapper component for unassigned tickets that tracks the active ticket.
 */
function UnassignedTicketListWithOverlay({
    unassignedTickets,
    unassignedTicketIds,
    editingTicketId,
    setEditingTicketId,
    setActiveTicketId,
}: {
    unassignedTickets: Ticket[];
    unassignedTicketIds: string[];
    editingTicketId: string | null;
    setEditingTicketId: (id: string | null) => void;
    setActiveTicketId: (id: string | null) => void;
}) {
    const activeTicketId = useActiveTicket(unassignedTicketIds);

    useEffect(() => {
        setActiveTicketId(activeTicketId);
    }, [activeTicketId, setActiveTicketId]);

    return (
        <SortableContext
            items={unassignedTicketIds}
            strategy={verticalListSortingStrategy}
        >
            {unassignedTickets.map(ticket => (
                <SortableTicketCard
                    key={ticket.id}
                    ticket={ticket}
                    selected={ticket.id === editingTicketId}
                    onSelect={() => setEditingTicketId(ticket.id)}
                />
            ))}
        </SortableContext>
    );
}

/**
 * Wrapper component that tracks the active epic for the DragOverlay.
 */
function EpicListWithOverlay({
    epicIds,
    expandedEpics,
    toggleEpic,
    setEditingEpicId,
    setActiveEpicId,
    project,
    addTicket,
    editingTicketId,
    setEditingTicketId,
    setActiveTicketId,
}: {
    epicIds: string[];
    expandedEpics: Set<string>;
    toggleEpic: (epicId: string) => void;
    setEditingEpicId: (id: string | null) => void;
    setActiveEpicId: (id: string | null) => void;
    project: NonNullable<ReturnType<typeof useProject>["project"]>;
    addTicket: (epicId?: string) => void;
    editingTicketId: string | null;
    setEditingTicketId: (id: string | null) => void;
    setActiveTicketId: (id: string | null) => void;
}) {
    const { active } = useDndContext();

    useEffect(() => {
        if (!active) {
            setActiveEpicId(null);
            return;
        }

        const isActiveEpic = epicIds.includes(active.id as string);
        setActiveEpicId(isActiveEpic ? active.id as string : null);
    }, [active, epicIds, setActiveEpicId]);

    return (
        <SortableContext
            items={epicIds}
            strategy={verticalListSortingStrategy}
        >
            {project.epics.map(
                epic => {
                    // Get tickets ordered by the epic's ticketIds list
                    const epicTickets = epic.ticketIds
                        .map(ticketId =>
                            project.tickets.find(
                                t => t.id === ticketId
                            )
                        )
                        .filter((ticket): ticket is NonNullable<typeof ticket> => ticket !== undefined);

                    return (
                        <div
                            key={epic.id}
                            className="backlog-epic-group"
                        >
                            <SortableEpicCard
                                epic={epic}
                                expanded={expandedEpics.has(epic.id)}
                                onToggle={() => toggleEpic(epic.id)}
                                onSelect={() =>
                                    setEditingEpicId(
                                        epic.id
                                    )
                                }
                            />

                            {expandedEpics.has(epic.id) && (
                                <div className="backlog-ticket-list">
                                    <EpicTicketListWithOverlay
                                        epic={epic}
                                        epicTickets={epicTickets}
                                        ticketIds={epic.ticketIds}
                                        editingTicketId={editingTicketId}
                                        setEditingTicketId={setEditingTicketId}
                                        setActiveTicketId={setActiveTicketId}
                                        onDropToEpic={(epicId) => addTicket(epicId)}
                                    />
                                </div>
                            )}
                        </div>
                    );
                }
            )}
        </SortableContext>
    );
}

export default function BacklogPage() {
    const {
        project,
        addEpic,
        addTicket,
        editingTicketId,
        setEditingTicketId,
        reorderTicketInEpic,
        moveTicketToEpicAtPosition,
        reorderUnassignedTicket,
        reorderEpic,
    } = useProject();

    const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
    const [editingEpicId, setEditingEpicId] = useState<string | null>(null);
    const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
    const [activeEpicId, setActiveEpicId] = useState<string | null>(null);

    // Dnd-kit sensors for drag activation constraints
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                delay: DND_DELAY_MS,
                tolerance: DND_TOLERANCE_PX,
            },
        })
    );

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

    const editingEpic =
        project?.epics.find(
            epic => epic.id === editingEpicId
        ) ?? null;

    const activeTicket =
        activeTicketId
            ? project?.tickets.find(t => t.id === activeTicketId) ?? null
            : null;

    const activeEpic =
        activeEpicId
            ? project?.epics.find(e => e.id === activeEpicId) ?? null
            : null;

    // -------------------------
    // Drag and Drop Handlers
    // -------------------------

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;

            // Clear active IDs first to prevent stale references during re-render
            setActiveTicketId(null);
            setActiveEpicId(null);

            if (!over || !project) {
                return;
            }

            const activeId = active.id as string;
            const overId = over.id as string;

            // Check if an epic is being dragged
            const activeEpic = project.epics.find(e => e.id === activeId);
            if (activeEpic) {
                // Epic drag handling
                const overEpic = project.epics.find(e => e.id === overId);
                if (overEpic) {
                    const targetIndex = project.epics.indexOf(overEpic);
                    reorderEpic(activeId, targetIndex);
                }
                return;
            }

            // Find the ticket that was dragged
            const activeTicket = project.tickets.find(
                t => t.id === activeId
            );

            if (!activeTicket) {
                return;
            }

            // Check if dropped on an epic drop target (for empty epics)
            if (overId.startsWith("epic-drop-")) {
                const targetEpicId = overId.replace("epic-drop-", "");
                const targetEpic = project.epics.find(
                    e => e.id === targetEpicId
                );

                if (targetEpic) {
                    // Add to the end of the epic's ticket list
                    const targetIndex = targetEpic.ticketIds.length;
                    moveTicketToEpicAtPosition(activeId, targetEpicId, targetIndex);
                }
                return;
            }

            // Check if dropped on unassigned drop target
            if (overId === "unassigned-drop") {
                // Move ticket to unassigned (add to end of unassigned list)
                const targetIndex = project.unassignedTicketIds.length;
                
                // If the ticket is currently in an epic, we need to move it to unassigned
                if (activeTicket.epicId) {
                    // First remove from epic
                    moveTicketToEpicAtPosition(activeId, "", targetIndex);
                } else {
                    // Just reorder within unassigned
                    reorderUnassignedTicket(activeId, targetIndex);
                }
                return;
            }

            // Find the epic that contains the drop target ticket
            const overTicket = project.tickets.find(
                t => t.id === overId
            );

            if (!overTicket) {
                return;
            }

            // Check if the target ticket is unassigned
            if (!overTicket.epicId) {
                // Dropping onto an unassigned ticket
                const targetIndex = project.unassignedTicketIds.indexOf(overId);
                
                if (activeTicket.epicId) {
                    // Moving from epic to unassigned
                    moveTicketToEpicAtPosition(activeId, "", targetIndex);
                } else {
                    // Reordering within unassigned
                    reorderUnassignedTicket(activeId, targetIndex);
                }
                return;
            }

            const targetEpicId = overTicket.epicId;

            // Find the target epic to get the position
            const targetEpic = project.epics.find(
                e => e.id === targetEpicId
            );

            if (!targetEpic) {
                return;
            }

            const targetIndex = targetEpic.ticketIds.indexOf(overId);

            // Use the atomic moveTicketToEpicAtPosition function which handles:
            // - Moving from one epic to another
            // - Moving from unassigned to an epic
            // - Reordering within the same epic
            moveTicketToEpicAtPosition(activeId, targetEpicId, targetIndex);
        },
        [project, moveTicketToEpicAtPosition, reorderUnassignedTicket, reorderEpic]
    );

    if (!project) {
        return null;
    }

    // Get unassigned tickets ordered by unassignedTicketIds
    const unassignedTickets = project.unassignedTicketIds
        .map(ticketId =>
            project.tickets.find(t => t.id === ticketId)
        )
        .filter((ticket): ticket is NonNullable<typeof ticket> => ticket !== undefined);

    const epicIds = project.epics.map(epic => epic.id);

    return (
        <DndContext
            sensors={sensors}
            onDragEnd={handleDragEnd}
        >
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
                        <EpicListWithOverlay
                            epicIds={epicIds}
                            expandedEpics={expandedEpics}
                            toggleEpic={toggleEpic}
                            setEditingEpicId={setEditingEpicId}
                            setActiveEpicId={setActiveEpicId}
                            project={project}
                            addTicket={addTicket}
                            editingTicketId={editingTicketId}
                            setEditingTicketId={setEditingTicketId}
                            setActiveTicketId={setActiveTicketId}
                        />

                        <UnassignedDropTarget onDrop={() => {}}>
                            <div className="backlog-unassigned">
                                <div className="backlog-section-label">
                                    Unassigned Tickets
                                </div>

                                <UnassignedTicketListWithOverlay
                                    unassignedTickets={unassignedTickets}
                                    unassignedTicketIds={project.unassignedTicketIds}
                                    editingTicketId={editingTicketId}
                                    setEditingTicketId={setEditingTicketId}
                                    setActiveTicketId={setActiveTicketId}
                                />

                                <AddTicketCard
                                    onClick={() =>
                                        addTicket()
                                    }
                                />
                            </div>
                        </UnassignedDropTarget>
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

                {editingEpic && (
                    <div
                        className="epic-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Epic details"
                        onClick={() =>
                            setEditingEpicId(null)
                        }
                    >
                        <div
                            className="epic-modal__surface"
                            onClick={event =>
                                event.stopPropagation()
                            }
                        >
                            <EpicEditor
                                epic={editingEpic}
                                onClose={() =>
                                    setEditingEpicId(null)
                                }
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* DragOverlay shows the ticket or epic while it's being dragged */}
            <DragOverlay>
                {activeTicket ? (
                    <TicketCard ticket={activeTicket} />
                ) : activeEpic ? (
                    <EpicCard
                        epic={activeEpic}
                        expanded={expandedEpics.has(activeEpic.id)}
                        onToggle={() => {}}
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
