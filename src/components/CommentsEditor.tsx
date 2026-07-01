import { useState } from "react";

import { type Ticket } from "../models/Ticket";
import { type Comment } from "../models/Comment";

import { useProject } from "../hooks/useProject";

import { createId } from "../utils/createId";

interface Props {
    ticket: Ticket;
}

export default function CommentsEditor({
    ticket,
}: Props) {

    const {
        updateTicket,
    } = useProject();

    const [
        newCommentText,
        setNewCommentText,
    ] = useState("");

    const [
        editingCommentId,
        setEditingCommentId,
    ] = useState<string | null>(null);

    const [
        editText,
        setEditText,
    ] = useState("");

    function addComment() {

        const text =
            newCommentText.trim();

        if (!text) {
            return;
        }

        const newCommentId = createId();

        const newComment: Comment = {
            id: newCommentId,
            text,
            timestamp: new Date().toISOString(),
        };

        updateTicket(
            ticket.id,
            {
                comments: [
                    ...(ticket.comments ?? []),
                    newComment,
                ],
            }
        );

        setNewCommentText("");
    }

    function updateComment(
        commentId: string,
        text: string
    ) {

        updateTicket(
            ticket.id,
            {
                comments:
                    (ticket.comments ?? []).map(
                        comment =>
                            comment.id === commentId
                                ? {
                                    ...comment,
                                    text,
                                }
                                : comment
                    ),
            }
        );
    }

    function deleteComment(
        commentId: string
    ) {

        updateTicket(
            ticket.id,
            {
                comments:
                    (ticket.comments ?? []).filter(
                        comment =>
                            comment.id !== commentId
                    ),
            }
        );
    }

    function startEditing(
        comment: Comment
    ) {
        setEditingCommentId(comment.id);
        setEditText(comment.text);
    }

    function cancelEditing() {
        setEditingCommentId(null);
        setEditText("");
    }

    function saveEditing() {
        if (editingCommentId) {
            updateComment(
                editingCommentId,
                editText.trim()
            );
        }
        setEditingCommentId(null);
        setEditText("");
    }

    function formatTimestamp(
        timestamp: string
    ) {
        const date = new Date(timestamp);
        return date.toLocaleString();
    }

    const handleNewCommentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            addComment();
        }
    };

    const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            saveEditing();
        }
        if (e.key === "Escape") {
            cancelEditing();
        }
    };

    return (
        <div className="comments-editor">
            <h4>
                Comments
            </h4>

            <div className="comments-editor__list">
                {(ticket.comments ?? []).map(
                    comment => (
                        <div
                            key={comment.id}
                            className="comments-editor__item"
                        >
                            <div className="comments-editor__card">
                                <div className="comments-editor__row">
                                    {editingCommentId === comment.id ? (
                                        <div className="comments-editor__edit-form">
                                            <textarea
                                                value={editText}
                                                onChange={e =>
                                                    setEditText(
                                                        e.target.value
                                                    )
                                                }
                                                onKeyDown={
                                                    handleEditKeyDown
                                                }
                                                rows={3}
                                            />
                                            <div className="comments-editor__edit-actions">
                                                <button
                                                    onClick={
                                                        cancelEditing
                                                    }
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={
                                                        saveEditing
                                                    }
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="comments-editor__text">
                                            {comment.text}
                                        </p>
                                    )}

                                    <div className="comments-editor__actions">
                                        {editingCommentId !== comment.id && (
                                            <button
                                                onClick={() =>
                                                    startEditing(
                                                        comment
                                                    )
                                                }
                                            >
                                                Edit
                                            </button>
                                        )}
                                        <button
                                            className="comments-editor__delete"
                                            onClick={() =>
                                                deleteComment(
                                                    comment.id
                                                )
                                            }
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <span className="comments-editor__timestamp">
                                {formatTimestamp(
                                    comment.timestamp
                                )}
                            </span>
                        </div>
                    )
                )}
            </div>

            <div className="comments-editor__add-form">
                <textarea
                    className="comments-editor__add-input"
                    placeholder="Add a comment..."
                    value={newCommentText}
                    onChange={e =>
                        setNewCommentText(
                            e.target.value
                        )
                    }
                    onKeyDown={
                        handleNewCommentKeyDown
                    }
                    rows={2}
                />

                <button
                    onClick={addComment}
                >
                    Add Comment
                </button>
            </div>
        </div>
    );
}