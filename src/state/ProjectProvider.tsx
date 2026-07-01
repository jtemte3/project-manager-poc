import { useEffect, useState, useMemo } from "react";

import { ProjectContext } from "./ProjectContext";

import { type Project } from "../models/Project";

import {
  loadProjects,
  saveProjects,
  loadActiveProjectId,
  saveActiveProjectId,
  loadProject,
  clearProject,
} from "../services/ProjectStorage";

import { useProjectManagement } from "../hooks/useProjectManagement";
import { useTickets } from "../hooks/useTickets";
import { useSprints } from "../hooks/useSprints";
import { useEpics } from "../hooks/useEpics";

interface Props {
  children: React.ReactNode;
}

export default function ProjectProvider({ children }: Props) {
  const [projects, setProjects] = useState<Project[]>(() => {
    const loaded = loadProjects();

    if (loaded.length === 0) {
      const legacy = loadProject();
      if (legacy) {
        clearProject();
        return [legacy];
      }
    }

    return loaded;
  });

  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(
    () => {
      const saved = loadActiveProjectId();
      return saved && projects.find((p) => p.id === saved)
        ? saved
        : projects[0]?.id ?? null;
    }
  );

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  useEffect(() => {
    saveActiveProjectId(activeProjectId);
  }, [activeProjectId]);

  useEffect(() => {
    if (activeProjectId && !projects.find((p) => p.id === activeProjectId)) {
      setActiveProjectIdState(projects[0]?.id ?? null);
    }
  }, [projects, activeProjectId]);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId]
  );

  // --- Domain Hooks ---
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);

  const projectManagement = useProjectManagement({
    projects,
    setProjects,
    activeProjectId,
    setActiveProjectIdState,
  });

  const tickets = useTickets({
    activeProject,
    commitActiveProject: projectManagement.commitActiveProject,
    setEditingTicketId,
  });

  const sprints = useSprints({
    activeProject,
    commitActiveProject: projectManagement.commitActiveProject,
  });

  const epics = useEpics({
    activeProject,
    commitActiveProject: projectManagement.commitActiveProject,
  });

  return (
    <ProjectContext.Provider
      value={{
        // Multi-project state
        projects,
        activeProjectId,
        activeProject,

        // Project CRUD
        createProject: projectManagement.createProject,
        updateProject: projectManagement.updateProject,
        deleteProject: projectManagement.deleteProject,
        setActiveProject: projectManagement.setActiveProject,
        importProject: projectManagement.importProject,

        // Legacy single-project access
        project: activeProject,
        setProject: projectManagement.commitActiveProject as any,
        commitActiveProject: projectManagement.commitActiveProject,

        // Ticket operations
        addTicket: tickets.addTicket,
        updateTicket: tickets.updateTicket,
        deleteTicket: tickets.deleteTicket,
        reorderTicketInEpic: tickets.reorderTicketInEpic,
        moveTicketToEpicAtPosition: tickets.moveTicketToEpicAtPosition,
        reorderUnassignedTicket: tickets.reorderUnassignedTicket,

        // Sprint operations
        addSprint: sprints.addSprint,
        updateSprint: sprints.updateSprint,
        startSprint: sprints.startSprint,
        endSprint: sprints.endSprint,
        deleteSprint: sprints.deleteSprint,
        assignTicketToSprint: sprints.assignTicketToSprint,
        assignTicketToSprintAtPosition:
          sprints.assignTicketToSprintAtPosition,
        removeTicketFromSprint: sprints.removeTicketFromSprint,

        // Epic operations
        addEpic: epics.addEpic,
        updateEpic: epics.updateEpic,
        deleteEpic: epics.deleteEpic,

        // Editing state
        editingTicketId,
        setEditingTicketId,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}
