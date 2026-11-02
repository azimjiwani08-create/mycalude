"use client";

import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, Warning } from "@phosphor-icons/react/ssr";
import { containsContact } from "@/lib/format";
import { ICON } from "@/lib/icons";
import { QuickReplies } from "./QuickReplies";

/** 4 lines of 22px plus 10px vertical padding and the 1px border. */
const MAX_HEIGHT = 4 * 22 + 20 + 2;

type ComposerProps = {
  onSend: (text: string) => void;
  quickReplies?: string[];
};

export function Composer({ onSend, quickReplies }: ComposerProps) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const blocked = containsContact(text);
  const empty = text.trim().length === 0;
  const canSend = !empty && !blocked;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [text]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="sticky bottom-0 z-20 space-y-2 bg-canvas px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-2">
      {blocked ? (
        <p id="composer-guard" role="status" className="flex items-start gap-2 rounded-inner bg-pink-tint px-5 py-2.5 text-caption text-ink">
          <Warning size={ICON.sm} className="mt-px shrink-0 text-alert" aria-hidden />
          Numbers and links can&apos;t be shared here. It keeps both of you safe.
        </p>
      ) : null}
      {quickReplies && empty ? <QuickReplies items={quickReplies} onPick={onSend} /> : null}
      <form onSubmit={submit} className="flex items-end gap-2">
        <label htmlFor="composer" className="sr-only">
          Message
        </label>
        <textarea
          id="composer"
          ref={ref}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Write a message"
          aria-describedby={blocked ? "composer-guard" : undefined}
          aria-invalid={blocked || undefined}
          className={`no-scrollbar block min-h-11 w-full resize-none rounded-inner border-[1.5px] bg-pink-tint px-5 py-[9px] text-chat text-ink placeholder:text-ink ${
            blocked ? "border-alert" : "border-transparent"
          }`}
          style={{ maxHeight: MAX_HEIGHT }}
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send message"
          className={`flex size-11 shrink-0 items-center justify-center rounded-full transition-[background-color,transform] duration-150 ${
            canSend
              ? "bg-pink text-ink hover:bg-pink-pressed active:scale-[0.98] active:bg-pink-pressed"
              : "cursor-not-allowed bg-disabled text-ink-3"
          }`}
        >
          <ArrowUp size={ICON.md} aria-hidden />
        </button>
      </form>
    </div>
  );
}
