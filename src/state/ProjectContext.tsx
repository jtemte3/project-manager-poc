import { createContext } from "react";
import { type Project } from "../models/Project";
import { type Sprint } from "../models/Sprint";

export interface ProjectContextType {
    project: Project | null;

    setProject: (project: Project) => void;

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

    editingTicketId: string | null;

    setEditingTicketId: (
        ticketId: string | null
    ) => void;

    addEpic: () => void;

    updateEpic: (
        epicId: string,
        updates: Record<string, any>
    ) => void;

    deleteEpic: (
        epicId: string
    ) => void;
}

export const ProjectContext =
    createContext<ProjectContextType | null>(
        null
    );
