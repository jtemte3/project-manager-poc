import { useState } from "react";

import {
    DndContext,
} from "@dnd-kit/core";

import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { type Ticket } from "../models/Ticket";

import { useProject } from "../hooks/useProject";
import { useSortableChecklist } from "../hooks/useSortableChecklist";

import { createId } from "../utils/createId";

import SortableChecklistElement from "./SortableChecklistElement";

interface Props {
    ticket: Ticket;
}

export default function ChecklistEditor({
    ticket,
}: Props) {

    const {
        updateTicket,
    } = useProject();

    const {
        sensors,
        handleDragEnd,
    } = useSortableChecklist({
        ticket,
        updateTicket,
    });

    const [
        newChecklistText,
        setNewChecklistText,
    ] = useState("");

    const [
        focusedItemId,
        setFocusedItemId,
    ] = useState<string | null>(null);

    function toggleItem(
        itemId: string
    ) {

        updateTicket(
            ticket.id,
            {
                checklist:
                    ticket.checklist.map(
                        item =>
                            item.id === itemId
                                ? {
                                    ...item,
                                    complete:
                                        !item.complete,
                                }
                                : item
                    ),
            }
        );
    }

    function updateItemText(
        itemId: string,
        text: string
    ) {

        updateTicket(
            ticket.id,
            {
                checklist:
                    ticket.checklist.map(
                        item =>
                            item.id === itemId
                                ? {
                                    ...item,
                                    text,
                                }
                                : item
                    ),
            }
        );
    }

    function deleteItem(
        itemId: string
    ) {

        updateTicket(
            ticket.id,
            {
                checklist:
                    ticket.checklist.filter(
                        item =>
                            item.id !== itemId
                    ),
            }
        );
    }

    function addItem() {

        const text =
            newChecklistText.trim();

        if (!text) {
            return;
        }

        const newItemId = createId();

        updateTicket(
            ticket.id,
            {
                checklist: [
                    ...ticket.checklist,
                    {
                        id: newItemId,
                        text,
                        complete: false,
                    },
                ],
            }
        );

        setNewChecklistText("");
    }

    function handleAddItemFromElement(
        currentItemId: string
    ) {
        const currentIndex = ticket.checklist.findIndex(
            item => item.id === currentItemId
        );

        const newItemId = createId();

        const updatedChecklist = [...ticket.checklist];
        updatedChecklist.splice(
            currentIndex + 1,
            0,
            {
                id: newItemId,
                text: "",
                complete: false,
            }
        );

        updateTicket(
            ticket.id,
            {
                checklist: updatedChecklist,
            }
        );

        setFocusedItemId(newItemId);
    }

    const handleNewItemKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addItem();
        }
    };

    return (
        <div className="checklist-editor">
            <h4>
                Checklist
            </h4>

            <DndContext
                sensors={sensors}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={ticket.checklist.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {ticket.checklist.map(
                        item => (
                            <SortableChecklistElement
                                key={item.id}
                                item={item}
                                onToggle={toggleItem}
                                onUpdateText={updateItemText}
                                onDelete={deleteItem}
                                onAddItem={handleAddItemFromElement}
                                shouldFocus={item.id === focusedItemId}
                            />
                        )
                    )}
                </SortableContext>
            </DndContext>

            <div
                style={{
                    display:
                        "flex",

                    gap: "8px",

                    marginTop:
                        "12px",
                }}
            >
                <input
                    style={{
                        flex: 1,
                    }}
                    placeholder="New checklist item..."
                    value={
                        newChecklistText
                    }
                    onChange={e =>
                        setNewChecklistText(
                            e.target.value
                        )
                    }
                    onKeyDown={handleNewItemKeyDown}
                />

                <button
                    onClick={addItem}
                >
                    Add Item
                </button>
            </div>
        </div>
    );
}
