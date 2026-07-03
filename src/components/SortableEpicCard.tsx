import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import EpicCard from "./EpicCard";
import { type Epic } from "../models/Epic";

interface Props {
    epic: Epic;
    expanded: boolean;
    onToggle: () => void;
    onSelect?: () => void;
}

export default function SortableEpicCard({
    epic,
    expanded,
    onToggle,
    onSelect,
}: Props) {

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: epic.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
        >
            <EpicCard
                epic={epic}
                expanded={expanded}
                onToggle={onToggle}
                onSelect={onSelect}
            />
        </div>
    );
}
