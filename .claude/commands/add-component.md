# /add-component — Add a widget-ai Component

Add a component from @customagile/widget-ai to this widget.

1. Ask which component to add:
   - RallyGrid — tabular data display
   - FieldValueCombobox — field-aware dropdown filter
   - IterationPicker — iteration selector
   - ReleasePicker — release selector
   - CardBoard — kanban board
   - TreeGrid — hierarchical data grid
   - Button, TextInput, Checkbox — basic inputs

2. Read `src/App.tsx` to understand the current widget structure

3. Add the component:
   - Add the import statement
   - Add necessary state hooks
   - Wire the component into the JSX tree
   - Add any required CSS imports

4. Run `npx tsc --noEmit` to verify no type errors were introduced
