# World Cup 2026 Live Bracket

By W. Gray-Roncal · <willgray@gmail.com>

A single-file, static GitHub Pages site for the World Cup 2026 knockout bracket:

- four decision-tree quarters feeding semifinals, third-place playoff, and final
- live match state pulled from ESPN's public scoreboard feed (with a committed JSON cache as a first source)
- scheduled labels for all future/unplayed matches
- a **backtested win-probability classifier** (logistic on Elo + host advantage) as the base prediction, validated out-of-sample on 2014–26 internationals (78% accuracy, 83% at World Cups)
- a **"Who wins it all" ranking** — every remaining team by the model's title odds (full-bracket propagation), shown on the page
- a **⚖️ Blend** control — one slider to set how much the value & market signals pull the model pick
- **Predict mode** — click teams to advance your own picks and a slider to tune how many upsets the model expects
- **Recent-data layer** — pulls live betting odds, cards, and news from ESPN and blends the market into each prediction
- **Squad value** — each team's total Transfermarkt market value shown on every card, with an optional layer that folds it into the prediction
- **model-generated match previews** for every current/upcoming tie (R16, quarterfinals, …) built from the model pick, Elo edge, host advantage, squad value, betting market, head-to-head, and each side's **key players** — with hand-written editorial previews used where they exist
- **Coming up** — a header popup with the remaining teams ranked by squad value, plus the next matches with the model pick, open betting odds, squad values, and recent news
- match popups pull the ESPN preview/news, odds, and cards on demand (no toggle needed), with news filtered to the two teams in question
- centered on the **Round of 16** (the completed Round of 32 columns are hidden; their results still feed the R16 cards)
- recent head-to-head notes where embedded lookups exist
- browser auto-refresh every 2 hours

No build step and no server — everything runs in the browser from a single HTML file.

## Files

- `index.html` — the entire app (markup, styles, and logic). This is the GitHub Pages entry point, and also opens directly from disk (`file://`).
- `scoreboard.json` — a same-origin fallback cache of ESPN's scoreboard, refreshed automatically by the workflow below. Used only when the visitor's browser can't reach ESPN directly.
- `.github/workflows/refresh-scoreboard.yml` — refreshes `scoreboard.json` from ESPN every 2 hours (and on manual dispatch).
- `.nojekyll` — tells GitHub Pages to serve files as-is (no Jekyll processing).

## How live updates work

On load (and every 2 hours after), the page tries data sources in order:

1. ESPN's public World Cup scoreboard feed, fetched directly from the browser — the live, real-time source (keyless and CORS-open, so it works straight from GitHub Pages).
2. `scoreboard.json` in the repo root — a same-origin cache refreshed every 2 hours by the GitHub Action, used as a fallback when ESPN is unreachable from the browser.
3. The embedded knockout snapshot baked into the page — carries the real Round-of-32 results so the current bracket always renders, even fully offline.

Live events are matched to the bracket by ESPN event id (baked into each match) and by team name + kickoff time as a fallback, so results flow in even if ESPN renumbers a fixture.

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

## Squad value

Every card shows each squad's **total market value** — from [Transfermarkt](https://www.transfermarkt.com)'s 2026 World Cup squad valuations (e.g. France €1.52bn, England €1.36bn, Spain €1.22bn, Portugal €1.01bn). Tap a match for a panel that breaks out both teams and the value share.

Click **Squad value** in the header to fold it into the pick. The more valuable squad is favored in proportion to its share of the two teams' combined value, and the **Value weight** slider blends it in: `0%` ignores value (pure ELO/market pick), `100%` picks purely by squad value. The blend is applied on top of the ELO (and, if on, market) probability. Market values fluctuate, so treat them as a snapshot rather than a live figure.

## Coming up

The **📋 Coming up** button (top bar) opens a popup summarising the state of the tournament:

- **Remaining teams** — every side still alive, ranked by squad value.
- **Next matches** — the upcoming fixtures, each with open betting odds (ESPN moneylines converted to a "to advance" share), the two squads' values, and recent ESPN news. Tap any match to open its full detail.

Match popups also pull ESPN's preview/news, betting odds, and cards on demand when you open them, so a preview appears even for matchups without an embedded AI writeup.

## Deploy to GitHub Pages (deploy from branch)

1. Push this repo to GitHub with `index.html` at the repository root.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose branch **`main`** and folder **`/ (root)`**, then **Save**.
5. Wait for the deployment, then open the published URL (`https://<user>.github.io/<repo>/`).

Pushing to `main` republishes the site automatically.

## Prediction model (backtested classifier)

Each unresolved match's "to advance" probability comes from a logistic classifier:

```
P(win) = sigmoid( 0.64 · (ΔElo / 100) + 0.25 · host )
```

- **Trained/validated** on 9,403 decisive international matches from 2014 to 2026 (World Cups, continental cups, qualifiers, friendlies), sourced from the [martj42 international results dataset](https://github.com/martj42/international_results). Drawn knockouts are resolved by their penalty result.
- **Elo** is computed from the full international match history (World-Football-Elo style, with margin-of-victory and home advantage). `host` gives the 2026 co-hosts (USA, Canada, Mexico) a home edge worth ≈39 Elo.
- **Out-of-sample performance** (2023–26 holdout, 2,912 matches): **78% accuracy, Brier 0.149, log-loss 0.453**. On World Cup matches alone: **83% accuracy, Brier 0.124**. Recent form and goal-difference features were tested and dropped — they didn't improve out-of-sample log-loss.
- The **Upset slider** flattens the curve (divides the logit). Official winners always override predictions.

The classifier is the base pick. The **Squad value** and **Recent data** layers fold their own "to advance" estimates in on top via the weight sliders (`(1 − w)·base + w·signal`), and the match popup shows all three signals — model, value, market — side by side. These blend layers are heuristic (not part of the historical backtest); the backtested figures above describe the Elo classifier alone.
