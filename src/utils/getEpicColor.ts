import { type Project }
from "../models/Project";

export function getEpicColor(
    project: Project,
    epicId?: string
) {

    const epic =
        project.epics.find(
            e => e.id === epicId
        );

    return (
        epic?.color ??
        "#808080"
    );
}