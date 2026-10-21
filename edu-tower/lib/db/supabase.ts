import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Tables, TableName } from "@/lib/types";
import { env } from "@/lib/env";
import type { Db, SelectOpts, Where } from "./types";

/**
 * Supabase-backed Db. `asUser(accessToken)` returns a client that carries the
 * user's JWT, so Postgres row-level security decides what comes back.
 * `service()` bypasses RLS and is used only by background jobs and by
 * route handlers after they have done their own role checks.
 */
export class SupabaseDb implements Db {
  readonly mode = "live" as const;
  constructor(private client: SupabaseClient) {}

  static service(): SupabaseDb {
    return new SupabaseDb(
      createClient(env.supabaseUrl()!, env.supabaseServiceKey()!, { auth: { persistSession: false } }),
    );
  }

  static asUser(accessToken: string): SupabaseDb {
    return new SupabaseDb(
      createClient(env.supabaseUrl()!, env.supabaseAnonKey()!, {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      }),
    );
  }

  get raw() {
    return this.client;
  }

  private filter<T>(q: any, where?: Where<T>) {
    for (const [k, v] of Object.entries(where ?? {})) {
      if (v === undefined) continue;
      if (Array.isArray(v)) q = q.in(k, v);
      else if (v === null) q = q.is(k, null);
      else q = q.eq(k, v);
    }
    return q;
  }

  async select<K extends TableName>(table: K, where?: Where<Tables[K]>, opts?: SelectOpts<Tables[K]>) {
    let q: any = this.filter(this.client.from(table).select("*"), where);
    if (opts?.gte) q = q.gte(opts.gte.column, opts.gte.value);
    if (opts?.lt) q = q.lt(opts.lt.column, opts.lt.value);
    if (opts?.order) q = q.order(opts.order.column, { ascending: opts.order.ascending ?? true });
    if (opts?.limit) q = q.limit(opts.limit);
    const { data, error } = await q;
    if (error) throw new Error(`db.select ${table}: ${error.message}`);
    return data as Tables[K][];
  }

  async insert<K extends TableName>(table: K, row: Partial<Tables[K]>) {
    const { data, error } = await this.client.from(table).insert(row as never).select("*").single();
    if (error) throw new Error(`db.insert ${table}: ${error.message}`);
    return data as Tables[K];
  }

  async update<K extends TableName>(table: K, where: Where<Tables[K]>, patch: Partial<Tables[K]>) {
    const q = this.filter(this.client.from(table).update(patch as never), where);
    const { data, error } = await q.select("*");
    if (error) throw new Error(`db.update ${table}: ${error.message}`);
    return data as Tables[K][];
  }

  async upsert<K extends TableName>(table: K, row: Partial<Tables[K]>, onConflict: (keyof Tables[K] & string)[]) {
    const { data, error } = await this.client
      .from(table)
      .upsert(row as never, { onConflict: onConflict.join(",") })
      .select("*")
      .single();
    if (error) throw new Error(`db.upsert ${table}: ${error.message}`);
    return data as Tables[K];
  }

  async remove<K extends TableName>(table: K, where: Where<Tables[K]>) {
    const q = this.filter(this.client.from(table).delete({ count: "exact" }), where);
    const { count, error } = await q;
    if (error) throw new Error(`db.remove ${table}: ${error.message}`);
    return count ?? 0;
  }

  async reserveSeat(args: { batch_id: string; full_name: string; phone: string; student_id: string | null; diagnostic_id: string | null }) {
    const { data, error } = await this.client.rpc("reserve_seat", {
      p_batch: args.batch_id,
      p_name: args.full_name,
      p_phone: args.phone,
      p_student: args.student_id,
      p_diag: args.diagnostic_id,
    });
    if (error) {
      if (error.message.includes("batch_full")) throw new Error("batch_full");
      if (error.message.includes("batch_not_open")) throw new Error("batch_not_open");
      throw new Error(`reserve_seat: ${error.message}`);
    }
    return data as Tables["bookings"];
  }
}
