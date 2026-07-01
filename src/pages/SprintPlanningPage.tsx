import { useEffect, useState } from "react";

import SprintBacklog from "../modules/SprintBacklog";
import SprintManager from "../modules/SprintManager";
import { useProject } from "../hooks/useProject";
import { getEpicColor } from "../utils/getEpicColor";
import { type Sprint } from "../models/Sprint";

import "../styles/modules/SprintBacklog.css";
import "../styles/modules/SprintManager.css";

function formatDateRange(
    startDate: string | null,
    endDate: string | null
) {
    if (!startDate || !endDate) {
        return "Not started";
    }

    return `${startDate} to ${endDate}`;
}

export default function SprintPlanningPage() {
    const {
        project,
        addSprint,
        updateSprint,
        startSprint,
        endSprint,
        deleteSprint,
        assignTicketToSprint,
        removeTicketFromSprint,
    } = useProject();

    const [selectedSprintId, setSelectedSprintId] =
        useState<string | null>(null);
    const [selectedBacklogTicketId, setSelectedBacklogTicketId] =
        useState<string | null>(null);
    const [selectedSprintTicketId, setSelectedSprintTicketId] =
        useState<string | null>(null);
    const [selectedEpicId, setSelectedEpicId] =
        useState<string | null>(null);
    const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!project) {
            return;
        }

        if (!project.sprints.length) {
            setSelectedSprintId(null);
            return;
        }

        if (selectedSprintId === null) {
            return;
        }

        const sprintExists =
            project.sprints.some(
                sprint =>
                    sprint.id === selectedSprintId
            );

        if (!sprintExists) {
            setSelectedSprintId(
                project.sprints.find(
                    sprint => sprint.active
                )?.id ?? null
            );
        }
    }, [project, selectedSprintId]);

    useEffect(() => {
        setSelectedBacklogTicketId(null);
        setSelectedSprintTicketId(null);
    }, [selectedSprintId]);

    const toggleEpic = (epicId: string) => {
        setExpandedEpics(prev => {
            const next = new Set(prev);
            if (next.has(epicId)) {
                next.delete(epicId);
            } else {
                next.add(epicId);
            }
            return next;
        });
    };

    if (!project) {
        return null;
    }

    const selectedSprint =
        selectedSprintId
            ? project.sprints.find(
                sprint =>
                    sprint.id === selectedSprintId
            ) ?? null
            : null;

    const visibleBacklogTickets =
        selectedSprint
            ? project.tickets.filter(
                ticket =>
                    ticket.status !== "Done" &&
                    !selectedSprint.ticketIds.includes(
                        ticket.id
                    )
            )
            : project.tickets.filter(
                ticket => ticket.status !== "Done"
            );

    const selectedSprintTickets =
        selectedSprint
            ? project.tickets.filter(
                ticket =>
                    selectedSprint.ticketIds.includes(
                        ticket.id
                    )
            )
            : [];

    const backlogGroups = project.epics.map(
        epic => ({
            epic,
            color: getEpicColor(project, epic.id),
            tickets: visibleBacklogTickets.filter(
                ticket =>
                    ticket.epicId === epic.id
            ),
        })
    );

    const unassignedTickets =
        visibleBacklogTickets.filter(
            ticket =>
                !ticket.epicId
        );

    function handleCreateSprint() {
        if (!project) {
            return;
        }

        const title =
            `New Sprint ${project.sprints.length + 1}`;

        const sprintId = addSprint(
            title,
            2
        );

        setSelectedSprintId(sprintId);
    }

    function handleSprintToggle() {
        if (!selectedSprint) {
            return;
        }

        if (selectedSprint.active) {
            endSprint(selectedSprint.id);
            return;
        }

        startSprint(selectedSprint.id);
    }

    function handleDeleteSprint() {
        if (!selectedSprint) {
            return;
        }

        deleteSprint(selectedSprint.id);
        setSelectedSprintId(null);
        setSelectedBacklogTicketId(null);
        setSelectedSprintTicketId(null);
    }

    function handleAddSelectedTicket() {
        if (
            !selectedSprint ||
            selectedSprint.archived ||
            !selectedBacklogTicketId
        ) {
            return;
        }

        assignTicketToSprint(
            selectedBacklogTicketId,
            selectedSprint.id
        );
        setSelectedBacklogTicketId(null);
    }

    function handleRemoveSelectedTicket() {
        if (
            !selectedSprint ||
            selectedSprint.archived ||
            !selectedSprintTicketId
        ) {
            return;
        }

        removeTicketFromSprint(
            selectedSprintTicketId
        );
        setSelectedSprintTicketId(null);
    }

    function handleSelectBacklogTicket(ticketId: string | null) {
        setSelectedBacklogTicketId(ticketId);
        setSelectedSprintTicketId(null);
    }

    function handleSelectSprintTicket(ticketId: string | null) {
        setSelectedSprintTicketId(ticketId);
        setSelectedBacklogTicketId(null);
    }

    return (
        <div className="backlog-page sprint-page">
            <SprintBacklog
                projectName={project.name}
                backlogGroups={backlogGroups}
                unassignedTickets={unassignedTickets}
                selectedBacklogTicketId={selectedBacklogTicketId}
                selectedEpicId={selectedEpicId}
                expandedEpics={expandedEpics}
                onToggleEpic={(epicId) => {
                    setSelectedEpicId(epicId);
                    toggleEpic(epicId);
                }}
                onSelectBacklogTicket={handleSelectBacklogTicket}
            />

            <SprintManager
                project={project}
                selectedSprint={selectedSprint}
                selectedSprintId={selectedSprintId}
                selectedSprintTicketId={selectedSprintTicketId}
                selectedBacklogTicketId={selectedBacklogTicketId}
                selectedSprintTickets={selectedSprintTickets}
                formatDateRange={formatDateRange}
                onCreateSprint={handleCreateSprint}
                onSelectSprint={setSelectedSprintId}
                onToggleSprint={handleSprintToggle}
                onDeleteSprint={handleDeleteSprint}
                onAddSelectedTicket={handleAddSelectedTicket}
                onRemoveSelectedTicket={handleRemoveSelectedTicket}
                onSelectSprintTicket={handleSelectSprintTicket}
                onUpdateSprint={updateSprint}
            />
        </div>
    );
}
