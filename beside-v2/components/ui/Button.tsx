"use client";

import Link from "next/link";
import { useId, type ButtonHTMLAttributes, type ReactNode, type Ref } from "react";

type Variant = "primary" | "secondary" | "ghost";

type ButtonProps = {
  variant?: Variant;
  /** Under-a-second operations only. Longer work gets a skeleton or step screen. */
  loading?: boolean;
  /** Shown under a disabled button so the user always knows why. */
  reason?: string;
  href?: string;
  className?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

const base =
  "group relative inline-flex w-full select-none items-center rounded-btn text-body transition-[background-color,transform] duration-150 active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary: "h-14 bg-pink text-ink active:bg-pink-pressed",
  secondary: "h-14 justify-center border-[1.5px] border-ink bg-canvas px-5 text-ink",
  ghost: "h-11 justify-center px-5 text-ink underline underline-offset-2",
};

const disabledStyles: Record<Variant, string> = {
  primary: "h-14 bg-disabled text-ink-2 cursor-not-allowed active:scale-100",
  secondary: "h-14 justify-center border-[1.5px] border-line px-5 text-ink-2 cursor-not-allowed active:scale-100",
  ghost: "h-11 justify-center px-5 text-ink-2 cursor-not-allowed active:scale-100",
};

export function Button({
  variant = "primary",
  loading = false,
  reason,
  href,
  className = "",
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  const reasonId = useId();
  const isDisabled = disabled || loading;
  const layout =
    variant === "primary" ? "justify-center px-5" : "";
  const classes = `${base} ${disabled ? disabledStyles[variant] : variants[variant]} ${layout} ${className}`;

  const inner = (
    <>
      <span className={loading ? "opacity-60" : undefined}>{children}</span>
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={classes}>
        {inner}
      </Link>
    );
  }

  return (
    <div className="w-full">
      <button
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        aria-describedby={disabled && reason ? reasonId : undefined}
        className={classes}
        {...rest}
      >
        {inner}
      </button>
      {disabled && reason ? (
        <p id={reasonId} className="mt-2 text-center text-caption text-ink-2">
          {reason}
        </p>
      ) : null}
    </div>
  );
}

export function IconButton({
  label,
  children,
  href,
  className = "",
  ref,
  ...rest
}: {
  label: string;
  children: ReactNode;
  href?: string;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">) {
  const classes = `inline-flex size-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-line bg-surface text-ink transition-[background-color,transform] duration-150 hover:bg-hover active:scale-[0.98] ${className}`;
  if (href) {
    return (
      <Link href={href} aria-label={label} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button ref={ref} type="button" aria-label={label} className={classes} {...rest}>
      {children}
    </button>
  );
}
