# World Cup 2026 Live ELO Bracket

Static GitHub Pages site for a traditional World Cup knockout bracket with:

- four decision-tree quarters feeding semifinals and final
- official/live match state from a scoreboard JSON file
- scheduled labels for all future/unplayed matches
- ELO-based predictions for unresolved games
- recent head-to-head notes where embedded lookups exist
- browser auto-refresh every 2 hours
- optional GitHub Action that refreshes `data/scoreboard.json` every 2 hours

## Quick deploy with GitHub Pages

1. Unzip this project.
2. Create a new GitHub repository.
3. Upload the unzipped contents to the repository root, including `.github/`, `data/`, `index.html`, and `.nojekyll`.
4. In GitHub, go to **Settings → Pages**.
5. Choose either:
   - **Deploy from branch** → `main` → `/root`, or
   - **GitHub Actions** if you want the included scheduled refresh workflow to run.
6. Open the Pages URL after deployment.

## How updates work

The page refreshes in the browser on load and then every 2 hours. It first tries to read `data/scoreboard.json` from the same GitHub Pages site. The included workflow updates that file every 2 hours from ESPN's public World Cup scoreboard endpoint.

If `data/scoreboard.json` is missing, empty, or stale, the browser attempts ESPN's public scoreboard endpoint directly. If both live sources fail, the bracket still renders from the embedded fallback snapshot.

## Files

- `index.html` — GitHub Pages entry point.
- `world_cup_live_bracket.html` — duplicate named copy for direct file use.
- `data/scoreboard.json` — scoreboard cache, refreshed by the workflow.
- `.github/workflows/update-scoreboard.yml` — scheduled refresh job.
- `.nojekyll` — prevents GitHub Pages from treating this as a Jekyll site.

## Notes

The ELO prediction layer is separate from official match state. Official final winners override ELO picks. All unplayed/future matches are shown as **SCHEDULED**.
