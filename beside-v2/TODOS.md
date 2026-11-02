# TODOS

## Server-gated sharp photos before real companion portraits
- **What:** serve each companion's sharp photo only through signed URLs that the server issues after checking real member verification. Soft (pre-blurred) files stay public.
- **Why:** in the prototype, "verified" is a browser flag and the sharp URL is derivable from the soft one. With real faces, anyone who can see the soft image could load the sharp one. That breaks the promise made to companions.
- **Pros:** makes "full photos for verified members only" true for real people.
- **Cons:** needs a backend, real auth and object storage. That's real infrastructure.
- **Context:** decided in the eng review (D5, 2026-10-29, `docs/designs/beside-home-feed.md`). Until this exists, the prototype uses licensed stock or AI portraits of non-companions only. Start from `data/companions.ts` (`softPhoto` and `sharpPhoto`) and `components/photo/UnlockImage.tsx`.
- **Depends on / blocked by:** a real backend with authentication and real ID verification. This must be done before any real companion portrait is uploaded.
