import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const cardVariants = cva("rounded-lg bg-reading-surface transition-colors", {
    variants: {
        border: {
            true: "border border-reading-divider",
            false: "",
        },
        shadow: {
            none: "",
            sm: "shadow-sm",
            md: "shadow-md",
        },
        padding: {
            none: "",
            sm: "p-4",
            md: "p-6",
            lg: "p-8",
        },
    },
    defaultVariants: {
        border: true,
        shadow: "none",
        padding: "none",
    },
});

interface CardProps
    extends
        React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof cardVariants> {}

export function Card({
    className,
    border,
    shadow,
    padding,
    children,
    ...props
}: CardProps) {
    return (
        <div
            className={cn(cardVariants({ border, shadow, padding }), className)}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "border-b border-reading-divider px-6 py-4",
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardBody({
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("px-6 py-4", className)} {...props}>
            {children}
        </div>
    );
}

export function CardFooter({
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "border-t border-reading-divider px-6 py-4",
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}
