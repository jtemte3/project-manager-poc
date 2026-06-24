import { type Project } from "../models/Project";

const STORAGE_KEY = "project-manager-poc";

export function saveProject(
    project: Project
): void {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(project)
    );
}

export function loadProject():
    Project | null {

    const raw =
        localStorage.getItem(
            STORAGE_KEY
        );

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

    localStorage.removeItem(
        STORAGE_KEY
    );
}