import { createContext } from "react";
import { type Project } from "../models/Project";
import { type Sprint } from "../models/Sprint";

export interface ProjectContextType {
    // Multi-project state
    projects: Project[];

    activeProjectId: string | null;

    activeProject: Project | null;

    // Project CRUD
    createProject: (name: string) => void;

    updateProject: (
        projectId: string,
        updates: Partial<Project>
    ) => void;

    deleteProject: (projectId: string) => void;

    setActiveProject: (projectId: string | null) => void;

    // Legacy single-project access (for backward compatibility)
    project: Project | null;

    setProject: (project: Project) => void;

    // Ticket operations
    addTicket: (
        epicId?: string
    ) => void;

    updateTicket: (
        ticketId: string,
        updates: Record<string, any>
    ) => void;

    deleteTicket: (
        ticketId: string
    ) => void;

    // Sprint operations
    addSprint: (
        title: string,
        durationWeeks: Sprint["durationWeeks"]
    ) => string;

    updateSprint: (
        sprintId: string,
        updates: Partial<Sprint>
    ) => void;

    startSprint: (
        sprintId: string
    ) => void;

    endSprint: (
        sprintId: string
    ) => void;

    deleteSprint: (
        sprintId: string
    ) => void;

    assignTicketToSprint: (
        ticketId: string,
        sprintId: string
    ) => void;

    removeTicketFromSprint: (
        ticketId: string
    ) => void;

    // Epic operations
    addEpic: () => void;

    updateEpic: (
        epicId: string,
        updates: Record<string, any>
    ) => void;

    deleteEpic: (
        epicId: string
    ) => void;

    // Editing state
    editingTicketId: string | null;

    setEditingTicketId: (
        ticketId: string | null
    ) => void;
}

export const ProjectContext =
    createContext<ProjectContextType | null>(
        null
    );
