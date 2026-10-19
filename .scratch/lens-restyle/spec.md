# opencode-lens — Visual restyle

> Tracker: `.scratch/lens-restyle/spec.md`
> Status: ready-for-agent
> Predecessor: `.scratch/lens/spec.md` (functional Lens, already implemented)

## Problem Statement

The Lens extension works, but it does not look like the product it is modeled on. The reference — the csr-lens panel — reads as a dense developer console: a stat grid, uppercase micro-labels over large numbers, pill tabs with counts, numbered section bars, status dots, colored deltas, monospace paths and inline diff rows.

The current Lens reads like an unstyled document. It has one donut ring, square tabs, sentence-case labels at body size, no cards or section grouping, and metadata that runs together (`#416m 13sUS$ 0,4685268 ferramentas15 falhas`). The light theme has almost no hierarchy, and the panel leaves a large empty area beside a narrow text column. The ring itself renders with a visible gap. A user scanning a running session cannot tell at a glance what matters, what changed, or what failed.

The visual language is the problem, not the data. The service, snapshot contract, tabs and interactions already work.

## Solution

Restyle the Lens panel and the Work Status strip in the visual language of the csr-lens reference, using the OpenChamber host theme as the color source.

- Follow the host theme (light and dark); do not force a dark island.
- Keep the same four tabs and the same data; change only presentation.
- Replace the ring with a horizontal context bar.
- Use a responsive stat-card grid, pill tabs with counts, numbered section bars, status dots, colored deltas, monospace paths and line-level diff patches.
- Make the status strip a compact two-row summary with the same tokens.
- Remove run-on metadata, the broken ring, and the empty horizontal space.
- Keep the panel usable from a narrow rail (~320px) to a wide panel (~880px).

## User Stories

1. As an OpenChamber user, I want the Lens panel to look like a deliberate developer console, so that I trust it with live session data.
2. As an OpenChamber user, I want a clear header with session title, agent, model and status, so that I know what I am looking at.
3. As an OpenChamber user, I want tabs as pills with counts, so that I can see how many agents, turns and files exist before opening a tab.
4. As an OpenChamber user, I want the active tab to be unmistakable, so that I always know where I am.
5. As an OpenChamber user, I want six stat cards for context, cost, tools, files, model and duration, so that the session reads at a glance.
6. As an OpenChamber user, I want uppercase micro-labels over large tabular values, so that labels recede and numbers stay scannable.
7. As an OpenChamber user, I want a horizontal context bar, so that I can judge context pressure without interpreting a ring.
8. As an OpenChamber user, I want the context bar to turn warning and danger colors near the limit, so that pressure is visible before compaction.
9. As an OpenChamber user, I want the token breakdown in a compact grid, so that input, output, reasoning and cache do not run together.
10. As an OpenChamber user, I want numbered section bars, so that the overview has a visible rhythm instead of a text stack.
11. As an OpenChamber user, I want section bars with a tinted surface and a left accent, so that sections are distinct without heavy borders.
12. As an OpenChamber user, I want the last turn as a card with request and metrics, so that I can catch up without opening Turnos.
13. As an OpenChamber user, I want recent files as rows with path, action and age, so that I can see what the session touched.
14. As an OpenChamber user, I want agent rows as cards with a status dot, so that I can distinguish running, completed and failed agents.
15. As an OpenChamber user, I want the agent tree indented by depth, so that parent and child relationships read visually.
16. As an OpenChamber user, I want each agent card to show model, cost, tokens and tool count, so that I can compare agents.
17. As an OpenChamber user, I want a discreet “Abrir” action on child agents, so that I can jump to their session without hunting the list.
18. As an OpenChamber user, I want turn cards with an index chip, so that I can reference a turn by number.
19. As an OpenChamber user, I want turn metadata separated by dots, so that duration, cost, tools and failures do not concatenate.
20. As an OpenChamber user, I want failures highlighted in warning or danger color, so that a broken turn stands out.
21. As an OpenChamber user, I want an in-progress turn marked with a status dot and label, so that I know work is still running.
22. As an OpenChamber user, I want turn details in a grid, so that agents, tools and failures are readable when expanded.
23. As an OpenChamber user, I want diff rows with a monospace path and colored additions/deletions, so that I can scan changes quickly.
24. As an OpenChamber user, I want a status badge per changed file, so that new, modified and deleted files are distinct.
25. As an OpenChamber user, I want expanded patches rendered line by line with green/red backgrounds, so that I can read a diff like a code review.
26. As an OpenChamber user, I want patch lines in monospace with preserved whitespace, so that indentation remains meaningful.
27. As an OpenChamber user, I want large patches capped and marked truncated, so that the panel stays responsive.
28. As an OpenChamber user, I want the Work Status strip to use the same visual language, so that the panel and the strip feel like one product.
29. As an OpenChamber user, I want the strip to show session title, status, context, cost, agents, files and model in two compact rows, so that it fits 76px.
30. As an OpenChamber user, I want the strip to avoid repeating the host’s “Lens” section title, so that the content gets the space.
31. As an OpenChamber user, I want the light theme to have the same hierarchy as the dark theme, so that the Lens is usable in either mode.
32. As an OpenChamber user, I want the dark theme to feel close to the csr-lens reference, so that the adaptation is recognizable.
33. As an OpenChamber user, I want the panel to work at 320px, 480px and 880px, so that it survives rail and wide layouts.
34. As an OpenChamber user, I want the stat grid to reflow from three columns to two to one, so that no card is clipped.
35. As an OpenChamber user, I want no horizontal page scroll, so that the panel behaves like an app surface.
36. As an OpenChamber user, I want long titles and paths to ellipsize, so that one long value does not break the layout.
37. As an OpenChamber user, I want empty and error states styled as cards, so that they do not look like missing CSS.
38. As an OpenChamber user, I want color never to be the only signal, so that status also has text or a label.
39. As an OpenChamber user, I want focus rings and keyboard-operable cards, so that the panel is usable without a mouse.
40. As an OpenChamber user with reduced motion, I want no decorative animation, so that the panel stays calm.
41. As a maintainer, I want one shared style source for panel and strip, so that the two surfaces cannot drift.
42. As a maintainer, I want the restyle to leave the service and snapshot contract untouched, so that no data regression is possible.
43. As a maintainer, I want view-model tests to cover tab counts and tones, so that the new presentation is protected.
44. As a maintainer, I want a Playwright smoke at three widths and two themes, so that responsive and theme regressions are caught.
45. As a maintainer, I want the visual smoke to assert invariants, not pixel-perfect screenshots, so that host theme changes do not break CI.

