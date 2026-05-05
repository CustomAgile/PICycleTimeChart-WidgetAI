# Generating Rally Types

The `widget-ai generate` command connects to your Rally workspace and generates a complete set of typed TypeScript classes — one per artifact type. These classes give you autocomplete, compile-time field validation, and type-safe queries across your entire widget codebase.

## Quick Start

```bash
widget-ai generate --apikey <your-rally-api-key>
```

Types are written to `src/types/rally/` by default. Run this once when setting up a new project, then again whenever you add custom fields to Rally.

## What Gets Generated

For every artifact type in your workspace — Defect, User Story, Feature, Task, and more — you get a class like this:

```ts
// src/types/rally/artifacts/defect.ts (generated)

export class Defect {
  // Runtime metadata
  static _typeName    = 'Defect';
  static _displayName = 'Defect';
  static _idPrefix    = 'DE';
  static _creatable   = true;
  static _deletable   = true;

  // Instance fields (the shape of a Defect object from the API)
  ObjectID!:      number;
  FormattedID!:   string;
  Name!:          string;
  State!:         string;
  Severity!:      string;
  Priority!:      string;
  Owner!:         Partial<UserRef> | null;
  // ... all other fields

  // Static field descriptors — used by SDK components and wsapiQuery
  static FormattedID = { label: 'FormattedID', type: 'STRING', ... };
  static Name        = { label: 'Name',        type: 'STRING', ... };
  static State       = { label: 'State',        type: 'RATING', constrained: true, ... };
  static Severity    = { label: 'Severity',     type: 'RATING', constrained: true, ... };
  // ...

  // All fields including inherited ones, keyed by element name
  static fieldMeta = { FormattedID: Defect.FormattedID, Name: Defect.Name, ... };
}
```

The static field descriptors are what make type-safe queries and self-loading components work.

## Usage After Generation

### Type-safe queries

```ts
import { Defect } from './types/rally/artifacts/defect';
import { wsapiQuery } from '@customagile/widget-ai/data';

// Fields are validated at compile time — typos won't build
const defects = await wsapiQuery(Defect, {
  fetch: [Defect.FormattedID, Defect.Name, Defect.State, Defect.Severity],
  query: '(State = "Open")',
});

// defects is Defect[] — full autocomplete on every property
console.log(defects[0].FormattedID); // string ✓
console.log(defects[0].Priority);    // string ✓
```

### Self-loading components

```tsx
import { RallyGrid } from '@customagile/widget-ai/components/RallyGrid';
import { FieldValueCombobox } from '@customagile/widget-ai/components/FieldValueCombobox';
import { Defect } from './types/rally/artifacts/defect';

// FieldValueCombobox reads allowed values from Defect.State's field descriptor
// RallyGrid fetches its own data — no useEffect needed
<FieldValueCombobox type={Defect} field={Defect.State} onChange={setFilter} />
<RallyGrid type={Defect} fields={[Defect.FormattedID, Defect.Name, Defect.State]} />
```

## Custom Fields

Use `--customs` to generate `My*` subclasses that include your workspace's custom fields:

```bash
widget-ai generate --apikey <key> --customs
```

This produces a `MyDefect` class alongside `Defect`:

```ts
// MyDefect extends Defect with workspace custom fields
import { MyDefect } from './types/rally/artifacts/defect';

const defects = await wsapiQuery(MyDefect, {
  fetch: [MyDefect.FormattedID, MyDefect.c_RootCause], // c_ prefix for custom fields
});
```

Custom fields are kept in subclasses so the base types stay clean and predictable across workspaces.

## Options

| Flag | Default | Description |
|---|---|---|
| `--apikey <key>` | `$RALLY_API_KEY` | Rally API key |
| `--workspace <oid>` | First available | Workspace ObjectID to target |
| `--output <dir>` | `./src/types/rally` | Where to write the generated files |
| `--customs` | off | Generate `My*` subclasses with custom fields |
| `--dry-run` | off | Show what would be generated without writing |
| `--verbose` | off | Show full fetch + resolve log |

## Getting Your API Key

1. Log into Rally
2. Click your avatar → **API Keys**
3. Create a key with **Read** access (Write not required for generate)
4. Pass it via `--apikey` or set it once in your environment:

```bash
export RALLY_API_KEY=_abc123yourkeyhere
```

## Re-running After Schema Changes

Re-run generate whenever you:
- Add or rename a custom field in Rally
- Add a new custom artifact type
- Change allowed values on a drop-down field

The generated files are safe to commit — they're checked TypeScript, not binary artifacts.

## File Structure

```
src/types/rally/
├── artifacts/
│   ├── defect.ts
│   ├── hierarchical-requirement.ts   ← UserStory alias included
│   ├── task.ts
│   ├── test-case.ts
│   └── ...
├── portfolio/
│   ├── feature.ts
│   ├── epic.ts
│   └── ...
├── timeboxes/
│   ├── iteration.ts
│   └── release.ts
├── enums/
│   └── index.ts                      ← union types for all constrained fields
└── index.ts                          ← barrel export for everything
```
