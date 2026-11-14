"use client";

import { Check, Pencil } from "lucide-react";
import { useActionState, useState } from "react";
import { updateDisplayName, type DisplayNameState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { DISPLAY_NAME_MAX_LENGTH } from "@/lib/auth-validation";

export function DisplayNameForm({
    initialName,
}: {
    initialName: string | null;
}) {
    const [editing, setEditing] = useState(false);
    const [state, action, pending] = useActionState<DisplayNameState, FormData>(
        async (prev, formData) => {
            const result = await updateDisplayName(prev, formData);
            // A changed name remounts this form (it's keyed on the name),
            // which closes the editor. An unchanged one keeps this
            // instance, so close it here; Edit can then open it again.
            if (result.saved) setEditing(false);
            return result;
        },
        {},
    );

    if (!editing) {
        return (
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-reading-text-muted">
                        Display name
                    </span>
                    <span className="text-base text-reading-text">
                        {initialName ?? (
                            <span className="text-reading-text-muted">
                                Not set
                            </span>
                        )}
                    </span>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(true)}
                >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    Edit
                </Button>
            </div>
        );
    }

    return (
        <form action={action} noValidate className="flex flex-col gap-3">
            <FormField
                label="Display name"
                name="displayName"
                type="text"
                autoComplete="nickname"
                autoFocus
                maxLength={DISPLAY_NAME_MAX_LENGTH}
                defaultValue={initialName ?? ""}
                placeholder="How should we address you?"
                error={state.error}
            />
            <div className="flex gap-2">
                <Button type="submit" size="sm" loading={pending}>
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    Save
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(false)}
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}
