# Deploy AU-YOUTH to Render

## Files to add to the repo root
- `render.yaml`
- `.node-version`
- `package-lock.json` (replace the old one; the original was out of sync with package.json and breaks `npm ci`)

## Steps
1. Copy the 3 files above into the project root (same level as `package.json`).
2. Push to GitHub:
   ```
   git init
   git add .
   git commit -m "Add Render config"
   git branch -M master
   git remote add origin https://github.com/<you>/AU-YOUTH.git
   git push -u origin master
   ```
   (If your branch is `main`, change `branch: master` in `render.yaml` to `main`.)
3. Go to https://dashboard.render.com -> New -> Blueprint.
4. Connect your GitHub account, pick the AU-YOUTH repo, click Connect.
5. Render reads `render.yaml`. Review it and click Apply.
6. Wait for the build (about 3-5 minutes). Your site goes live at `https://au-youth.onrender.com`.

## Manual alternative (no render.yaml)
New -> Web Service -> pick repo, then set:
- Runtime: Node
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Env var: `NODE_VERSION` = `20.18.0`

## Notes
- No environment variables are required. The app has no API routes or database; login/sign-up are placeholders that just redirect to /dashboard.
- Free plan sleeps after ~15 min idle; the first visit after that takes about 30-60 seconds. Use a paid plan to avoid this.
- Auto-deploys on every push to the branch.
- Custom domain: Service -> Settings -> Custom Domains, then add the DNS records Render shows.
