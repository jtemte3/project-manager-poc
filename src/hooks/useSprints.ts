import { type Project } from "../models/Project";
import { type Sprint } from "../models/Sprint";
import { buildBoardFromTickets } from "../utils/buildBoardFromTickets";

interface UseSprintsArgs {
  activeProject: Project | null;
  commitActiveProject: (updates: Partial<Project>) => void;
}

export function useSprints({
  activeProject,
  commitActiveProject,
}: UseSprintsArgs) {
  function addSprint(
    title: string,
    durationWeeks: Sprint["durationWeeks"]
  ) {
    if (!activeProject) return "";

    const newSprint: Sprint = {
      id: crypto.randomUUID(),
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
      sprints: activeProject.sprints.map((sprint) =>
        sprint.id === sprintId
          ? { ...sprint, ...updates }
          : sprint
      ),
    });
  }

  function startSprint(sprintId: string) {
    if (!activeProject) return;

    const sprint = activeProject.sprints.find(
      (item) => item.id === sprintId
    );

    if (!sprint || sprint.archived) return;

    const startDate = new Date();
    const plannedEnd = new Date(startDate);
    plannedEnd.setDate(plannedEnd.getDate() + sprint.durationWeeks * 7);

    const updatedSprints = activeProject.sprints.map((item) =>
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

    const sprintTickets = activeProject.tickets.filter(
      (ticket) => sprint.ticketIds.includes(ticket.id)
    );

    const board = buildBoardFromTickets(sprintTickets);

    commitActiveProject({
      sprints: updatedSprints,
      board,
    });
  }

  function endSprint(sprintId: string) {
    if (!activeProject) return;

    const endDate = new Date().toISOString().slice(0, 10);

    const updatedSprints = activeProject.sprints.map((sprint) =>
      sprint.id === sprintId
        ? { ...sprint, active: false, archived: true, endDate }
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
        (sprint) => sprint.id !== sprintId
      ),
    });
  }

  function assignTicketToSprint(
    ticketId: string,
    sprintId: string
  ) {
    if (!activeProject) return;

    const ticket = activeProject.tickets.find(
      (item) => item.id === ticketId
    );

    if (!ticket) return;

    commitActiveProject({
      tickets: activeProject.tickets.map((item) =>
        item.id === ticketId
          ? {
              ...item,
              sprintId,
              status:
                item.status === "Backlog" ? "Todo" : item.status,
            }
          : item
      ),
      sprints: activeProject.sprints.map((sprint) =>
        sprint.id === sprintId
          ? {
              ...sprint,
              ticketIds: sprint.ticketIds.includes(ticketId)
                ? sprint.ticketIds
                : [...sprint.ticketIds, ticketId],
            }
          : {
              ...sprint,
              ticketIds: sprint.ticketIds.filter(
                (id) => id !== ticketId
              ),
            }
      ),
    });
  }

  function assignTicketToSprintAtPosition(
    ticketId: string,
    sprintId: string,
    position: number
  ) {
    if (!activeProject) return;

    const ticket = activeProject.tickets.find(
      (item) => item.id === ticketId
    );

    if (!ticket) return;

    commitActiveProject({
      tickets: activeProject.tickets.map((item) =>
        item.id === ticketId
          ? {
              ...item,
              sprintId,
              status:
                item.status === "Backlog" ? "Todo" : item.status,
            }
          : item
      ),
      sprints: activeProject.sprints.map((sprint) => {
        if (sprint.id !== sprintId) {
          return {
            ...sprint,
            ticketIds: sprint.ticketIds.filter(
              (id) => id !== ticketId
            ),
          };
        }

        const ticketIds = [...sprint.ticketIds];
        const existingIndex = ticketIds.indexOf(ticketId);
        if (existingIndex !== -1) {
          ticketIds.splice(existingIndex, 1);
        }

        const clampedPosition = Math.min(
          Math.max(0, position),
          ticketIds.length
        );

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
      (item) => item.id === ticketId
    );

    if (!ticket) return;

    commitActiveProject({
      tickets: activeProject.tickets.map((item) =>
        item.id === ticketId
          ? {
              ...item,
              sprintId: undefined,
              status: "Backlog" as const,
              doneAt: null,
            }
          : item
      ),
      sprints: activeProject.sprints.map((sprint) => ({
        ...sprint,
        ticketIds: sprint.ticketIds.filter(
          (id) => id !== ticketId
        ),
      })),
    });
  }

  return {
    addSprint,
    updateSprint,
    startSprint,
    endSprint,
    deleteSprint,
    assignTicketToSprint,
    assignTicketToSprintAtPosition,
    removeTicketFromSprint,
  };
}
