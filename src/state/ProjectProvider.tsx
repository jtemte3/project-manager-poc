import { useEffect, useState, useMemo } from "react";
import { v4 as uuid } from "uuid";

import { ProjectContext } from "./ProjectContext";

import { type Project } from "../models/Project";
import { type Epic } from "../models/Epic";
import { type Sprint } from "../models/Sprint";

import { sampleProject } from "../services/SampleProject";
import { normalizeProjectState, syncSprintMetrics } from "../services/ProjectMetrics";

import { buildBoardFromTickets } from "../utils/buildBoardFromTickets";

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

    function importProject(project: Project) {
        const normalized = normalizeProjectState({
            ...project,
            id: uuid(), // new id to avoid collisions
        });
        setProjects(prev => [...prev, normalized]);
        setActiveProjectIdState(normalized.id);
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
            ticketIds: [],
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

        // Collect ticket ids that will become unassigned
        const unassigningTicketIds = activeProject.tickets
            .filter(ticket => ticket.epicId === epicId)
            .map(ticket => ticket.id);

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
            // Add unassigned tickets to unassignedTicketIds
            unassignedTicketIds: [
                ...(activeProject.unassignedTicketIds ?? []),
                ...unassigningTicketIds,
            ],
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

        // If adding to an epic, also add the ticket to the epic's ticketIds
        const updatedEpics = epicId
            ? activeProject.epics.map(epic =>
                epic.id === epicId
                    ? {
                        ...epic,
                        ticketIds: [...(epic.ticketIds ?? []), newTicket.id],
                    }
                    : epic
            )
            : activeProject.epics;

        // If adding unassigned ticket, add to unassignedTicketIds
        const updatedUnassignedTicketIds = !epicId
            ? [...(activeProject.unassignedTicketIds ?? []), newTicket.id]
            : activeProject.unassignedTicketIds;

        commitActiveProject({
            tickets: [...activeProject.tickets, newTicket],
            epics: updatedEpics,
            unassignedTicketIds: updatedUnassignedTicketIds,
        });

        setEditingTicketId(newTicket.id);
    }

    function updateTicket(
        ticketId: string,
        updates: Record<string, any>
    ) {
        if (!activeProject) return;

        // Find the current ticket to check for epic changes
        const currentTicket = activeProject.tickets.find(
            t => t.id === ticketId
        );

        if (!currentTicket) {
            return;
        }

        const newEpicId = updates.epicId;
        const oldEpicId = currentTicket.epicId;

        // Update epics if the epic assignment changed
        let updatedEpics = activeProject.epics;
        let updatedUnassignedTicketIds = activeProject.unassignedTicketIds;

        if (newEpicId !== undefined && newEpicId !== oldEpicId) {
            updatedEpics = activeProject.epics.map(epic => {
                // Remove from old epic
                if (epic.id === oldEpicId) {
                    return {
                        ...epic,
                        ticketIds: (epic.ticketIds ?? []).filter(
                            id => id !== ticketId
                        ),
                    };
                }
                // Add to new epic
                if (epic.id === newEpicId) {
                    return {
                        ...epic,
                        ticketIds: [...(epic.ticketIds ?? []), ticketId],
                    };
                }
                return epic;
            });

            // Update unassignedTicketIds
            if (!oldEpicId && newEpicId) {
                // Moving from unassigned to epic - remove from unassigned
                updatedUnassignedTicketIds = (activeProject.unassignedTicketIds ?? []).filter(
                    id => id !== ticketId
                );
            } else if (oldEpicId && !newEpicId) {
                // Moving from epic to unassigned - add to unassigned
                updatedUnassignedTicketIds = [
                    ...(activeProject.unassignedTicketIds ?? []),
                    ticketId,
                ];
            }
        }

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
            epics: updatedEpics,
            unassignedTicketIds: updatedUnassignedTicketIds,
        });
    }

    function deleteTicket(ticketId: string) {
        if (!activeProject) return;

        // Find the ticket to get its epicId
        const ticket = activeProject.tickets.find(
            t => t.id === ticketId
        );

        // Remove from epic's ticketIds if assigned to an epic
        const updatedEpics = ticket?.epicId
            ? activeProject.epics.map(epic =>
                epic.id === ticket.epicId
                    ? {
                        ...epic,
                        ticketIds: (epic.ticketIds ?? []).filter(
                            id => id !== ticketId
                        ),
                    }
                    : epic
            )
            : activeProject.epics;

        // Remove from unassignedTicketIds if unassigned
        const updatedUnassignedTicketIds = !ticket?.epicId
            ? (activeProject.unassignedTicketIds ?? []).filter(
                id => id !== ticketId
            )
            : activeProject.unassignedTicketIds;

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
            epics: updatedEpics,
            unassignedTicketIds: updatedUnassignedTicketIds,
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

        const updatedSprints = activeProject.sprints.map(item =>
            item.id === sprintId
                ? {
                    ...item,
                    active: true,
                    archived: false,
                    startDate: startDate.toISOString().slice(0, 10),
                    endDate: plannedEnd.toISOString().slice(0, 10),
                }
                : { ...item, active: false }
        );

        // Build the initial board for this sprint
        const sprintTickets = activeProject.tickets.filter(
            ticket =>
                sprint.ticketIds.includes(ticket.id)
        );

        const board =
            buildBoardFromTickets(sprintTickets);

        commitActiveProject({
            sprints: updatedSprints,
            board,
        });
    }

    function endSprint(sprintId: string) {
        if (!activeProject) return;

        const endDate = nowIso().slice(0, 10);

        const updatedSprints = activeProject.sprints.map(sprint =>
                sprint.id === sprintId
                    ? {
                        ...sprint,
                        active: false,
                        archived: true,
                        endDate,
                    }
                    : sprint
            );

        commitActiveProject({
            sprints: updatedSprints,
            board: null,
        });
    }

    function deleteSprint(sprintId: string) {
        if (!activeProject) return;

        commitActiveProject({
            sprints: activeProject.sprints.filter(
                sprint => sprint.id !== sprintId
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

    /**
     * Assign a ticket to a sprint at a specific position in the ticketIds array.
     * This is useful for drag-and-drop reordering.
     */
    function assignTicketToSprintAtPosition(
        ticketId: string,
        sprintId: string,
        position: number
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
            sprints: activeProject.sprints.map(sprint => {
                if (sprint.id !== sprintId) {
                    // Remove ticket from other sprints
                    return {
                        ...sprint,
                        ticketIds: sprint.ticketIds.filter(
                            id => id !== ticketId
                        ),
                    };
                }

                // Target sprint - insert at position
                const ticketIds = [...sprint.ticketIds];

                // Remove ticket if already present (moving within sprint)
                const existingIndex = ticketIds.indexOf(ticketId);
                if (existingIndex !== -1) {
                    ticketIds.splice(existingIndex, 1);
                }

                // Clamp position to valid range
                const clampedPosition = Math.min(
                    Math.max(0, position),
                    ticketIds.length
                );

                // Insert at the target position
                ticketIds.splice(clampedPosition, 0, ticketId);

                return {
                    ...sprint,
                    ticketIds,
                };
            }),
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

    /**
     * Reorder a ticket within an epic's ticketIds list.
     * This is useful for drag-and-drop reordering in the backlog.
     */
    function reorderTicketInEpic(
        epicId: string,
        ticketId: string,
        newPosition: number
    ) {
        if (!activeProject) return;

        commitActiveProject({
            epics: activeProject.epics.map(epic => {
                if (epic.id !== epicId) {
                    return epic;
                }

                // Make a copy of the ticketIds array
                const ticketIds = [...(epic.ticketIds ?? [])];

                // Remove the ticket from its current position
                const currentIndex = ticketIds.indexOf(ticketId);
                if (currentIndex === -1) {
                    return epic; // Ticket not in this epic's list
                }
                ticketIds.splice(currentIndex, 1);

                // Clamp position to valid range
                const clampedPosition = Math.min(
                    Math.max(0, newPosition),
                    ticketIds.length
                );

                // Insert at the new position
                ticketIds.splice(clampedPosition, 0, ticketId);

                return {
                    ...epic,
                    ticketIds,
                };
            }),
        });
    }

    /**
     * Move a ticket between containers (epics or unassigned) at a specific position.
     * Empty string targetEpicId means moving to unassigned.
     * This is an atomic operation that handles cross-container drag-and-drop.
     */
    function moveTicketToEpicAtPosition(
        ticketId: string,
        targetEpicId: string,
        position: number
    ) {
        if (!activeProject) return;

        // Find the ticket to get its current epicId
        const ticket = activeProject.tickets.find(
            t => t.id === ticketId
        );

        if (!ticket) {
            return;
        }

        const oldEpicId = ticket.epicId;

        // If moving to the same epic, just reorder within epic
        if (oldEpicId === targetEpicId && oldEpicId) {
            reorderTicketInEpic(targetEpicId, ticketId, position);
            return;
        }

        // If moving within unassigned, just reorder within unassigned
        if (!oldEpicId && !targetEpicId) {
            reorderUnassignedTicket(ticketId, position);
            return;
        }

        // Calculate updated unassignedTicketIds
        let updatedUnassignedTicketIds = activeProject.unassignedTicketIds ?? [];

        // Moving from unassigned to epic - remove from unassigned
        if (!oldEpicId && targetEpicId) {
            updatedUnassignedTicketIds = updatedUnassignedTicketIds.filter(
                id => id !== ticketId
            );
        }
        // Moving from epic to unassigned - add to unassigned at position
        else if (oldEpicId && !targetEpicId) {
            const ticketIds = [...updatedUnassignedTicketIds];
            // Remove if already present (shouldn't happen)
            const existingIndex = ticketIds.indexOf(ticketId);
            if (existingIndex !== -1) {
                ticketIds.splice(existingIndex, 1);
            }
            // Clamp position
            const clampedPosition = Math.min(
                Math.max(0, position),
                ticketIds.length
            );
            // Insert at position
            ticketIds.splice(clampedPosition, 0, ticketId);
            updatedUnassignedTicketIds = ticketIds;
        }

        commitActiveProject({
            // Update the ticket's epicId
            tickets: activeProject.tickets.map(t =>
                t.id === ticketId
                    ? { ...t, epicId: targetEpicId || undefined }
                    : t
            ),
            // Update all epics: remove from old, add to new at position
            epics: activeProject.epics.map(epic => {
                // Handle old epic - remove ticket from its list
                if (epic.id === oldEpicId) {
                    return {
                        ...epic,
                        ticketIds: (epic.ticketIds ?? []).filter(
                            id => id !== ticketId
                        ),
                    };
                }

                // Handle target epic - insert ticket at position (only if targetEpicId is set)
                if (targetEpicId && epic.id === targetEpicId) {
                    const ticketIds = [...(epic.ticketIds ?? [])];

                    // Remove ticket if already present (shouldn't happen, but safety check)
                    const existingIndex = ticketIds.indexOf(ticketId);
                    if (existingIndex !== -1) {
                        ticketIds.splice(existingIndex, 1);
                    }

                    // Clamp position to valid range
                    const clampedPosition = Math.min(
                        Math.max(0, position),
                        ticketIds.length
                    );

                    // Insert at the target position
                    ticketIds.splice(clampedPosition, 0, ticketId);

                    return {
                        ...epic,
                        ticketIds,
                    };
                }

                return epic;
            }),
            unassignedTicketIds: updatedUnassignedTicketIds,
        });
    }

    /**
     * Reorder a ticket within the unassigned tickets list.
     * This is useful for drag-and-drop reordering in the backlog.
     */
    function reorderUnassignedTicket(
        ticketId: string,
        newPosition: number
    ) {
        if (!activeProject) return;

        const unassignedTicketIds = [...(activeProject.unassignedTicketIds ?? [])];

        // Remove the ticket from its current position
        const currentIndex = unassignedTicketIds.indexOf(ticketId);
        if (currentIndex === -1) {
            return; // Ticket not in unassigned list
        }
        unassignedTicketIds.splice(currentIndex, 1);

        // Clamp position to valid range
        const clampedPosition = Math.min(
            Math.max(0, newPosition),
            unassignedTicketIds.length
        );

        // Insert at the new position
        unassignedTicketIds.splice(clampedPosition, 0, ticketId);

        commitActiveProject({
            unassignedTicketIds,
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
                importProject,

                // Legacy single-project access
                project: activeProject,
                setProject: commitActiveProject as any,
                commitActiveProject,

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
                assignTicketToSprintAtPosition,
                removeTicketFromSprint,

                // Epic operations
                addEpic,
                updateEpic,
                deleteEpic,
                reorderTicketInEpic,
                moveTicketToEpicAtPosition,
                reorderUnassignedTicket,

                // Editing state
                editingTicketId,
                setEditingTicketId,
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
}
