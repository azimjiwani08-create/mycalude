# Edu Tower — education platform

The student journey for Edu Tower (formerly London House of Careers): free diagnostic → course and batch booking → student portal → mock tests → weekly progress report → exam day. OpenAI help runs throughout. Mumbai and Vadodara only. Visa, banking and Europe services are out of scope and not built.

> **Integration note.** The live site (lhoc.vercel.app) source was not reachable from this build environment. This folder is therefore a self-contained Next.js 15 App Router module. Every route, `lib/` module and migration is written so it can be copied into the existing app (`app/…`, `lib/…`, `components/…`, `supabase/…`) without rebuilding it. Two things clash and need a decision when merging: the root `app/layout.tsx` and `app/page.tsx` (keep the site's own, add the nav links), and `globals.css` (scope these tokens if the site already has its own).

## Run it

**Quickest preview:** install Node.js 20+ (nodejs.org), then double-click `start-preview.command` (Mac) or `start-preview.bat` (Windows). It installs dependencies the first time and opens http://localhost:3000.

```bash
npm install
npm run dev          # http://localhost:3000, demo mode, no keys needed
npm test             # 27 tests, including the acceptance checks
npm run build && npm run check:secrets
```

In demo mode, log in from `/login` as any sample person (student, parent, counsellor, teacher, admin, in either office).

## Demo vs live

There is one switch: `EDU_DEMO_MODE`. It defaults to demo.

| | Demo (`EDU_DEMO_MODE` unset or `true`) | Live (`false` + Supabase keys) |
|---|---|---|
| Data | In-memory sample store (`lib/demo/seed.ts`) | Postgres with row-level security |
| Login | Role picker | Phone/email OTP (Supabase Auth); accounts are created by staff |
| AI | Transparent heuristic scorer + FAQ retrieval | OpenAI (only if `OPENAI_API_KEY` is set too) |
| Jobs | Run inline | Inngest (if `INNGEST_EVENT_KEY` is set, otherwise inline) |
| WhatsApp | Logged, plus a `wa.me` link for staff | WhatsApp Cloud API |

**Fallback:** if the database throws while live, read requests (GET routes and pages) are served from sample data, flagged with the `x-edu-mode: demo-fallback` header. Write requests return 503 rather than pretending they saved. Setting `EDU_DEMO_MODE=true` returns the whole site to sample data.

## Request pipeline (`lib/pipeline.ts`)

Every API route goes through `route({...})`, which runs these steps in order:

1. Authenticate from a signed, httpOnly session cookie, then load the user's role, office and student or parent record.
2. Check the role.
3. Validate the input with zod; reject oversized bodies.
4. Rate-limit per user and per IP.
5. Run the handler against the live or demo database.

No key is ever sent to the browser.

## AI features (built in the order the brief gives)

1. **Ask helper** (`lib/ai/helper.ts`). Retrieval runs over *approved* content only. If nothing matches, the model is skipped and the student is handed to WhatsApp. If the model replies `HANDOFF`, that is never streamed raw. The reply streams from the server, and logs are stored with names, phones and emails redacted.
2. **Diagnostic scoring** (`lib/services/diagnostic.ts`). Code marks the objective answers. Writing and speaking are scored against the fixed rubric (`lib/ai/rubric.ts`) in strict JSON. Each criterion gets a one-line reason. Code recomputes the overall band rather than trusting the model's.
3. **Writing and speaking feedback** (`lib/services/submissions.ts`). Audio is uploaded and transcribed first. The pipeline is: validate JSON → retry once → `needs_teacher`.
4. **Practice generator** (`lib/services/practice.ts`). Questions target the weakest skill and are tagged by skill and level. They are saved as `pending_review` and enter the bank only after a teacher approves them.
5. **Report writer** (`lib/ai/report-writer.ts`). The model writes with `{{placeholders}}` only; any output containing a digit is rejected. Code fills in every number.

Every AI score is shown as an **estimate** until a teacher confirms it. Teachers can override any score, and both the AI score and the final score are stored.

## Marking pipeline

`submit → queued → (transcribe) → objective by code → rubric JSON → validate/retry → ai_estimate → awaiting_review (mock) | released (practice) → teacher override → released → WhatsApp notify`.

Raw audio is deleted after scoring unless the student opted to keep it.

## Database

- `supabase/migrations/0001_schema.sql`: all core tables, plus the atomic `reserve_seat()` (row lock, so the last seat can't be double-booked).
- `supabase/migrations/0002_rls.sql`: row-level security.
  - A student sees only their own record.
  - A parent sees only a child with a `parent_share` consent, plus a `parent_signed_minor` consent if the child is under 18 or their age is unknown.
  - Staff see only their own office. Admin sees everything.
  - Answer keys are revoked from client roles.
- `lib/access.ts` mirrors the same rules in code, so demo mode and the tests enforce them too.

## Acceptance checks → where they're proven

| Check | Test |
|---|---|
| Diagnostic → confirmed seat, no retyping | `tests/acceptance.test.ts` › diagnostic → confirmed seat |
| Writing marked → reviewed → released, both scores kept | › writing submission |
| No parent access without consent | › parent access needs consent |
| Demo flag returns the site to sample data | `EDU_DEMO_MODE`, `lib/pipeline.ts` (`withPageDb`, `route`) |
| Mumbai ↔ Vadodara isolation | › office isolation (+ RLS policies) |
| No key in browser or repo | `npm run check:secrets` (scans `.next/static` + tracked files) |

## Going live: checklist

1. Create a Supabase project. Run both migrations. Create a **private** bucket called `edu-private`. Enable phone and/or email OTP.
2. Create staff and student `users` rows linked to `auth.users`. Set the office for every staff member.
3. Set the variables from `.env.example` in Vercel, **separately for Preview and Production**. None of them may use the `NEXT_PUBLIC_` prefix.
4. OpenAI: set a **hard monthly budget** in the dashboard. `AI_DAILY_LIMIT_PER_USER` caps each user.
5. Inngest: connect the app at `/api/inngest`. This schedules weekly drafts (Sunday 6 pm IST) and hourly hold expiry.
6. WhatsApp Business: get message templates approved for booking confirmation, result-ready and weekly report. Business-initiated messages outside the 24-hour window need templates.
7. Rate limiting is in-memory per instance. For hard global limits, back `lib/rate-limit.ts` with Upstash/Vercel KV.
8. Confirm the retention periods in `/privacy` with the client.

## Design

The design follows the "green playground" reference: Nunito, flat colours, thick borders, a 12px radius everywhere, and depth from a bottom border instead of shadows. There are no gradients. The illustrations and the mascot "Towie" are original. Note: white text on `#58cc02` (the brand's primary button) is below WCAG AA contrast. If accessibility is a priority, switch `--color-ecto-green` on buttons to `--color-tree-green` (`#58a700`).
