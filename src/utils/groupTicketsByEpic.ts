import { type Project }
from "../models/Project";

export function groupTicketsByEpic(
    project: Project
) {

    return project.epics.map(
        epic => ({

            epic,

            tickets:

                project.tickets.filter(
                    ticket =>
                        ticket.epicId === epic.id
                )

        })
    );
}