# Pi Cycle Time Chart — Widget Project

## Build Commands

```bash
widget-ai dev          # Dev server with hot reload (mock mode)
widget-ai build        # Production build for Rally Custom View
widget-ai build:mock   # Build with mock data baked in
widget-ai deploy       # Build and deploy to Rally
widget-ai generate     # Generate typed Rally classes from your workspace
```

## Slash Commands

- `/feedback` — Send migration retro to CustomAgile (rating + notes, no source code sent)
- `/build` — Run production build and report results
- `/deploy` — Build and deploy to Rally, print Custom View URL
- `/add-component` — Add a widget-ai component to the widget

## Project Structure

```
src/
  main.tsx          # Entry point — wires RallyContext and mock/live branching
  App.tsx           # Main widget component (receives rallyContext prop)
  types.ts          # Widget-specific TypeScript types
  mock-data.ts      # Mock data and mockContext for dev/testing (if present)
rally.config.json   # Widget name, deploy target, settings schema
auth.json           # Rally credentials (not committed) — { server, apiKey }
vite.config.js      # Vite build config
tsconfig.json       # TypeScript config
```

## RallyContext

`RallyContext` is injected by the Rally Custom HTML Widget iframe as `$RallyContext`. In dev/mock it's synthesized in `main.tsx`.

```ts
import type { RallyContext } from '@customagile/widget-ai/types/rally-context';

interface RallyContext {
  Url: { origin: string; href: string };
  User: { DisplayName: string; EmailAddress: string; UserName: string; ObjectID: number };
  Workspace: { _ref: string; Name: string; ObjectID: number };
  Project:   { _ref: string; Name: string; ObjectID: number };
  Settings:  Record<string, string>;    // persisted widget settings
  WidgetName: string;
  WidgetUUID: string;
  isEditMode: boolean;
}
```

Dev URL params: `?mock=true`, `?editMode=true`, `?live=true`

## Import Paths

```ts
// Components
import { RallyGrid }            from '@customagile/widget-ai/components/RallyGrid';
import { Grid }                  from '@customagile/widget-ai/components/Grid';
import { TreeGrid }              from '@customagile/widget-ai/components/TreeGrid';
import { CardBoard }             from '@customagile/widget-ai/components/CardBoard';
import { RallyCard }             from '@customagile/widget-ai/components/RallyCard';
import { FieldValueCombobox }    from '@customagile/widget-ai/components/FieldValueCombobox';
import { IterationPicker }       from '@customagile/widget-ai/components/IterationPicker';
import { ReleasePicker }         from '@customagile/widget-ai/components/ReleasePicker';
import { MilestonePicker }       from '@customagile/widget-ai/components/MilestonePicker';
import { ArtifactTypePicker }    from '@customagile/widget-ai/components/ArtifactTypePicker';
import { ProjectPicker }         from '@customagile/widget-ai/components/ProjectPicker';
import { MultiProjectPicker }    from '@customagile/widget-ai/components/MultiProjectPicker';
import { ColumnChooser }         from '@customagile/widget-ai/components/ColumnChooser';
import { ArtifactChooserDialog } from '@customagile/widget-ai/components/ArtifactChooserDialog';
import { Combobox }              from '@customagile/widget-ai/components/Combobox';
import { Button }                from '@customagile/widget-ai/components/Button';
import { TextInput }             from '@customagile/widget-ai/components/TextInput';
import { Checkbox }              from '@customagile/widget-ai/components/Checkbox';
import { EditModePanel }         from '@customagile/widget-ai/components/EditModePanel';
import { SettingsPanel }         from '@customagile/widget-ai/components/SettingsPanel';
import { Toast }                 from '@customagile/widget-ai/components/Toast';
import { AppFooter }             from '@customagile/widget-ai/components/AppFooter';

// Settings hooks
import { useWidgetSettings } from '@customagile/widget-ai/components/settings';

// Data
import { wsapiQuery, wsapiCreate, wsapiUpdate, wsapiDelete } from '@customagile/widget-ai/data';
import { queryLookback } from '@customagile/widget-ai/data';
import { useRallyData }  from '@customagile/widget-ai/hooks';
import { useToast }      from '@customagile/widget-ai/hooks';

// Rally artifact types (use static field refs, not string literals)
import { HierarchicalRequirement } from '@customagile/widget-ai/types/rally/artifacts/hierarchical-requirement';
import { Defect }                   from '@customagile/widget-ai/types/rally/artifacts/defect';
import { Task }                     from '@customagile/widget-ai/types/rally/artifacts/task';
import { Feature }                  from '@customagile/widget-ai/types/rally/artifacts/feature';
import { Epic }                     from '@customagile/widget-ai/types/rally/artifacts/epic';

// CSS
import '@customagile/widget-ai/styles/tokens.css';       // always include
import '@customagile/widget-ai/styles/grid.css';
import '@customagile/widget-ai/styles/combobox.css';
import '@customagile/widget-ai/styles/card-board.css';
import '@customagile/widget-ai/styles/artifact-chooser.css';
```