## Implementation Decisions

### Design language

- Reference: csr-lens. The Lens adopts its hierarchy, not a new design system.
- Color source: OpenChamber host tokens (`--oc-*`). No forced dark mode.
- Dark theme should land close to the reference palette; light theme uses the same structure with light surfaces and adjusted contrast.
- Semantic tokens: background, surface, surface-raised, border, text, muted, accent, accent-text, success, warning, danger, mono, radius.
- Shared style module used by both panel and status strip, so the two surfaces share tokens and primitives.
- Spacing scale: 4, 8, 12, 16. Panel padding 16. Card gap 8–12. Section gap 16.
- Radius: 8 for cards and section bars; 6 for small controls; 999 for pills and dots.
- Borders: 1px. No shadows.
- Typography: host sans; labels 10px uppercase with 0.06em tracking; values 20–24px semibold tabular; body 12–13px; paths and patches in host mono.

### Header and tabs

- Header: title 18px/600, subtitle 12px muted, status pill with a 6px dot and text.
- Tabs: pill row, 28px tall, 6px gap, horizontal scroll without a visible scrollbar.
- Active tab: accent fill with accent-foreground text.
- Inactive tab: surface fill with border and muted text.
- Count badges: `Agents` = number of child agents, `Turns` = number of turns, `Diffs` = number of changed files. `Overview` has no count.
- Count badge is a small circular pill inside the tab; it must not change tab height.

### Overview

- Context, cost, tools, files, model and duration render as six stat cards in a responsive grid.
- Card label: 10px uppercase muted. Card value: 22px semibold tabular. Card hint: 11px muted.
- Context card replaces the ring with a 4px horizontal bar with a track and a filled portion. The percentage and `used / limit` sit beside or below the bar.
- Bar tone: accent below 70%, warning at 70–89%, danger at 90%+; unknown is muted.
- Cost card may show a delta hint when a last-turn cost is available.
- Tools card shows total calls and failure count; failure count uses warning/danger.
- Model card shows model name and variant.
- Duration card shows session age and last update.
- Token breakdown is a five-column compact grid (input, output, reasoning, cache read, cache write) with label above value; wraps to three/two columns as needed.
- Numbered section bars use a 20px amber-outlined number, a tinted surface, a left accent and a 12–13px label. Overview uses `01 Último turno` and `02 Arquivos recentes`.
- Last-turn card: request title, dot-separated meta, no duplicate “Último turno” label inside the card.
- Recent files: rows with mono path, action label and age; empty state is a card.

### Agents

- Each agent is a card/row with a 24px status avatar, title, status text, model, parent, cost, tokens and tool count.
- Status avatar: filled dot or glyph; running uses success, failed uses danger, completed uses muted, unknown uses border color.
- Depth indentation: 12–14px per level; parent label shown as `pai · model` when not root.
- Child cards are keyboard-operable buttons; root is not clickable.
- “Abrir” is a ghost button or a trailing affordance, not a large primary button.
- Figures align to the right on wide widths and stack under the title on narrow widths.

