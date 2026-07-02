import { useState } from "react";

import { type Ticket } from "../models/Ticket";
import { type Comment } from "../models/Comment";

import { useProject } from "../hooks/useProject";

import { createId } from "../utils/createId";
import { decodeRichText } from "../utils/richText";
import RichTextEditor from "./RichTextEditor";

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
        newCommentContent,
        setNewCommentContent,
    ] = useState("");

    const [
        editingCommentId,
        setEditingCommentId,
    ] = useState<string | null>(null);

    const [
        editContent,
        setEditContent,
    ] = useState("");

    const [
        showNewCommentForm,
        setShowNewCommentForm,
    ] = useState(false);

    function addComment() {

        const content =
            newCommentContent.trim();

        if (!content) {
            return;
        }

        const newCommentId = createId();

        const newComment: Comment = {
            id: newCommentId,
            content,
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

        setNewCommentContent("");
        setShowNewCommentForm(false);
    }

    function updateComment(
        commentId: string,
        content: string
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
                                    content,
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
        setEditContent(comment.content);
    }

    function cancelEditing() {
        setEditingCommentId(null);
        setEditContent("");
    }

    function saveEditing() {
        if (editingCommentId) {
            updateComment(
                editingCommentId,
                editContent.trim()
            );
        }
        setEditingCommentId(null);
        setEditContent("");
    }

    function formatTimestamp(
        timestamp: string
    ) {
        const date = new Date(timestamp);
        return date.toLocaleString();
    }

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
                                            <RichTextEditor
                                                value={editContent}
                                                onChange={setEditContent}
                                                minHeight="100px"
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
                                        <div className="comments-editor__text">
                                            <div dangerouslySetInnerHTML={{ __html: decodeRichText(comment.content) }} />
                                        </div>
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
                {showNewCommentForm ? (
                    <>
                        <RichTextEditor
                            value={newCommentContent}
                            onChange={setNewCommentContent}
                            minHeight="80px"
                        />
                        <div className="comments-editor__add-actions">
                            <button
                                onClick={() => setShowNewCommentForm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addComment}
                            >
                                Add Comment
                            </button>
                        </div>
                    </>
                ) : (
                    <button
                        className="comments-editor__add-button"
                        onClick={() => setShowNewCommentForm(true)}
                    >
                        + Add Comment
                    </button>
                )}
            </div>
        </div>
    );
}
