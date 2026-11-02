"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type StepId = "phone" | "id" | "selfie" | "payment";
export type StepStatus = "pending" | "running" | "done" | "failed";

/** Where the user was when the gate opened, so we can return them there. */
export type Intent = { companionId: string | null; scrollIndex: number };

type Stored = {
  verified: boolean;
  phone: string | null;
  authMode: "join" | "signin";
  intent: Intent | null;
  steps: Record<StepId, StepStatus>;
  idMethod: "DigiLocker" | "PAN" | null;
  paymentDeferred: boolean;
  agreed: boolean;
  savedIds: string[];
  planCompanionId: string | null;
  emergencyContact: string | null;
  messageAlerts: boolean;
  /** The member ended the mock live session, so the Live session pill goes away. */
  liveEnded: boolean;
};

const initialState: Stored = {
  verified: false,
  phone: null,
  authMode: "join",
  intent: null,
  steps: { phone: "pending", id: "pending", selfie: "pending", payment: "pending" },
  idMethod: null,
  paymentDeferred: false,
  agreed: false,
  savedIds: [],
  planCompanionId: null,
  emergencyContact: null,
  messageAlerts: true,
  liveEnded: false,
};

type SessionValue = Stored & {
  /** False until sessionStorage has been read on the client. */
  hydrated: boolean;
  /** True for one beat after verification, so the rail can play the unlock. */
  justUnlocked: boolean;
  update: (patch: Partial<Stored>) => void;
  setStep: (id: StepId, status: StepStatus) => void;
  completeVerification: () => void;
  clearUnlock: () => void;
  toggleSaved: (id: string) => void;
  reset: () => void;
};

const STORAGE_KEY = "beside:session";
const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Stored>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = { ...initialState, ...JSON.parse(raw) } as Stored;
        // A step interrupted by a reload goes back to pending.
        for (const key of Object.keys(saved.steps) as StepId[]) {
          if (saved.steps[key] === "running") saved.steps[key] = "pending";
        }
        // Storage is browser-only; reading it after hydration avoids an SSR mismatch.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState(saved);
      }
      // Development only: ?demo=member opens the app as a verified test member, for previews on a phone.
      if (process.env.NODE_ENV !== "production" && new URLSearchParams(window.location.search).get("demo") === "member") {
        setState((s) => ({
          ...s,
          verified: true,
          agreed: true,
          phone: "9820012345",
          idMethod: "DigiLocker",
          steps: { phone: "done", id: "done", selfie: "done", payment: "pending" },
        }));
      }
    } catch {
      // Private mode or blocked storage: start fresh.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage failures; state still lives in memory.
    }
  }, [state, hydrated]);

  const update = useCallback((patch: Partial<Stored>) => {
    setState((s) => ({ ...s, ...patch }));
  }, []);

  const setStep = useCallback((id: StepId, status: StepStatus) => {
    setState((s) => ({ ...s, steps: { ...s.steps, [id]: status } }));
  }, []);

  const completeVerification = useCallback(() => {
    setState((s) => ({ ...s, verified: true, agreed: true }));
    setJustUnlocked(true);
  }, []);

  const clearUnlock = useCallback(() => setJustUnlocked(false), []);

  const toggleSaved = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      savedIds: s.savedIds.includes(id)
        ? s.savedIds.filter((x) => x !== id)
        : [...s.savedIds, id],
    }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
    setJustUnlocked(false);
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      ...state,
      hydrated,
      justUnlocked,
      update,
      setStep,
      completeVerification,
      clearUnlock,
      toggleSaved,
      reset,
    }),
    [state, hydrated, justUnlocked, update, setStep, completeVerification, clearUnlock, toggleSaved, reset],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
