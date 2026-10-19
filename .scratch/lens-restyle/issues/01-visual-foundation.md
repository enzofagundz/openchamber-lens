# 01: Visual foundation, header and pill tabs

**What to build:** The Lens panel adopts a shared visual foundation: semantic tokens for surfaces, text, borders, accent and status, plus the header and tab bar from the csr-lens reference. The panel opens with an 18px session title, a 12px subtitle, a status pill with a dot, and four tabs rendered as pills. Tabs for Agents, Turns and Diffs carry count badges. The look follows the host light/dark theme.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] A shared style source defines semantic tokens (surface, border, text, muted, accent, success, warning, danger, mono, radius) from host theme variables.
- [ ] Header shows session title, agent, model and status; status has a dot plus text.
- [ ] Tabs are 28px pills with 6px gaps, horizontal scroll and no page-level horizontal scroll.
- [ ] The active tab is visually distinct without relying on color alone.
- [ ] Agents, Turns and Diffs show count badges; Overview has no count.
- [ ] Light and dark host themes both have readable hierarchy and contrast.
- [ ] View-model tests cover the tab counts and active state; typecheck and build pass.
- [ ] The installed panel demonstrates the new header and tabs in OpenChamber.
