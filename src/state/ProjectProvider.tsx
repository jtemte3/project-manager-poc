import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";

import { ProjectContext } from "./ProjectContext";

import { type Project } from "../models/Project";
import { type Epic } from "../models/Epic";
import { type Sprint } from "../models/Sprint";

import { sampleProject } from "../services/SampleProject";
import { normalizeProjectState, syncSprintMetrics } from "../services/ProjectMetrics";

import {
    loadProject,
    saveProject,
} from "../services/ProjectStorage";

interface Props {
    children: React.ReactNode;
}

function nowIso() {
    return new Date().toISOString();
}

export default function ProjectProvider({
    children,
}: Props) {
    const [project, setProject] = useState<Project>(() => {
        const saved = loadProject();

        return normalizeProjectState(saved ?? sampleProject);
    });

    function commitProject(next: Project) {
        setProject(syncSprintMetrics(next));
    }

    useEffect(() => {
        saveProject(project);
    }, [project]);

    const [editingTicketId, setEditingTicketId] =
        useState<string | null>(null);

    function addEpic() {
        const newEpic: Epic = {
            id: uuid(),
            name: "New Epic",
            description: "",
            color: "#2196F3",
        };

        commitProject({
            ...project,
            epics: [...project.epics, newEpic],
        });
    }

    function updateEpic(
        epicId: string,
        updates: Record<string, any>
    ) {
        commitProject({
            ...project,
            epics: project.epics.map(epic =>
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
        commitProject({
            ...project,
            epics: project.epics.filter(
                epic => epic.id !== epicId
            ),
            tickets: project.tickets.map(ticket =>
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

        commitProject({
            ...project,
            tickets: [...project.tickets, newTicket],
        });

        setEditingTicketId(newTicket.id);
    }

    function updateTicket(
        ticketId: string,
        updates: Record<string, any>
    ) {
        commitProject({
            ...project,
            tickets: project.tickets.map(ticket => {
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
        commitProject({
            ...project,
            tickets: project.tickets.filter(
                ticket => ticket.id !== ticketId
            ),
            sprints: project.sprints.map(sprint => ({
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

        commitProject({
            ...project,
            sprints: [...project.sprints, newSprint],
        });

        return newSprint.id;
    }

    function updateSprint(
        sprintId: string,
        updates: Partial<Sprint>
    ) {
        commitProject({
            ...project,
            sprints: project.sprints.map(sprint =>
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
        const sprint = project.sprints.find(
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

        commitProject({
            ...project,
            sprints: project.sprints.map(item =>
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
        const endDate = nowIso().slice(0, 10);

        commitProject({
            ...project,
            sprints: project.sprints.map(sprint =>
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
        commitProject({
            ...project,
            sprints: project.sprints.filter(
                sprint => sprint.id !== sprintId
            ),
            tickets: project.tickets.map(ticket =>
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
        const ticket = project.tickets.find(
            item => item.id === ticketId
        );

        if (!ticket) {
            return;
        }

        commitProject({
            ...project,
            tickets: project.tickets.map(item =>
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
            sprints: project.sprints.map(sprint =>
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
        const ticket = project.tickets.find(
            item => item.id === ticketId
        );

        if (!ticket) {
            return;
        }

        commitProject({
            ...project,
            tickets: project.tickets.map(item =>
                item.id === ticketId
                    ? {
                          ...item,
                          sprintId: undefined,
                          status: "Backlog" as const,
                          doneAt: null,
                      }
                    : item
            ),
            sprints: project.sprints.map(sprint => ({
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
                project,
                setProject: commitProject,
                addTicket,
                updateTicket,
                editingTicketId,
                setEditingTicketId,
                deleteTicket,
                addEpic,
                updateEpic,
                deleteEpic,
                addSprint,
                updateSprint,
                startSprint,
                endSprint,
                deleteSprint,
                assignTicketToSprint,
                removeTicketFromSprint,
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
}
