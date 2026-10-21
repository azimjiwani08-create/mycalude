"use client";
import { useEffect, useState } from "react";
import { BookingsTab } from "./tabs/bookings";
import { BatchesTab } from "./tabs/batches";
import { ClassesTab } from "./tabs/classes";
import { ReviewTab } from "./tabs/review";
import { QuestionsTab } from "./tabs/questions";
import { TestsTab } from "./tabs/tests";
import { ContentTab } from "./tabs/content";
import { ReportsTab } from "./tabs/reports";
import { UsageTab } from "./tabs/usage";

const TABS = [
  { id: "bookings", label: "Bookings", roles: ["admin", "counsellor"], C: BookingsTab },
  { id: "batches", label: "Batches", roles: ["admin", "counsellor", "teacher"], C: BatchesTab },
  { id: "classes", label: "Attendance & homework", roles: ["admin", "teacher"], C: ClassesTab },
  { id: "review", label: "Review marking", roles: ["admin", "teacher"], C: ReviewTab },
  { id: "questions", label: "Question bank", roles: ["admin", "teacher"], C: QuestionsTab },
  { id: "tests", label: "Mock tests", roles: ["admin", "teacher"], C: TestsTab },
  { id: "reports", label: "Weekly reports", roles: ["admin", "counsellor", "teacher"], C: ReportsTab },
  { id: "content", label: "Content", roles: ["admin"], C: ContentTab },
  { id: "usage", label: "AI usage", roles: ["admin"], C: UsageTab },
] as const;

export function AdminShell({ role, live }: { role: string; live: boolean }) {
  const tabs = TABS.filter((t) => (t.roles as readonly string[]).includes(role));
  const [tab, setTab] = useState<string>(tabs[0].id);
  useEffect(() => {
    try { const saved = localStorage.getItem("edu-admin-tab"); if (saved && tabs.some((t) => t.id === saved)) setTab(saved); } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const choose = (id: string) => { setTab(id); try { localStorage.setItem("edu-admin-tab", id); } catch {} };
  const Active = tabs.find((t) => t.id === tab)!.C;
  return (
    <>
      <div className="tabs" role="tablist">
        {tabs.map((t) => <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => choose(t.id)}>{t.label}</button>)}
      </div>
      <Active role={role} live={live} />
    </>
  );
}
