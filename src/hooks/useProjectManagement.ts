import { type Project } from "../models/Project";
import { normalizeProjectState, syncSprintMetrics } from "../services/ProjectMetrics";
import { sampleProject } from "../services/SampleProject";

interface UseProjectManagementArgs {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  activeProjectId: string | null;
  setActiveProjectIdState: (id: string | null) => void;
}

export function useProjectManagement({
  projects,
  setProjects,
  activeProjectId,
  setActiveProjectIdState,
}: UseProjectManagementArgs) {
  function makeEmptyProject(name: string): Project {
    return normalizeProjectState({
      ...sampleProject,
      id: crypto.randomUUID(),
      name,
    });
  }

  function createProject(name: string) {
    const newProject = makeEmptyProject(name);
    setProjects((prev) => [...prev, newProject]);
    setActiveProjectIdState(newProject.id);
  }

  function updateProject(
    projectId: string,
    updates: Partial<Project>
  ) {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? syncSprintMetrics({ ...project, ...updates })
          : project
      )
    );
  }

  function deleteProject(projectId: string) {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  }

  function setActiveProject(projectId: string | null) {
    setActiveProjectIdState(projectId);
  }

  function importProject(project: Project) {
    const normalized = normalizeProjectState({
      ...project,
      id: crypto.randomUUID(),
    });
    setProjects((prev) => [...prev, normalized]);
    setActiveProjectIdState(normalized.id);
  }

  function commitActiveProject(updates: Partial<Project>) {
    if (!activeProjectId) return;

    setProjects((prev) =>
      prev.map((project) =>
        project.id === activeProjectId
          ? syncSprintMetrics({ ...project, ...updates })
          : project
      )
    );
  }

  return {
    createProject,
    updateProject,
    deleteProject,
    setActiveProject,
    importProject,
    commitActiveProject,
  };
}
