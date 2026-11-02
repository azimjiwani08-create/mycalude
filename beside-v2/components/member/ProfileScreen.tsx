"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CaretRight, Check } from "@phosphor-icons/react/ssr";
import { NAV_CLEARANCE } from "@/lib/layout";
import { Button, IconButton } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { maskPhone } from "@/lib/format";
import { ICON } from "@/lib/icons";
import { useSession } from "@/lib/session";

const heading = "text-caption text-ink-2";
const card = "mt-2 divide-y divide-line rounded-card bg-surface px-5 ring-[1.5px] ring-line";

/** The member's verification, payment, safety contact, alerts, help and account deletion. */
export function ProfileScreen() {
  const router = useRouter();
  const { phone, steps, idMethod, emergencyContact, messageAlerts, update, reset } = useSession();
  const [draft, setDraft] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const value = draft ?? emergencyContact ?? "";
  const digits = value.replace(/\D/g, "");
  const validContact = digits.length === 10;

  const verification = [
    ["Phone", steps.phone, phone ? maskPhone(phone) : "Confirmed"],
    ["Government ID", steps.id, idMethod ? `Verified through ${idMethod}` : "Verified"],
    ["Selfie check", steps.selfie, "Matched to your ID"],
  ] as const;

  return (
    <main className="space-y-6 px-5 pt-3" style={{ paddingBottom: `calc(${NAV_CLEARANCE + 24}px + env(safe-area-inset-bottom))` }}>
      <div className="-ml-1">
        <IconButton label="Back to companions" href="/">
          <ArrowLeft size={ICON.md} />
        </IconButton>
      </div>
      <h1 className="font-serif text-headline text-ink">Your profile</h1>

      <section>
        <h2 className={heading}>Your sessions and more</h2>
        <ul className={card}>
          {[
            ["Sessions", "/sessions"],
            ["Messages", "/chat"],
            ["Saved and past companions", "/companions"],
            ["Help and how Beside works", "/legal"],
          ].map(([label, href]) => (
            <li key={href}>
              <Link href={href} className="flex min-h-14 items-center justify-between gap-3 py-3 text-ink">
                {label}
                <CaretRight size={ICON.md} className="shrink-0 text-ink-2" aria-hidden />
              </Link>
            </li>
          ))}
          <li>
            <button type="button" onClick={() => setConfirmDelete(true)} className="flex min-h-14 w-full items-center py-3 text-left text-ink">
              Delete account
            </button>
          </li>
        </ul>
      </section>

      <section>
        <h2 className={heading}>Verification</h2>
        <ul className={card}>
          {verification.map(([label, status, detail]) => (
            <li key={label} className="flex items-center justify-between gap-3 py-3">
              <span className="min-w-0">
                <span className="block text-ink">{label}</span>
                <span className="block truncate text-caption text-ink-2">{status === "done" ? detail : "Not finished yet"}</span>
              </span>
              {status === "done" ? (
                <span className="flex shrink-0 items-center gap-1 text-caption text-ink">
                  <Check size={ICON.sm} aria-hidden /> Done
                </span>
              ) : (
                <Link href="/verify" className="flex h-11 shrink-0 items-center text-body text-ink">
                  Finish
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className={heading}>Payment methods</h2>
        <p className={`${card} py-3 text-body text-ink-2`}>
          None added. You add UPI or a card when you request a session. Nothing is charged until it&apos;s confirmed.
        </p>
      </section>

      <section>
        <label htmlFor="emergency-contact" className={heading}>
          Emergency contact
        </label>
        <p className="mt-1 text-body text-ink-2">Called only if you raise an SOS or miss a check-in during a session.</p>
        <input
          id="emergency-contact"
          inputMode="tel"
          autoComplete="off"
          value={value}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="10-digit mobile number"
          className="mt-2 block h-12 w-full rounded-inner border-[1.5px] border-line-strong bg-surface px-5 text-body text-ink"
        />
        <div className="mt-2">
          <Button
            variant="secondary"
            disabled={!validContact}
            reason={value && !validContact ? "Enter a 10-digit mobile number." : undefined}
            onClick={() => {
              update({ emergencyContact: digits });
              setDraft(null);
            }}
          >
            {emergencyContact && draft === null ? "Saved" : "Save contact"}
          </Button>
        </div>
      </section>

      <section>
        <h2 className={heading}>Notifications</h2>
        <div className={card}>
          <label className="flex min-h-14 items-center justify-between gap-3 py-3">
            <span className=" text-ink">New messages and session changes</span>
            <input
              type="checkbox"
              checked={messageAlerts}
              onChange={(e) => update({ messageAlerts: e.target.checked })}
              className="size-5 shrink-0 accent-pink"
            />
          </label>
          <p className="py-3 text-body text-ink-2">Safety check-ins stay on during every session.</p>
        </div>
      </section>

      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete your account?">
        <p className="text-ink-2">This removes your verification and saved companions from this device. You&apos;d need to verify again to come back.</p>
        <div className="mt-4 space-y-1">
          <Button
            onClick={() => {
              reset();
              router.push("/");
            }}
          >
            Delete account
          </Button>
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
            Keep my account
          </Button>
        </div>
      </Sheet>
    </main>
  );
}
