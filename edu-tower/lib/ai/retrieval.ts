import type { ContentEntry } from "@/lib/types";

const STOP = new Set("a an the is are was were do does did i you we my your our to of in on for and or what which how when where can will be it this that with at from about me us have has".split(" "));

export function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9₹\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map((w) => (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w));
}

export interface Hit {
  entry: ContentEntry;
  score: number;
}

/**
 * Keyword retrieval over approved content, IDF-weighted so words that appear
 * everywhere ("IELTS") count less than distinctive ones ("fee"). A word counts
 * once per entry: triple in tags, double in the title, single in the body. Small corpus, so this beats an embedding call on
 * cost and latency; swap for pgvector if the FAQ grows into the hundreds.
 */
export function retrieve(question: string, entries: ContentEntry[], k = 3, minScore = 2): Hit[] {
  const q = new Set(tokens(question));
  const approved = entries.filter((e) => e.approved);
  if (!q.size || !approved.length) return [];
  const docs = approved.map((entry) => ({
    entry,
    tags: new Set(entry.tags.flatMap(tokens)),
    title: new Set(tokens(entry.title)),
    body: new Set(tokens(entry.body)),
  }));
  const idf = (w: string) => {
    const df = docs.filter((d) => d.tags.has(w) || d.title.has(w) || d.body.has(w)).length;
    return df ? 1 + Math.log(docs.length / df) : 0;
  };
  const hits: Hit[] = [];
  for (const d of docs) {
    let score = 0;
    for (const w of q) {
      const weight = d.tags.has(w) ? 3 : d.title.has(w) ? 2 : d.body.has(w) ? 1 : 0;
      if (weight) score += weight * idf(w);
    }
    if (score >= minScore) hits.push({ entry: d.entry, score });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, k);
}
