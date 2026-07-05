# Prediction model

The bracket's win-probability prediction is a logistic classifier:

```
P(win) = sigmoid( 0.64 · (ΔElo / 100) + 0.25 · host )
```

- **`backtest.mjs`** — reproducible pipeline. Run `node model/backtest.mjs` (Node 18+). It fetches the public [martj42 international-results dataset](https://github.com/martj42/international_results), builds an Elo rating for every national team from full match history, fits the classifier on 9,403 decisive international matches from 2014 onward, validates it out-of-sample on a 2023+ holdout, and writes `model.json`.
- **`model.json`** — the fitted coefficients (`B`, `C`), out-of-sample metrics, and current team ratings that `index.html` embeds (as `MODEL` and `modelElo`).

## Out-of-sample results (2023–26 holdout, 2,912 matches)

| Set | Accuracy | Brier | Log-loss |
|---|---|---|---|
| All internationals | 78.0% | 0.149 | 0.453 |
| World Cup matches only | 82.9% | 0.124 | 0.400 |

`host` gives the 2026 co-hosts (USA, Canada, Mexico) a home edge worth ≈39 Elo. Recent-form and goal-difference features were tested and dropped — they did not improve out-of-sample log-loss. To refresh after new results, re-run `backtest.mjs` and copy `B`, `C`, and `ratings` from `model.json` into `index.html`.
