import { type ChecklistItem } from "./ChecklistItem";
import { type Comment } from "./Comment";

export interface Ticket {

  id: string;

  title: string;

  description: string;

  epicId?: string;

  complexity: number;

  doneAt: string | null;

  status:
      | "Backlog"
      | "Todo"
      | "InProgress"
      | "Done";

  checklist: ChecklistItem[];

  comments: Comment[];
}