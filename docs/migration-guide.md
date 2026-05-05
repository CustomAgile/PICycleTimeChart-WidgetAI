# Migration Guide — Legacy ExtJS Apps to React Widgets

Use `widget-ai migrate` to convert legacy Rally Custom HTML apps (built with the Rally App SDK 2.1) into modern React widgets.

---

## What Gets Migrated

| Legacy (ExtJS) | Modern (React + Widget AI) |
|----------------|---------------------------|
| `Ext.define('MyApp', { extend: 'Rally.app.App' })` | `export default function App()` |
| `Rally.data.wsapi.Store` | `wsapiQuery()` from Widget AI |
| `this.getSetting('name')` | `rallyContext.Settings.name` |
| `xtype: 'rallygrid'` | `<Grid>` component |
| `xtype: 'rallycombobox'` | `<Combobox>` component |
| `this.getContext().getProject()` | `rallyContext.GlobalScope.Project` |
| ExtJS class hierarchy | React functional components + hooks |
| Inline CSS / `app.css` | CSS tokens (`var(--ca-*)`) |
| Custom HTML Panel (dashboard) | Custom View (widget) |

---

## Migration Modes

### From a source directory

If you have the original source code (App.js, config.json, etc.):

```bash
npx @customagile/widget-ai migrate ./path/to/legacy-app
```

The tool reads:
- `config.json` — app name, class name, JS file list
- `App.js` — main application code
- `overrides.js`, utility files — supporting code
- `app.css` — styles

### From an exported HTML file

If you only have the deployed HTML (copied from a Rally Custom Page):

```bash
npx @customagile/widget-ai migrate ./my-app.html
```

The tool extracts:
- JavaScript from `<script>` tags (skips SDK and CDN scripts)
- App class name from `Rally.launchApp('ClassName', ...)`
- CSS from `<style>` tags
- App name from `<title>`

**How to get the HTML:** In Rally, open the Custom Page, view source (or use the browser's DevTools > Elements), and save the HTML.

---

## How It Works

The migration is a 5-step pipeline:

### 1. Extract
Reads source files (directory mode) or parses HTML (file mode) to collect the legacy JavaScript, CSS, and metadata.

### 2. Analyze
Sends the legacy code to an AI model (Anthropic Claude or local Ollama) which produces a structured analysis:
- App purpose
- WSAPI queries used
- Custom fields referenced
- Settings (getSetting calls)
- UI components (grids, combos, charts)
- External dependencies

### 3. Generate
Sends the analysis + source to the AI model with detailed instructions about Widget AI's component library, data layer, and patterns. The AI generates a complete React widget:
- `src/App.tsx` — main component
- `src/data.ts` — Rally queries
- `src/types.ts` — data provider interface
- `src/main.tsx` — entry point
- Additional component files as needed

### 4. Scaffold
Creates the project directory using the standard template (vite.config.js, package.json, VS Code config, etc.) and writes the generated source files.

### 5. Validate
Runs TypeScript checking on the generated code. Reports any errors for manual review.

---

## AI Setup

Before migrating, you need an AI provider. Run:

```bash
npx @customagile/widget-ai setup
```

This checks for:

### Option 1: Anthropic API (recommended)

Set your API key:

```bash
export ANTHROPIC_API_KEY=sk-ant-your-key
```

Best code quality. Requires internet.

### Option 2: Local Ollama

Install Ollama and pull the model:

```bash
brew install ollama        # macOS
ollama serve               # start the server
ollama pull qwen2.5-coder:7b   # download the model (~4GB)
```

Runs 100% offline after setup. Good for air-gapped environments.

---

## Options

```
npx @customagile/widget-ai migrate <source> [options]

Arguments:
  source              Path to legacy app directory or HTML file

Options:
  --name <name>       Widget name (default: derived from app name)
  --output <dir>      Output directory (default: ./<name>)
  --provider <name>   Force AI provider: anthropic or ollama
  --dry-run           Show analysis without generating code
```

---

## Dry Run

Preview the analysis without generating any code:

```bash
npx @customagile/widget-ai migrate ./legacy-app --dry-run
```

This shows:
- App complexity (simple / medium / complex)
- WSAPI queries found
- Custom fields used
- Settings detected
- UI components identified

Use this to verify the AI understands the app before generating.

---

## After Migration

1. **Review the generated code** — AI output is a starting point, not production-ready
2. **Run `npm run dev`** — test locally
3. **Connect to Rally** — create `auth.json` and verify live data
4. **Customize** — adjust components, add features, fix any issues
5. **Deploy** — `npx widget-ai deploy`

---

## Common Issues

### "No LLM provider available"

Run `npx @customagile/widget-ai setup` to check AI configuration.

### TypeScript errors after generation

The AI-generated code may have type issues. Common fixes:
- Add missing imports
- Fix type assertions (replace `any` with proper types)
- Adjust WSAPI query field names

### Missing features

The migration handles standard Rally patterns. Complex custom logic (charts, multi-step workflows, Lookback queries) may need manual implementation. Use the analysis output as a guide.

### Large apps

Apps over 1000 lines may hit AI context limits. For very large apps:
1. Run `--dry-run` first to see the analysis
2. Consider migrating in phases (one feature at a time)
3. Use the generated scaffold as a starting point and implement features manually

---

## ExtJS to React Quick Reference

| ExtJS | React |
|-------|-------|
| `Ext.define('Class', { ... })` | `function Component() { ... }` |
| `this.items = [...]` | `return (<div>...</div>)` |
| `this.launch()` | `useEffect(() => { ... }, [])` |
| `store.load()` → `load callback` | `wsapiQuery().then(setData)` |
| `this.down('#id')` | `useRef()` or state |
| `Ext.create('Rally.ui.dialog...')` | React modal component |
| `this.getSetting('key')` | `rallyContext.Settings.key` |
| `getSettingsFields()` | `<EditModePanel>` with `<SettingRow>` |
| `listeners: { change: fn }` | `onChange={fn}` prop |
| `stateful: true, stateId: '...'` | `useState()` + `useEffect()` or `stateId` prop |
| `Rally.data.lookback.SnapshotStore` | `queryLookback()` from Widget AI |
