# Pushing Project KEYSTONE to GitHub

Follow these steps exactly — copy/paste into your terminal one block at a time.

## 1. Create the repository on GitHub

1. Go to https://github.com/new
2. Repository name: `keystone-field-service` (or any name you like)
3. Visibility: **Public** (so your mentor and reviewers can access it without permissions),
   or **Private** with your mentor added as a collaborator — either satisfies the brief.
4. **Do NOT** check "Add a README" / ".gitignore" / license — this project already has
   those files and it avoids a merge conflict on your first push.
5. Click **Create repository**. Keep the page open — it shows the exact remote URL you'll
   need (something like `https://github.com/<your-username>/keystone-field-service.git`).

## 2. Push your local project

Open a terminal in the folder where you unzipped this project (the folder that directly
contains `backend/`, `frontend/`, `README.md`, etc.) and run:

```bash
git init
git add .
git commit -m "Initial commit: Project KEYSTONE full-stack platform"
git branch -M main
git remote add origin https://github.com/<your-username>/keystone-field-service.git
git push -u origin main
```

Replace `<your-username>` and the repo name with your actual GitHub username and the
name you chose in step 1.

If this is the first time you're pushing from this machine, Git may ask you to sign in —
follow its prompt (it will open a browser window, or ask for a Personal Access Token if
you use HTTPS auth; GitHub's device-login flow is the easiest for beginners).

## 3. Verify

Refresh the GitHub repository page in your browser. You should see the full folder
structure: `backend/`, `frontend/`, `README.md`, `docker-compose.yml`, `render.yaml`,
`.gitignore`, and this guide.

## 4. Double-check nothing sensitive got committed

The `.gitignore` already excludes `backend/.env`, `frontend/.env`, `node_modules/`, and
build output (`target/`, `dist/`). Before you push, it's worth running:

```bash
git status
```

...and confirming you don't see `.env` or `node_modules` in the list of files about to
be committed. If you do, something's off with `.gitignore` placement — make sure it's
in the same folder where you ran `git init` (the project root).

## 5. Making changes later

Once the repo exists, any future change is just:

```bash
git add .
git commit -m "Describe what you changed"
git push
```

## 6. Giving your mentor access (if the repo is Private)

GitHub repo page → **Settings** → **Collaborators** → **Add people** → enter your
mentor's GitHub username or email → they'll get an invite email.

## 7. What to put in the submission form

- **Source code link**: the GitHub repo URL from step 1, e.g.
  `https://github.com/<your-username>/keystone-field-service`
- **Live deployment links**: your Render backend URL and Render (or Vercel/Netlify)
  frontend URL — see `README.md` §6 for how to deploy both for free.
- **Demo video / Feedback video**: unlisted YouTube or Google Drive links (see
  `DEMO_VIDEO_SCRIPT.md` and `FEEDBACK_VIDEO_SCRIPT.md` in this repo) — remember to
  set sharing to "Anyone with the link" so reviewers aren't blocked by a login prompt.
- **Project report**: `Project_KEYSTONE_Report.docx` (included in this repo) — upload
  it to Drive too and share the same way, or attach the file directly if the
  submission form allows uploads.
