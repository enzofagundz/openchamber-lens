# 02: Overview stat grid and context bar

**What to build:** The Overview tab shows six stat cards in a responsive grid: context, cost, tools, files, model and duration. Labels are 10px uppercase muted; values are large tabular numerals; hints are 11px muted. Context is a horizontal bar with a track and fill, replacing the ring, and turns warning/danger near the limit. Token input/output/reasoning/cache values form a compact five-column grid instead of a run-on line.

**Blocked by:** 01 (Visual foundation, header and pill tabs)

**Status:** ready-for-agent

- [x] Six stat cards exist and reflow from three columns to two and then one.
- [x] Context card shows percentage, used/limit and a 4px horizontal bar.
- [x] Context fill uses accent below 70%, warning at 70–89% and danger at 90%+; unknown is muted.
- [x] Cost, tools, files, model and duration cards show the intended label/value/hint hierarchy.
- [x] Tools card distinguishes total calls from failure count.
- [x] Token values render as five separate label/value pairs, never a concatenated string.
- [x] No card overflows or clips at 320px.
- [x] View-model tests cover the card values and context tone; typecheck and build pass.
- [x] The installed Overview tab shows the grid and bar in OpenChamber.
