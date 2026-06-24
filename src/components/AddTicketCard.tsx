interface Props {
    onClick: () => void;
}

export default function AddTicketCard({
    onClick,
}: Props) {
    return (
        <button
            type="button"
            className="add-ticket-card"
            onClick={onClick}
        >
            + Add Ticket
        </button>
    );
}
