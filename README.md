# World Cup 2026 Live ELO Bracket

A single-file, static GitHub Pages site for the World Cup 2026 knockout bracket:

- four decision-tree quarters feeding semifinals, third-place playoff, and final
- live match state pulled from ESPN's public scoreboard feed (with a committed JSON cache as a first source)
- scheduled labels for all future/unplayed matches
- ELO-based predictions for unresolved games, recomputed after each result
- **Predict mode** — click teams to advance your own picks and a slider to tune how many upsets the model expects
- **Recent-data layer** — pulls live betting odds, cards, and news from ESPN and blends the market into each prediction
- recent head-to-head notes where embedded lookups exist
- browser auto-refresh every 2 hours

No build step and no server — everything runs in the browser from a single HTML file.

## Files

- `index.html` — the entire app (markup, styles, and logic). This is the GitHub Pages entry point, and also opens directly from disk (`file://`).
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

## Recent-data layer (betting markets, cards & news)

Click **Recent data** in the header to pull, per match, from ESPN's public summary endpoint (no API key, CORS-open):

- **Betting market** — DraftKings moneyline, converted to an implied "to advance" probability. The **Market weight** slider blends it with ELO (`0%` = pure ELO, `100%` = pure market).
- **Cards** — yellow/red cards with player, team, and minute, shown as chips (a suspension/availability signal).
- **News** — recent ESPN headlines for the match (team news, injuries, previews) as links.

Only matches ESPN currently lists with both teams known carry odds (i.e. the live round); future rounds fill in as teams are decided. Requests are fetched on demand when you enable the layer and throttled four at a time. If ESPN ever changes or blocks the endpoint, the rest of the page is unaffected.

## Deploy to GitHub Pages (deploy from branch)

1. Push this repo to GitHub with `index.html` at the repository root.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose branch **`main`** and folder **`/ (root)`**, then **Save**.
5. Wait for the deployment, then open the published URL (`https://<user>.github.io/<repo>/`).

Pushing to `main` republishes the site automatically.

## Prediction model notes

Each unresolved match uses an embedded ELO table and the logistic transform `1 / (1 + 10^(-ΔELO / (400 × upsetFactor)))`. On its own it ignores injuries, rest, travel, home advantage, styles, and penalty-specific skill except as already reflected in the rating — the recent-data layer is how live market/news context gets folded in. With that layer on, the displayed probability is `(1 − w)·ELO + w·market`, where `w` is the Market-weight slider. The ELO layer is independent of official match state, and official winners always override predictions.
