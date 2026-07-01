import { useState, useRef } from "react";

import ProjectCard from "../components/ProjectCard";
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
                    {projects.map(project => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            isActive={project.id === activeProjectId}
                            isEditing={editingProjectId === project.id}
                            editingName={editingName}
                            onSelect={() => setActiveProject(project.id)}
                            onChangeEditingName={setEditingName}
                            onKeyDownEdit={handleKeyDownEdit}
                            onSaveEdit={() => handleSaveEdit(project.id)}
                            onCancelEdit={handleCancelEdit}
                            onDownload={() => handleDownload(project)}
                            onStartEdit={() => startEdit(project.id, project.name)}
                            onDelete={() => handleDelete(project.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
