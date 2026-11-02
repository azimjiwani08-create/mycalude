"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  IdentificationCard,
  Phone,
  UserFocus,
  WarningCircle,
} from "@phosphor-icons/react/ssr";
import type { IconProps } from "@phosphor-icons/react";
import { Button, IconButton } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { BottomBar, TopBar } from "@/components/ui/Frame";
import { useSession, type StepId, type StepStatus } from "@/lib/session";
import { maskPhone } from "@/lib/format";
import { ICON } from "@/lib/icons";

type Row = {
  id: StepId;
  title: string;
  icon: ComponentType<IconProps>;
  pending: string;
  done: string;
  failed: string;
  runMs: number;
};

const STEP_ORDER: StepId[] = ["phone", "id", "selfie"];

export function VerifyFlow() {
  const router = useRouter();
  const { steps, setStep, phone, idMethod, update } = useSession();
  const [slow, setSlow] = useState<Partial<Record<StepId, boolean>>>({});
  const [choosingId, setChoosingId] = useState(false);
  const attempts = useRef<Partial<Record<StepId, number>>>({});
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const rows: Row[] = [
    {
      id: "phone",
      title: "Phone number",
      icon: Phone,
      pending: "Confirm the number you'll use on Beside.",
      done: phone ? `${maskPhone(phone)} confirmed` : "Confirmed",
      failed: "We couldn't confirm that number.",
      runMs: 900,
    },
    {
      id: "id",
      title: "Government ID",
      icon: IdentificationCard,
      pending: "DigiLocker or PAN. We check it, then delete the image.",
      done: `Verified through ${idMethod ?? "DigiLocker"}`,
      failed: "That ID didn't go through. Try again or use the other method.",
      runMs: 1800,
    },
    {
      id: "selfie",
      title: "Selfie check",
      icon: UserFocus,
      pending: "A quick photo matched to your ID. Never shown to anyone.",
      done: "Matched to your ID",
      failed: "We couldn't see your face clearly. Try again in better light.",
      runMs: 2000,
    },
  ];

  const run = (row: Row) => {
    setStep(row.id, "running");
    setSlow((s) => ({ ...s, [row.id]: false }));
    const n = (attempts.current[row.id] ?? 0) + 1;
    attempts.current[row.id] = n;
    // Anything over a second gets a skeleton, never a spinner.
    timers.current.push(setTimeout(() => setSlow((s) => ({ ...s, [row.id]: true })), 1000));
    timers.current.push(
      setTimeout(() => {
        // Prototype: the first selfie attempt fails so the failed state is visible.
        setStep(row.id, row.id === "selfie" && n === 1 ? "failed" : "done");
        setSlow((s) => ({ ...s, [row.id]: false }));
      }, row.runMs),
    );
  };

  const doneCount = STEP_ORDER.filter((id) => steps[id] === "done").length;
  const missing = STEP_ORDER.filter((id) => steps[id] !== "done");
  const ready = missing.length === 0;
  const names: Record<StepId, string> = { phone: "phone", id: "ID", selfie: "selfie check", payment: "payment method" };
  const reason = ready
    ? undefined
    : `Finish your ${missing.map((m) => names[m]).join(", ").replace(/, ([^,]*)$/, " and $1")} to continue.`;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <TopBar>
        <IconButton label="Back" href="/login">
          <ArrowLeft size={ICON.md} />
        </IconButton>
        <div className="ml-auto flex gap-1" aria-label={`${doneCount} of ${STEP_ORDER.length} steps done`} role="img">
          {STEP_ORDER.map((id) => (
            <span key={id} className={`h-1 w-6 rounded-full ${steps[id] === "done" ? "bg-pink" : "bg-line"}`} />
          ))}
        </div>
      </TopBar>
      <div className="px-5 pb-8 pt-6">
        <h1 className="font-serif text-headline text-ink">Everyone on Beside is verified, including you.</h1>
        <p className="mt-2 text-ink-2">About three minutes. Your documents are never shown to companions.</p>

        <ul className="mt-6 rounded-card bg-surface px-5 ring-[1.5px] ring-line">
          {rows.map((row) => {
            const status = steps[row.id];
            const Icon = row.icon;
            const isSlow = status === "running" && slow[row.id];
            return (
              <li key={row.id} className="flex gap-3 border-b-[1.5px] border-line py-4 last:border-b-0">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pink-tint text-ink">
                  <Icon size={ICON.md} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className=" text-ink">{row.title}</p>
                    <StatusTag status={status} />
                  </div>
                  <div aria-live="polite">
                    {isSlow ? (
                      <div aria-label="Checking" className="mt-2 space-y-1.5">
                        <div className="skeleton h-3 w-4/5 rounded" />
                        <div className="skeleton h-3 w-1/2 rounded" />
                      </div>
                    ) : (
                      <p className="mt-0.5 text-body text-ink-2">
                        {status === "done"
                          ? row.done
                          : status === "failed"
                            ? row.failed
                            : status === "running"
                              ? "Checking…"
                              : row.pending}
                      </p>
                    )}
                  </div>

                  {row.id === "id" && choosingId && status === "pending" ? (
                    <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Choose how to verify your ID">
                      {(["DigiLocker", "PAN"] as const).map((m) => (
                        <Chip
                          key={m}
                          onClick={() => {
                            update({ idMethod: m });
                            setChoosingId(false);
                            run(row);
                          }}
                        >
                          {m === "PAN" ? "PAN card" : m}
                        </Chip>
                      ))}
                    </div>
                  ) : status === "pending" || status === "failed" ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Chip
                        onClick={() => {
                          if (row.id === "id" && status === "pending") setChoosingId(true);
                          else run(row);
                        }}
                      >
                        {status === "failed" ? "Try again" : "Start"}
                      </Chip>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-body text-ink-2">
          No payment needed now. You add UPI or a card when you request a session, and nothing is charged until it&apos;s confirmed.
        </p>
      </div>
      <BottomBar>
        <Button disabled={!ready} reason={reason} onClick={() => router.push("/rules")}>
          Continue
        </Button>
      </BottomBar>
    </div>
  );
}

function StatusTag({ status }: { status: StepStatus }) {
  if (status === "done") {
    return (
      <span className="flex items-center gap-1 text-caption text-ink">
        <Check size={ICON.sm} aria-hidden /> Done
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="flex items-center gap-1 text-caption text-ink">
        <WarningCircle size={ICON.sm} className="text-alert" aria-hidden /> Try again
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="flex items-center gap-1.5 text-caption text-ink-2">
        <span aria-hidden className="size-1.5 rounded-full bg-pink" /> In progress
      </span>
    );
  }
  return <span className="text-caption text-ink-2">To do</span>;
}
