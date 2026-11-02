export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export type Message = {
  id: string;
  from: "member" | "companion" | "system";
  text: string;
  /** Minutes since midnight. */
  minutes: number;
  status?: MessageStatus;
};

export const threads: Record<string, Message[]> = {
  s1: [
    { id: "a1", from: "system", text: "Session confirmed", minutes: 600 },
    { id: "a2", from: "companion", text: "Hi Arjun, looking forward to Saturday. You mentioned wanting to practice small talk before your work offsite?", minutes: 602 },
    { id: "a3", from: "companion", text: "We can start easy and build up from there.", minutes: 602 },
    { id: "a4", from: "member", text: "Yes, exactly. I freeze after the first two minutes with new people.", minutes: 615, status: "read" },
    { id: "a5", from: "member", text: "Is the bookstore café still okay?", minutes: 616, status: "read" },
    { id: "a6", from: "companion", text: "Perfect. It's quiet upstairs, good for talking.", minutes: 620 },
    { id: "a7", from: "member", text: "Great, see you there.", minutes: 631, status: "delivered" },
    { id: "a8", from: "member", text: "Should I bring anything?", minutes: 633, status: "failed" },
    { id: "a9", from: "system", text: "Check-in opens at the venue", minutes: 634 },
  ],
  s2: [
    { id: "b1", from: "system", text: "Session confirmed", minutes: 840 },
    { id: "b2", from: "companion", text: "Hi Arjun. Prithvi at 6 works. I'll be at a table near the entrance.", minutes: 845 },
    { id: "b3", from: "member", text: "Sounds good, thank you.", minutes: 850, status: "read" },
    { id: "b4", from: "system", text: "Session completed", minutes: 1140 },
    { id: "b5", from: "companion", text: "Thanks for today. You did really well with the storytelling exercise.", minutes: 1145 },
    { id: "b6", from: "system", text: "Chat closed 24 hours after the session", minutes: 1146 },
  ],
  s3: [],
};

export const starters: Record<string, string[]> = {
  s3: [
    "Hi Kavya, looking forward to Thursday.",
    "I'd like to practice keeping a conversation going.",
  ],
};

export const quickReplies = ["I've arrived", "Running 5 minutes late", "Can we adjust the time?"];

/** Canned replies the prototype uses to simulate the other person. */
export const cannedReplies = {
  companion: [
    "Nothing to bring, just come as you are.",
    "That works for me. See you there.",
    "Good question. Let's talk about it when we meet.",
  ],
  member: [
    "Thanks, that helps.",
    "Great, see you then.",
    "Sounds good to me.",
  ],
};
