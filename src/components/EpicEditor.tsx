import { type Epic }
from "../models/Epic";

import {
    useProject
}
from "../hooks/useProject";

import FormField from "./FormField";

interface Props {
    epic: Epic;
    onClose: () => void;
}

export default function EpicEditor({
    epic,
    onClose
}: Props) {

    const {
        updateEpic,
        deleteEpic
    } = useProject();

    const inputStyle = {
        width: "100%",
        boxSizing: "border-box" as const,
    };

    return (

        <div
            className="epic-detail"
            style={{
                borderLeftColor: epic.color,
            }}
        >

            <div className="ticket-detail__header">
                <div>
                    <div className="ticket-detail__eyebrow">
                        Epic details
                    </div>
                    <h2 className="ticket-detail__title">
                        {epic.name}
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
                label="Name"
                helpText="Give this epic a short, clear name."
            >
                <input
                    style={inputStyle}
                    value={epic.name}
                    onChange={e =>
                        updateEpic(
                            epic.id,
                            {
                                name:
                                    e.target.value
                            }
                        )
                    }
                />
            </FormField>

            <FormField
                label="Description"
                helpText="Describe the goals or scope of this epic."
            >
                <textarea
                    style={inputStyle}
                    rows={6}
                    value={epic.description}
                    onChange={e =>
                        updateEpic(
                            epic.id,
                            {
                                description:
                                    e.target.value
                            }
                        )
                    }
                />
            </FormField>

            <FormField
                label="Color"
                helpText="Choose a color to identify this epic."
            >
                <input
                    type="color"
                    value={epic.color}
                    onChange={e =>
                        updateEpic(
                            epic.id,
                            {
                                color:
                                    e.target.value
                            }
                        )
                    }
                    style={{
                        width: "48px",
                        height: "48px",
                        padding: "0",
                        border: "none",
                        cursor: "pointer",
                    }}
                />
            </FormField>

            <div className="ticket-detail__danger-zone">
                <button
                    type="button"
                    className="ticket-detail__danger"
                    onClick={() => {
                        deleteEpic(epic.id);
                        onClose();
                    }}
                >
                    Delete
                </button>
            </div>

        </div>
    );
}
