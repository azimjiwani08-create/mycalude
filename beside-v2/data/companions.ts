import type { SceneKey } from "./scenes";

export type Photo = {
  /** Sharp file. Only request it once the viewer is verified. */
  url: string;
  /** Pre-blurred file, safe to show before verification. */
  softUrl: string;
  alt: string;
  order: number;
  isCover: boolean;
  /** An unpublished photo stays in the data but is never shown. */
  published: boolean;
};

export type Venue = { name: string; area: string; kind: string };

export type Companion = {
  id: string;
  name: string;
  role: string;
  languages: string[];
  /** Real rating only. Hidden until the companion has RATING_MIN_SESSIONS completed sessions. */
  rating: number | null;
  /** Completed sessions on Beside. Never seeded with sample numbers. */
  sessions: number;
  area: string;
  about: string;
  goodFor: string[];
  venues: Venue[];
  /** PLACEHOLDER base in INR for 60 minutes. Read only through sessionFee(), on the booking summary. */
  pricePlaceholder: number;
  replyTime: string;
  /** 1 to 6 photos. Order, cover and published are set by the admin (the admin form is not built yet). */
  photos: Photo[];
  /** The place on her home card: her venue or topic, not her face. */
  scene: SceneKey;
  /** "Ask me about…" openers shown in Fraunces italic. Up to three. */
  prompts: string[];
  /** Open days, Monday first. */
  availability: boolean[];
  neighbourhoods: string[];
  /** The in-app recorded hello, reviewed before it goes live. 30s and 2 MB max; the transcript is required. */
  voiceNote: VoiceNote;
  /** One line on the feed card, written by the companion in the admin (140 characters max). */
  prompt: string;
};

export type VoiceNote = {
  /** mp3 or m4a. Empty until the admin upload exists: the prototype then simulates playback. */
  url: string;
  durationSec: number;
  transcript: string;
};

/** What the feed needs and nothing more: no fee, no address-level detail. This is all that reaches the feed page. */
export type FeedCompanion = Pick<Companion, "id" | "name" | "role" | "languages" | "photos" | "availability" | "voiceNote" | "prompt">;

export const toFeedCompanion = (c: Companion): FeedCompanion => ({
  id: c.id,
  name: c.name,
  role: c.role,
  languages: c.languages,
  photos: c.photos,
  availability: c.availability,
  voiceNote: c.voiceNote,
  prompt: c.prompt,
});

/*
 * Prototype portraits are AI-generated, not real companions. Each has a sharp
 * file and a soft file in public/portraits.
 *
 * Soft files are pre-blurred on disk, never a CSS blur over a sharp image.
 * Only call sharpPhoto() once the viewer is verified. In production the sharp
 * file must be gated server-side (signed URL), since public/ is open to anyone.
 */
const photoAlt: Record<string, string> = {
  p1: "{name} on the Mumbai sea-face at sunset",
  p2: "{name} walking through a busy street market",
  p3: "{name} smiling on a garden bench with a coffee",
  p4: "{name} laughing at a cafe table",
  p5: "{name} walking down a city street with a coffee",
  p6: "{name} on a rooftop terrace above the city at night",
  p7: "{name} outside a cafe with a shopping bag",
};

/** Builds a companion's photo list from files in public/portraits. The first one is the cover. */
const photoSet = (name: string, ids: string[]): Photo[] =>
  ids.map((id, i) => ({
    url: `/portraits/${id}-sharp.jpg`,
    softUrl: `/portraits/${id}-soft.jpg`,
    alt: photoAlt[id].replace("{name}", name),
    order: i,
    isCover: i === 0,
    published: true,
  }));

/** Published photos in display order. Everything that shows a companion's photos goes through this. */
export const livePhotos = (c: Pick<Companion, "photos">) =>
  c.photos.filter((p) => p.published).sort((a, b) => a.order - b.order);

export const softPhoto = (c: Pick<Companion, "photos">, i = 0) => livePhotos(c)[i]?.softUrl ?? "";

export const sharpPhoto = (c: Pick<Companion, "photos">, i = 0) => livePhotos(c)[i]?.url ?? "";

export const photoAltAt = (c: Pick<Companion, "photos">, i = 0) => livePhotos(c)[i]?.alt ?? "";

