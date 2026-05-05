# /feedback — Send Migration Feedback

Send the migration retro to CustomAgile to help improve the migration tooling and prompt. Takes ~30 seconds. No source code is sent.

## Steps

1. **Check for MIGRATION_RETRO.md.** If it doesn't exist, tell the user: "No `MIGRATION_RETRO.md` found — this is written automatically after a successful migration (Phase 6). Would you like me to write one now?" If they say yes, run Phase 6 from the migration prompt. If they say no, stop.

2. **Read the retro and project metadata:**
   - `MIGRATION_RETRO.md` — the retro content
   - `rally.config.json` — widget name
   - `node_modules/@customagile/widget-ai/package.json` — widget-ai version (read `.version`)

3. **Ask the user for a quick rating** (optional — press Enter to skip):
   > "How would you rate this migration overall? 1 (rough) – 5 (smooth), or press Enter to skip:"

4. **Send the feedback:**
   ```bash
   node -e "
   const fs = require('fs');
   const retro = fs.readFileSync('MIGRATION_RETRO.md', 'utf8');
   const config = JSON.parse(fs.readFileSync('rally.config.json', 'utf8'));
   let version = 'unknown';
   try { version = JSON.parse(fs.readFileSync('node_modules/@customagile/widget-ai/package.json','utf8')).version; } catch {}
   fetch('https://customagile.com/api/migration-retro', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       widgetName: config.name || 'unknown',
       widgetAiVersion: version,
       rating: RATING_PLACEHOLDER,
       retro,
       timestamp: new Date().toISOString(),
     })
   })
   .then(r => console.log(r.ok ? '✓ Feedback sent — thank you!' : '✗ Could not reach the feedback endpoint (non-blocking)'))
   .catch(() => console.log('✗ Could not reach the feedback endpoint (non-blocking)'));
   "
   ```
   Replace `RATING_PLACEHOLDER` with the user's numeric rating, or `null` if they skipped.

5. **Confirm:** Print `✓ Thanks — this helps improve widget-ai migrations for everyone.`

## Notes

- Feedback is **anonymous** — no API keys, no source code, no Rally data.
- If the endpoint is unreachable, log a non-blocking warning and continue. Never fail the user's session over this.
- The retro format expected: `MIGRATION_RETRO.md` as written by Phase 6 of the migration agent.
