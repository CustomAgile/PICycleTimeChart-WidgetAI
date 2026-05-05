# Type-Safe Rally Queries Without Writing a Single Type

If you've built a Rally custom app, you know the pain. You query the API, get back a blob of JSON, and spend the next hour guessing field names — `ScheduleState` or `State`? `FormattedID` or `formattedId`? Is `Owner` a string or a ref object?

We fixed this.

## One Command. Full Type Coverage.

```bash
widget-ai generate --apikey <your-key>
```

That's it. The CLI connects to your Rally workspace, reads the full type schema — every artifact, every field, every allowed value — and generates a TypeScript class for each one. In about 10 seconds you go from guessing to this:

```ts
import { Defect } from './types/rally/artifacts/defect';
import { wsapiQuery } from '@customagile/widget-ai/data';

const defects = await wsapiQuery(Defect, {
  fetch: [Defect.FormattedID, Defect.Name, Defect.State, Defect.Severity],
  query: '(State = "Open")',
});

// defects is Defect[] — full autocomplete, no casting, no guessing
console.log(defects[0].Severity); // string ✓
```

Mistype `Defect.Severaty` and the build fails. The schema is enforced at compile time.

## How It Works

Rally exposes its full type system via WSAPI — every artifact's fields, types, constraints, and allowed values. We fetch that metadata, resolve the inheritance hierarchy (Defect → SchedulableArtifact → Artifact → WorkspaceDomainObject), and emit clean TypeScript.

Each generated class has three parts:

**1. Runtime metadata** — for widget-ai to know how to talk to the API:
```ts
static _typeName    = 'Defect';
static _idPrefix    = 'DE';
static _creatable   = true;
```

**2. Instance shape** — the TypeScript interface you get back from a query:
```ts
ObjectID!:    number;
FormattedID!: string;
State!:       string;
Owner!:       Partial<UserRef> | null;
```

**3. Static field descriptors** — one per field, carrying its full schema:
```ts
static State = {
  label:       'State',
  type:        'RATING',
  constrained: true,
  required:    false,
  readOnly:    false,
  filterable:  true,
  sortable:    true,
};
```

That third part is what makes the whole widget-ai tick.

## Fields as First-Class Values

Because field descriptors are static properties on the class, you pass fields *as values*, not strings. This enables a pattern we're calling **compile-time field resolution**:

```ts
// Instead of this (error-prone string):
fetch: 'FormattedID,Name,State,Severity'

// You write this (validated at compile time):
fetch: [Defect.FormattedID, Defect.Name, Defect.State, Defect.Severity]
```

widget-ai resolves the descriptors back to field names before the API call. If a field doesn't exist on the type, TypeScript tells you before you ship.

The same descriptors power the UI components:

```tsx
// FieldValueCombobox reads Defect.State's allowed values at compile time
// No hardcoded options, no stale enums
<FieldValueCombobox
  type={Defect}
  field={Defect.State}
  value={filter}
  onChange={setFilter}
/>
```

## Custom Fields Included

Most teams have custom fields on their artifacts. Pass `--customs` and the generator produces `My*` subclasses alongside the base types:

```bash
widget-ai generate --apikey <key> --customs
```

```ts
import { MyDefect } from './types/rally/artifacts/defect';

// MyDefect.c_RootCause is your workspace's custom field
const defects = await wsapiQuery(MyDefect, {
  fetch: [MyDefect.FormattedID, MyDefect.c_RootCause],
});
```

Custom fields get the `c_` prefix Rally uses internally. The base classes stay clean — `Defect` is the same across every workspace. `MyDefect` is yours.

## No Go Required

The generator is compiled to WebAssembly and bundled inside the npm package. There's nothing to install beyond `@customagile/widget-ai`. The type generation logic runs on your machine — it never touches our servers.

```bash
npx @customagile/widget-ai generate --apikey <key>
```

Works on macOS, Windows, and Linux. No Go, no Rust, no Docker.

## The Workflow

```bash
# 1. Scaffold a new widget
npx @customagile/widget-ai init my-defect-tracker
cd my-defect-tracker

# 2. Generate types for your workspace
widget-ai generate --apikey _abc123

# 3. Start building — with full type safety
npm run dev
```

Re-run `generate` whenever your schema changes. The output is plain TypeScript — commit it, diff it, review it like any other source file.

---

*`@customagile/widget-ai` is a private package for Rally widget development. Contact your workspace admin for access.*
