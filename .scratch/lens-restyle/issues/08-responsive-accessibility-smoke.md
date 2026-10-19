# 08: Responsive, accessibility and visual smoke

**What to build:** The restyled panel holds together from a narrow rail to a wide panel and in both host themes. It has no horizontal page scroll, focus-visible states, reduced-motion support, and styled empty/error states. A Playwright smoke checks the installed panel at three widths and two themes, with invariants rather than pixel goldens.

**Blocked by:** 02 (Overview stat grid and context bar), 03 (Overview sections, last turn and recent files), 04 (Agent cards and delegation tree), 05 (Turn cards and expandable detail), 06 (Diff rows and line-level patches), 07 (Work Status strip restyle)

**Status:** ready-for-agent

- [ ] Panel renders at 320, 480 and 880px with no horizontal page overflow.
- [ ] Stat grid reflows 3 → 2 → 1 columns; tabs scroll horizontally only.
- [ ] Titles, paths and metadata ellipsize; no clipped values or run-on text.
- [ ] Tabs and cards have visible focus rings and keyboard behavior.
- [ ] Animations respect `prefers-reduced-motion`; no decorative motion.
- [ ] Empty and error states render as cards in every tab.
- [ ] Status is conveyed by dot plus text, not color alone.
- [ ] Playwright smoke runs in light and dark at the three widths and asserts the structural invariants.
- [ ] Screenshots are captured for human comparison, not committed as goldens.
- [ ] The smoke skips cleanly when the host app is unavailable; view-model tests remain the gate.
- [ ] Typecheck, tests and build pass; the installed panel is verified in OpenChamber.
