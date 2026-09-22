import { useId } from "react";
import { cn } from "@/lib/cn";

interface FormFieldProps extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "id"
> {
    label: string;
    error?: string;
    hint?: string;
}

export function FormField({
    label,
    error,
    hint,
    className,
    ...inputProps
}: FormFieldProps) {
    const id = useId();
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;
    const describedBy =
        [error ? errorId : null, hint ? hintId : null]
            .filter(Boolean)
            .join(" ") || undefined;

    return (
        <div className="flex flex-col gap-1.5">
            <label
                htmlFor={id}
                className="text-xs font-medium text-reading-text-muted"
            >
                {label}
            </label>
            <input
                id={id}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                className={cn(
                    "h-11 w-full rounded-md border bg-reading-surface-raised px-3 text-base text-reading-text",
                    "placeholder:text-reading-text-muted",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus focus-visible:ring-offset-2 focus-visible:ring-offset-reading-bg",
                    error
                        ? "border-reading-danger"
                        : "border-reading-border-strong",
                    className,
                )}
                {...inputProps}
            />
            {hint && !error && (
                <p id={hintId} className="text-xs text-reading-text-muted">
                    {hint}
                </p>
            )}
            {error && (
                <p
                    id={errorId}
                    role="alert"
                    className="text-xs text-reading-danger"
                >
                    {error}
                </p>
            )}
        </div>
    );
}
