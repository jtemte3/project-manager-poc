import { type Project } from "../models/Project";

interface ProjectCardProps {
    project: Project;
    isActive: boolean;
    isEditing: boolean;
    editingName: string;
    onSelect: () => void;
    onChangeEditingName: (value: string) => void;
    onKeyDownEdit: (event: React.KeyboardEvent) => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onDownload: () => void;
    onStartEdit: () => void;
    onDelete: () => void;
}

export default function ProjectCard({
    project,
    isActive,
    isEditing,
    editingName,
    onSelect,
    onChangeEditingName,
    onKeyDownEdit,
    onSaveEdit,
    onCancelEdit,
    onDownload,
    onStartEdit,
    onDelete,
}: ProjectCardProps) {
    return (
        <div
            className={`project-card${isActive ? " project-card--active" : ""}`}
        >
            <div className="project-card__main">
                <button
                    type="button"
                    className="project-card__select"
                    onClick={onSelect}
                    title={isActive ? "Active project" : "Select this project"}
                >
                    {isActive ? "● Active" : "○ Select"}
                </button>

                {isEditing ? (
                    <div className="project-card__edit">
                        <input
                            type="text"
                            className="project-card__edit-input"
                            value={editingName}
                            onChange={e => onChangeEditingName(e.target.value)}
                            onKeyDown={onKeyDownEdit}
                            autoFocus
                        />
                        <div className="project-card__edit-actions">
                            <button
                                type="button"
                                onClick={onSaveEdit}
                            >
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={onCancelEdit}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="project-card__info">
                        <h2 className="project-card__name">
                            {project.name}
                        </h2>
                        <span className="project-card__meta">
                            {project.tickets.length} ticket
                            {project.tickets.length !== 1 ? "s" : ""}
                            {" · "}
                            {project.sprints.length} sprint
                            {project.sprints.length !== 1 ? "s" : ""}
                            {" · "}
                            {project.epics.length} epic
                            {project.epics.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                )}
            </div>

            {!isEditing && (
                <div className="project-card__actions">
                    <button
                        type="button"
                        onClick={onDownload}
                        className="project-card__download"
                        title="Download as JSON"
                    >
                        Export
                    </button>
                    <button
                        type="button"
                        onClick={onStartEdit}
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        className="project-card__delete"
                        onClick={onDelete}
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}
