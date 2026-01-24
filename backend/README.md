# Matchday Backend (Next.js)

## Weekly data updates

Edit `data/matchups.json` each Gameweek to update your custom mini-league matchups.  
- Only include your mini-league pairings (team vs team).  
- Do not add EPL fixtures here.

Edit `data/teams.json` when you need to adjust manager names, FPL team names, or entry IDs.  
- This is the long-lived roster list for all 2-person teams.  
- Entry IDs are resolved from the league standings (or filled manually if missing).

Edit `data/captains.json` each Gameweek to update captains.  
- Use `default` for your standard captains per matchup.  
- Add a `byGameweek` override when you want a different captain for a specific GW.

## Players left to play (definition)

"Players left to play" counts only starting XI picks whose EPL fixture has **not started yet**.  
If a fixture has already started (even if still ongoing), that player is not counted.

## API

`GET /api/live-score`  
Query params:
- `gw` (optional): Gameweek number. If omitted, the API auto-detects the current GW.
- `matchupId` (optional): Return only a single matchup by id.