export const companions: Companion[] = [
  {
    id: "meera",
    name: "Meera",
    role: "Communication coach",
    languages: ["English", "Hindi", "Marathi"],
    rating: null,
    sessions: 0,
    area: "Bandra, Mumbai",
    about:
      "I spent eight years coaching new managers on how to speak up in rooms that feel too big. Sessions with me are relaxed, practical and usually involve a lot of chai.",
    goodFor: ["Small talk practice", "Speaking up at work", "Interview nerves"],
    venues: [
      { name: "Kitab Khana café", area: "Fort", kind: "Bookstore café" },
      { name: "Bandstand promenade", area: "Bandra West", kind: "Public promenade" },
      { name: "Prithvi Café", area: "Juhu", kind: "Theatre café" },
    ],
    pricePlaceholder: 1800,
    replyTime: "Usually replies within 2 hours",
    photos: photoSet("Meera", ["p1", "p6", "p5"]),
    scene: "seaFace",
    prompts: ["Ask me about speaking up in meetings without rehearsing every word.", "Ask me about the best cutting chai near Fort."],
    availability: [true, false, true, true, false, true, true],
    neighbourhoods: ["Bandra", "Fort", "Juhu"],
    voiceNote: { url: "", durationSec: 15, transcript: "Hi, I'm Meera. I coach people who find big rooms a bit scary. Bring whatever you're nervous about, and we'll practise it over chai." },
    prompt: "Ask me about speaking up in meetings without rehearsing every word.",
  },
  {
    id: "tara",
    name: "Tara",
    role: "Theatre performer",
    languages: ["English", "Hindi"],
    rating: null,
    sessions: 0,
    area: "Juhu, Mumbai",
    about:
      "I act, and I teach improv on weekends. I like helping people find their voice without a script. Expect a few games and some laughing at ourselves.",
    goodFor: ["Confidence", "Improv basics", "Storytelling"],
    venues: [
      { name: "Prithvi Café", area: "Juhu", kind: "Theatre café" },
      { name: "NCPA foyer café", area: "Nariman Point", kind: "Arts centre café" },
    ],
    pricePlaceholder: 1600,
    replyTime: "Usually replies within 4 hours",
    photos: photoSet("Tara", ["p6", "p1", "p3"]),
    scene: "cafe",
    prompts: ["Ask me about theatre and long walks in the rain.", "Ask me about telling a story people remember."],
    availability: [false, true, true, false, true, true, false],
    neighbourhoods: ["Juhu", "Nariman Point"],
    voiceNote: { url: "", durationSec: 15, transcript: "Hello, I'm Tara. I act and teach improv. If you'd like to feel easier talking to people, come and play a few games with me." },
    prompt: "Ask me about theatre and long walks in the rain.",
  },
  {
    id: "kavya",
    name: "Kavya",
    role: "Freelance writer",
    languages: ["English", "Hindi"],
    rating: null,
    sessions: 0,
    area: "Bandra, Mumbai",
    about:
      "I write about food and cities, which mostly means asking strangers a lot of questions. Happy to talk books, travel, or how to keep a conversation going.",
    goodFor: ["Conversation flow", "Books and culture", "Listening skills"],
    venues: [
      { name: "Kitab Khana café", area: "Fort", kind: "Bookstore café" },
      { name: "Bandstand promenade", area: "Bandra West", kind: "Public promenade" },
    ],
    pricePlaceholder: 1500,
    replyTime: "Usually replies within 3 hours",
    photos: photoSet("Kavya", ["p4", "p5", "p2"]),
    scene: "street",
    prompts: ["Ask me about the books everyone pretends to have read.", "Ask me about keeping a conversation going after hello."],
    availability: [true, true, false, true, false, false, true],
    neighbourhoods: ["Bandra", "Fort"],
    voiceNote: { url: "", durationSec: 15, transcript: "Hi, I'm Kavya. I write about food and cities, so I ask a lot of questions. Let's practise keeping a conversation going." },
    prompt: "Ask me about the books everyone pretends to have read.",
  },
  {
    id: "anika",
    name: "Anika",
    role: "Museum educator",
    languages: ["English", "Bengali", "Hindi"],
    rating: null,
    sessions: 0,
    area: "Colaba, Mumbai",
    about:
      "I give gallery talks to school groups and to adults who insist they don't like art. I'm good at quiet starts and long, wandering conversations.",
    goodFor: ["Calm conversation", "Art and history", "First-meeting nerves"],
    venues: [
      { name: "Jehangir Art Gallery café", area: "Kala Ghoda", kind: "Gallery café" },
      { name: "Kitab Khana café", area: "Fort", kind: "Bookstore café" },
    ],
    pricePlaceholder: 1700,
    replyTime: "Usually replies within 2 hours",
    photos: photoSet("Anika", ["p7", "p3", "p1", "p4"]),
    scene: "shops",
    prompts: ["Ask me about the one painting worth crossing the city for.", "Ask me about quiet first meetings that don’t feel awkward."],
    availability: [false, false, true, true, true, false, true],
    neighbourhoods: ["Colaba", "Kala Ghoda", "Fort"],
    voiceNote: { url: "", durationSec: 15, transcript: "Hello, I'm Anika. I give gallery talks to people who say they don't like art. I'm good at quiet starts, so there's no rush." },
    prompt: "Ask me about the one painting worth crossing the city for.",
  },
  {
    id: "ira",
    name: "Ira",
    role: "Debate coach",
    languages: ["English", "Hindi"],
    rating: null,
    sessions: 0,
    area: "Juhu, Mumbai",
    about:
      "I coach college debate teams, so I'm comfortable with disagreement and patient with pauses. Good if you want to practice holding your point kindly.",
    goodFor: ["Disagreeing kindly", "Public speaking", "Clear thinking"],
    venues: [
      { name: "Prithvi Café", area: "Juhu", kind: "Theatre café" },
      { name: "NCPA foyer café", area: "Nariman Point", kind: "Arts centre café" },
    ],
    pricePlaceholder: 1400,
    replyTime: "Usually replies within 5 hours",
    photos: photoSet("Ira", ["p3", "p2", "p7"]),
    scene: "garden",
    prompts: ["Ask me about disagreeing without losing the room.", "Ask me about thinking out loud before a big pitch."],
    availability: [true, true, true, false, false, true, false],
    neighbourhoods: ["Juhu", "Nariman Point"],
    voiceNote: { url: "", durationSec: 15, transcript: "Hi, I'm Ira. I coach debate, so I'm comfortable with disagreement. Come and practise holding your point, kindly." },
    prompt: "Ask me about disagreeing without losing the room.",
  },
];

export const RATING_MIN_SESSIONS = 5;

/** Session lengths a member can book. Beside sells sessions, never hours. */
export const SESSION_LENGTHS = [60, 90] as const;

export function sessionFee(c: Pick<Companion, "pricePlaceholder">, minutes: number) {
  return Math.round((c.pricePlaceholder * minutes) / 60);
}

export function getCompanion(id: string) {
  return companions.find((c) => c.id === id);
}
