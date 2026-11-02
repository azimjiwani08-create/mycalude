"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowClockwise, Siren, Warning } from "@phosphor-icons/react/ssr";
import type { LiveRow, LiveStatus } from "@/data/sessions";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { SOS_STORAGE_KEY } from "@/components/safety/HoldToSos";
import { ICON } from "@/lib/icons";

type Status = "loading" | "ready" | "empty" | "error";
type Filter = "all" | "attention" | "on-track";

const ORDER: Record<LiveStatus, number> = { sos: 0, overdue: 1, "on-track": 2 };

function readSos(): string | null {
  try {
    const raw = localStorage.getItem(SOS_STORAGE_KEY);
    return raw ? (JSON.parse(raw).sessionId as string) : null;
  } catch {
    return null;
  }
}

export function LiveOps({ rows }: { rows: LiveRow[] }) {
  const [status, setStatus] = useState<Status>("loading");
  const [filter, setFilter] = useState<Filter>("all");
  const [sosId, setSosId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const hold = useRef(false);

  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).get("state");
    if (forced === "loading" || forced === "empty" || forced === "error") {
      hold.current = forced === "loading";
      // The URL and storage are read after hydration so server and client markup match.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus(forced);
    }
    setSosId(readSos());
    // The member's SOS in another tab lands here through the storage event.
    const onStorage = (e: StorageEvent) => {
      if (e.key === SOS_STORAGE_KEY) setSosId(readSos());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (status !== "loading" || hold.current) return;
    const t = setTimeout(() => setStatus((s) => (s === "loading" ? "ready" : s)), 600);
    return () => clearTimeout(t);
  }, [status]);

  const live = useMemo(
    () =>
      rows
        .map((r) => (r.id === sosId ? { ...r, status: "sos" as const } : r))
        .sort((a, b) => ORDER[a.status] - ORDER[b.status]),
    [rows, sosId],
  );

  const visible = live.filter((r) =>
    filter === "all" ? true : filter === "attention" ? r.status !== "on-track" : r.status === "on-track",
  );
  const counts = {
    live: live.length,
    overdue: live.filter((r) => r.status === "overdue").length,
    sos: live.filter((r) => r.status === "sos").length,
  };
  const selected = live.find((r) => r.id === selectedId) ?? null;

  return (
    <main className="mx-auto max-w-[1440px] px-6 py-8 lg:px-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b-[1.5px] border-line pb-6">
        <div>
          <p className="text-caption uppercase tracking-wide text-ink-2">Beside operations</p>
          <h1 className="mt-1 text-headline text-ink">Live sessions</h1>
        </div>
        <dl className="flex divide-x divide-line text-body">
          {[
            ["Live now", counts.live],
            ["Check-ins overdue", counts.overdue],
            ["SOS active", counts.sos],
          ].map(([label, value]) => (
            <div key={label} className="px-5 first:pl-0 last:pr-0">
              <dt className="text-caption text-ink-2">{label}</dt>
              <dd className="mt-0.5 text-section tabular-nums text-ink">{status === "ready" ? value : "–"}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div role="group" aria-label="Filter sessions" className="mt-6 flex flex-wrap gap-2 py-1">
        {(
          [
            ["all", "All"],
            ["attention", "Needs attention"],
            ["on-track", "On track"],
          ] as const
        ).map(([key, label]) => (
          <Chip key={key} selected={filter === key} onClick={() => setFilter(key)}>
            {label}
          </Chip>
        ))}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-0">
        <div className="min-w-0 overflow-x-auto lg:pr-8">
          {status === "loading" ? (
            <div aria-busy="true" aria-label="Loading sessions" className="divide-y divide-line border-y-[1.5px] border-line">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-6 py-4">
                  <div className="skeleton h-4 w-28 rounded" />
                  <div className="skeleton h-4 w-40 rounded" />
                  <div className="skeleton h-4 flex-1 rounded" />
                </div>
              ))}
            </div>
          ) : status === "error" ? (
            <div role="alert" className="border-y-[1.5px] border-line py-8">
              <p className=" text-ink">Live sessions didn&apos;t load.</p>
              <p className="mt-1 text-body text-ink-2">Alerts still reach the on-call phone. Try again in a moment.</p>
              <div className="mt-4 w-56">
                <Button variant="secondary" onClick={() => setStatus("loading")}>
                  <span className="flex items-center justify-center gap-2">
                    <ArrowClockwise size={ICON.md} aria-hidden /> Try again
                  </span>
                </Button>
              </div>
            </div>
          ) : status === "empty" || visible.length === 0 ? (
            <div className="border-y-[1.5px] border-line py-8">
              <p className=" text-ink">No live sessions{filter !== "all" ? " in this view" : ""}</p>
              <p className="mt-1 text-body text-ink-2">Sessions appear here the moment both people check in at the venue.</p>
            </div>
          ) : (
            <table className="w-full min-w-[760px] border-collapse text-left text-body">
              <thead>
                <tr className="border-b-[1.5px] border-line text-caption uppercase tracking-wide text-ink-2">
                  {["Status", "Member and companion", "Venue", "Started", "Elapsed", "Last check-in"].map((h) => (
                    <th key={h} scope="col" className="py-3 pr-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const isSelected = r.id === selectedId;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={`cursor-pointer border-b-[1.5px] border-line ${
                        r.status === "sos" ? "bg-pink-tint" : isSelected ? "bg-pink-tint" : "hover:bg-hover"
                      }`}
                    >
                      <td className="py-3.5 pr-4">
                        <button
                          type="button"
                          onClick={() => setSelectedId(r.id)}
                          aria-pressed={isSelected}
                          className="-my-2 flex min-h-11 items-center gap-2 rounded-btn text-left"
                        >
                          <StatusLabel status={r.status} />
                        </button>
                      </td>
                      <td className="py-3.5 pr-4 text-ink">
                        <span className="">{r.member}</span>
                        <span className="text-ink-2"> with </span>
                        <span className="">{r.companion}</span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="block text-ink">{r.venue}</span>
                        <span className="block text-caption text-ink-2">{r.area}</span>
                      </td>
                      <td className="py-3.5 pr-4 tabular-nums text-ink">{r.started}</td>
                      <td className="py-3.5 pr-4 tabular-nums text-ink">
                        {r.elapsedMin} <span className="text-ink-2">/ {r.plannedMin} min</span>
                      </td>
                      <td className="py-3.5 pr-4 tabular-nums text-ink">{r.lastCheckIn}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <aside aria-label="Session detail" className="border-t-[1.5px] border-line pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          {selected ? (
            <Detail
              row={selected}
              acknowledged={acknowledged.includes(selected.id)}
              onAcknowledge={() => setAcknowledged((a) => [...a, selected.id])}
            />
          ) : (
            <p className="text-body text-ink-2">Select a session to see its timeline and contacts.</p>
          )}
        </aside>
      </div>
    </main>
  );
}

function StatusLabel({ status }: { status: LiveStatus }) {
  if (status === "sos") {
    return (
      <span className="flex items-center gap-2 text-ink">
        <Siren size={ICON.md} aria-hidden /> SOS triggered
      </span>
    );
  }
  if (status === "overdue") {
    return (
      <span className="flex items-center gap-2 text-ink">
        <Warning size={ICON.md} className="text-alert" aria-hidden /> Check-in overdue
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2 text-ink">
      <span aria-hidden className="size-2 rounded-full bg-pink" /> On track
    </span>
  );
}

function Detail({ row, acknowledged, onAcknowledge }: { row: LiveRow; acknowledged: boolean; onAcknowledge: () => void }) {
  const timeline = [
    [row.started, "Both checked in at the venue"],
    [row.lastCheckIn, row.status === "overdue" ? "Last check-in answered" : "Check-in: all good"],
    ...(row.status === "overdue" ? [["Now", "Next check-in not answered after 10 minutes"]] : []),
    ...(row.status === "sos" ? [["Now", `SOS held by ${row.member}`]] : []),
  ];
  return (
    <div>
      <h2 className="text-section text-ink">
        {row.member} with {row.companion}
      </h2>
      <p className="mt-1 text-body text-ink-2">
        {row.venue}, {row.area}
      </p>
      <div className="mt-3">
        <StatusLabel status={row.status} />
      </div>

      <h3 className="mt-6 text-caption uppercase tracking-wide text-ink-2">Timeline</h3>
      <ol className="mt-2 divide-y divide-line border-y-[1.5px] border-line">
        {timeline.map(([time, text]) => (
          <li key={`${time}-${text}`} className="grid grid-cols-[72px_1fr] gap-3 py-2.5 text-body">
            <span className="tabular-nums text-ink-2">{time}</span>
            <span className="text-ink">{text}</span>
          </li>
        ))}
      </ol>

      <div className="mt-6 space-y-2" aria-live="polite">
        {row.status === "sos" ? (
          acknowledged ? (
            <p className="rounded-inner bg-pink-tint px-5 py-3 text-body text-ink">
              Acknowledged. Calling {row.member} now. Venue staff alerted.
            </p>
          ) : (
            <Button onClick={onAcknowledge}>Acknowledge and call {row.member}</Button>
          )
        ) : null}
        <Button variant="secondary">Call {row.member}</Button>
        <Button variant="secondary">Call {row.companion}</Button>
      </div>
    </div>
  );
}
