import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import TicketCard from "./TicketCard";
import { type Ticket } from "../models/Ticket";

interface Props {
    ticket: Ticket;
    selected: boolean;
    onSelect: () => void;
}

export default function SortableTicketCard({
    ticket,
    selected,
    onSelect,
}: Props) {

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: ticket.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
        >
            <TicketCard
                ticket={ticket}
                selected={selected}
                onSelect={onSelect}
            />
        </div>
    );
}