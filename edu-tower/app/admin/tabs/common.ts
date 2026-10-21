"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/components/api";

export interface TabProps { role: string; live: boolean }

export function useLoad<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(() => api<T>(url).then((d) => { setData(d); setError(null); }).catch((e) => setError(e.message)), [url]);
  useEffect(() => { reload(); }, [reload]);
  return { data, error, reload, setError };
}

export function hoursLeft(iso: string) {
  const h = (Date.parse(iso) - Date.now()) / 3_600_000;
  return h <= 0 ? "expired" : h < 1 ? `${Math.round(h * 60)} min left` : `${Math.floor(h)} h left`;
}
