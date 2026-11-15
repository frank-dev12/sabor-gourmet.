import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const variantes = {
  primary: "bg-amber-600 text-white shadow-sm hover:bg-amber-700 focus-visible:outline-amber-600",
  secondary: "bg-white text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-stone-50 focus-visible:outline-stone-400",
  danger: "bg-white text-red-600 ring-1 ring-inset ring-red-200 hover:bg-red-50 focus-visible:outline-red-500",
  ghost: "text-stone-600 hover:bg-stone-100 focus-visible:outline-stone-400",
} as const;

const tamanos = {
  sm: "h-8 px-2.5 text-xs",
  md: "h-10 px-4 text-sm",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variantes;
  size?: keyof typeof tamanos;
  loading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        variantes[variant],
        tamanos[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />
      )}
      {children}
    </button>
  );
}
