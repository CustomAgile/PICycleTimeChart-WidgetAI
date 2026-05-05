# PI Cycle Time Chart — Setup Guide

End-to-end setup for developing, testing, and deploying the PI Cycle Time Chart widget.

## Prerequisites

- Node.js 18+ and npm
- A Rally workspace and project you can access
- A Rally API key (instructions below)

## 1. Generate a Rally API key

1. Sign in to Rally.
2. Open the API key page: **<https://rally1.rallydev.com/#/api_key>** (or click your avatar → API Keys).
3. Click **Create**, give the key a name (e.g. `widget-dev`), pick the workspaces it can access, and copy the full key. It starts with `_`.
4. Treat it like a password — don't paste it into anything that gets committed.

## 2. Configure auth

The Vite dev server proxies `/slm/*` requests to Rally. It reads credentials in this order (first non-empty wins):

### Option A — `auth.json` (per-widget, gitignored)

Create `auth.json` in the `pi-cycle-time-chart/` folder:

```json
{
  "server": "https://rally1.rallydev.com",
  "apiKey": "_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

`auth.json` is in `.gitignore` and never commits.

### Option B — environment variables

```bash
export RALLY_SERVER=https://rally1.rallydev.com
export RALLY_API_KEY=_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Restart `npm run dev` after changing either source.

## 3. Install dependencies

From this widget's directory:

```bash
npm install
```

You need GitHub Packages auth for `@customagile/widget-ai`. Add this to your global `~/.npmrc`:

```
@customagile:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=ghp_your_github_pat
```

Create a GitHub PAT at https://github.com/settings/tokens with the `read:packages` scope.

## 4. Develop with mock data

```bash
npm run dev
```

Opens http://localhost:5173. The widget loads in mock mode showing 8 months of sample cycle time data — no Rally connection needed.

To test Edit Mode: http://localhost:5173?editMode=true

## 5. Develop with live Rally data

After creating `auth.json`:

```bash
npm run dev
```

Visit http://localhost:5173?live=true

The dev server proxies `/slm/*` to Rally. Your API key authenticates all requests.

For live data to appear in the chart, your Portfolio Items need both `ActualStartDate` and `ActualEndDate` populated. Items missing either date are excluded from the cycle time calculation.

## 6. Build for deployment

```bash
npm run build          # live Rally data (hardcoded at build time)
npm run build:mock     # mock data baked in
npm run typecheck      # verify TypeScript — should be zero errors
```

Output: `dist/app.js` — a single IIFE JavaScript file with CSS inlined. This file is what gets deployed to Rally.

## 7. Deploy to Rally as a Custom View

**Manual method:**

1. Run `npm run build`
2. Open `dist/app.js` and copy all its contents
3. In Rally: Custom Pages → create a Custom HTML page → paste the contents into the HTML block
4. Save and configure with your page settings

**Automated method (requires auth.json):**

```bash
npx widget-ai deploy
```

This builds and deploys in one step. The Rally Custom View URL is printed on completion.

## Widget Settings

Configure in Edit Mode within Rally (pencil icon in the widget header):

| Setting | Default | Notes |
|---------|---------|-------|
| Portfolio Item Type | Feature | Feature, Epic, or Initiative |
| Bucket By | Month | Month, Quarter, or Year |
| Number of Buckets | 10 | Most-recent N periods displayed |
| Query | _(empty)_ | Optional WSAPI filter for advanced scoping |

Example query to show only Accepted items:
```
(State = "Accepted")
```

Example query combining state and owner:
```
((State = "Accepted") AND (Owner.UserName = "jsmith@example.com"))
```

## Data requirements

- Portfolio Items must have `ActualStartDate` and `ActualEndDate` populated for cycle time to be calculated
- Items missing either date are silently excluded
- Up to 2,000 items are fetched per query; a banner warns when the cap is hit
- The widget does NOT respect timebox (Iteration/Release/Milestone) View Filters — scope is controlled by the project navigation and the optional Query setting

## Troubleshooting

**No data appears:**
- Check that your Portfolio Items have both `ActualStartDate` and `ActualEndDate` set
- Widen the bucket count or change the Bucket By period to cover more history
- Confirm the Rally project scope includes the items you expect

**Fetch cap warning (2,000 items):**
- Add a Query filter to narrow the dataset: e.g. `(State = "Accepted")`
- Reduce the Number of Buckets to cover a shorter time window
- Scope to a more specific project

**TypeScript errors:**
- Run `npm run typecheck` from the widget directory
- All errors must be resolved before deployment

**`chart.js` missing adapter error:**
- This widget uses `type: 'category'` for the x-axis, so no date adapter is needed
- If you see this error, check that `buildChartOptions` in `App.tsx` does not use `type: 'time'`
