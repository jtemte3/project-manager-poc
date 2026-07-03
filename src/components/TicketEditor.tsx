import { useState, useEffect } from "react";

import { type Ticket } from "../models/Ticket";

import ChecklistEditor from "./ChecklistEditor";
import CommentsEditor from "./CommentsEditor";
import RichTextEditor from "./RichTextEditor";
import { useProject } from "../hooks/useProject";
import { getEpicColor } from "../utils/getEpicColor";
import FormField from "./FormField";

interface Props {
    ticket: Ticket;
    onClose: () => void;
}

export default function TicketEditor({
    ticket,
    onClose,
}: Props) {
    const {
        project,
        updateTicket,
        deleteTicket,
        setEditingTicketId,
    } = useProject();

    // Track if checklist panel is visible
    const [showChecklistPanel, setShowChecklistPanel] = useState(false);

    // If ticket has checklist items, show the panel by default
    useEffect(() => {
        if (ticket.checklist.length > 0) {
            setShowChecklistPanel(true);
        }
    }, [ticket.checklist.length]);

    if (!project) {
        return null;
    }

    const epicColor = getEpicColor(
        project,
        ticket.epicId
    );

    const inputStyle = {
        width: "100%",
        boxSizing: "border-box" as const,
    };

    function handleToggleChecklistPanel() {
        setShowChecklistPanel(prev => !prev);
    }

    return (
        <div
            className="ticket-detail"
            style={{
                borderLeftColor: epicColor,
            }}
        >
            <div className="ticket-detail__header">
                <div>
                    <div className="ticket-detail__eyebrow">
                        Ticket details
                        <span className="ticket-detail__id">
                            {ticket.id}
                        </span>
                    </div>
                    <h2 className="ticket-detail__title">
                        {ticket.title || "Untitled Ticket"}
                    </h2>
                </div>

                <div className="ticket-detail__actions">
                    <button
                        type="button"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>

            <FormField
                label="Title"
                helpText="Give this ticket a short, clear name."
            >
                <input
                    style={inputStyle}
                    value={ticket.title}
                    onChange={e =>
                        updateTicket(
                            ticket.id,
                            {
                                title:
                                    e.target.value,
                            }
                        )
                    }
                />
            </FormField>

            <div className="ticket-detail__grid">
                <FormField
                    label="Status"
                    helpText="Move the ticket through the workflow."
                >
                    <select
                        style={inputStyle}
                        value={ticket.status}
                        onChange={e =>
                            updateTicket(
                                ticket.id,
                                {
                                    status:
                                        e.target
                                            .value,
                                }
                            )
                        }
                    >
                        <option value="Backlog">
                            Backlog
                        </option>
                        <option value="Todo">
                            To Do
                        </option>
                        <option value="InProgress">
                            In Progress
                        </option>
                        <option value="Done">
                            Done
                        </option>
                    </select>
                </FormField>

                <FormField
                    label="Epic"
                    helpText="Assign this ticket to an epic."
                >
                    <select
                        style={inputStyle}
                        value={ticket.epicId ?? ""}
                        onChange={e =>
                            updateTicket(
                                ticket.id,
                                {
                                    epicId:
                                        e.target
                                            .value ||
                                        undefined,
                                }
                            )
                        }
                    >
                        <option value="">
                            Unassigned
                        </option>

                        {project.epics.map(
                            epic => (
                                <option
                                    key={epic.id}
                                    value={epic.id}
                                >
                                    {epic.name}
                                </option>
                            )
                        )}
                    </select>
                </FormField>

                <FormField
                    label="Complexity"
                    helpText="Use a lightweight estimate."
                >
                    <input
                        type="number"
                        min={1}
                        max={13}
                        style={inputStyle}
                        value={ticket.complexity}
                        onChange={e =>
                            updateTicket(
                                ticket.id,
                                {
                                    complexity:
                                        Number(
                                            e.target
                                                .value
                                        ),
                                }
                            )
                        }
                    />
                </FormField>
            </div>

            <FormField
                label="Description"
                helpText="Describe the work, goals, or notes for this ticket."
            >
                <div className="description-checklist-wrapper">
                    {/* Checklist Toggle Button */}
                    <button
                        type="button"
                        className={`checklist-toggle-btn ${showChecklistPanel ? "is-active" : ""}`}
                        onClick={handleToggleChecklistPanel}
                    >
                        {/* <span className="checklist-toggle-btn__icon">
                            ☑
                        </span> */}
                        <span className="checklist-toggle-btn__text">
                            {showChecklistPanel ? "🗹 Hide Checklist" : "☐ Show Checklist"}
                        </span>
                    </button>

                    {/* Split View Container */}
                    <div className={`description-checklist-split ${showChecklistPanel ? "is-split" : ""}`}>
                        {/* Rich Text Editor - takes 2/3 when split, full when not */}
                        <div className="description-editor-panel">
                            <RichTextEditor
                                value={ticket.description}
                                onChange={(value) => updateTicket(ticket.id, { description: value })}
                            />
                        </div>

                        {/* Checklist Panel - slides in from right, takes 1/3 */}
                        <div className={`checklist-panel ${showChecklistPanel ? "is-visible" : ""}`}>
                            <ChecklistEditor ticket={ticket} showChecklistPanel={showChecklistPanel} />
                        </div>
                    </div>
                </div>
            </FormField>

            <CommentsEditor ticket={ticket} />

            <div className="ticket-detail__danger-zone">
                <button
                    type="button"
                    className="ticket-detail__danger"
                    onClick={() => {
                        deleteTicket(
                            ticket.id
                        );
                        setEditingTicketId(null);
                    }}
                >
                    Delete Ticket
                </button>
            </div>
        </div>
    );
}
