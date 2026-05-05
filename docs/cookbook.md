# Widget AI — Cookbook

Common patterns and recipes for building Rally widgets.

---

## Pattern: Combobox Drives Grid Data

The most common pattern — a dropdown controls what the grid shows.

```tsx
import { useState, useEffect } from 'react';
import { Grid } from '@customagile/widget-ai/components/Grid';
import { Combobox } from '@customagile/widget-ai/components/Combobox';
import { wsapiQuery } from '@customagile/widget-ai/data/wsapi';

function App() {
  const [type, setType] = useState('Task');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    wsapiQuery(type.toLowerCase(), { fetch: 'FormattedID,Name,State' })
      .then((rows) => { if (!cancelled) setData(rows); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [type]);

  return (
    <>
      <Combobox items={['Task', 'Defect']} value={type} onChange={setType} />
      {loading ? <p>Loading...</p> : <Grid data={data} columns={COLUMNS} />}
    </>
  );
}
```

**What's happening:**
- `useEffect` re-fetches when the combobox changes
- The `cancelled` flag prevents state updates after unmount (React strict mode safety)
- Keep query logic in a separate `data.ts` file for cleaner components

---

## Pattern: Custom Hook for Data Fetching

Wrap fetch + loading + error into a reusable hook.

```tsx
function useRallyData(type, fetchFields) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    wsapiQuery(type, { fetch: fetchFields, pagesize: 200 })
      .then((rows) => { if (!cancelled) setData(rows); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [type, fetchFields]);

  return { data, loading, error };
}

// Usage:
const { data, loading, error } = useRallyData('task', 'FormattedID,Name,State');
```

---

## Pattern: Multiple Queries, One View

Load from several Rally types and combine them.

```tsx
function Dashboard() {
  const [stories, setStories] = useState([]);
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      wsapiQuery('hierarchicalrequirement', { fetch: 'FormattedID,Name,ScheduleState' }),
      wsapiQuery('defect', { fetch: 'FormattedID,Name,State,Priority' }),
    ]).then(([s, d]) => {
      setStories(s);
      setDefects(d);
      setLoading(false);
    });
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <h3>Stories ({stories.length})</h3>
      <Grid data={stories} columns={STORY_COLUMNS} />
      <h3>Defects ({defects.length})</h3>
      <Grid data={defects} columns={DEFECT_COLUMNS} />
    </>
  );
}
```

---

## Pattern: Filtered Query

Build dynamic Rally queries from user input.

```tsx
function FilteredGrid() {
  const [state, setState] = useState('In-Progress');
  const [data, setData] = useState([]);

  useEffect(() => {
    wsapiQuery('hierarchicalrequirement', {
      fetch: 'FormattedID,Name,ScheduleState,Owner',
      query: `(ScheduleState = "${state}")`,
    }).then(setData);
  }, [state]);

  return (
    <>
      <Combobox
        items={['Defined', 'In-Progress', 'Completed', 'Accepted']}
        value={state}
        onChange={(val) => setState(val ?? 'In-Progress')}
      />
      <Grid data={data} columns={COLUMNS} />
    </>
  );
}
```

**Rally query syntax:**
- `(Field = "value")` — equals
- `(Field != "value")` — not equals
- `(Field contains "text")` — partial match
- `(Field > "2024-01-01")` — comparison (dates, numbers)
- `((Field1 = "a") AND (Field2 = "b"))` — combine with AND/OR

---

## Pattern: Grid with Export

Add Excel and CSV export buttons to any grid.

```tsx
<Grid
  data={stories}
  columns={COLUMNS}
  exportToExcel="stories.xlsx"
  exportToCsv="stories.csv"
/>
```

Excel export requires `exceljs`:
```bash
npm install exceljs
```

---

## Pattern: Grid with Locked Columns

Pin the first N columns so they stay visible during horizontal scroll.

```tsx
<Grid
  data={data}
  columns={COLUMNS}
  lockedColumns={2}  // FormattedID + Name stay pinned
/>
```

---

## Pattern: Combobox with Object Items

Use objects instead of strings, with separate display and value fields.

```tsx
const iterations = [
  { Name: 'Sprint 1', ObjectID: 100 },
  { Name: 'Sprint 2', ObjectID: 200 },
];

<Combobox
  items={iterations}
  displayField="Name"
  valueField="ObjectID"
  value={selectedIterationOid}
  onChange={(oid) => setSelectedIterationOid(oid)}
  placeholder="Select iteration..."
/>
```

---

## Pattern: Toast Notifications

Show success/error feedback after actions.

```tsx
import { ToastContainer } from '@customagile/widget-ai/components/Toast';
import { useToast } from '@customagile/widget-ai/hooks/useToast';

function App() {
  const { addToast } = useToast();

  async function handleSave() {
    try {
      await wsapiUpdate('hierarchicalrequirement', oid, { Name: newName });
      addToast('Story updated', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  }

  return (
    <>
      <Button onClick={handleSave}>Save</Button>
      <ToastContainer />
    </>
  );
}
```

---

## Pattern: Rally Edit Mode (Widget Settings)

When your widget is inside Rally and the user clicks the gear icon, Rally sets `isEditMode = true`. Show a settings form.

```tsx
import { EditModePanel, SettingRow } from '@customagile/widget-ai/components/EditModePanel';

function App({ rallyContext }) {
  if (rallyContext.isEditMode) {
    return (
      <EditModePanel
        onSave={(settings) => {
          // settings are persisted to Rally
        }}
        onCancel={() => {}}
      >
        <SettingRow label="Query Type">
          <Combobox items={['Story', 'Defect', 'Task']} value={queryType} onChange={setQueryType} />
        </SettingRow>
        <SettingRow label="Page Size">
          <TextInput value={pageSize} onChange={setPageSize} />
        </SettingRow>
      </EditModePanel>
    );
  }

  // Normal view
  return <Grid data={data} columns={columns} />;
}
```

---

## Things to Avoid

### Don't query in render

```tsx
// BAD — queries on every render
function App() {
  const data = wsapiQuery('task', { fetch: 'Name' }); // This is a Promise, not data!
  return <Grid data={data} />;
}

// GOOD — query in useEffect
function App() {
  const [data, setData] = useState([]);
  useEffect(() => { wsapiQuery('task', { fetch: 'Name' }).then(setData); }, []);
  return <Grid data={data} />;
}
```

### Don't forget the cancelled flag

```tsx
// BAD — race condition if component unmounts before fetch completes
useEffect(() => {
  wsapiQuery('task', { fetch: 'Name' }).then(setData);
}, [type]);

// GOOD — prevent state updates after unmount
useEffect(() => {
  let cancelled = false;
  wsapiQuery('task', { fetch: 'Name' })
    .then((rows) => { if (!cancelled) setData(rows); });
  return () => { cancelled = true; };
}, [type]);
```

### Don't hardcode colors

```tsx
// BAD
<div style={{ color: '#1B2A4A', background: '#FFFFFF' }}>

// GOOD — tokens handle theming for you
<div style={{ color: 'var(--ca-text-primary)', background: 'var(--ca-bg-surface)' }}>
```

---

