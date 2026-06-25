import { useEffect, useState, useMemo } from "react";
import { v4 as uuid } from "uuid";

import { ProjectContext } from "./ProjectContext";

import { type Project } from "../models/Project";
import { type Epic } from "../models/Epic";
import { type Sprint } from "../models/Sprint";

import { sampleProject } from "../services/SampleProject";
import { normalizeProjectState, syncSprintMetrics } from "../services/ProjectMetrics";

import {
    loadProjects,
    saveProjects,
    loadActiveProjectId,
    saveActiveProjectId,
    loadProject,
    clearProject,
} from "../services/ProjectStorage";

interface Props {
    children: React.ReactNode;
}

function nowIso() {
    return new Date().toISOString();
}

function makeEmptyProject(name: string): Project {
    return normalizeProjectState({
        ...sampleProject,
        id: uuid(),
        name,
    });
}

export default function ProjectProvider({
    children,
}: Props) {
    const [projects, setProjects] = useState<Project[]>(() => {
        const loaded = loadProjects();

        // Migrate legacy single project if no multi-project data exists
        if (loaded.length === 0) {
            const legacy = loadProject();
            if (legacy) {
                clearProject();
                return [normalizeProjectState(legacy)];
            }
        }

        return loaded;
    });

    const [activeProjectId, setActiveProjectIdState] = useState<string | null>(() => {
        const saved = loadActiveProjectId();
        return saved && projects.find(p => p.id === saved) ? saved : (projects[0]?.id ?? null);
    });

    // Save projects whenever they change
    useEffect(() => {
        saveProjects(projects);
    }, [projects]);

    // Save active project id whenever it changes
    useEffect(() => {
        saveActiveProjectId(activeProjectId);
    }, [activeProjectId]);

    // Recompute active project id if current one was deleted
    useEffect(() => {
        if (activeProjectId && !projects.find(p => p.id === activeProjectId)) {
            setActiveProjectIdState(projects[0]?.id ?? null);
        }
    }, [projects, activeProjectId]);

    const activeProject = useMemo(
        () => projects.find(p => p.id === activeProjectId) ?? null,
        [projects, activeProjectId]
    );

    // --- Project CRUD ---

    function createProject(name: string) {
        const newProject = makeEmptyProject(name);
        setProjects(prev => [...prev, newProject]);
        setActiveProjectIdState(newProject.id);
    }

    function updateProject(
        projectId: string,
        updates: Partial<Project>
    ) {
        setProjects(prev =>
            prev.map(project =>
                project.id === projectId
                    ? syncSprintMetrics({ ...project, ...updates })
                    : project
            )
        );
    }

    function deleteProject(projectId: string) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
    }

    function setActiveProject(projectId: string | null) {
        setActiveProjectIdState(projectId);
    }

    // --- Commit helper for active project ---

    function commitActiveProject(updates: Partial<Project>) {
        if (!activeProjectId) return;

        setProjects(prev =>
            prev.map(project =>
                project.id === activeProjectId
                    ? syncSprintMetrics({ ...project, ...updates })
                    : project
            )
        );
    }

    // --- Ticket, Sprint, Epic operations (operate on active project) ---

    const [editingTicketId, setEditingTicketId] =
        useState<string | null>(null);

    function addEpic() {
        if (!activeProject) return;

        const newEpic: Epic = {
            id: uuid(),
            name: "New Epic",
            description: "",
            color: "#2196F3",
        };

        commitActiveProject({
            epics: [...activeProject.epics, newEpic],
        });
    }

    function updateEpic(
        epicId: string,
        updates: Record<string, any>
    ) {
        if (!activeProject) return;

        commitActiveProject({
            epics: activeProject.epics.map(epic =>
                epic.id === epicId
                    ? {
                          ...epic,
                          ...updates,
                      }
                    : epic
            ),
        });
    }

    function deleteEpic(epicId: string) {
        if (!activeProject) return;

        commitActiveProject({
            epics: activeProject.epics.filter(
                epic => epic.id !== epicId
            ),
            tickets: activeProject.tickets.map(ticket =>
                ticket.epicId === epicId
                    ? {
                          ...ticket,
                          epicId: undefined,
                      }
                    : ticket
            ),
        });
    }

    function addTicket(epicId?: string) {
        if (!activeProject) return;

        const newTicket = {
            id: uuid(),
            title: "New Ticket",
            description: "",
            epicId,
            complexity: 1,
            doneAt: null,
            status: "Backlog" as const,
            checklist: [],
        };

        commitActiveProject({
            tickets: [...activeProject.tickets, newTicket],
        });

        setEditingTicketId(newTicket.id);
    }

    function updateTicket(
        ticketId: string,
        updates: Record<string, any>
    ) {
        if (!activeProject) return;

        commitActiveProject({
            tickets: activeProject.tickets.map(ticket => {
                if (ticket.id !== ticketId) {
                    return ticket;
                }

                const nextTicket = {
                    ...ticket,
                    ...updates,
                };

                if (Object.prototype.hasOwnProperty.call(updates, "status")) {
                    if (updates.status === "Done") {
                        nextTicket.doneAt =
                            ticket.status === "Done"
                                ? ticket.doneAt
                                : nowIso();
                    } else if (ticket.status === "Done") {
                        nextTicket.doneAt = null;
                    }
                }

                return nextTicket;
            }),
        });
    }

    function deleteTicket(ticketId: string) {
        if (!activeProject) return;

        commitActiveProject({
            tickets: activeProject.tickets.filter(
                ticket => ticket.id !== ticketId
            ),
            sprints: activeProject.sprints.map(sprint => ({
                ...sprint,
                ticketIds: sprint.ticketIds.filter(
                    id => id !== ticketId
                ),
            })),
        });
    }

    function addSprint(
        title: string,
        durationWeeks: Sprint["durationWeeks"]
    ) {
        if (!activeProject) return "";

        const newSprint: Sprint = {
            id: uuid(),
            title,
            durationWeeks,
            startDate: null,
            endDate: null,
            active: false,
            archived: false,
            ticketCount: 0,
            totalComplexity: 0,
            doneTicketCount: 0,
            doneComplexity: 0,
            ticketIds: [],
        };

        commitActiveProject({
            sprints: [...activeProject.sprints, newSprint],
        });

        return newSprint.id;
    }

    function updateSprint(
        sprintId: string,
        updates: Partial<Sprint>
    ) {
        if (!activeProject) return;

        commitActiveProject({
            sprints: activeProject.sprints.map(sprint =>
                sprint.id === sprintId
                    ? {
                          ...sprint,
                          ...updates,
                      }
                    : sprint
            ),
        });
    }

    function startSprint(sprintId: string) {
        if (!activeProject) return;

        const sprint = activeProject.sprints.find(
            item => item.id === sprintId
        );

        if (!sprint || sprint.archived) {
            return;
        }

        const startDate = new Date();
        const plannedEnd = new Date(startDate);
        plannedEnd.setDate(
            plannedEnd.getDate() + sprint.durationWeeks * 7
        );

        commitActiveProject({
            sprints: activeProject.sprints.map(item =>
                item.id === sprintId
                    ? {
                          ...item,
                          active: true,
                          archived: false,
                          startDate: startDate.toISOString().slice(0, 10),
                          endDate: plannedEnd.toISOString().slice(0, 10),
                      }
                    : {
                          ...item,
                          active: false,
                      }
            ),
        });
    }

    function endSprint(sprintId: string) {
        if (!activeProject) return;

        const endDate = nowIso().slice(0, 10);

        commitActiveProject({
            sprints: activeProject.sprints.map(sprint =>
                sprint.id === sprintId
                    ? {
                          ...sprint,
                          active: false,
                          archived: true,
                          endDate,
                      }
                    : sprint
            ),
        });
    }

    function deleteSprint(sprintId: string) {
        if (!activeProject) return;

        commitActiveProject({
            sprints: activeProject.sprints.filter(
                sprint => sprint.id !== sprintId
            ),
            tickets: activeProject.tickets.map(ticket =>
                ticket.sprintId === sprintId
                    ? {
                          ...ticket,
                          sprintId: undefined,
                          status: "Backlog" as const,
                          doneAt: null,
                      }
                    : ticket
            ),
        });
    }

    function assignTicketToSprint(
        ticketId: string,
        sprintId: string
    ) {
        if (!activeProject) return;

        const ticket = activeProject.tickets.find(
            item => item.id === ticketId
        );

        if (!ticket) {
            return;
        }

        commitActiveProject({
            tickets: activeProject.tickets.map(item =>
                item.id === ticketId
                    ? {
                          ...item,
                          sprintId,
                          status:
                              item.status === "Backlog"
                                  ? "Todo"
                                  : item.status,
                      }
                    : item
            ),
            sprints: activeProject.sprints.map(sprint =>
                sprint.id === sprintId
                    ? {
                          ...sprint,
                          ticketIds: sprint.ticketIds.includes(
                              ticketId
                          )
                              ? sprint.ticketIds
                              : [...sprint.ticketIds, ticketId],
                      }
                    : {
                          ...sprint,
                          ticketIds: sprint.ticketIds.filter(
                              id => id !== ticketId
                          ),
                      }
            ),
        });
    }

    function removeTicketFromSprint(ticketId: string) {
        if (!activeProject) return;

        const ticket = activeProject.tickets.find(
            item => item.id === ticketId
        );

        if (!ticket) {
            return;
        }

        commitActiveProject({
            tickets: activeProject.tickets.map(item =>
                item.id === ticketId
                    ? {
                          ...item,
                          sprintId: undefined,
                          status: "Backlog" as const,
                          doneAt: null,
                      }
                    : item
            ),
            sprints: activeProject.sprints.map(sprint => ({
                ...sprint,
                ticketIds: sprint.ticketIds.filter(
                    id => id !== ticketId
                ),
            })),
        });
    }

    return (
        <ProjectContext.Provider
            value={{
                // Multi-project state
                projects,
                activeProjectId,
                activeProject,

                // Project CRUD
                createProject,
                updateProject,
                deleteProject,
                setActiveProject,

                // Legacy single-project access
                project: activeProject,
                setProject: commitActiveProject as any,

                // Ticket operations
                addTicket,
                updateTicket,
                deleteTicket,

                // Sprint operations
                addSprint,
                updateSprint,
                startSprint,
                endSprint,
                deleteSprint,
                assignTicketToSprint,
                removeTicketFromSprint,

                // Epic operations
                addEpic,
                updateEpic,
                deleteEpic,

                // Editing state
                editingTicketId,
                setEditingTicketId,
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
}
