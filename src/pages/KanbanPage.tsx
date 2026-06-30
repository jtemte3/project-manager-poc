import { useEffect, useState, useCallback, useMemo } from "react";

import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    type DragEndEvent,
} from "@dnd-kit/core";

import TicketCard from "../components/TicketCard";
import TicketEditor from "../components/TicketEditor";
import KanbanLane from "../components/KanbanLane";

import { useProject } from "../hooks/useProject";
import { type Ticket } from "../models/Ticket";
import { type Board } from "../models/Board";
import { buildBoardFromTickets } from "../utils/buildBoardFromTickets";

import { DND_DELAY_MS, DND_TOLERANCE_PX } from "../utils/dndConstants";

function formatDate(date: string | null | undefined) {
    return date ?? "—";
}

function sumComplexity(tickets: Array<{ complexity: number }>) {
    return tickets.reduce((sum, t) => sum + t.complexity, 0);
}

export default function KanbanPage() {
    const { project, updateTicket } = useProject();

    const [selectedTicketId, setSelectedTicketId] =
        useState<string | null>(null);

    const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

    const [board, setBoard] = useState<Board | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                delay: DND_DELAY_MS,
                tolerance: DND_TOLERANCE_PX,
            },
        })
    );

    function isDefined<T>(value: T | undefined | null): value is T {
        return value != null;
    }

    const activeSprint =
        project?.sprints.find(
            s => s.active && !s.archived
        ) ?? null;

    const activeSprintTickets =
        project && activeSprint
            ? project.tickets.filter(
                t =>
                    t.sprintId === activeSprint.id ||
                    activeSprint.ticketIds.includes(t.id)
            )
            : [];

    // -------------------------
    // Build board from tickets
    // -------------------------
    useEffect(() => {
        if (!activeSprint) return;

        setBoard(prev => {
            return buildBoardFromTickets(
                activeSprintTickets
            );
        });
    }, [activeSprint?.id]);

    // -------------------------
    // Ticket lookup
    // -------------------------
    const ticketById = useMemo(() => {
        const map = new Map<string, Ticket>();
        for (const t of activeSprintTickets) {
            map.set(t.id, t);
        }
        return map;
    }, [activeSprintTickets]);

    // -------------------------
    // Derived lanes (ORDERED by board)
    // -------------------------
    const todoTickets =
        board?.laneOrder.todo
            .map(id => ticketById.get(id))
            .filter(isDefined) ?? [];

    const inProgressTickets =
        board?.laneOrder.inProgress
            .map(id => ticketById.get(id))
            .filter(isDefined) ?? [];

    const doneTickets =
        board?.laneOrder.done
            .map(id => ticketById.get(id))
            .filter(isDefined) ?? [];

    // -------------------------
    // Selection reset
    // -------------------------
    useEffect(() => {
        setSelectedTicketId(null);
    }, [activeSprint?.id]);

    // -------------------------
    // Drag start
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

    // -------------------------
    // Drag end (ONLY reorder within lane)
    // -------------------------
    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;

            setActiveTicket(null);

            if (!over || !board) return;

            const activeId = active.id as string;
            const overId = over.id as string;

            const findLane = (id: string) => {
                if (board.laneOrder.todo.includes(id)) return "todo";
                if (board.laneOrder.inProgress.includes(id)) return "inProgress";
                if (board.laneOrder.done.includes(id)) return "done";
                return null;
            };

            const lane = findLane(activeId);
            if (!lane) return;

            const items = board.laneOrder[lane];

            const oldIndex = items.indexOf(activeId);
            const newIndex = items.indexOf(overId);

            if (oldIndex === -1 || newIndex === -1) return;

            const newItems = [...items];
            const [moved] = newItems.splice(oldIndex, 1);
            newItems.splice(newIndex, 0, moved);

            setBoard({
                ...board,
                laneOrder: {
                    ...board.laneOrder,
                    [lane]: newItems,
                },
            });
        },
        [board]
    );

    const handleDragCancel = useCallback(() => {
        setActiveTicket(null);
    }, []);

    if (!project || !board) return null;

    const ticketCount = activeSprintTickets.length;

    const completedTickets = doneTickets.length;

    const totalComplexity =
        sumComplexity(activeSprintTickets);

    const doneComplexity =
        sumComplexity(
            doneTickets as unknown as any[]
        );

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="kanban-page">
                <header className="kanban-summary">
                    <h1>
                        {activeSprint?.title ?? "No Sprint Active"}
                    </h1>

                    <div className="kanban-metrics">
                        <div>Tickets: {ticketCount}</div>
                        <div>Done: {completedTickets}</div>
                        <div>Complexity: {totalComplexity}</div>
                        <div>
                            Done Complexity: {doneComplexity}
                        </div>
                    </div>
                </header>

                {selectedTicketId && (
                    <TicketEditor
                        ticket={
                            project.tickets.find(
                                t => t.id === selectedTicketId
                            )!
                        }
                        onClose={() =>
                            setSelectedTicketId(null)
                        }
                    />
                )}

                <section className="kanban-board">
                    <KanbanLane
                        title="To Do"
                        tickets={todoTickets}
                        selectedTicketId={selectedTicketId}
                        onSelectTicket={setSelectedTicketId}
                    />

                    <KanbanLane
                        title="In Progress"
                        tickets={inProgressTickets}
                        selectedTicketId={selectedTicketId}
                        onSelectTicket={setSelectedTicketId}
                    />

                    <KanbanLane
                        title="Done"
                        tickets={doneTickets}
                        selectedTicketId={selectedTicketId}
                        onSelectTicket={setSelectedTicketId}
                    />
                </section>
            </div>

            <DragOverlay>
                {activeTicket ? (
                    <TicketCard ticket={activeTicket} />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}