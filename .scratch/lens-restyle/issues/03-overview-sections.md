# 03: Overview sections, last turn and recent files

**What to build:** The rest of the Overview tab uses numbered section bars: `01 Último turno` and `02 Arquivos recentes`. The last-turn card shows the request and dot-separated metrics without duplicating the section label. Recent files render as rows with a monospace path, action and age. Empty states are bordered cards, not loose text.

**Blocked by:** 02 (Overview stat grid and context bar)

**Status:** ready-for-agent

- [ ] Section bars show a 20px numbered marker, tinted surface, left accent and 12–13px label.
- [ ] Last-turn card shows request, duration, cost, tools and failures with explicit separators.
- [ ] The “Último turno” label appears once, in the section bar, not inside the card.
- [ ] Recent files show path, action and age; long paths ellipsize.
- [ ] Missing last turn or recent files shows a styled empty card.
- [ ] Layout stays readable at 320px and 880px.
- [ ] View-model tests cover the section data and empty state; typecheck and build pass.
- [ ] The installed Overview tab shows both sections in OpenChamber.
