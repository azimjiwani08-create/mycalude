"use client";
import { useState } from "react";

/** Reads the listening script aloud with the browser's voice. Two plays, like a real test. */
export function ListenPlayer({ script, maxPlays = 2 }: { script: string; maxPlays?: number }) {
  const [plays, setPlays] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  function play() {
    if (!supported || plays >= maxPlays) return;
    const u = new SpeechSynthesisUtterance(script);
    u.lang = "en-GB";
    u.rate = 0.95;
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setSpeaking(true);
    setPlays((p) => p + 1);
  }

  if (!supported) return <div className="notice warn">Audio isn&apos;t available in this browser. Read the script instead: <em>{script}</em></div>;
  return (
    <div className="row">
      <button type="button" className="btn btn-blue" onClick={play} disabled={plays >= maxPlays || speaking}>
        {speaking ? "Playing…" : plays === 0 ? "▶ Play recording" : "▶ Play again"}
      </button>
      <span className="muted caption">{maxPlays - plays} play{maxPlays - plays === 1 ? "" : "s"} left</span>
    </div>
  );
}
