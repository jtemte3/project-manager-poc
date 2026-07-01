import { type Project } from "../models/Project";
import { type Epic } from "../models/Epic";

interface UseEpicsArgs {
  activeProject: Project | null;
  commitActiveProject: (updates: Partial<Project>) => void;
}

export function useEpics({
  activeProject,
  commitActiveProject,
}: UseEpicsArgs) {
  function addEpic() {
    if (!activeProject) return;

    const newEpic: Epic = {
      id: crypto.randomUUID(),
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
      epics: activeProject.epics.map((epic) =>
        epic.id === epicId
          ? { ...epic, ...updates }
          : epic
      ),
    });
  }

  function deleteEpic(epicId: string) {
    if (!activeProject) return;

    const unassigningTicketIds = activeProject.tickets
      .filter((ticket) => ticket.epicId === epicId)
      .map((ticket) => ticket.id);

    commitActiveProject({
      epics: activeProject.epics.filter(
        (epic) => epic.id !== epicId
      ),
      tickets: activeProject.tickets.map((ticket) =>
        ticket.epicId === epicId
          ? { ...ticket, epicId: undefined }
          : ticket
      ),
      unassignedTicketIds: [
        ...(activeProject.unassignedTicketIds ?? []),
        ...unassigningTicketIds,
      ],
    });
  }

  return { addEpic, updateEpic, deleteEpic };
}
