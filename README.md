# Cloud CI/CD Mini Project

A static website deployed to the cloud (GitHub Pages) through an automated
CI/CD pipeline built with GitHub Actions. Every push to `main` is tested,
built and published without any manual step.

## Pipeline

```
git push --> [ Test ] --> [ Build ] --> [ Deploy to GitHub Pages ]
              npm test    npm run build   live URL updated
```

| Stage  | What it does | Stops the pipeline if... |
|--------|--------------|--------------------------|
| Test   | Runs unit tests (cost estimator, service-model logic) and smoke tests (assets exist, relative paths, element ids) | any test fails |
| Build  | Copies `src/` to `dist/` and writes `build-info.json` with the commit SHA and time | the build script errors |
| Deploy | Publishes `dist/` using the official Pages actions | build failed, or the event is a pull request |

Pull requests run Test and Build only, so you can see a failing check before merging.

## Project structure

```
src/                  the website (HTML, CSS, JS modules)
  lib.js              pure logic, unit-tested
test/                 node:test unit and smoke tests (no dependencies)
scripts/build.js      build step run by the pipeline
scripts/serve.js      local preview server
.github/workflows/deploy.yml   the CI/CD pipeline
```

No npm dependencies are needed. You only need Node.js 20 or newer.

## Run locally

```bash
npm test            # run the tests
npm run build       # creates dist/
npm start           # preview at http://localhost:8080
```

## Deploy it (one-time setup)

1. Create a new empty repository on GitHub (for example `cloud-cicd-demo`).
2. Push this project:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/cloud-cicd-demo.git
   git push -u origin main
   ```
3. In the repository go to **Settings -> Pages**, and under **Build and deployment** set **Source** to **GitHub Actions**.
4. Open the **Actions** tab. The first run starts automatically (re-run it if it ran before you changed the Pages setting).
5. When the Deploy job turns green, your site is live at
   `https://<your-username>.github.io/cloud-cicd-demo/`.

## Demo script for your viva or presentation

1. **Show a successful run:** open the Actions tab, expand the three jobs, open the live URL and point to the footer showing the deployed commit hash.
2. **Show the pipeline catching a bug:** in `src/lib.js` change `vcpuPerHour: 0.02` to `0.03`, commit and push. The Test job fails, Build and Deploy are skipped, and the live site is unchanged.
3. **Show a fix going live:** revert the change, push, and watch all three stages pass. Refresh the site and the footer shows the new commit hash.
4. **Show PR protection:** push a branch and open a pull request. Test and Build run, Deploy is skipped.

## Concepts this project demonstrates

- Continuous Integration: automated tests on every push
- Continuous Delivery/Deployment: automatic release to a cloud host
- Infrastructure as code: the pipeline is a versioned YAML file
- Static hosting on a cloud platform (GitHub Pages, backed by a CDN)
- Artifacts, job dependencies (`needs`), environments and concurrency control
- Cloud service models (IaaS, PaaS, SaaS) shown on the page itself

## Possible extensions

- Deploy the same `dist/` to Netlify or Vercel as a second target and compare them
- Add an HTML validator or Lighthouse performance check as a pipeline stage
- Add a status badge to this README:
  `![CI](https://github.com/<user>/<repo>/actions/workflows/deploy.yml/badge.svg)`
- Add a custom domain through the Pages settings
