import { useState } from "react";

import { type Ticket } from "../models/Ticket";

import { useProject } from "../hooks/useProject";

import { createId } from "../utils/createId";

interface Props {
    ticket: Ticket;
}

export default function ChecklistEditor({
    ticket,
}: Props) {

    const {
        updateTicket,
    } = useProject();

    const [
        newChecklistText,
        setNewChecklistText,
    ] = useState("");

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

        updateTicket(
            ticket.id,
            {
                checklist: [
                    ...ticket.checklist,
                    {
                        id: createId(),
                        text,
                        complete: false,
                    },
                ],
            }
        );

        setNewChecklistText("");
    }

    return (
        <div className="checklist-editor">
            <h4>
                Checklist
            </h4>

            {ticket.checklist.map(
                item => (
                    <div
                        key={item.id}
                        style={{
                            display:
                                "flex",

                            alignItems:
                                "center",

                            gap: "8px",

                            marginBottom:
                                "8px",
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={
                                item.complete
                            }
                            onChange={() =>
                                toggleItem(
                                    item.id
                                )
                            }
                        />

                        <input
                            style={{
                                flex: 1,
                            }}
                            value={
                                item.text
                            }
                            onChange={e =>
                                updateItemText(
                                    item.id,
                                    e.target
                                        .value
                                )
                            }
                        />

                        <button
                            onClick={() =>
                                deleteItem(
                                    item.id
                                )
                            }
                        >
                            Delete
                        </button>
                    </div>
                )
            )}

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
