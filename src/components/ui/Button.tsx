import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
    // Base styles applied to every variant
    "inline-flex items-center justify-center gap-2 rounded-full font-sans font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-clay focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                primary:
                    "bg-bronze text-linen hover:bg-clay-mid active:bg-dark-clay",
                secondary:
                    "border border-bronze text-bronze hover:bg-bronze/10 active:bg-bronze/20",
                ghost: "text-dark-clay hover:bg-dark-clay/10 active:bg-dark-clay/20",
                destructive:
                    "bg-rust text-linen hover:bg-rust/90 active:bg-rust/80",
            },
            size: {
                sm: "h-8 px-3 text-sm",
                md: "h-10 px-5 text-sm",
                lg: "h-12 px-6 text-base",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "md",
        },
    },
);

interface ButtonProps
    extends
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    loading?: boolean;
}

export function Button({
    className,
    variant,
    size,
    loading,
    disabled,
    children,
    ...props
}: ButtonProps) {
    return (
        <button
            className={cn(buttonVariants({ variant, size }), className)}
            disabled={disabled ?? loading}
            aria-busy={loading}
            {...props}
        >
            {loading && (
                <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                </svg>
            )}
            {children}
        </button>
    );
}
