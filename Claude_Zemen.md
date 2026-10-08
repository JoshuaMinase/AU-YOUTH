# Claude_Zemen.md — Zemen's rules for Claude

Read this file first and follow it in every session. Add new rules at the bottom of the matching section.

## Environment
- Local machine is **Windows**. Every command must be **PowerShell** (`Expand-Archive`, `Copy-Item`, `Remove-Item`, `$env:VAR`). Never give bash, cmd or Linux commands.
- Downloads folder is `D:\Chrome_Downloads`. Do not use `C:\Users\HP\Downloads`.
- Zemen does not unzip anything by hand. Always give the PowerShell command that unzips from `D:\Chrome_Downloads`.

## Delivery
- Zip **only the files that changed**, keeping their folder structure.
- Every zip needs a **unique filename**. Never reuse a zip name from an earlier delivery, so Chrome never creates `abc (1)` duplicates. The same goes for any other downloadable file, including this one.
- Give the **exact `Copy-Item` command for each file**, not a generic copy-everything line.
- Every delivery includes the whole flow in PowerShell, from unzip, through copying the files, to `git add`, `git commit` and `git push` to GitHub.
- Projects that are already live on Render are **not run locally**. Push to GitHub and test on Render. Do not tell Zemen to run `npm run dev` or `npm run build` locally.
- Never commit `.env.local` or any secret key.

## Project-specific (au_youth, Drizzle/Neon version)
- Local folder: `C:\Users\HP\projects\au-youth-platform`.
- When `src/db/schema.ts` changes, remind Zemen to run `npx drizzle-kit push` manually.
- After real work, append a dated entry to `CHAT_HISTORY.md`. `COMMIT_HISTORY.md` is generated from git log and is never edited by hand.

## Project-specific (AU-YOUTH, Next.js + Supabase version, repo JoshuaMinase/AU-YOUTH)
- Follow that repo's `AGENTS.md`. Ask before adding dependencies.
- Supabase project is AU-YOUTH. Only the publishable key goes in the app. Never use the secret or `service_role` key in the repo.
- Local folder: `D:\Projects\AU-YOUTH`.
- Deployed on Render at `https://au-youth.onrender.com`. `NEXT_PUBLIC_*` variables are baked in at build time, so redeploy after changing them.
- SQL files live in `docs/sql/` and are run by hand in the Supabase SQL Editor.
