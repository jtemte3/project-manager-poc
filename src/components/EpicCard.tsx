import { useState } from "react";

import { type Epic } from "../models/Epic";

import { useProject } from "../hooks/useProject";

import EpicEditor from "./EpicEditor";

interface Props {
    epic: Epic;
    expanded: boolean;
    onToggle: () => void;
}

export default function EpicCard({
    epic,
    expanded,
    onToggle,
}: Props) {
    const [editorOpen, setEditorOpen] =
        useState(false);

    const { project, deleteEpic } =
        useProject();

    const ticketCount =
        project?.tickets.filter(
            ticket =>
                ticket.epicId === epic.id
        ).length ?? 0;

    return (
        <div
            className="epic-card"
            style={{
                borderLeftColor: epic.color,
            }}
        >
            <div
                className="epic-card__header"
                onClick={onToggle}
                style={{ cursor: "pointer" }}
            >
                <div>
                    <span className="epic-card__eyebrow">
                        Epic
                    </span>
                    <span style={{marginLeft:"8px"}} className="epic-card__meta">
                        {ticketCount} tickets
                    </span>
                    <h2 className="epic-card__title">
                        {epic.name}
                    </h2>
                </div>

                <div className="epic-card__actions">
                    <button
                        type="button"
                        onClick={event => {
                            event.stopPropagation();
                            setEditorOpen(!editorOpen);
                        }}
                    >
                        {editorOpen
                            ? "Close"
                            : "Edit"}
                    </button>

                    <button
                        type="button"
                        onClick={event => {
                            event.stopPropagation();
                            deleteEpic(epic.id);
                        }}
                    >
                        Delete
                    </button>
                </div>
            </div>

            {editorOpen && (
                <div className="epic-card__body">
                    <EpicEditor
                        epic={epic}
                    />
                </div>
            )}
        </div>
    );
}
