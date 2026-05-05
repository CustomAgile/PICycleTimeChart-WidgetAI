# Widget AI — API Reference

All imports use `@customagile/widget-ai/...`

---

## Components

### Grid

Sortable data table with column chooser, pagination, and Excel/CSV export.

```typescript
import { Grid } from '@customagile/widget-ai/components/Grid';
import type { GridColumn, GridProps } from '@customagile/widget-ai/components/Grid';
import '@customagile/widget-ai/styles/grid.css';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `Record<string, unknown>[]` | required | Row data |
| `columns` | `GridColumn[]` | required | Column definitions |
| `pageSize` | `number` | — | Rows per page. 0 = no pagination |
| `rowKey` | `string` | `'ObjectID'` | Unique key field on each record |
| `showColumnChooser` | `boolean` | `false` | Show column chooser button |
| `sort` | `SortState \| null` | — | External sort control |
| `onSortChange` | `(sort) => void` | — | Sort change callback |
| `lockedColumns` | `number` | — | Freeze N columns from the left |
| `exportToCsv` | `string` | — | Show CSV export button (value = filename) |
| `exportToExcel` | `string` | — | Show Excel export button (value = filename) |
| `emptyText` | `string` | — | Message when data is empty |
| `stateId` | `string` | — | Persist column selection to localStorage |

**GridColumn:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `text` | `string` | required | Column header |
| `dataIndex` | `string` | required | Field name on the record |
| `columnType` | `'numeric' \| 'date' \| 'textShort' \| 'textLong' \| 'percentDone'` | `'textShort'` | Affects width and alignment |
| `flex` | `number` | — | Flex proportion for remaining space |
| `width` | `number` | — | Explicit width in px |
| `sortable` | `boolean` | `true` | Column is sortable |
| `resizable` | `boolean` | `true` | Column is resizable |
| `locked` | `boolean` | `false` | Freeze column to the left |
| `hidden` | `boolean` | `false` | Column starts hidden |
| `renderer` | `(value, record, column) => ReactNode` | — | Custom cell renderer |
| `sortComparator` | `(a, b) => number` | — | Custom sort function |

---

### Combobox

Searchable dropdown with single/multi-select, keyboard navigation, and pagination.

```typescript
import { Combobox } from '@customagile/widget-ai/components/Combobox';
import '@customagile/widget-ai/styles/combobox.css';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `T[]` | required | Options to display |
| `value` | `T \| T[] \| null` | — | Selected value(s) |
| `onChange` | `(value) => void` | — | Selection change callback |
| `multiSelect` | `boolean` | `false` | Allow multiple selections |
| `placeholder` | `string` | — | Placeholder text |
| `displayField` | `string` | — | Field name to display for object items |
| `valueField` | `string` | — | Field name to use as value for object items |
| `showNoEntry` | `boolean` | `false` | Show "-- No Entry --" option |
| `showClear` | `boolean` | `false` | Show "-- Clear --" option |
| `searchable` | `boolean` | `true` | Enable type-ahead filtering |
| `pageSize` | `number` | — | Paginate the dropdown |
| `stateId` | `string` | — | Persist selection to localStorage |

**Usage with objects:**

```tsx
const projects = [
  { name: 'Alpha', oid: 123 },
  { name: 'Beta', oid: 456 },
];

<Combobox
  items={projects}
  displayField="name"
  valueField="oid"
  value={selectedOid}
  onChange={(oid) => setSelectedOid(oid)}
/>
```

---

### FieldValueCombobox

Dropdown that auto-populates from a Rally field's allowed values. No API call needed — values come from compile-time metadata.

```typescript
import { FieldValueCombobox } from '@customagile/widget-ai/components/FieldValueCombobox';
import { HierarchicalRequirement } from '@customagile/widget-ai/types/rally/artifacts/hierarchical-requirement';
```

**Usage:**

```tsx
// Automatically shows: Defined, In-Progress, Completed, Accepted
<FieldValueCombobox
  type={HierarchicalRequirement}
  field={HierarchicalRequirement.ScheduleState}
  value={selectedState}
  onChange={setSelectedState}
  showNoEntry        // adds "-- No Entry --" option for clearing
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `RallyTypeClass` | required | Rally class (e.g., Defect) |
| `field` | `FieldDescriptor` | required | Field descriptor from class statics |
| `value` | `string \| null` | — | Selected value |
| `onChange` | `(value: string \| null) => void` | — | Change callback |
| `showNoEntry` | `boolean` | `false` | Add clear option |
| `placeholder` | `string` | — | Placeholder text |

---

### IterationPicker

Self-loading iteration dropdown. Fetches iterations from Rally and auto-selects the current one.

```typescript
import { IterationPicker } from '@customagile/widget-ai/components/IterationPicker';
```

```tsx
<IterationPicker
  value={selectedIterationOid}
  onChange={setSelectedIterationOid}
