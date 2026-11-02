"use client";

import { useId, type InputHTMLAttributes } from "react";
import { WarningCircle } from "@phosphor-icons/react/ssr";
import { ICON } from "@/lib/icons";

type InputProps = {
  label: string;
  prefix?: string;
  helper?: string;
  error?: string | null;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "prefix">;

/** Label above, helper below, error below that. Errors use warn, never the SOS red. */
export function Input({ label, prefix, helper, error, id, className = "", ...rest }: InputProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const helpId = `${fieldId}-help`;
  const errId = `${fieldId}-err`;
  const describedBy = [helper ? helpId : null, error ? errId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <label htmlFor={fieldId} className="mb-2 block text-body text-ink">
        {label}
      </label>
      <div
        className={`flex h-[52px] items-center rounded-inner border bg-surface transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink ${
          error ? "border-alert" : "border-line-strong"
        }`}
      >
        {prefix ? (
          <span className="flex h-6 items-center border-r border-line pl-4 pr-3 text-ink-2">{prefix}</span>
        ) : null}
        <input
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="h-full w-full min-w-0 rounded-btn bg-transparent px-5 text-body text-ink outline-none focus-visible:outline-none"
          {...rest}
        />
      </div>
      {helper ? (
        <p id={helpId} className="mt-2 text-caption text-ink-2">
          {helper}
        </p>
      ) : null}
      {error ? (
        <p id={errId} role="alert" className="mt-2 flex items-start gap-1.5 text-caption text-ink">
          <WarningCircle size={ICON.sm} className="mt-px shrink-0 text-alert" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
}
