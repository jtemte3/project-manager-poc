import { useState, useRef } from "react";

import { useProject } from "../hooks/useProject";
import { type Project } from "../models/Project";

export default function ProjectsPage() {
    const {
        projects,
        activeProjectId,
        createProject,
        updateProject,
        deleteProject,
        setActiveProject,
        importProject,
    } = useProject();

    const [newProjectName, setNewProjectName] = useState("");
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleCreateProject() {
        const trimmed = newProjectName.trim();
        if (!trimmed) return;

        createProject(trimmed);
        setNewProjectName("");
    }

    function handleKeyDownCreate(event: React.KeyboardEvent) {
        if (event.key === "Enter") {
            handleCreateProject();
        }
    }

    function startEdit(projectId: string, currentName: string) {
        setEditingProjectId(projectId);
        setEditingName(currentName);
    }

    function handleSaveEdit(projectId: string) {
        const trimmed = editingName.trim();
        if (trimmed) {
            updateProject(projectId, { name: trimmed });
        }
        setEditingProjectId(null);
        setEditingName("");
    }

    function handleCancelEdit() {
        setEditingProjectId(null);
        setEditingName("");
    }

    function handleKeyDownEdit(event: React.KeyboardEvent) {
        if (event.key === "Enter") {
            handleSaveEdit(editingProjectId!);
        }
        if (event.key === "Escape") {
            handleCancelEdit();
        }
    }

    function handleDelete(projectId: string) {
        if (confirm("Delete this project and all its data?")) {
            deleteProject(projectId);
        }
    }

    function handleDownload(project: Project) {
        const dataStr = JSON.stringify(project, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${project.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const parsed = JSON.parse(text);
                if (!parsed || typeof parsed !== "object" || !parsed.name) {
                    alert("Invalid project file: missing 'name' field.");
                    return;
                }
                importProject(parsed as Project);
            } catch {
                alert("Invalid JSON file.");
            }
        };
        reader.readAsText(file);

        // Reset input so the same file can be re-imported
        event.target.value = "";
    }

    return (
        <div className="projects-page">
            <div className="projects-page__header">
                <h1 className="projects-page__title">Projects</h1>
                <span className="projects-page__count">
                    {projects.length} project{projects.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Create + Import row */}
            <div className="create-project-form">
                <input
                    type="text"
                    className="create-project-form__input"
                    placeholder="New project name..."
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    onKeyDown={handleKeyDownCreate}
                />
                <button
                    type="button"
                    className="create-project-form__button"
                    onClick={handleCreateProject}
                    disabled={!newProjectName.trim()}
                >
                    Create
                </button>
                <button
                    type="button"
                    className="create-project-form__button create-project-form__button--import"
                    onClick={() => fileInputRef.current?.click()}
                >
                    Import
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="create-project-form__file-input"
                    onChange={handleImport}
                />
            </div>

            {/* Project list */}
            {projects.length === 0 ? (
                <div className="projects-empty">
                    <p>No projects yet. Create one above to get started.</p>
                </div>
            ) : (
                <div className="projects-list">
                    {projects.map(project => {
                        const isActive = project.id === activeProjectId;
                        const isEditing = editingProjectId === project.id;

                        return (
                            <div
                                key={project.id}
                                className={`project-card${isActive ? " project-card--active" : ""}`}
                            >
                                <div className="project-card__main">
                                    <button
                                        type="button"
                                        className="project-card__select"
                                        onClick={() => setActiveProject(project.id)}
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
                                                onChange={e => setEditingName(e.target.value)}
                                                onKeyDown={handleKeyDownEdit}
                                                autoFocus
                                            />
                                            <div className="project-card__edit-actions">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveEdit(project.id)}
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleCancelEdit}
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
                                            onClick={() => handleDownload(project)}
                                            className="project-card__download"
                                            title="Download as JSON"
                                        >
                                            Export
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => startEdit(project.id, project.name)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            className="project-card__delete"
                                            onClick={() => handleDelete(project.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`
                .projects-page {
                    max-width: 720px;
                    margin: 0 auto;
                }

                .projects-page__header {
                    display: flex;
                    align-items: baseline;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .projects-page__title {
                    margin: 0;
                    font-size: 2rem;
                    line-height: 1.1;
                }

                .projects-page__count {
                    color: #6c7891;
                    font-size: 0.95rem;
                }

                .create-project-form {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 24px;
                }

                .create-project-form__input {
                    flex: 1;
                }

                .create-project-form__button {
                    white-space: nowrap;
                    background: #5b7cff;
                    color: white;
                    border-color: #5b7cff;
                }

                .create-project-form__button:hover {
                    background: #4a6ae8;
                    border-color: #4a6ae8;
                }

                .create-project-form__button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .create-project-form__button--import {
                    background: #6c7891;
                    border-color: #6c7891;
                }

                .create-project-form__button--import:hover {
                    background: #5a6678;
                    border-color: #5a6678;
                }

                .create-project-form__file-input {
                    display: none;
                }

                .projects-empty {
                    padding: 40px 20px;
                    text-align: center;
                    border: 1px dashed #c7d0e0;
                    border-radius: 16px;
                    background: #f9fbff;
                    color: #66738e;
                }

                .projects-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .project-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    padding: 16px 20px;
                    border: 1px solid #d9dfeb;
                    border-radius: 16px;
                    background: rgba(255, 255, 255, 0.92);
                    box-shadow: 0 4px 16px rgba(31, 42, 68, 0.06);
                }

                .project-card--active {
                    border-color: #5b7cff;
                    box-shadow: 0 4px 20px rgba(91, 124, 255, 0.15);
                }

                .project-card__main {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    min-width: 0;
                    flex: 1;
                }

                .project-card__select {
                    flex-shrink: 0;
                    font-size: 0.8rem;
                    padding: 6px 10px;
                    min-width: 80px;
                    text-align: center;
                }

                .project-card--active .project-card__select {
                    color: #5b7cff;
                    font-weight: 600;
                }

                .project-card__info {
                    min-width: 0;
                }

                .project-card__name {
                    margin: 0 0 4px;
                    font-size: 1.15rem;
                    line-height: 1.2;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .project-card__meta {
                    color: #6c7891;
                    font-size: 0.85rem;
                }

                .project-card__edit {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    flex: 1;
                    min-width: 0;
                }

                .project-card__edit-input {
                    font-size: 1.15rem;
                    font-weight: 500;
                }

                .project-card__edit-actions {
                    display: flex;
                    gap: 8px;
                }

                .project-card__actions {
                    display: flex;
                    gap: 8px;
                    flex-shrink: 0;
                }

                .project-card__download {
                    font-size: 1.1rem;
                    line-height: 1;
                    padding: 4px 8px;
                    color: #5b7cff;
                }

                .project-card__download:hover {
                    background: #f0f4ff;
                    border-color: #5b7cff;
                }

                .project-card__delete {
                    color: #d93025;
                }

                .project-card__delete:hover {
                    background: #fef2f2;
                    border-color: #d93025;
                }
            `}</style>
        </div>
    );
}
