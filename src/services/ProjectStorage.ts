import { type Project } from "../models/Project";

const PROJECTS_KEY = "project-manager-poc-projects";
const ACTIVE_PROJECT_KEY = "project-manager-poc-active-id";

interface ProjectsStorage {
    projects: Project[];
}

export function loadProjects(): Project[] {
    const raw = localStorage.getItem(PROJECTS_KEY);

    if (!raw) {
        return [];
    }

    try {
        const data: ProjectsStorage = JSON.parse(raw);
        return data.projects ?? [];
    }
    catch {
        return [];
    }
}

export function saveProjects(projects: Project[]): void {
    localStorage.setItem(
        PROJECTS_KEY,
        JSON.stringify({ projects })
    );
}

export function loadActiveProjectId(): string | null {
    return localStorage.getItem(ACTIVE_PROJECT_KEY);
}

export function saveActiveProjectId(id: string | null): void {
    if (id == null) {
        localStorage.removeItem(ACTIVE_PROJECT_KEY);
    } else {
        localStorage.setItem(ACTIVE_PROJECT_KEY, id);
    }
}

// Legacy compatibility helpers - kept for migration
export function loadProject(): Project | null {
    const raw = localStorage.getItem("project-manager-poc");

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}

export function clearProject() {
    localStorage.removeItem("project-manager-poc");
}
