import type { Tables, TableName } from "@/lib/types";

/** Equality filter; an array value means "in". */
export type Where<T> = { [K in keyof T]?: T[K] | T[K][] };

export interface SelectOpts<T> {
  order?: { column: keyof T & string; ascending?: boolean };
  limit?: number;
  /** Rows whose column is >= this value (dates as ISO strings). */
  gte?: { column: keyof T & string; value: string | number };
  lt?: { column: keyof T & string; value: string | number };
}

/**
 * The minimal table API the domain layer needs. Two implementations: an
 * in-memory store for demo mode and tests, and Supabase for production.
 */
export interface Db {
  readonly mode: "demo" | "live";
  select<K extends TableName>(table: K, where?: Where<Tables[K]>, opts?: SelectOpts<Tables[K]>): Promise<Tables[K][]>;
  insert<K extends TableName>(table: K, row: Partial<Tables[K]>): Promise<Tables[K]>;
  update<K extends TableName>(table: K, where: Where<Tables[K]>, patch: Partial<Tables[K]>): Promise<Tables[K][]>;
  upsert<K extends TableName>(table: K, row: Partial<Tables[K]>, onConflict: (keyof Tables[K] & string)[]): Promise<Tables[K]>;
  remove<K extends TableName>(table: K, where: Where<Tables[K]>): Promise<number>;
  /** Atomic seat hold. Throws "batch_full" / "batch_not_open". */
  reserveSeat(args: { batch_id: string; full_name: string; phone: string; student_id: string | null; diagnostic_id: string | null }): Promise<Tables["bookings"]>;
}
