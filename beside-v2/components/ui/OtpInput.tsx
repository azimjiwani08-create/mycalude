"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";

type OtpInputProps = {
  value: string[];
  onChange: (next: string[]) => void;
  invalid?: boolean;
  describedBy?: string;
};

/** Six single-digit boxes with auto-advance, backspace-back and paste support. */
export function OtpInput({ value, onChange, invalid, describedBy }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const length = value.length;

  const focusAt = (i: number) => {
    const el = refs.current[Math.max(0, Math.min(length - 1, i))];
    el?.focus();
    el?.select();
  };

  const fillFrom = (start: number, digits: string) => {
    const next = value.slice();
    let i = start;
    for (const d of digits) {
      if (i >= length) break;
      next[i++] = d;
    }
    onChange(next);
    focusAt(i >= length ? length - 1 : i);
  };

  const handleChange = (i: number, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) {
      const next = value.slice();
      next[i] = "";
      onChange(next);
      return;
    }
    // Autofill or fast typing can drop several digits into one box.
    fillFrom(i, digits.length > 1 ? digits : digits.slice(-1));
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      e.preventDefault();
      const next = value.slice();
      next[i - 1] = "";
      onChange(next);
      focusAt(i - 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusAt(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusAt(i + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!digits) return;
    e.preventDefault();
    fillFrom(0, digits.slice(0, length));
  };

  return (
    <div className="grid grid-cols-6 gap-2" role="group" aria-label="Verification code">
      {value.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={`h-14 w-full min-w-0 rounded-btn border bg-surface text-center text-section text-ink transition-colors ${
            invalid ? "border-alert" : digit ? "border-ink" : "border-line-strong"
          }`}
        />
      ))}
    </div>
  );
}
