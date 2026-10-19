# 07: Work Status strip restyle

**What to build:** The Lens section in Work Status uses the same visual language as the panel: two compact rows at 76px. The first row shows the session title and status; the second shows context, cost, running agents, changed files and model as label/value pills. Labels are 9px uppercase; values are 12px tabular. The strip does not repeat the host’s “Lens” section title.

**Blocked by:** 01 (Visual foundation, header and pill tabs)

**Status:** ready-for-agent

- [x] The strip fits within 76px and renders two rows without clipping.
- [x] Session title and status appear on the first row.
- [x] Context, cost, agents, files and model render as separate label/value pills.
- [x] Context uses the same warning/danger thresholds as the panel.
- [x] The strip does not render a second “Lens” brand.
- [x] Light and dark themes are readable at 320px.
- [x] Hidden frames still do not poll; the existing 2s visible polling remains.
- [x] View-model tests cover the strip values and context tone; typecheck and build pass.
- [x] The installed Work Status section shows the new strip.
