import type { Venue } from "./companions";

export const member = {
  name: "Arjun",
  verification: "ID and selfie verified",
  since: "Member since Sep 2026",
};

export type Session = {
  id: string;
  companionId: string;
  memberName: string;
  /** Days from today, so sample dates stay correct. Label it with useDayLabel(). */
  dayOffset: number;
  time: string;
  endTime: string;
  duration: string;
  venue: Venue;
  status: "confirmed" | "completed";
  chat: "open" | "closed";
  /** Prototype only: the session the live and SOS screens use. */
  live?: boolean;
};

export const sessions: Session[] = [
  {
    id: "s1",
    companionId: "meera",
    memberName: "Arjun",
    dayOffset: 0,
    time: "4:00 pm",
    endTime: "5:30 pm",
    duration: "90 min",
    venue: { name: "Kitab Khana café", area: "Fort", kind: "Bookstore café" },
    status: "confirmed",
    chat: "open",
    live: true,
  },
  {
    id: "s2",
    companionId: "tara",
    memberName: "Arjun",
    dayOffset: -9,
    time: "6:00 pm",
    endTime: "7:00 pm",
    duration: "60 min",
    venue: { name: "Prithvi Café", area: "Juhu", kind: "Theatre café" },
    status: "completed",
    chat: "closed",
  },
  {
    id: "s3",
    companionId: "kavya",
    memberName: "Arjun",
    dayOffset: 7,
    time: "11:00 am",
    endTime: "12:00 pm",
    duration: "60 min",
    venue: { name: "Bandstand promenade", area: "Bandra West", kind: "Public promenade" },
    status: "confirmed",
    chat: "open",
  },
];

export function getSession(id: string) {
  return sessions.find((s) => s.id === id);
}

export type SessionRequest = {
  id: string;
  memberName: string;
  verification: string;
  since: string;
  /** Days from today. Label it with useDayLabel(). */
  dayOffset: number;
  time: string;
  duration: string;
  venue: Venue;
  note: string;
  sentAgo: string;
};

/** Incoming requests, as seen by the companion Meera. */
export const requests: SessionRequest[] = [
  {
    id: "r1",
    memberName: "Rohan",
    verification: "ID and selfie verified",
    since: "Member since Aug 2026",
    dayOffset: 3,
    time: "11:00 am",
    duration: "60 min",
    venue: { name: "Bandstand promenade", area: "Bandra West", kind: "Public promenade" },
    note: "I have a panel talk next month and want to get comfortable answering questions on the spot.",
    sentAgo: "12 min ago",
  },
  {
    id: "r2",
    memberName: "Vikram",
    verification: "ID and selfie verified",
    since: "Member since Oct 2026",
    dayOffset: 5,
    time: "6:00 pm",
    duration: "90 min",
    venue: { name: "Prithvi Café", area: "Juhu", kind: "Theatre café" },
    note: "New to Mumbai. I'd like to practice everyday conversation in Hindi.",
    sentAgo: "1 hr ago",
  },
  {
    id: "r3",
    memberName: "Sameer",
    verification: "ID and selfie verified",
    since: "Member since Jul 2026",
    dayOffset: 6,
    time: "1:00 pm",
    duration: "60 min",
    venue: { name: "Kitab Khana café", area: "Fort", kind: "Bookstore café" },
    note: "Mostly want to get better at small talk at work events.",
    sentAgo: "3 hr ago",
  },
];

export type LiveStatus = "on-track" | "overdue" | "sos";

export type LiveRow = {
  id: string;
  member: string;
  companion: string;
  venue: string;
  area: string;
  started: string;
  elapsedMin: number;
  plannedMin: number;
  lastCheckIn: string;
  status: LiveStatus;
};

/** Ops view rows. s1 flips to "sos" when the live-session SOS fires in another tab. */
export const liveSessions: LiveRow[] = [
  { id: "s1", member: "Arjun", companion: "Meera", venue: "Kitab Khana café", area: "Fort, Mumbai", started: "4:00 pm", elapsedMin: 24, plannedMin: 90, lastCheckIn: "4:15 pm", status: "on-track" },
  { id: "s7", member: "Karan", companion: "Anika", venue: "Jehangir Art Gallery café", area: "Kala Ghoda, Mumbai", started: "3:30 pm", elapsedMin: 54, plannedMin: 60, lastCheckIn: "3:45 pm", status: "overdue" },
  { id: "s8", member: "Dev", companion: "Kavya", venue: "Kitab Khana café", area: "Fort, Mumbai", started: "3:45 pm", elapsedMin: 39, plannedMin: 90, lastCheckIn: "4:15 pm", status: "on-track" },
  { id: "s9", member: "Nikhil", companion: "Tara", venue: "Prithvi Café", area: "Juhu, Mumbai", started: "4:10 pm", elapsedMin: 14, plannedMin: 60, lastCheckIn: "4:10 pm", status: "on-track" },
  { id: "s10", member: "Aditya", companion: "Ira", venue: "NCPA foyer café", area: "Nariman Point, Mumbai", started: "3:00 pm", elapsedMin: 84, plannedMin: 120, lastCheckIn: "3:45 pm", status: "overdue" },
  { id: "s11", member: "Farhan", companion: "Riya", venue: "NCPA foyer café", area: "Nariman Point, Mumbai", started: "4:05 pm", elapsedMin: 19, plannedMin: 60, lastCheckIn: "4:05 pm", status: "on-track" },
  { id: "s12", member: "Manav", companion: "Leela", venue: "Bandstand promenade", area: "Bandra West, Mumbai", started: "3:50 pm", elapsedMin: 34, plannedMin: 90, lastCheckIn: "4:20 pm", status: "on-track" },
];
