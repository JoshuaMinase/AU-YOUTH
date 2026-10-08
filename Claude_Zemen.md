# Claude_Zemen.md — Zemen's rules for Claude

Read this file first and follow it in every session. Add new rules at the bottom of the matching section.

## Environment
- Local machine is **Windows**. Every command must be **PowerShell** (`Expand-Archive`, `Copy-Item`, `Remove-Item`, `$env:VAR`). Never give bash, cmd or Linux commands.
- Downloads folder is `D:\Chrome_Downloads`. Do not use `C:\Users\HP\Downloads`.
- Zemen does not unzip anything by hand. Always give the PowerShell command that unzips from `D:\Chrome_Downloads`.

## Delivery
- Zip **only the files that changed**, keeping their folder structure.
- Every zip needs a **unique filename**. Never reuse a zip name from an earlier delivery.
- Give the **exact `Copy-Item` command for each file**, not a generic copy-everything line.
- Every delivery includes the whole flow in PowerShell, from unzip, through copying the files, installing packages and checking the build, to `git add`, `git commit` and `git push` to GitHub.
- Run `npm run build` before pushing and push only if it passes. Never commit `.env.local` or any secret key.

## Project-specific (au_youth, Drizzle/Neon version)
- Local folder: `C:\Users\HP\projects\au-youth-platform`.
- When `src/db/schema.ts` changes, remind Zemen to run `npx drizzle-kit push` manually.
- After real work, append a dated entry to `CHAT_HISTORY.md`. `COMMIT_HISTORY.md` is generated from git log and is never edited by hand.

## Project-specific (AU-YOUTH, Next.js + Supabase version, repo JoshuaMinase/AU-YOUTH)
- Follow that repo's `AGENTS.md`. Ask before adding dependencies.
- Supabase project is AU-YOUTH. Only the publishable key goes in the app. Never use the secret or `service_role` key in the repo.
- Deployed on Render at `https://au-youth.onrender.com`. `NEXT_PUBLIC_*` variables are baked in at build time, so redeploy after changing them.
- SQL files live in `docs/sql/` and are run by hand in the Supabase SQL Editor.
