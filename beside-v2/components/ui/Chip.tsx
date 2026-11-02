import type { ButtonHTMLAttributes, ReactNode } from "react";

type ChipProps = {
  selected?: boolean;
  children: ReactNode;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

/**
 * 36px pill. The ::before pseudo-element extends the hit area to 44px
 * without changing the visual height.
 */
export function Chip({ selected, children, className = "", type = "button", ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={`relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-5 text-body transition-[background-color,transform] duration-150 before:absolute before:inset-x-0 before:-inset-y-1 before:content-[''] active:scale-[0.98] disabled:cursor-not-allowed disabled:border-transparent disabled:bg-disabled disabled:text-ink-3 ${
        selected
          ? "border-ink bg-pink-tint text-ink"
          : "border-line bg-surface text-ink hover:bg-hover"
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
