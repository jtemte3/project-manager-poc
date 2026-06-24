import { useState } from "react";

import { type Epic } from "../models/Epic";

import { useProject } from "../hooks/useProject";

import EpicEditor from "./EpicEditor";

interface Props {
    epic: Epic;
}

export default function EpicCard({
    epic,
}: Props) {
    const [expanded, setExpanded] =
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
            <div className="epic-card__header">
                <div>
                    <div className="epic-card__eyebrow">
                        Epic
                    </div>
                    <h2 className="epic-card__title">
                        {epic.name}
                    </h2>
                    <div className="epic-card__meta">
                        {ticketCount} tickets
                    </div>
                </div>

                <div className="epic-card__actions">
                    <button
                        type="button"
                        onClick={() =>
                            setExpanded(
                                !expanded
                            )
                        }
                    >
                        {expanded
                            ? "Close"
                            : "Edit"}
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            deleteEpic(
                                epic.id
                            )
                        }
                    >
                        Delete
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="epic-card__body">
                    <EpicEditor
                        epic={epic}
                    />
                </div>
            )}
        </div>
    );
}
