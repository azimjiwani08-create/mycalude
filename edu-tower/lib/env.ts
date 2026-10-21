import "server-only";

/**
 * Server-side configuration. Nothing here is exposed to the browser: no
 * variable uses the NEXT_PUBLIC_ prefix, and this module is server-only.
 */
function read(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() !== "" ? v.trim() : undefined;
}

export const env = {
  get demoFlag() {
    // Unset means demo: the site only goes live when someone says so.
    return read("EDU_DEMO_MODE") !== "false";
  },
  sessionSecret: () => read("SESSION_SECRET"),
  supabaseUrl: () => read("SUPABASE_URL"),
  supabaseAnonKey: () => read("SUPABASE_ANON_KEY"),
  supabaseServiceKey: () => read("SUPABASE_SERVICE_ROLE_KEY"),
  storageBucket: () => read("SUPABASE_STORAGE_BUCKET") ?? "edu-private",
  openaiKey: () => read("OPENAI_API_KEY"),
  chatModel: () => read("OPENAI_CHAT_MODEL") ?? "gpt-4o-mini",
  sttModel: () => read("OPENAI_STT_MODEL") ?? "whisper-1",
  aiDailyLimit: () => Number(read("AI_DAILY_LIMIT_PER_USER") ?? 40),
  inngestEventKey: () => read("INNGEST_EVENT_KEY"),
  whatsappToken: () => read("WHATSAPP_TOKEN"),
  whatsappPhoneId: () => read("WHATSAPP_PHONE_NUMBER_ID"),
  counsellorNumber: (office: string) =>
    read(`WHATSAPP_COUNSELLOR_${office.toUpperCase()}`) ??
    (office === "vadodara" ? "919800000002" : "919800000001"),
};

/** True when the database is configured and the demo flag is off. */
export function isLive(): boolean {
  return !env.demoFlag && !!env.supabaseUrl() && !!env.supabaseServiceKey() && !!env.supabaseAnonKey();
}

/** AI features run live only when the site is live and an OpenAI key exists. */
export function aiLive(): boolean {
  return isLive() && !!env.openaiKey();
}

export function sessionSecret(): string {
  const s = env.sessionSecret();
  if (s) return s;
  if (isLive()) throw new Error("SESSION_SECRET must be set when the site is live");
  return "demo-only-secret-not-for-production";
}