/>
```

---

### ReleasePicker

Self-loading release dropdown. Fetches releases from Rally and auto-selects the active one.

```typescript
import { ReleasePicker } from '@customagile/widget-ai/components/ReleasePicker';
```

```tsx
<ReleasePicker
  value={selectedReleaseOid}
  onChange={setSelectedReleaseOid}
/>
```

---

### RallyGrid (self-loading)

Pass `query` instead of `data` and RallyGrid fetches its own data. No useEffect, no state management.

```typescript
import { RallyGrid } from '@customagile/widget-ai/components/RallyGrid';
import { UserStory } from '@customagile/widget-ai/types/rally/artifacts/hierarchical-requirement';
```

```tsx
<RallyGrid
  type={UserStory}
  query={{ query: '(ScheduleState = "In-Progress")', order: 'Rank' }}
  fields={[UserStory.FormattedID, UserStory.Name, UserStory.ScheduleState, UserStory.Owner]}
  showColumnChooser
  pageSize={20}
/>
```

Pass `data` instead of `query` when you want to manage the data yourself.

---

### Button

Styled button with primary, secondary, and minimal variants.

```typescript
import { Button } from '@customagile/widget-ai/components/Button';
import '@customagile/widget-ai/styles/button.css';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'minimal'` | `'secondary'` | Visual style |
| `icon` | `ReactNode` | — | Icon element before the label |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Icon placement |
| `disabled` | `boolean` | `false` | Disabled state |
| `onClick` | `() => void` | — | Click handler |
| `children` | `ReactNode` | — | Button label |

---

### Checkbox

Accessible checkbox with label.

```typescript
import { Checkbox } from '@customagile/widget-ai/components/Checkbox';
import '@customagile/widget-ai/styles/checkbox.css';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean` | `false` | Checked state |
| `onChange` | `(checked: boolean) => void` | — | Change callback |
| `label` | `string` | — | Label text |
| `disabled` | `boolean` | `false` | Disabled state |

---

### TextInput

Text input with validation support.

```typescript
import { TextInput } from '@customagile/widget-ai/components/TextInput';
import '@customagile/widget-ai/styles/text-input.css';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | — | Input value |
| `onChange` | `(value: string) => void` | — | Change callback |
| `placeholder` | `string` | — | Placeholder text |
| `label` | `string` | — | Label above input |
| `hint` | `string` | — | Hint text below input |
| `error` | `string` | — | Error message (shows error state) |
| `disabled` | `boolean` | `false` | Disabled state |

---

### Toast

Notification system — success, warning, error, and default types.

```typescript
import { ToastContainer } from '@customagile/widget-ai/components/Toast';
import { useToast } from '@customagile/widget-ai/hooks/useToast';
import '@customagile/widget-ai/styles/toast.css';
```

**Usage:**

```tsx
function App() {
  const { addToast } = useToast();

  return (
    <>
      <button onClick={() => addToast('Saved!', 'success')}>Save</button>
      <button onClick={() => addToast('Something went wrong', 'error')}>Error</button>
      <ToastContainer />
    </>
  );
}
```

---

### CardBoard

Kanban-style board with drag-and-drop, swim lanes, and inline editing.

```typescript
import { CardBoard } from '@customagile/widget-ai/components/CardBoard';
import '@customagile/widget-ai/styles/cardboard.css';
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `data` | `T[]` | All card items |
| `columns` | `CardBoardColumn[]` | Column definitions (value, label, wipLimit) |
| `columnField` | `keyof T & string` | Field that determines which column a card belongs to |
| `renderCard` | `(item, isDragging) => ReactNode` | Custom card renderer |
| `onCardMove` | `(item, fromCol, toCol) => void` | Called when a card is dragged between columns |
| `swimLaneField` | `keyof T & string` | Field to group cards into swim lanes |

---

### SettingsPanel

Gear icon dropdown for widget configuration. Extend with custom settings via `children`.

```typescript
import { useWidgetSettings, SettingsPanel } from '@customagile/widget-ai/components/settings';
```

**Usage:**

```tsx
const { settings, updateSetting } = useWidgetSettings(rallyContext, {});

