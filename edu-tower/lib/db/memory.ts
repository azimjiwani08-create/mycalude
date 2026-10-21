import { randomUUID } from "node:crypto";
import type { Tables, TableName } from "@/lib/types";
import { buildSeed, type DemoTables } from "@/lib/demo/seed";
import type { Db, SelectOpts, Where } from "./types";

const DEFAULTS: Partial<{ [K in TableName]: () => Partial<Tables[K]> }> = {
  bookings: () => ({ status: "held", held_until: new Date(Date.now() + 48 * 3_600_000).toISOString(), created_at: new Date().toISOString(), confirmed_by: null, confirmed_at: null }),
  submissions: () => ({ status: "queued", attempts: 0, created_at: new Date().toISOString(), released_at: null, transcript: null, file_path: null }),
  consents: () => ({ granted_at: new Date().toISOString(), revoked_at: null, evidence_path: null }),
  ai_logs: () => ({ created_at: new Date().toISOString() }),
  diagnostics: () => ({ created_at: new Date().toISOString() }),
  content_entries: () => ({ updated_at: new Date().toISOString(), tags: [] }),
  enrolments: () => ({ enrolled_at: new Date().toISOString() }),
  reports: () => ({ status: "draft", approved_by: null, approved_at: null, sent_student_at: null, sent_parent_at: null }),
};

// Join tables carry their own keys; every other table gets a generated id.
const COMPOSITE_KEY = new Set<TableName>(["enrolments", "parent_links", "attendance", "homework_status", "scores"]);

function matches<T>(row: T, where?: Where<T>): boolean {
  if (!where) return true;
  for (const [k, v] of Object.entries(where) as [keyof T, unknown][]) {
    if (v === undefined) continue;
    const cell = row[k];
    if (Array.isArray(v)) {
      if (!v.includes(cell)) return false;
    } else if (cell !== v) return false;
  }
  return true;
}

const clone = <T>(v: T): T => structuredClone(v);

export class MemoryDb implements Db {
  readonly mode = "demo" as const;
  constructor(public tables: DemoTables = buildSeed()) {}

  async select<K extends TableName>(table: K, where?: Where<Tables[K]>, opts?: SelectOpts<Tables[K]>) {
    let rows = (this.tables[table] as Tables[K][]).filter((r) => matches(r, where));
    if (opts?.gte) rows = rows.filter((r) => (r[opts.gte!.column as keyof Tables[K]] as unknown as string | number) >= opts.gte!.value);
    if (opts?.lt) rows = rows.filter((r) => (r[opts.lt!.column as keyof Tables[K]] as unknown as string | number) < opts.lt!.value);
    if (opts?.order) {
      const { column, ascending = true } = opts.order;
      rows = [...rows].sort((a, b) => {
        const x = a[column as keyof Tables[K]] as unknown as string | number;
        const y = b[column as keyof Tables[K]] as unknown as string | number;
        return (x < y ? -1 : x > y ? 1 : 0) * (ascending ? 1 : -1);
      });
    }
    if (opts?.limit) rows = rows.slice(0, opts.limit);
    return clone(rows);
  }

  async insert<K extends TableName>(table: K, row: Partial<Tables[K]>) {
    const full = { ...(DEFAULTS[table]?.() ?? {}), ...row } as Tables[K];
    if (!COMPOSITE_KEY.has(table) && !(full as { id?: string }).id) (full as { id?: string }).id = randomUUID();
    (this.tables[table] as Tables[K][]).push(full);
    return clone(full);
  }

  async update<K extends TableName>(table: K, where: Where<Tables[K]>, patch: Partial<Tables[K]>) {
    const out: Tables[K][] = [];
    for (const row of this.tables[table] as Tables[K][]) {
      if (matches(row, where)) {
        Object.assign(row as object, patch);
        out.push(clone(row));
      }
    }
    return out;
  }

  async upsert<K extends TableName>(table: K, row: Partial<Tables[K]>, onConflict: (keyof Tables[K] & string)[]) {
    const key = Object.fromEntries(onConflict.map((c) => [c, row[c]])) as Where<Tables[K]>;
    const updated = await this.update(table, key, row);
    if (updated.length) return updated[0];
    return this.insert(table, row);
  }

  async remove<K extends TableName>(table: K, where: Where<Tables[K]>) {
    const rows = this.tables[table] as Tables[K][];
    const keep = rows.filter((r) => !matches(r, where));
    const n = rows.length - keep.length;
    (this.tables[table] as Tables[K][]) = keep;
    return n;
  }

  async reserveSeat(args: { batch_id: string; full_name: string; phone: string; student_id: string | null; diagnostic_id: string | null }) {
    // Single-threaded: the check and the insert cannot interleave.
    const batch = this.tables.batches.find((b) => b.id === args.batch_id);
    if (!batch || batch.status !== "open") throw new Error("batch_not_open");
    if (seatsTaken(this.tables, batch.id) >= batch.seats) throw new Error("batch_full");
    return this.insert("bookings", { ...args, office_id: batch.office_id });
  }
}

export function seatsTaken(t: Pick<DemoTables, "enrolments" | "bookings">, batchId: string, now = Date.now()) {
  const enrolled = t.enrolments.filter((e) => e.batch_id === batchId).length;
  const held = t.bookings.filter((b) => b.batch_id === batchId && b.status === "held" && Date.parse(b.held_until) > now).length;
  return enrolled + held;
}
