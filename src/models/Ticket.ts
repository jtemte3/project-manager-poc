import { type ChecklistItem } from "./ChecklistItem";

export interface Ticket {

  id: string;

  title: string;

  description: string;

  epicId?: string;

  complexity: number;

  sprintId?: string;

  doneAt: string | null;

  status:
      | "Backlog"
      | "Todo"
      | "InProgress"
      | "Done";

  checklist: ChecklistItem[];
}