<SettingsPanel>
  {/* Add custom settings rows here */}
</SettingsPanel>
```

---

### EditModePanel

Settings panel for Rally edit mode — appears when a user clicks the gear icon in the Rally widget chrome.

```typescript
import { EditModePanel, SettingRow } from '@customagile/widget-ai/components/EditModePanel';
```

**Usage:**

```tsx
if (rallyContext.isEditMode) {
  return (
    <EditModePanel onSave={handleSave} onCancel={handleCancel}>
      <SettingRow label="Query Filter">
        <TextInput value={filter} onChange={setFilter} />
      </SettingRow>
    </EditModePanel>
  );
}
```

---

### AppFooter

Version bar at the bottom of the widget.

```typescript
import { AppFooter } from '@customagile/widget-ai/components/AppFooter';
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `appName` | `string` | Widget name |
| `version` | `string` | Version string |

---

## Data Layer

### wsapiQuery

Query Rally artifacts. Pass a **string type key** for quick lookups, or a **type class** for full type safety.

```typescript
import { wsapiQuery } from '@customagile/widget-ai/data/wsapi';
```

**String key (quick and simple):**

```typescript
const stories = await wsapiQuery('hierarchicalrequirement', {
  fetch: 'FormattedID,Name,ScheduleState',
  query: '(ScheduleState != "Accepted")',
});
// stories is HierarchicalRequirement[] — typed from the registry
```

**Type class (recommended) — gives you compile-time field validation:**

```typescript
import { Defect } from '@customagile/widget-ai/types/rally/artifacts/defect';

const defects = await wsapiQuery(Defect, {
  fetch: [Defect.FormattedID, Defect.Name, Defect.State, Defect.Severity],
  query: '(State = "Open")',
});
// defects is Defect[] — full autocomplete on properties
defects[0].Severity  // ← typed, autocomplete works
```

**UserStory shorthand:**

```typescript
import { UserStory } from '@customagile/widget-ai/types/rally/artifacts/hierarchical-requirement';

const stories = await wsapiQuery(UserStory, {
  fetch: [UserStory.FormattedID, UserStory.Name, UserStory.ScheduleState],
});
// Or use the string key:
const stories2 = await wsapiQuery('userstory', { fetch: 'FormattedID,Name' });
```

**Why use type classes?**

| Feature | String key | Type class |
|---------|-----------|------------|
| Return type | Typed from registry | Typed from class instance |
| Fetch fields | Comma-separated string (typos possible) | Field descriptors (compile-time validated) |
| Autocomplete on results | Yes | Yes |
| Field name autocomplete | No | Yes (`Defect.` shows all fields) |
| Refactor safety | No | Yes (rename a field → compiler catches it) |

**Params:**

| Param | Type | Description |
|-------|------|-------------|
| `query` | `string` | Rally query filter |
| `fetch` | `string \| FieldDescriptor[]` | Field names or field descriptors from type statics |
| `order` | `string` | Sort field + direction |
| `pagesize` | `number` | Results per page (default 200) |
| `project` | `string` | Project ref to scope query |
| `projectScopeDown` | `boolean` | Include child projects |

**Supported string keys:** `'hierarchicalrequirement'`, `'userstory'`, `'task'`, `'defect'`, `'portfolioitem/feature'`, `'portfolioitem/epic'`, `'portfolioitem/initiative'`, `'testcase'`, `'defectsuite'`

**Also available:** `wsapiQueryPage()` (returns pagination metadata) and `wsapiQueryAll()` (auto-paginates all results).

---

### wsapiCreate / wsapiUpdate / wsapiDelete

CRUD operations on Rally artifacts. Work with type classes or string keys.

```typescript
import { wsapiCreate, wsapiUpdate, wsapiDelete } from '@customagile/widget-ai/data/wsapi';
import { UserStory } from '@customagile/widget-ai/types/rally/artifacts/hierarchical-requirement';

// Create
const story = await wsapiCreate('hierarchicalrequirement', {
  Name: 'New Story',
  PlanEstimate: 5,
  ScheduleState: 'Defined',
});

// Update
await wsapiUpdate('hierarchicalrequirement', story.ObjectID, {
  ScheduleState: 'In-Progress',
});

// Delete
await wsapiDelete('hierarchicalrequirement', story.ObjectID);
```

