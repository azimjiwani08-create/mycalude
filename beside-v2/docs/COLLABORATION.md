# Working on Beside together

Two people, two computers, one GitHub repo. Nobody edits a shared live copy. Each person works on their own branch and merges through a pull request.

## Roles

| | Azim (frontend) | Friend (backend) |
|---|---|---|
| Owns | `app/`, `components/`, design, copy | server code, database, auth, OTP, KYC, payments, safety loop |
| Branches | `front/<topic>` | `back/<topic>` |
| Reviews | backend pull requests for anything the UI touches | frontend pull requests for anything that calls the server |

Shared types live in `data/`. Change them in their own small pull request first, so the other person can build on them.

## One-time setup (about 30 minutes)

### 1. Company accounts first
Create these under a company identity, not a personal one, so both of you keep access if anything changes:

1. A GitHub **organisation** (for example `beside-app`). Both of you are **Owners**.
2. A Vercel team, linked to that organisation.
3. A Supabase organisation, with both of you as owners.
4. A shared password manager (1Password, Bitwarden) for keys and logins.

Turn on two-factor login on every account.

### 2. Create the repo (Azim)
1. In the organisation, create a **private** repo called `beside`. Leave it empty.
2. Add your friend as a collaborator (or as an Owner of the organisation).
3. Push this project:

```bash
git remote add origin git@github.com:<org>/beside.git
git push -u origin main
```

### 3. Protect `main`
In GitHub, go to Settings, Branches, Add rule for `main`:
- Require a pull request before merging.
- Require 1 approval.
- Require the checks to pass (once CI exists).

### 4. Your friend's computer
```bash
git clone git@github.com:<org>/beside.git
cd beside
npm install
cp .env.example .env.local   # then fill in their own dev keys
npm run dev
```
Install Claude Code, open the folder, and start it. It reads `CLAUDE.md` on its own, so both sessions follow the same rules.

### 5. Vercel
Import the repo in the company Vercel team. Every branch and pull request then gets its own preview link, so you can both open the same running app without sharing a laptop.

### 6. Supabase
Each person creates their own **dev** project. Nobody tests on the live one. Schema changes go in migration files in the repo, so the other person can apply them.

## Daily routine

```bash
git checkout main && git pull
git checkout -b front/feed-tweaks     # or back/otp-login
# ... work with Claude Code ...
npm run lint && npx tsc --noEmit && npm test
git add -A && git commit -m "Describe what changed in plain English"
git pull --rebase origin main
git push -u origin front/feed-tweaks
```

Then open a pull request on GitHub. The other person looks at the Vercel preview link, reviews, and approves. Merge, delete the branch, and pull `main` again.

Rules of thumb:
- Small pull requests, merged the same day if you can.
- Tell each other before touching the other person's folders.
- If you both need the same file, talk first.
- Pull `main` every morning.

## Secrets
- Never put a key, password or token in the repo, a chat with Claude, or a screenshot.
- Real values live in the password manager. `.env.example` shows the names with empty values.
- Use test or sandbox keys for payments, OTP and KYC until launch.
- If a secret leaks, rotate it immediately, then tell the other person.

## Working at the same moment
- **Same running app:** Vercel preview links.
- **Same file, live:** VS Code Live Share or Zed shared editing. Claude Code runs in the terminal inside it.
- **Quick check-in:** a call with screen share.

## Product rules both of you keep
Listed in `CLAUDE.md`: no prices, ratings or filters in the feed, soft photos before verification, no dating cues, the banned words, and alert red only for safety. A pull request that breaks one of these does not merge.

## Open items before launch
- Gated data is still in the page source for some routes, and `/live` and `/requests` are unprotected.
- The safety loop (SOS, check-in) is a mock until the backend exists.
- Photos are placeholders.
- The admin panel and photo upload need the backend first.