## Key Patterns

### Field references — always use static fields, not strings

```ts
// Correct
RallyGrid type={Defect} fields={[Defect.FormattedID, Defect.Name, Defect.State]} />
FieldValueCombobox type={Defect} field={Defect.State} />

// Wrong — don't use string literals for field names
fields={['FormattedID', 'Name', 'State']}
```

### Widget settings

Custom settings interfaces must include an index signature:
```ts
interface MySettings { myField: string; [key: string]: unknown; }

const { settings, updateSetting } = useWidgetSettings<MySettings>(
  rallyContext,
  { myField: '' }
);
```

### SettingRow requires settingKey

```tsx
<SettingRow label="Artifact Type" settingKey="artifactType">
  <ArtifactTypePicker value={settings.artifactType} onChange={...} />
</SettingRow>
```

### queryLookback

```ts
// Signature: queryLookback(rallyContext, query)
// LookbackQuery: { find, fields?, hydrate?, start?, pagesize?, compress?, removeUnauthorizedSnapshots? }
// No sort field — results in LBAPI default order
// GlobalScope.Workspace may be empty in Custom HTML Widget iframes — queryLookback
// handles this automatically by falling back to a WSAPI fetch.

const snapshots = await queryLookback(rallyContext, {
  find: { ObjectID: oid },
  fields: ['_ValidFrom', '_ValidTo', 'State'],
});
```

### WSAPI query syntax — binary AND/OR only

```ts
// Correct — nested binary pairs
'((A) AND ((B) AND (C)))'

// Parse error — three-way AND not supported
'((A) AND (B) AND (C))'
```

### Edit mode — always handle it

When `rallyContext.isEditMode === true`, render `<EditModePanel>` instead of the widget content.
The template `App.tsx` shows the full pattern.

### useRallyData

```ts
const { data, loading, error, refresh } = useRallyData(() =>
  wsapiQuery<Defect>({ type: Defect, query: '(State != "Closed")', order: 'FormattedID DESC' })
, [stateFilter]);
// loading = initial fetch in progress
// refreshing (second field) = background refresh
```

## widget-ai Components

### Self-Loading (fetch their own data)
- `RallyGrid` — tabular data with auto-columns from Rally field metadata
- `FieldValueCombobox` — dropdown auto-populated from field allowed values
- `IterationPicker` — self-loading iteration dropdown
- `ReleasePicker` — self-loading release dropdown

### UI Components
- `Grid` — paginated, sortable, resizable data table _(Storybook: Grids/Grid)_
- `TreeGrid` — hierarchical tree table with expandable rows _(Storybook: Grids/TreeGrid)_
- `CardBoard` — drag-and-drop kanban board _(Storybook: CardBoard/CardBoard)_
- `RallyCard` — default card renderer for CardBoard _(Storybook: CardBoard/RallyCard)_
- `ColumnChooser` — dual-list column selector dialog _(Storybook: Dialogs/ColumnChooser)_
- `ArtifactChooserDialog` — search and pick Rally artifacts _(Storybook: Dialogs/ArtifactChooserDialog)_
- `Combobox` — searchable dropdown with keyboard navigation _(Storybook: Shared/Combobox)_
- `Button`, `TextInput`, `Checkbox` — standard form inputs
- `EditModePanel` — widget settings panel (opens in Rally edit mode)
- `SettingsPanel` — collapsible settings form wrapper
- `Toast` — transient notification messages
- `AppFooter` — standard widget footer with branding
- `ArtifactTypePicker` — type selector (Story, Defect, Task, etc.)
- `ProjectPicker` / `MultiProjectPicker` — Rally project selector(s)

## Charting

**Chart.js 4.x is included** — use it directly for any chart or visualization. Do not add Highcharts, D3, Recharts, or any other chart library.

```ts
import { Chart, CategoryScale, LinearScale, BarElement, LineElement,
         PointElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { exportChartAsPng } from '@customagile/widget-ai/utils/chart-export';
```

`chartjs-chart-treemap` is also included for treemap visualizations.

## Coding Standards

- Functional components only, TypeScript with strict typing
- Copyright header on every authored file:
  ```ts
  /**
   * Copyright (c) 2026 Custom Agile LLC. All rights reserved.
   */
  ```
- Use `var(--ca-*)` CSS custom properties for colors, spacing, fonts — never hardcode values
- Handle `loading` and `error` states for all data fetches
- Never commit `auth.json` — it contains your Rally API key
