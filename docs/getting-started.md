# Getting Started with Widget AI

This guide walks you through creating, developing, and deploying a Rally widget.

---

## 1. Create Your Widget

```bash
npx @customagile/widget-ai init my-widget
cd my-widget
```

This gives you:
- A working React + TypeScript widget
- Vite dev server with Rally proxy
- Grid and Combobox demo components
- Settings panel
- VS Code tasks and debug configuration

## 2. Understand the Project

```
my-widget/
├── src/
│   ├── App.tsx       ← your widget UI (start here)
│   ├── data.ts       ← Rally data queries (add yours here)
│   └── main.tsx      ← entry point (handles Rally context — leave this alone)
├── docs/             ← widget-ai documentation (you are here)
├── .vscode/          ← VS Code tasks, debug, extension recommendations
├── auth.json         ← Rally credentials (you create this, gitignored)
├── rally.config.json ← widget name, version, settings
├── vite.config.js    ← build config (usually don't touch)
└── package.json      ← dependencies and scripts
```

## 3. Start Developing

```bash
npm run dev
```

This opens http://localhost:5173 with your widget running. Changes reload instantly — no browser refresh needed.

The widget renders without a Rally connection. You'll see an error where data should be until you connect, but the UI works fine.

## 4. Connect to Rally

Create `auth.json` in your project root:

```json
{
  "server": "https://rally1.rallydev.com",
  "apiKey": "your-rally-api-key"
}
```

**To get a Rally API key:**
1. Log into Rally
2. Click your avatar (top-right) → API Keys
3. Click "Create" and copy the full key

**Restart the dev server.** Your widget now pulls live Rally data.

## 5. Build Your Widget

`src/App.tsx` is where your widget lives. The template shows:
- **Combobox** for user selection
- **Grid** for data display
- **SettingsPanel** for configuration

Replace these with your own components. Add data queries in `src/data.ts`.

### Adding a new query

In `src/data.ts`:

```typescript
import { wsapiQuery } from '@customagile/widget-ai/data/wsapi';

export async function loadFeatures() {
  const results = await wsapiQuery('portfolioitem/feature', {
    fetch: 'FormattedID,Name,State,Release',
    pagesize: 100,
    order: 'Rank',
  });
  return results;
}
```

In `src/App.tsx`:

```typescript
import { loadFeatures } from './data';

// Inside your component:
useEffect(() => {
  loadFeatures().then(setFeatures);
}, []);
```

### Using widget-ai components

```typescript
import { Grid } from '@customagile/widget-ai/components/Grid';
import { Combobox } from '@customagile/widget-ai/components/Combobox';
import { Button } from '@customagile/widget-ai/components/Button';
```

See `docs/api-reference.md` for all available components and their props.

## 6. Production Build

```bash
npm run build
```

This creates `dist/app.js` — a single IIFE file ready for Rally.

## 7. Deploy to Rally

```bash
npx widget-ai deploy
```

Builds your widget and deploys it as a Rally Custom View. First deploy creates the view; subsequent deploys update it in place.

The deploy URL is saved to `rally.config.json` so you can find it later.

## 8. VS Code Tips

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Default build task | ⌘⇧B | Ctrl+Shift+B |
| Start dev server + Chrome debugger | F5 | F5 |
| See all tasks | Terminal → Run Task | Terminal → Run Task |

Install the recommended extensions when VS Code prompts — they add autocomplete for CSS tokens, inline error display, and Vite status bar controls.

---

## Next Steps

- **API Reference** — `docs/api-reference.md` — all components, functions, and types
- **Cookbook** — `docs/cookbook.md` — common patterns and recipes

---

