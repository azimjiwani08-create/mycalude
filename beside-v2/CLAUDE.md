@AGENTS.md

# Beside: rules for every Claude session

Beside is a paid, platonic conversation-companion marketplace for Mumbai (Next.js 16 App Router, TypeScript, Tailwind v4, Capacitor iOS shell). Both owners work with Claude Code, so these rules keep every session building the same product.

## Product rules (never break)

- Companions are for conversation only. No dating cues.
- Banned words in any copy, label or page source: rent, girlfriend, date, hookup.
- Before verification a member sees only the pre-blurred soft photo (`softUrl`). The sharp photo loads only after verification (`UnlockImage`).
- The feed shows no prices, ratings, session counts or filter chips. The session fee appears only on the booking summary, and trimmed server data (`toFeedCompanion`) keeps it out of the page source.
- Public places only. Safety features (SOS, check-in, live session) are never hidden or weakened.

## Design rules

- Palette: white screens, ink `#111111`, pink `#F1B2DC` for buttons and highlights, pink tint `#FBEAF5`, hairline `#E7D8DD`. Use the tokens in `app/globals.css`, never raw hex in components.
- Text on pink is flat ink.
- Alert red `#D6362F` only for SOS, the Live session pill and urgent alerts.
- Fonts: Zodiak for titles, Supreme for everything else, one weight.
- Glass (`glass`, `feed-blur`, `photo-scrim`) only over photos, never on white screens.
- Corners: 28px for cards and photos, full pill for buttons. Touch targets at least 44px.
- Every gesture has a button alternative, honours Reduce Motion, and clears the safe areas.

## How we work

- Never commit to `main`. Branch from `main`: `front/<topic>` for UI, `back/<topic>` for server work. Open a pull request, get the other person to review, then merge.
- Frontend owner: `app/`, `components/`, `app/globals.css`. Backend owner: server code, database, auth, payments, safety loop. Change the other person's area only by agreement in the pull request.
- Shared types live in `data/`. Change them in their own small pull request first.
- Secrets never go in the repo. Copy `.env.example` to `.env.local` and fill it in. Each person uses their own dev database.
- Commits are small and in plain English. Run `git pull --rebase origin main` before you push.

## Checks before a pull request

```bash
npm run lint
npx tsc --noEmit
npm test
npm run test:e2e
```

Read `docs/COLLABORATION.md` for the full setup and the day-to-day routine.
