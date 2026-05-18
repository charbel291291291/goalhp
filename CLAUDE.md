# QuizGoal 2026 — Claude Instructions

## Git Workflow
- **Always commit and push directly to `main`**
- Do NOT create feature branches unless explicitly asked
- After every change: `git add`, `git commit`, `git push origin main`

## Project Stack
- React + TypeScript + Vite SPA
- Supabase (PostgreSQL + Realtime + Auth)
- Tailwind CSS + framer-motion
- Deployed on Vercel (auto-deploys on push to main)

## Key Conventions
- All navigation uses `window.history.pushState` + `popstate` — no React Router
- Modals and file inputs that need real viewport positioning must use `createPortal(…, document.body)` to escape framer-motion's CSS transform stacking context
- Auth state lives in `src/store/useAuth.ts` (Zustand)
- Shared data hooks live in `src/lib/useData.ts`
- SQL migrations go in `src/db/` and must be run manually in Supabase SQL Editor

## Build
```bash
npm run build   # TypeScript check + Vite build
```
Always run build before pushing to verify no TypeScript errors.
