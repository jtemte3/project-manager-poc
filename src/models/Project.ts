import { type Epic } from "./Epic";
import { type Sprint } from "./Sprint";
import { type Ticket } from "./Ticket";
import { type Board } from "./Board";

export interface Project {
    id: string;

    name: string;

    epics: Epic[];

    sprints: Sprint[];

    tickets: Ticket[];

    board: Board | null;
}