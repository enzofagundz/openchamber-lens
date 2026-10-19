# 05: Turn cards and expandable detail

**What to build:** The Turns tab shows one card per user request, with an index chip, request title, status dot, chevron and a metadata line separated by dots. Failures use warning/danger tone and the running turn is labeled. Expanding a turn reveals a detail grid for the request, tools, failures, agents, start time and tokens.

**Blocked by:** 01 (Visual foundation, header and pill tabs)

**Status:** ready-for-agent

- [ ] Each turn is a card with an index chip and a chevron.
- [ ] Metadata renders as separate items with `·` separators: duration, cost, tools, failures, agents.
- [ ] No metadata line matches the old run-on pattern (`#416m 13sUS$…`).
- [ ] Failures are toned warning/danger; zero failures is muted.
- [ ] The running turn shows a status dot and label.
- [ ] Expanded detail uses a responsive grid and preserves the full request.
- [ ] Long requests ellipsize in the head and show in full in the detail.
- [ ] Empty sessions show a styled empty card.
- [ ] View-model tests cover meta separation and tones; typecheck and build pass.
- [ ] The installed Turns tab expands and collapses correctly.
