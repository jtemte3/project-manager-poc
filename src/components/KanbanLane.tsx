import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import SortableTicketCard from "./SortableTicketCard";
import { type Ticket } from "../models/Ticket";

interface Props {
    title: string;
    tickets: Ticket[];

    selectedTicketId: string | null;

    onSelectTicket: (ticketId: string) => void;
}

export default function KanbanLane({
    title,
    tickets,
    selectedTicketId,
    onSelectTicket,
}: Props) {
    return (
        <div className="kanban-lane">

            <div className="kanban-lane__header">

                <span>{title}</span>

                <strong>{tickets.length}</strong>

            </div>

            <SortableContext
                items={tickets.map(t => t.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="kanban-lane__body">

                    {tickets.map(ticket => (

                        <SortableTicketCard
                            key={ticket.id}
                            ticket={ticket}
                            selected={
                                ticket.id === selectedTicketId
                            }
                            onSelect={() =>
                                onSelectTicket(ticket.id)
                            }
                        />

                    ))}

                </div>
            </SortableContext>

        </div>
    );
}