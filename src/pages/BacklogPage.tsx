import { useEffect, useState, useCallback } from "react";

import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    useDndContext,
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
 * Wrapper component that provides the active ticket ID to the DragOverlay.
 * This is needed because useDndContext must be used within a DndContext.
 */
function EpicTicketListWithOverlay({
    epicTickets,
    ticketIds,
    editingTicketId,
    setEditingTicketId,
    setActiveTicketId,
}: {
    epicTickets: Ticket[];
    ticketIds: string[];
    editingTicketId: string | null;
    setEditingTicketId: (id: string | null) => void;
    setActiveTicketId: (id: string | null) => void;
}) {
    const activeTicketId = useActiveTicket(ticketIds);

    useEffect(() => {
        setActiveTicketId(activeTicketId);
    }, [activeTicketId, setActiveTicketId]);

    return (
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
    } = useProject();

    const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
    const [editingEpicId, setEditingEpicId] = useState<string | null>(null);
    const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

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

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setEditingTicketId(null);
                setEditingEpicId(null);
            }
        }

        if (selectedTicket || editingEpic) {
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
    }, [selectedTicket, editingEpic, setEditingTicketId]);

    // -------------------------
    // Drag and Drop Handlers
    // -------------------------

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;

            if (!over || !project) {
                return;
            }

            const activeId = active.id as string;
            const overId = over.id as string;

            // Find the ticket that was dragged
            const activeTicket = project.tickets.find(
                t => t.id === activeId
            );

            if (!activeTicket) {
                return;
            }

            // Find the epic that contains the drop target ticket
            const overTicket = project.tickets.find(
                t => t.id === overId
            );

            if (!overTicket || !overTicket.epicId) {
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
        [project, moveTicketToEpicAtPosition]
    );

    if (!project) {
        return null;
    }

    const unassignedTickets =
        project.tickets.filter(
            ticket => !ticket.epicId
        );

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
                                        <EpicCard
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
                                                    epicTickets={epicTickets}
                                                    ticketIds={epic.ticketIds}
                                                    editingTicketId={editingTicketId}
                                                    setEditingTicketId={setEditingTicketId}
                                                    setActiveTicketId={setActiveTicketId}
                                                />

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

            {/* DragOverlay shows the ticket while it's being dragged */}
            <DragOverlay>
                {activeTicket ? (
                    <TicketCard ticket={activeTicket} />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