### Turns

- Each turn is a card with an index chip, request title, status dot, and a chevron.
- Meta line uses explicit separators: duration · cost · tools · failures · agents. No concatenated strings.
- Failures use warning/danger tone; zero failures use muted.
- In-progress turns show a running dot and label.
- Expanded detail is a two-column grid: request, tools/failures, agents, start time, tokens.
- Long requests truncate with ellipsis in the head and show full text in the detail.

### Diffs

- Each file is a card row with a monospace path, status badge, `+N` in success, `−N` in danger, and a chevron.
- Expanded patch renders line by line, not as one `<pre>` block:
  - addition lines: success-tinted background and success text;
  - deletion lines: danger-tinted background and danger text;
  - context lines: default surface;
  - hunk headers: muted, slightly stronger border;
  - preserve whitespace with `white-space: pre`.
- The patch has a max height and scrolls internally.
- Truncated patches keep the warning notice.
- Empty state is a card.

### Work Status strip

- Two rows at 76px: session title/status; then context, cost, agents, files and model.
- Labels 9px uppercase muted; values 12px semibold tabular.
- Context uses the same tone thresholds as the panel.
- The strip does not render a second “Lens” brand; the host section title already does.
- Hidden frames do not poll (existing behavior preserved).

### Responsive behavior

- Stat grid: `repeat(auto-fit, minmax(138px, 1fr))`; three columns on wide, two on the rail, one below 300px.
- Tabs scroll horizontally; the page itself never scrolls horizontally.
- Cards use `min-width: 0`; titles and paths ellipsize.
- Diff and turn detail grids collapse to one column below 420px.
- Header status moves under the title on very narrow widths.

### Accessibility

- Tab buttons use `aria-pressed` or `aria-selected`; active state is not color-only.
- Cards that open a session are buttons with focus-visible rings and Enter/Space behavior.
- Status is conveyed by dot plus text.
- Color contrast uses host theme pairs; no raw hex hardcoded for text.
- No animation beyond hover/focus transitions; respect `prefers-reduced-motion`.

### Non-goals for the restyle

- No service, snapshot or endpoint changes.
- No new tabs.
- No collapse behavior for section bars unless already present for turns/diffs.
- No change to polling, SSE, error codes or persistence.

## Testing Decisions

A good test asserts external, user-visible behavior. Pixel-perfect snapshots are not appropriate because the host theme, fonts and panel width can change; assert structural and textual invariants instead.

### Existing seam — view models

- Extend the existing view-model seam for tab counts, context tone, agent status tone, turn failure tone and diff status labels.
- Assert that metadata is represented as separate fields, not one concatenated string.
- Assert empty and unknown states.

### New seam — Playwright visual smoke

- Add a small Playwright smoke that loads the installed Lens panel against a real OpenChamber session.
- Widths: 320, 480 and 880.
- Themes: host light and host dark.
- Assert:
  - four tab pills exist and the active one is distinguishable;
  - six stat cards exist;
  - the context bar exists and has a non-zero fill for a used context;
  - no element causes horizontal page overflow;
  - metadata text contains separators and does not match the run-on pattern;
  - the Work Status strip renders inside 76px;
  - empty/error states render a card.
- Capture screenshots for human comparison; do not commit them as golden files.
- If the host app is unavailable, the smoke is skipped with a clear message; view-model tests remain the gate.

### Manual verification

- Compare the dark screenshot against the csr-lens reference at a similar width.
- Compare light and dark for hierarchy and contrast.
- Open a session with subagents, multiple turns and a changed file; expand a turn and a diff.
- Check the Work Status strip with the panel closed.

### Commands

- `bun run typecheck`
- `bun test`
- `bun run build`
- Playwright smoke (when the app is running).

## Out of Scope

- New data, endpoints or service behavior.
- New tabs or navigation.
- Collapsible section bars beyond the existing turn/diff expansion.
- Stop-agent, history, file tree, inventory or per-turn diff.
- Forced dark mode or a standalone Lens theme.
- Pixel-perfect screenshot baselines in CI.
- Changes to the extension manifest, permissions or install flow.

## Further Notes

- The reference is wider than the OpenChamber rail; the design must reflow rather than copy the reference’s 885px layout literally.
- The current ring should be removed, not repaired; a bar is the reference pattern and reads better at narrow widths.
- The current `styles.ts` already uses some host tokens; the restyle keeps that direction but adds the missing hierarchy, surfaces, typography and components.
- The extension is already installed and live-tested; the restyle must be verified in the same host, not only in a standalone HTML page.
