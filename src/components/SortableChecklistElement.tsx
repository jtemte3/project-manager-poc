import { useRef, useEffect } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { type ChecklistItem } from "../models/ChecklistItem";

interface Props {
    item: ChecklistItem;
    onToggle: (itemId: string) => void;
    onUpdateText: (itemId: string, text: string) => void;
    onDelete: (itemId: string) => void;
    onAddItem: (itemId: string) => void;
    shouldFocus: boolean;
}

export default function SortableChecklistElement({
    item,
    onToggle,
    onUpdateText,
    onDelete,
    onAddItem,
    shouldFocus,
}: Props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: item.id,
    });

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (shouldFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [shouldFocus]);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            onAddItem(item.id);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
            }}
            {...attributes}
        >
            {/* Drag handle - only this triggers drag */}
            <span
                {...listeners}
                style={{
                    cursor: "grab",
                    color: "#999",
                    fontSize: "16px",
                    userSelect: "none",
                    padding: "0 4px",
                }}
                title="Drag to reorder"
            >
                ⠿
            </span>

            <input
                type="checkbox"
                checked={item.complete}
                onChange={() => onToggle(item.id)}
            />

            <input
                ref={inputRef}
                style={{
                    flex: 1,
                    textDecoration: item.complete ? "line-through" : "none",
                    color: item.complete ? "gray" : "inherit",
                }}
                value={item.text}
                onChange={e => onUpdateText(item.id, e.target.value)}
                onKeyDown={handleKeyDown}
            />

            <button
                onClick={() => onDelete(item.id)}
            >
                Delete
            </button>
        </div>
    );
}
