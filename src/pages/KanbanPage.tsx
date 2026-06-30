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
import KanbanLane, { type LaneId } from "../components/KanbanLane";

import { useProject } from "../hooks/useProject";
import { type Ticket } from "../models/Ticket";
import { type Board } from "../models/Board";
import { buildBoardFromTickets } from "../utils/buildBoardFromTickets";

import { DND_DELAY_MS, DND_TOLERANCE_PX } from "../utils/dndConstants";

const LANE_IDS = ["todo", "inProgress", "done"] as const;

const LANE_TO_STATUS: Record<LaneId, Ticket["status"]> = {
    todo: "Todo",
    inProgress: "InProgress",
    done: "Done",
};

const STATUS_TO_LANE: Record<Ticket["status"], LaneId> = {
    Backlog: "todo",
    Todo: "todo",
    InProgress: "inProgress",
    Done: "done",
};

function isDefined<T>(value: T | undefined | null): value is T {
    return value != null;
}

function sumComplexity(tickets: Array<{ complexity: number }>) {
    return tickets.reduce((sum, t) => sum + t.complexity, 0);
}

/**
 * Rebuild board from current sprint tickets.
 * Lane assignment comes from ticket status.
 * Within-lane order is preserved from the persisted board.
 */
function rebuildBoard(
    sprintTickets: Ticket[],
    persistedBoard: Board | undefined
): Board {
    if (!persistedBoard) {
        return buildBoardFromTickets(sprintTickets);
    }

    // Build a combined ordering from persisted board lanes
    const persistedOrder = [
        ...persistedBoard.laneOrder.todo,
        ...persistedBoard.laneOrder.inProgress,
        ...persistedBoard.laneOrder.done,
    ];

    const todo: string[] = [];
    const inProgress: string[] = [];
    const done: string[] = [];

    for (const ticket of sprintTickets) {
        const lane = STATUS_TO_LANE[ticket.status] ?? "todo";

        if (lane === "todo") todo.push(ticket.id);
        else if (lane === "inProgress") inProgress.push(ticket.id);
        else done.push(ticket.id);
    }

    // Sort each lane by persisted order (stable — new tickets end last)
    const sortByPersisted = (a: string, b: string) =>
        persistedOrder.indexOf(a) - persistedOrder.indexOf(b);

    todo.sort(sortByPersisted);
    inProgress.sort(sortByPersisted);
    done.sort(sortByPersisted);

    return {
        laneOrder: { todo, inProgress, done },
    };
}

export default function KanbanPage() {
    const { project, updateTicket, commitActiveProject } = useProject();

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

    const activeSprint =
        project?.sprints.find(
            s => s.active && !s.archived
        ) ?? null;

    const activeSprintTickets =
        project && activeSprint
            ? project.tickets.filter(
                t =>
                    activeSprint.ticketIds.includes(t.id)
            )
            : [];

    // Stable key that changes when sprint ticket membership OR status changes
    const sprintTicketKey = activeSprint?.id
        ? `${activeSprint.id}:${activeSprintTickets.map(t => `${t.id}:${t.status}`).join(",")}`
        : "";

    // -------------------------
    // Rebuild board whenever sprint tickets or statuses change
    // Preserves within-lane drag order from persisted project.board
    // -------------------------
    useEffect(() => {
        if (!activeSprint) return;

        setBoard(() => {
            return rebuildBoard(
                activeSprintTickets,
                project?.board
            );
        });
    }, [sprintTicketKey]);

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
    // Helpers
    // -------------------------
    const findLane = useCallback(
        (id: string): LaneId | null => {
            if (!board) return null;
            if (board.laneOrder.todo.includes(id)) return "todo";
            if (board.laneOrder.inProgress.includes(id)) return "inProgress";
            if (board.laneOrder.done.includes(id)) return "done";
            return null;
        },
        [board]
    );

    const isLaneId = (id: string): id is LaneId => {
        return LANE_IDS.includes(id as LaneId);
    };

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
    // Drag end (cross-lane + within-lane)
    // -------------------------
    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;

            setActiveTicket(null);

            if (!over || !board) return;

            const activeId = active.id as string;
            const overId = over.id as string;

            const sourceLane = findLane(activeId);
            if (!sourceLane) return;

            // Determine target lane and index
            let targetLane: LaneId;
            let targetIndex: number;

            if (isLaneId(overId)) {
                // Dropped directly on a lane (empty or at bottom)
                targetLane = overId;
                targetIndex = board.laneOrder[targetLane].length;
            } else {
                // Dropped on a ticket — find its lane
                targetLane = findLane(overId) ?? sourceLane;
                targetIndex = board.laneOrder[targetLane].indexOf(overId);
            }

            // ---- Same-lane reorder: single array operation ----
            if (sourceLane === targetLane) {
                const items = [...board.laneOrder[sourceLane]];
                const sourceIndex = items.indexOf(activeId);
                if (sourceIndex === -1) return;

                items.splice(sourceIndex, 1);

                if (targetIndex === -1) {
                    targetIndex = items.length;
                }

                items.splice(targetIndex, 0, activeId);

                const newBoard: Board = {
                    laneOrder: {
                        ...board.laneOrder,
                        [sourceLane]: items,
                    },
                };

                setBoard(newBoard);
                commitActiveProject({ board: newBoard });
                return;
            }

            // ---- Cross-lane move: remove from source, insert into target ----
            const sourceItems = [...board.laneOrder[sourceLane]];
            const sourceIndex = sourceItems.indexOf(activeId);
            if (sourceIndex === -1) return;
            sourceItems.splice(sourceIndex, 1);

            const targetItems = [...board.laneOrder[targetLane]];
            if (targetIndex === -1) {
                targetIndex = targetItems.length;
            }
            targetItems.splice(targetIndex, 0, activeId);

            const newBoard: Board = {
                laneOrder: {
                    ...board.laneOrder,
                    [sourceLane]: sourceItems,
                    [targetLane]: targetItems,
                },
            };

            setBoard(newBoard);
            commitActiveProject({ board: newBoard });

            // Update ticket status when crossing lanes
            const newStatus = LANE_TO_STATUS[targetLane];
            updateTicket(activeId, { status: newStatus });
        },
        [board, findLane, commitActiveProject, updateTicket]
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
                        laneId="todo"
                        title="To Do"
                        tickets={todoTickets}
                        selectedTicketId={selectedTicketId}
                        onSelectTicket={setSelectedTicketId}
                    />

                    <KanbanLane
                        laneId="inProgress"
                        title="In Progress"
                        tickets={inProgressTickets}
                        selectedTicketId={selectedTicketId}
                        onSelectTicket={setSelectedTicketId}
                    />

                    <KanbanLane
                        laneId="done"
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
