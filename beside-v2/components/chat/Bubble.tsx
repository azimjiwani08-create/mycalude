"use client";

import { memo } from "react";
import { Check, Checks, WarningCircle } from "@phosphor-icons/react/ssr";
import type { Message } from "@/data/messages";
import { formatMinutes } from "@/lib/format";
import { ICON } from "@/lib/icons";

type BubbleProps = {
  message: Message;
  mine: boolean;
  /** Last bubble in a two-minute group gets the tail corner and the timestamp. */
  last: boolean;
  onRetry?: (id: string) => void;
};

export const Bubble = memo(function Bubble({ message, mine, last, onRetry }: BubbleProps) {
  const failed = message.status === "failed";
  const tail = last ? (mine ? "rounded-br-[6px]" : "rounded-bl-[6px]") : "";

  return (
    <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[78%] whitespace-pre-wrap break-words rounded-[20px] px-3.5 py-2 text-chat transition-opacity duration-150 ${tail} ${
          mine ? "bg-pink text-ink" : "bg-pink-tint text-ink"
        } ${message.status === "sending" ? "opacity-60" : ""}`}
      >
        {message.text}
      </div>
      {failed ? (
        <p className="mt-1 flex items-center gap-1 text-caption text-alert">
          <WarningCircle size={ICON.sm} aria-hidden />
          Not sent.
          <button
            type="button"
            onClick={() => onRetry?.(message.id)}
            className="-my-3 rounded-btn px-1.5 py-3 underline underline-offset-2"
          >
            Retry
          </button>
        </p>
      ) : last ? (
        <p className="mt-1 flex items-center gap-1 text-caption text-ink-2">
          {formatMinutes(message.minutes)}
          {mine && message.status ? <StatusMark status={message.status} /> : null}
        </p>
      ) : null}
    </div>
  );
});

function StatusMark({ status }: { status: NonNullable<Message["status"]> }) {
  if (status === "sending") return <span>· Sending…</span>;
  if (status === "sent")
    return (
      <span className="flex items-center gap-1">
        · <Check size={ICON.sm} aria-hidden /> Sent
      </span>
    );
  if (status === "delivered")
    return (
      <span className="flex items-center gap-1">
        · <Checks size={ICON.sm} aria-hidden /> Delivered
      </span>
    );
  if (status === "read")
    return (
      <span className="flex items-center gap-1">
        · <Checks size={ICON.sm} aria-hidden /> Read
      </span>
    );
  return null;
}

export const SystemMessage = memo(function SystemMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-center">
      <span className="rounded-full bg-pink-tint px-3 py-1 text-caption text-ink-2">{text}</span>
    </div>
  );
});
