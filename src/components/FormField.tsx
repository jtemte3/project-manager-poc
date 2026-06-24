import { type ReactNode } from "react";

interface Props {
    label: string;
    helpText?: string;
    children: ReactNode;
}

export default function FormField({
    label,
    helpText,
    children,
}: Props) {

    return (
        <div
            className="form-field"
            style={{
                marginBottom: "12px",
            }}
        >
            <label
                style={{
                    display: "block",
                    marginBottom: "4px",
                    fontWeight: "bold",
                }}
            >
                {label}
            </label>

            {children}
            {helpText && (
                <div
                    style={{
                        fontSize: "0.85rem",
                        color: "#666",
                        marginBottom: "4px",
                    }}
                >
                    {helpText}
                </div>
            )}
        </div>
    );
}
