// Fails if a secret could reach the browser or the repo.
// Run after `next build`: scans the client bundle (.next/static) and every
// git-tracked file for key patterns and for the actual values of server env vars.
import { execSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const SECRET_VARS = ["OPENAI_API_KEY", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY", "SESSION_SECRET", "WHATSAPP_TOKEN", "INNGEST_SIGNING_KEY", "INNGEST_EVENT_KEY"];
const PATTERNS = [
  [/sk-(proj-)?[A-Za-z0-9_-]{20,}/, "OpenAI-style key"],
  [/eyJhbGciOi[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/, "JWT (Supabase key?)"],
  [/EAA[A-Za-z0-9]{40,}/, "Meta/WhatsApp token"],
  [/signkey-(prod|test)-[a-f0-9]{20,}/, "Inngest signing key"],
];
const values = SECRET_VARS.map((k) => [k, process.env[k]]).filter(([, v]) => v && v.length >= 12);
const problems = [];

function scan(label, text) {
  for (const [re, what] of PATTERNS) if (re.test(text)) problems.push(`${label}: looks like a ${what}`);
  for (const [k, v] of values) if (text.includes(v)) problems.push(`${label}: contains the value of ${k}`);
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(js|css|html|json|txt|map)$/.test(name)) scan(p, readFileSync(p, "utf8"));
  }
}

if (existsSync(".next/static")) walk(".next/static");
else console.warn("No .next/static — run `next build` first to check the client bundle.");

const tracked = execSync("git ls-files", { encoding: "utf8" }).split("\n").filter(Boolean);
for (const f of tracked) {
  if (f.endsWith(".env.example") || f.startsWith("scripts/check-secrets") || /\.(png|jpe?g|pdf|ico)$/.test(f)) continue;
  try { scan(f, readFileSync(f, "utf8")); } catch {}
}
for (const f of tracked) if (/(^|\/)\.env(\.|$)(?!example)/.test(f)) problems.push(`${f}: env file is tracked by git`);

// No server env var may be exposed with the NEXT_PUBLIC_ prefix.
for (const f of tracked.filter((f) => /\.(ts|tsx|mjs|js)$/.test(f))) {
  try { if (/NEXT_PUBLIC_[A-Z_]*(KEY|SECRET|TOKEN)/.test(readFileSync(f, "utf8"))) problems.push(`${f}: secret-looking NEXT_PUBLIC_ variable`); } catch {}
}

if (problems.length) {
  console.error("Secret check FAILED:\n" + problems.map((p) => ` - ${p}`).join("\n"));
  process.exit(1);
}
console.log(`Secret check passed (${tracked.length} tracked files${existsSync(".next/static") ? " + client bundle" : ""}).`);
