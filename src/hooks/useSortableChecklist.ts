import { useCallback } from "react";

import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";

import { type Ticket } from "../models/Ticket";
import { DND_DELAY_MS, DND_TOLERANCE_PX } from "../utils/dndConstants";

interface UseSortableChecklistReturn {
    sensors: ReturnType<typeof useSensors>;
    handleDragEnd: (event: DragEndEvent) => void;
}

interface UseSortableChecklistProps {
    ticket: Ticket;
    updateTicket: (ticketId: string, updates: Record<string, any>) => void;
}

export function useSortableChecklist({
    ticket,
    updateTicket,
}: UseSortableChecklistProps): UseSortableChecklistReturn {

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                delay: DND_DELAY_MS,
                tolerance: DND_TOLERANCE_PX,
            },
        })
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;

            if (!over || active.id === over.id) {
                return;
            }

            const oldIndex = ticket.checklist.findIndex(
                item => item.id === active.id
            );
            const newIndex = ticket.checklist.findIndex(
                item => item.id === over.id
            );

            if (oldIndex === -1 || newIndex === -1) {
                return;
            }

            const updatedChecklist = [...ticket.checklist];
            const [movedItem] = updatedChecklist.splice(oldIndex, 1);
            updatedChecklist.splice(newIndex, 0, movedItem);

            updateTicket(ticket.id, {
                checklist: updatedChecklist,
            });
        },
        [ticket, updateTicket]
    );

    return {
        sensors,
        handleDragEnd,
    };
}
