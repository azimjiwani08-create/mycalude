"use client";

import { Chip } from "@/components/ui/Chip";

export function QuickReplies({ items, onPick }: { items: string[]; onPick: (text: string) => void }) {
  return (
    <div role="group" aria-label="Quick replies" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
      {items.map((text) => (
        <Chip key={text} onClick={() => onPick(text)}>
          {text}
        </Chip>
      ))}
    </div>
  );
}