---

### queryLookback

Query Rally's Lookback API for historical snapshots.

```typescript
import { queryLookback } from '@customagile/widget-ai/data/lookback';

const snapshots = await queryLookback({
  find: {
    _TypeHierarchy: 'HierarchicalRequirement',
    _ProjectHierarchy: 12345,
    __At: 'current',
  },
  fields: ['ObjectID', 'ScheduleState', 'PlanEstimate'],
  hydrate: ['ScheduleState'],
});
```

---

## Types

### Rally Artifacts

```typescript
import type { HierarchicalRequirement } from '@customagile/widget-ai/types/rally-artifacts';
import type { Feature, Epic, Initiative } from '@customagile/widget-ai/types/rally-artifacts';
import type { Defect, Task, TestCase } from '@customagile/widget-ai/types/rally-artifacts';
```

### Rally Supporting Types

```typescript
import type { Project, Iteration, Release, User } from '@customagile/widget-ai/types/rally-supporting';
import type { Tag, Milestone, Workspace } from '@customagile/widget-ai/types/rally-supporting';
```

### Rally Context

```typescript
import type { RallyContext } from '@customagile/widget-ai/types/rally-context';
import { DEFAULT_RALLY_CONTEXT } from '@customagile/widget-ai/types/rally-context';
```

**Key fields on RallyContext:**

| Field | Type | Description |
|-------|------|-------------|
| `User` | `{ DisplayName, EmailAddress, ObjectID }` | Current user |
| `GlobalScope.Project` | `string` | Project ref (e.g. `'/project/123'`) |
| `GlobalScope.Workspace` | `string` | Workspace ref |
| `GlobalScope.ProjectScopeDown` | `boolean` | Include child projects |
| `Settings` | `Record<string, any>` | Persisted widget settings |
| `isEditMode` | `boolean` | Widget is in edit/settings mode |
| `WidgetName` | `string` | Widget display name |

---

## Styles

### Design Tokens

```typescript
import '@customagile/widget-ai/styles/tokens.css';
```

**Available tokens:**

| Token | Description |
|-------|-------------|
| `--ca-font-family` | Inter, system fallback |
| `--ca-text-primary` | Primary text color |
| `--ca-text-secondary` | Secondary/muted text |
| `--ca-bg-surface` | Surface background |
| `--ca-bg-base` | Base background |
| `--ca-border-default` | Default border color |
| `--ca-spacing-xs` through `--ca-spacing-xl` | Spacing scale (4px grid) |
| `--ca-radius-sm`, `--ca-radius-md`, `--ca-radius-lg` | Border radius |
| `--ca-shadow-sm`, `--ca-shadow-md`, `--ca-shadow-lg` | Box shadows |
| `--ca-transition-base` | Default transition duration |

Tokens are designed for Rally's light UI. See the Cookbook for standalone dark mode patterns during local development.

### Component Styles

Import alongside each component:

```typescript
import '@customagile/widget-ai/styles/grid.css';
import '@customagile/widget-ai/styles/combobox.css';
import '@customagile/widget-ai/styles/button.css';
import '@customagile/widget-ai/styles/checkbox.css';
import '@customagile/widget-ai/styles/text-input.css';
import '@customagile/widget-ai/styles/toast.css';
import '@customagile/widget-ai/styles/cardboard.css';
```

---

## Utils

### toExcel

Export data to Excel (requires `exceljs` — install with `npm install exceljs`).

```typescript
import { toExcel } from '@customagile/widget-ai/utils/toExcel';

const buffer = await toExcel([
  { name: 'Stories', rows: [['ID', 'Name', 'State'], ['US1', 'Story 1', 'Defined']] },
  { name: 'Tasks', rows: [['ID', 'Name'], ['TA1', 'Task 1']] },
]);
// Trigger download...
```

### toCsv

Export data to CSV string.

```typescript
import { toCsv } from '@customagile/widget-ai/utils/toCsv';

const csv = toCsv([
  ['ID', 'Name', 'State'],
  ['US1', 'My Story', 'Defined'],
]);
```

### chartExport

Export a Chart.js canvas to PNG (requires `chart.js` — install with `npm install chart.js`).

```typescript
import { exportChartAsPng } from '@customagile/widget-ai/utils/chart-export';

exportChartAsPng(chartRef.current, { filename: 'burndown.png' });
```

---

