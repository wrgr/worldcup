# World Cup 2026 Live ELO Bracket

A single-file, static GitHub Pages site for the World Cup 2026 knockout bracket:

- four decision-tree quarters feeding semifinals, third-place playoff, and final
- live match state pulled from ESPN's public scoreboard feed (with a committed JSON cache as a first source)
- scheduled labels for all future/unplayed matches
- ELO-based predictions for unresolved games, recomputed after each result
- **Predict mode** — click teams to advance your own picks and a slider to tune how many upsets the model expects
- recent head-to-head notes where embedded lookups exist
- browser auto-refresh every 2 hours

No build step and no server — everything runs in the browser from a single HTML file.

## Files

- `index.html` — the entire app (markup, styles, and logic). This is the GitHub Pages entry point.
- `world_cup_live_bracket.html` — a byte-identical copy of `index.html` for opening the bracket directly from disk (`file://`). Kept in sync with `index.html`; edit `index.html` and copy it over.
- `scoreboard.json` — optional scoreboard cache read first on load. The committed file is an empty placeholder; the page falls back to ESPN live if it has no events.
- `.nojekyll` — tells GitHub Pages to serve files as-is (no Jekyll processing).

## How live updates work

On load (and every 2 hours after), the page tries data sources in order:

1. `scoreboard.json` in the repo root — a cached snapshot, if you choose to populate it.
2. ESPN's public World Cup scoreboard feed, fetched directly from the browser.
3. The embedded knockout snapshot baked into the page (so the bracket always renders).

Official results always override ELO predictions. All unplayed/future matches show as **SCHEDULED**. Cross-check official fixtures against [FIFA's schedule page](https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums).

## Predict mode

Click **Predict mode** in the header, then:

- Click either team in a match to make them your projected winner. Picks cascade down the bracket and recolor the projected path. Click the same team again to clear that pick.
- Drag **Upset factor** to reshape the ELO probabilities: `1.0×` is the standard model, higher values flatten the odds (more upsets), lower values favor the stronger side more sharply.
- **Reset picks** clears all manual picks and returns to the pure ELO projection.

Manual picks never override an official result — confirmed winners stay locked.

## Deploy to GitHub Pages (deploy from branch)

1. Push this repo to GitHub with `index.html` at the repository root.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose branch **`main`** and folder **`/ (root)`**, then **Save**.
5. Wait for the deployment, then open the published URL (`https://<user>.github.io/<repo>/`).

Pushing to `main` republishes the site automatically.

## Prediction model notes

Each unresolved match uses an embedded ELO table and the logistic transform `1 / (1 + 10^(-ΔELO / (400 × upsetFactor)))`. It ignores injuries, rest, travel, home advantage, styles, and penalty-specific skill except as already reflected in the rating. The ELO layer is independent of official match state.
