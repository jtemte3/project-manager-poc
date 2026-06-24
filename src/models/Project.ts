import { type Epic } from "./Epic";
import { type Sprint } from "./Sprint";
import { type Ticket } from "./Ticket";

export interface Project {
  id: string;

  name: string;

  epics: Epic[];

  sprints: Sprint[];

  tickets: Ticket[];
}