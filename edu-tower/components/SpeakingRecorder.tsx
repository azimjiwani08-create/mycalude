"use client";
import { useEffect, useRef, useState } from "react";

type Rec = { start(): void; stop(): void; onresult: ((e: any) => void) | null; onend: (() => void) | null; continuous: boolean; interimResults: boolean; lang: string };

/**
 * Records an answer. Audio goes to the server for transcription (live mode);
 * the browser's own speech recognition, where available, gives an instant
 * transcript so the demo works without an API key.
 */
export function SpeakingRecorder({ maxSeconds = 120, onChange, allowAudio = true }: { maxSeconds?: number; allowAudio?: boolean; onChange: (v: { audio: Blob | null; transcript: string }) => void }) {
  const [state, setState] = useState<"idle" | "recording" | "done">("idle");
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasRecognition, setHasRecognition] = useState(false);
  const media = useRef<MediaRecorder | null>(null);
  const rec = useRef<Rec | null>(null);
  const chunks = useRef<Blob[]>([]);
  const blob = useRef<Blob | null>(null);
  const finalText = useRef("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setHasRecognition(!!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  useEffect(() => { onChange({ audio: blob.current, transcript }); }, [transcript, state]); // eslint-disable-line react-hooks/exhaustive-deps

  async function start() {
    setError(null);
    chunks.current = [];
    finalText.current = "";
    setTranscript("");
    try {
      if (allowAudio) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const type = ["audio/webm", "audio/mp4", "audio/ogg"].find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
        const mr = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
        mr.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
        mr.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          blob.current = new Blob(chunks.current, { type: mr.mimeType || "audio/webm" });
          setAudioUrl(URL.createObjectURL(blob.current));
          setState("done");
        };
        mr.start();
        media.current = mr;
      }
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        const r: Rec = new SR();
        r.continuous = true;
        r.interimResults = true;
        r.lang = "en-IN";
        r.onresult = (e: any) => {
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const t = e.results[i][0].transcript;
            if (e.results[i].isFinal) finalText.current += `${t.trim()} `;
            else interim += t;
          }
          setTranscript((finalText.current + interim).trim());
        };
        r.start();
        rec.current = r;
      }
      setSeconds(0);
      setState("recording");
      timer.current = setInterval(() => setSeconds((s) => { if (s + 1 >= maxSeconds) stop(); return s + 1; }), 1000);
    } catch {
      setError("We couldn't use your microphone. You can type your answer instead.");
    }
  }

  function stop() {
    if (timer.current) clearInterval(timer.current);
    rec.current?.stop();
    if (media.current && media.current.state !== "inactive") media.current.stop();
    else setState("done");
  }

  return (
    <div className="stack">
      <div className="row">
        {state !== "recording" ? (
          <button type="button" className="btn btn-blue" onClick={start}>{state === "done" ? "Record again" : "● Start recording"}</button>
        ) : (
          <button type="button" className="btn btn-danger" onClick={stop}>■ Stop ({maxSeconds - seconds}s left)</button>
        )}
        {state === "recording" && <span className="pill red">Recording {seconds}s</span>}
      </div>
      {audioUrl && <audio controls src={audioUrl} />}
      {error && <p className="error">{error}</p>}
      <div className="field">
        <label htmlFor="transcript">{hasRecognition ? "What we heard (you can fix mistakes)" : "Type what you said (or would say)"}</label>
        <textarea id="transcript" className="input" style={{ minHeight: 110 }} value={transcript} onChange={(e) => { finalText.current = e.target.value; setTranscript(e.target.value); }} maxLength={5000} />
      </div>
    </div>
  );
}
