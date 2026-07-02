import { useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { encodeRichText, decodeRichText } from "../utils/richText";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    minHeight?: string;
}

export default function RichTextEditor({
    value,
    onChange,
    minHeight = "200px",
}: RichTextEditorProps) {
    // Debounce timer reference for auto-save
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounced save function
    const debouncedSave = useCallback((editorInstance: any) => {
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }
        saveTimerRef.current = setTimeout(() => {
            const html = editorInstance.getHTML();
            onChange(encodeRichText(html));
        }, 500); // 500ms debounce
    }, [onChange]);

    // Initialize TipTap editor with HTML output
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
        ],
        content: decodeRichText(value),
        editorProps: {
            attributes: {
                class: "ticket-description-editor",
            },
            handleKeyDown: (_view, event) => {
                // Handle Tab key for list indentation
                if (event.key === "Tab" && !event.ctrlKey && !event.metaKey && !event.altKey) {
                    event.preventDefault();

                    if (event.shiftKey) {
                        // Shift+Tab: Outdent list item
                        editor.chain().focus().liftListItem("listItem").run();
                    } else {
                        // Tab: Indent list item
                        editor.chain().focus().sinkListItem("listItem").run();
                    }

                    return true;
                }
                return false;
            },
        },
        onUpdate: ({ editor: editorInstance }) => {
            debouncedSave(editorInstance);
        },
    });

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
            }
        };
    }, []);

    return (
        <div className="rich-text-container">
            <div className="rich-text-toolbar">
                {/* Text Formatting */}
                <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    className={editor?.isActive("bold") ? "is-active" : ""}
                    title="Bold (Ctrl+B)"
                >
                    <strong>B</strong>
                </button>
                <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    className={editor?.isActive("italic") ? "is-active" : ""}
                    title="Italic (Ctrl+I)"
                >
                    <em>I</em>
                </button>
                <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleUnderline().run()}
                    className={editor?.isActive("underline") ? "is-active" : ""}
                    title="Underline (Ctrl+U)"
                >
                    <u>U</u>
                </button>
                <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleStrike().run()}
                    className={editor?.isActive("strike") ? "is-active" : ""}
                    title="Strikethrough"
                >
                    <s>S</s>
                </button>
                <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleCode().run()}
                    className={editor?.isActive("code") ? "is-active" : ""}
                    title="Inline Code"
                >
                    {'< >'}
                </button>

                <div className="toolbar-separator" />

                {/* Headings */}
                <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={editor?.isActive("heading", { level: 1 }) ? "is-active" : ""}
                    title="Heading 1"
                >
                    H1
                </button>
                <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={editor?.isActive("heading", { level: 2 }) ? "is-active" : ""}
                    title="Heading 2"
                >
                    H2
                </button>
                <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={editor?.isActive("heading", { level: 3 }) ? "is-active" : ""}
                    title="Heading 3"
                >
                    H3
                </button>

                <div className="toolbar-separator" />

                {/* Lists */}
                <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    className={editor?.isActive("bulletList") ? "is-active" : ""}
                    title="Bullet List"
                >
                    • List
                </button>
                <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    className={editor?.isActive("orderedList") ? "is-active" : ""}
                    title="Ordered List"
                >
                    1. List
                </button>

                <div className="toolbar-separator" />

                {/* Block Elements */}
                <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                    className={editor?.isActive("blockquote") ? "is-active" : ""}
                    title="Blockquote"
                >
                    ❝ Quote
                </button>
                <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                    className={editor?.isActive("codeBlock") ? "is-active" : ""}
                    title="Code Block"
                >
                    {'{ }'} Block
                </button>
                <button
                    type="button"
                    onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                    title="Horizontal Rule"
                >
                    — Rule
                </button>

                <div className="toolbar-separator" />

                {/* History */}
                <button
                    type="button"
                    onClick={() => editor?.chain().focus().undo().run()}
                    disabled={!editor?.can().undo()}
                    title="Undo (Ctrl+Z)"
                >
                    ↶ Undo
                </button>
                <button
                    type="button"
                    onClick={() => editor?.chain().focus().redo().run()}
                    disabled={!editor?.can().redo()}
                    title="Redo (Ctrl+Y)"
                >
                    ↷ Redo
                </button>

                <div className="toolbar-separator" />

                {/* Clear Formatting */}
                <button
                    type="button"
                    onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
                    title="Clear Formatting"
                >
                    ✕ Clear
                </button>
            </div>
            <EditorContent
                editor={editor}
                style={{ minHeight }}
            />
        </div>
    );
}
