import { useEffect, useState, useMemo } from "react";
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import TicketCard from "../components/TicketCard";
import TicketEditor from "../components/TicketEditor";
import { useProject } from "../hooks/useProject";
import { buildBurndownData, type BurndownMode } from "../services/Burndown";

function formatDate(date: string | null | undefined) {
    return date ?? "—";
}

function CompletionDot({ cx, cy, stroke, shape, payload }: any) {
    if (!payload.completions || payload.completions.length === 0) {
        return null;
    }
    return (
        <circle
            cx={cx}
            cy={cy}
            r={6}
            fill={stroke}
            stroke="#fff"
            strokeWidth={2}
        />
    );
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    const data = payload[0].payload;
    const completions = data.completions;

    return (
        <div className="custom-tooltip">
            <p className="tooltip-label">Day {label}</p>
            <p className="tooltip-value">
                Actual: <strong>{payload[0].value}</strong>
            </p>
            {payload.length > 1 && (
                <p className="tooltip-value">
                    Ideal: <strong>{payload[1].value}</strong>
                </p>
            )}
            {completions && completions.length > 0 && (
                <div className="tooltip-completions">
                    <p className="tooltip-completions-title">
                        Completed:
                    </p>
                    {completions.map((c: any) => (
                        <p key={c.ticketId} className="tooltip-completion-item">
                            {c.title}
                            {c.complexity > 0
                                ? ` (${c.complexity})`
                                : ""}
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function MetricsPage() {
    const { project } = useProject();
    const [selectedSprintId, setSelectedSprintId] =
        useState<string | null>(null);
    const [chartMode, setChartMode] =
        useState<BurndownMode>("tickets");
    const [selectedTicketId, setSelectedTicketId] =
        useState<string | null>(null);

    useEffect(() => {
        if (!project) {
            return;
        }

        if (!project.sprints.length) {
            setSelectedSprintId(null);
            return;
        }

        const sprintExists = project.sprints.some(
            sprint => sprint.id === selectedSprintId
        );

        if (!sprintExists) {
            setSelectedSprintId(
                project.sprints.find(
                    sprint =>
                        sprint.active && !sprint.archived
                )?.id ?? project.sprints[0].id
            );
        }
    }, [project, selectedSprintId]);

    if (!project) {
        return null;
    }

    const selectedSprint =
        selectedSprintId
            ? project.sprints.find(
                sprint => sprint.id === selectedSprintId
            ) ?? null
            : null;

    const selectedSprintTickets =
        selectedSprint
            ? project.tickets.filter(
                ticket =>
                    ticket.sprintId === selectedSprint.id ||
                    selectedSprint.ticketIds.includes(
                        ticket.id
                    )
            )
            : [];

    const selectedTicket =
        project.tickets.find(
            ticket => ticket.id === selectedTicketId
        ) ?? null;

    useEffect(() => {
        setSelectedTicketId(null);
    }, [selectedSprint?.id]);

    useEffect(() => {
        if (
            selectedTicketId &&
            !selectedSprintTickets.some(
                ticket =>
                    ticket.id === selectedTicketId
            )
        ) {
            setSelectedTicketId(null);
        }
    }, [selectedSprintTickets, selectedTicketId]);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setSelectedTicketId(null);
            }
        }

        if (selectedTicket) {
            window.addEventListener(
                "keydown",
                handleKeyDown
            );
        }

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [selectedTicket]);

    const topTicketCount = selectedSprint?.ticketCount ?? 0;
    const topDoneCount =
        selectedSprint?.doneTicketCount ?? 0;
    const topComplexity =
        selectedSprint?.totalComplexity ?? 0;
    const topDoneComplexity =
        selectedSprint?.doneComplexity ?? 0;
    const topState = selectedSprint
        ? selectedSprint.archived
            ? "Archived"
            : selectedSprint.active
                ? "Active"
                : "Planned"
        : "No Sprint Active";
    const burndownData = selectedSprint
        ? buildBurndownData(
            selectedSprint,
            selectedSprintTickets,
            chartMode
        )
        : [{ day: 0, actual: 0, ideal: 0 }];
    const sprintDays = selectedSprint
        ? selectedSprint.durationWeeks * 7
        : 1;

    const chartTitle =
        chartMode === "tickets"
            ? "Burndown by Tickets"
            : "Burndown by Complexity";
    const verticalLabel =
        chartMode === "tickets"
            ? "Tickets Remaining"
            : "Complexity Remaining";

    return (
        <div className="metrics-page">
            <header className="kanban-summary">
                <div className="kanban-summary__title-group">
                    <div className="backlog-eyebrow">
                        Metrics
                    </div>
                    <h1 className="kanban-summary__title">
                        {selectedSprint?.title ??
                            "No Sprint Active"}
                    </h1>

                    <div className="metrics-summary__controls">
                        <label className="sprint-manager__field metrics-sprint-select">
                            <span>Sprint</span>
                            <select
                                value={selectedSprintId ?? ""}
                                onChange={e =>
                                    setSelectedSprintId(
                                        e.target.value || null
                                    )
                                }
                            >
                                {!project.sprints.length && (
                                    <option value="">
                                        No sprints available
                                    </option>
                                )}

                                {project.sprints.map(
                                    sprint => (
                                        <option
                                            key={sprint.id}
                                            value={sprint.id}
                                        >
                                            {sprint.title}
                                            {sprint.active
                                                ? " (Active)"
                                                : ""}
                                            {sprint.archived
                                                ? " (Archived)"
                                                : ""}
                                        </option>
                                    )
                                )}
                            </select>
                        </label>
                    </div>
                </div>

                <div className="kanban-metrics">
                    <div className="kanban-metric">
                        <span>Tickets</span>
                        <strong>{topTicketCount}</strong>
                    </div>

                    <div className="kanban-metric">
                        <span>Done</span>
                        <strong>{topDoneCount}</strong>
                    </div>

                    <div className="kanban-metric">
                        <span>Complexity</span>
                        <strong>{topComplexity}</strong>
                    </div>

                    <div className="kanban-metric">
                        <span>Done Complexity</span>
                        <strong>{topDoneComplexity}</strong>
                    </div>

                    <div className="kanban-metric">
                        <span>State</span>
                        <strong>{topState}</strong>
                    </div>

                    <div className="kanban-metric">
                        <span>End Date</span>
                        <strong>
                            {selectedSprint
                                ? formatDate(
                                    selectedSprint.endDate
                                )
                                : "—"}
                        </strong>
                    </div>
                </div>
            </header>

            <section className="metrics-graph-shell">
                <div className="metrics-graph-shell__header">
                    <div>
                        <div className="backlog-eyebrow">
                            Burndown
                        </div>
                        <h2 className="metrics-graph-shell__title">
                            {chartTitle}
                        </h2>
                    </div>

                    <div className="metrics-mode-toggle">
                        <button
                            type="button"
                            className={
                                chartMode === "tickets"
                                    ? "is-active"
                                    : ""
                            }
                            onClick={() =>
                                setChartMode("tickets")
                            }
                        >
                            Tickets
                        </button>

                        <button
                            type="button"
                            className={
                                chartMode === "complexity"
                                    ? "is-active"
                                    : ""
                            }
                            onClick={() =>
                                setChartMode("complexity")
                            }
                        >
                            Complexity
                        </button>
                    </div>
                </div>

                <div className="metrics-chart">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={burndownData}>
                            <CartesianGrid stroke="#dfe5f0" />
                            <XAxis
                                dataKey="day"
                                type="number"
                                domain={[0, sprintDays]}
                                tickCount={
                                    sprintDays + 1
                                }
                                label={{
                                    value: "Days in Sprint",
                                    position: "insideBottom",
                                    offset: -4,
                                }}
                            />
                            <YAxis
                                allowDecimals={false}
                                domain={[0, "auto"]}
                                label={{
                                    value: verticalLabel,
                                    angle: -90,
                                    position: "insideLeft",
                                }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="actual"
                                name="Actual Remaining"
                                stroke="#5b7cff"
                                strokeWidth={3}
                                dot={CompletionDot}
                            />
                            <Line
                                type="monotone"
                                dataKey="ideal"
                                name="Ideal Remaining"
                                stroke="#94a3b8"
                                strokeDasharray="6 6"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </section>

            <section className="metrics-list-shell">
                <div className="metrics-list-shell__header">
                    <div>
                        <div className="backlog-eyebrow">
                            Sprint Tickets
                        </div>
                        <h2 className="metrics-list-shell__title">
                            Tickets in sprint
                        </h2>
                    </div>

                    <div className="metrics-list-shell__count">
                        {selectedSprintTickets.length}
                    </div>
                </div>

                <div className="metrics-ticket-list">
                    {selectedSprintTickets.map(ticket => (
                        <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            selected={
                                ticket.id ===
                                selectedTicketId
                            }
                            onSelect={() =>
                                setSelectedTicketId(
                                    current =>
                                        current === ticket.id
                                            ? null
                                            : ticket.id
                                )
                            }
                        />
                    ))}
                </div>

                {!selectedSprintTickets.length && (
                    <div className="metrics-empty-state">
                        {selectedSprint
                            ? "No tickets are assigned to this sprint."
                            : "Select a sprint to inspect its tickets."}
                    </div>
                )}
            </section>

            {selectedTicket && (
                <div
                    className="ticket-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Ticket details"
                    onClick={() =>
                        setSelectedTicketId(null)
                    }
                >
                    <div
                        className="ticket-modal__surface"
                        onClick={event =>
                            event.stopPropagation()
                        }
                    >
                        <TicketEditor
                            ticket={selectedTicket}
                            onClose={() =>
                                setSelectedTicketId(null)
                            }
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
