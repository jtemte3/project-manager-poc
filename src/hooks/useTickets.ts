import { type Project } from "../models/Project";

interface UseTicketsArgs {
  activeProject: Project | null;
  commitActiveProject: (updates: Partial<Project>) => void;
  setEditingTicketId: (id: string | null) => void;
}

export function useTickets({
  activeProject,
  commitActiveProject,
  setEditingTicketId,
}: UseTicketsArgs) {
  function addTicket(epicId?: string) {
    if (!activeProject) return;

    const newTicket = {
      id: crypto.randomUUID(),
      title: "New Ticket",
      description: "",
      epicId,
      complexity: 1,
      doneAt: null,
      status: "Backlog" as const,
      checklist: [],
      comments: [],
    };

    const updatedEpics = epicId
      ? activeProject.epics.map((epic) =>
          epic.id === epicId
            ? { ...epic, ticketIds: [...(epic.ticketIds ?? []), newTicket.id] }
            : epic
        )
      : activeProject.epics;

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

    const currentTicket = activeProject.tickets.find(
      (t) => t.id === ticketId
    );

    if (!currentTicket) return;

    const newEpicId = updates.epicId;
    const oldEpicId = currentTicket.epicId;

    let updatedEpics = activeProject.epics;
    let updatedUnassignedTicketIds = activeProject.unassignedTicketIds;

    if (newEpicId !== undefined && newEpicId !== oldEpicId) {
      updatedEpics = activeProject.epics.map((epic) => {
        if (epic.id === oldEpicId) {
          return {
            ...epic,
            ticketIds: (epic.ticketIds ?? []).filter((id) => id !== ticketId),
          };
        }
        if (epic.id === newEpicId) {
          return {
            ...epic,
            ticketIds: [...(epic.ticketIds ?? []), ticketId],
          };
        }
        return epic;
      });

      if (!oldEpicId && newEpicId) {
        updatedUnassignedTicketIds = (
          activeProject.unassignedTicketIds ?? []
        ).filter((id) => id !== ticketId);
      } else if (oldEpicId && !newEpicId) {
        updatedUnassignedTicketIds = [
          ...(activeProject.unassignedTicketIds ?? []),
          ticketId,
        ];
      }
    }

    commitActiveProject({
      tickets: activeProject.tickets.map((ticket) => {
        if (ticket.id !== ticketId) return ticket;

        const nextTicket = { ...ticket, ...updates };

        if (Object.prototype.hasOwnProperty.call(updates, "status")) {
          if (updates.status === "Done") {
            nextTicket.doneAt =
              ticket.status === "Done" ? ticket.doneAt : new Date().toISOString();
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

    const ticket = activeProject.tickets.find(
      (t) => t.id === ticketId
    );

    const updatedEpics = ticket?.epicId
      ? activeProject.epics.map((epic) =>
          epic.id === ticket.epicId
            ? {
                ...epic,
                ticketIds: (epic.ticketIds ?? []).filter(
                  (id) => id !== ticketId
                ),
              }
            : epic
        )
      : activeProject.epics;

    const updatedUnassignedTicketIds = !ticket?.epicId
      ? (activeProject.unassignedTicketIds ?? []).filter(
          (id) => id !== ticketId
        )
      : activeProject.unassignedTicketIds;

    commitActiveProject({
      tickets: activeProject.tickets.filter(
        (ticket) => ticket.id !== ticketId
      ),
      sprints: activeProject.sprints.map((sprint) => ({
        ...sprint,
        ticketIds: sprint.ticketIds.filter(
          (id) => id !== ticketId
        ),
      })),
      epics: updatedEpics,
      unassignedTicketIds: updatedUnassignedTicketIds,
    });
  }

  function reorderTicketInEpic(
    epicId: string,
    ticketId: string,
    newPosition: number
  ) {
    if (!activeProject) return;

    commitActiveProject({
      epics: activeProject.epics.map((epic) => {
        if (epic.id !== epicId) return epic;

        const ticketIds = [...(epic.ticketIds ?? [])];
        const currentIndex = ticketIds.indexOf(ticketId);
        if (currentIndex === -1) return epic;

        ticketIds.splice(currentIndex, 1);

        const clampedPosition = Math.min(
          Math.max(0, newPosition),
          ticketIds.length
        );

        ticketIds.splice(clampedPosition, 0, ticketId);

        return { ...epic, ticketIds };
      }),
    });
  }

  function moveTicketToEpicAtPosition(
    ticketId: string,
    targetEpicId: string,
    position: number
  ) {
    if (!activeProject) return;

    const ticket = activeProject.tickets.find(
      (t) => t.id === ticketId
    );

    if (!ticket) return;

    const oldEpicId = ticket.epicId;

    if (oldEpicId === targetEpicId && oldEpicId) {
      reorderTicketInEpic(targetEpicId, ticketId, position);
      return;
    }

    if (!oldEpicId && !targetEpicId) {
      reorderUnassignedTicket(ticketId, position);
      return;
    }

    let updatedUnassignedTicketIds = activeProject.unassignedTicketIds ?? [];

    if (!oldEpicId && targetEpicId) {
      updatedUnassignedTicketIds = updatedUnassignedTicketIds.filter(
        (id) => id !== ticketId
      );
    } else if (oldEpicId && !targetEpicId) {
      const ticketIds = [...updatedUnassignedTicketIds];
      const existingIndex = ticketIds.indexOf(ticketId);
      if (existingIndex !== -1) {
        ticketIds.splice(existingIndex, 1);
      }
      const clampedPosition = Math.min(
        Math.max(0, position),
        ticketIds.length
      );
      ticketIds.splice(clampedPosition, 0, ticketId);
      updatedUnassignedTicketIds = ticketIds;
    }

    commitActiveProject({
      tickets: activeProject.tickets.map((t) =>
        t.id === ticketId
          ? { ...t, epicId: targetEpicId || undefined }
          : t
      ),
      epics: activeProject.epics.map((epic) => {
        if (epic.id === oldEpicId) {
          return {
            ...epic,
            ticketIds: (epic.ticketIds ?? []).filter(
              (id) => id !== ticketId
            ),
          };
        }

        if (targetEpicId && epic.id === targetEpicId) {
          const ticketIds = [...(epic.ticketIds ?? [])];
          const existingIndex = ticketIds.indexOf(ticketId);
          if (existingIndex !== -1) {
            ticketIds.splice(existingIndex, 1);
          }
          const clampedPosition = Math.min(
            Math.max(0, position),
            ticketIds.length
          );
          ticketIds.splice(clampedPosition, 0, ticketId);

          return { ...epic, ticketIds };
        }

        return epic;
      }),
      unassignedTicketIds: updatedUnassignedTicketIds,
    });
  }

  function reorderUnassignedTicket(
    ticketId: string,
    newPosition: number
  ) {
    if (!activeProject) return;

    const unassignedTicketIds = [
      ...(activeProject.unassignedTicketIds ?? []),
    ];

    const currentIndex = unassignedTicketIds.indexOf(ticketId);
    if (currentIndex === -1) return;

    unassignedTicketIds.splice(currentIndex, 1);

    const clampedPosition = Math.min(
      Math.max(0, newPosition),
      unassignedTicketIds.length
    );

    unassignedTicketIds.splice(clampedPosition, 0, ticketId);

    commitActiveProject({
      unassignedTicketIds,
    });
  }

  return {
    addTicket,
    updateTicket,
    deleteTicket,
    reorderTicketInEpic,
    moveTicketToEpicAtPosition,
    reorderUnassignedTicket,
  };
}