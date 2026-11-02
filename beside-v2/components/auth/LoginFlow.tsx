"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/ssr";
import { Button, IconButton } from "@/components/ui/Button";
import { BottomBar, TopBar } from "@/components/ui/Frame";
import { Input } from "@/components/ui/Input";
import { OtpInput } from "@/components/ui/OtpInput";
import { useSession } from "@/lib/session";
import { formatPhone } from "@/lib/format";
import { useStayPut } from "@/lib/useStayPut";
import { ICON } from "@/lib/icons";

const EMPTY_CODE = ["", "", "", "", "", ""];

export function LoginFlow() {
  const router = useRouter();
  useStayPut();
  const { authMode, update, setStep: setVerifyStep } = useSession();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showAltNote, setShowAltNote] = useState(false);

  const [code, setCode] = useState<string[]>(EMPTY_CODE);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [seconds, setSeconds] = useState(30);
  const otpWrap = useRef<HTMLDivElement>(null);

  const digits = phone.replace(/\D/g, "").slice(-10);
  const codeComplete = code.every(Boolean);

  useEffect(() => {
    if (step !== "otp" || seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, seconds]);

  useEffect(() => {
    if (step === "otp") otpWrap.current?.querySelector("input")?.focus();
  }, [step]);

  const sendCode = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setPhoneError("Enter a 10-digit mobile number, like 98200 12345.");
      return;
    }
    setPhoneError(null);
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setStep("otp");
      setSeconds(30);
    }, 700);
  };

  const verify = (e: FormEvent) => {
    e.preventDefault();
    if (!codeComplete) return;
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      // Prototype: 000000 always fails so the error state can be reviewed.
      if (code.join("") === "000000") {
        setCodeError("That code didn't match. Try again.");
        setCode(EMPTY_CODE);
        otpWrap.current?.querySelector("input")?.focus();
        return;
      }
      update({ phone: digits });
      setVerifyStep("phone", "done");
      router.push("/verify");
    }, 700);
  };

  if (step === "otp") {
    return (
      <form onSubmit={verify} className="flex min-h-[100dvh] flex-col">
        <TopBar>
          <IconButton label="Back to phone number" onClick={() => setStep("phone")}>
            <ArrowLeft size={ICON.md} />
          </IconButton>
        </TopBar>
        <div className="px-5 pt-6">
          <h1 className="font-serif text-headline text-ink">Enter the code</h1>
          <p className="mt-2 text-ink-2">Sent by text to {formatPhone(digits)}.</p>

          <div ref={otpWrap} className="mt-8">
            <OtpInput
              value={code}
              onChange={(next) => {
                setCode(next);
                if (codeError) setCodeError(null);
              }}
              invalid={!!codeError}
              describedBy={codeError ? "otp-error" : "otp-help"}
            />
          </div>
          {codeError ? (
            <p id="otp-error" role="alert" className="mt-3 text-caption text-ink">
              {codeError}
            </p>
          ) : null}
          <p id="otp-help" className="mt-3 text-caption text-ink-2" aria-live="polite">
            {seconds > 0 ? `You can resend the code in 0:${String(seconds).padStart(2, "0")}.` : "Didn't get it?"}
          </p>
          {seconds === 0 ? (
            <button
              type="button"
              onClick={() => setSeconds(30)}
              className="-ml-2 mt-1 h-11 rounded-btn px-2 text-body text-ink hover:bg-pink-tint"
            >
              Resend code
            </button>
          ) : null}
          <p className="mt-8 rounded-inner bg-hover px-5 py-3 text-caption text-ink-2">
            Prototype: any six digits work. Enter 000000 to see the error state.
          </p>
        </div>
        <BottomBar>
          <div className="space-y-1">
            <Button
              type="submit"
              loading={verifying}
              disabled={!codeComplete && !verifying}
              reason="Enter all six digits to continue."
            >
              Verify and continue
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setStep("phone");
                setCode(EMPTY_CODE);
                setCodeError(null);
              }}
            >
              Change number
            </Button>
          </div>
        </BottomBar>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} noValidate className="flex min-h-[100dvh] flex-col">
      <TopBar>
        <IconButton label="Back" href="/">
          <ArrowLeft size={ICON.md} />
        </IconButton>
      </TopBar>
      <div className="px-5 pt-6">
        <h1 className="font-serif text-headline text-ink">
          {authMode === "signin" ? "Welcome back" : "What's your phone number?"}
        </h1>
        <p className="mt-2 text-ink-2">
          {authMode === "signin"
            ? "Sign in with the number you joined with."
            : "We use it to sign you in and to reach you during a session. Companions never see it."}
        </p>
        <Input
          className="mt-8"
          label="Phone number"
          prefix="+91"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="98200 12345"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value.replace(/[^\d\s]/g, "").slice(0, 11));
            if (phoneError) setPhoneError(null);
          }}
          helper="We'll text you a code."
          error={phoneError}
        />
        <p className="mt-4 text-caption text-ink-2">
          By continuing you agree to our{" "}
          <Link href="/legal#terms" className=" text-ink underline underline-offset-2">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/legal#privacy" className=" text-ink underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
        {showAltNote ? (
          <p role="status" className="mt-6 rounded-inner bg-hover px-5 py-3 text-caption text-ink-2">
            Email sign-in is coming soon. For now, a phone number keeps everyone verifiable.
          </p>
        ) : null}
      </div>
      <BottomBar>
        <div className="space-y-1">
          <Button type="submit" loading={sending}>
            Send code
          </Button>
          <Button variant="ghost" onClick={() => setShowAltNote(true)}>
            Use a different method
          </Button>
        </div>
      </BottomBar>
    </form>
  );
}
