import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "danger";
type Size = "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-accent text-black hover:bg-accent-hover disabled:bg-muted2 disabled:text-surface disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-muted border border-border2 hover:text-text hover:bg-surface2",
  danger: "bg-transparent text-danger border border-danger hover:bg-danger hover:text-white",
};

const SIZE_CLASSES: Record<Size, string> = {
  md: "px-3.5 py-2 text-xs",
  sm: "px-2.5 py-[5px] text-[11px]",
};

/** Shared button styling ported from .btn / .btn-primary / .btn-ghost / .btn-danger / .btn-sm. */
export function Button({
  variant = "ghost",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded font-medium transition-all duration-150 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
