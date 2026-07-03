import { useRef, useEffect, useState } from "react";

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
    isVisible: boolean;
}

export default function SortableChecklistElement({
    item,
    onToggle,
    onUpdateText,
    onDelete,
    onAddItem,
    shouldFocus,
    isVisible,
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

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [rows, setRows] = useState(1);

    useEffect(() => {
        if (shouldFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [shouldFocus]);

    const updateTextareaRows = () => {
        if (textareaRef.current) {
            const textarea = textareaRef.current;
            const computedStyle = window.getComputedStyle(textarea);

            // Get textarea inner width (client width minus horizontal padding)
            const paddingLeft = parseFloat(computedStyle.paddingLeft);
            const paddingRight = parseFloat(computedStyle.paddingRight);
            const availableWidth = textarea.clientWidth - paddingLeft - paddingRight;

            // Skip if textarea is not visible (width is 0)
            if (availableWidth <= 0) return;

            // Build font string from computed styles
            const font = `${computedStyle.fontWeight} ${computedStyle.fontSize} ${computedStyle.fontFamily}`;

            // Use canvas to measure text wrapping
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            if (context) {
                context.font = font;

                const words = item.text.split(" ");
                let lineCount = 1;
                let currentLineWidth = 0;

                for (const word of words) {
                    const wordWidth = context.measureText(word).width;
                    const spaceWidth = context.measureText(" ").width;

                    if (currentLineWidth + wordWidth > availableWidth) {
                        // Word doesn't fit on current line, wrap to next
                        lineCount++;
                        currentLineWidth = wordWidth;
                    } else {
                        // Word fits on current line
                        currentLineWidth += wordWidth + spaceWidth;
                    }
                }

                setRows(Math.max(1, lineCount));
            }
        }
    };

    useEffect(() => {
        if (!isVisible) return;

        // Run immediately when panel becomes visible
        updateTextareaRows();

        // Run every 100ms while panel is visible
        const interval = setInterval(updateTextareaRows, 100);

        return () => clearInterval(interval);
    }, [isVisible, item.text]);

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

    const handleKeyDownTextArea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
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

            {/* <input
                className="checkbox-inputfield"
                ref={inputRef}
                style={{
                    flex: 1,
                    textDecoration: item.complete ? "line-through" : "none",
                    color: item.complete ? "gray" : "inherit",
                }}
                value={item.text}
                onChange={e => onUpdateText(item.id, e.target.value)}
                onKeyDown={handleKeyDown}
            /> */}

            <textarea
                ref={textareaRef}
                rows={rows}
                className="checklist-textarea"
                style={{
                    textDecoration: item.complete ? "line-through" : "none",
                    color: item.complete ? "gray" : "inherit",
                }}
                value={item.text}
                onChange={e => onUpdateText(item.id, e.target.value)}
                onKeyDown={handleKeyDownTextArea}
            />

            <button className="checklist-delete-button"
                onClick={() => onDelete(item.id)}
            >
                X
            </button>
        </div>
    );
}
