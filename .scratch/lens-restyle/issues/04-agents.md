# 04: Agent cards and delegation tree

**What to build:** The Agents tab shows the main conversation and every subagent as cards in a delegation tree. Each card has a status dot, an avatar glyph, title, status text, model, parent and right-aligned cost/tokens/tool figures. Depth is visible through indentation. Child cards open their session; the root does not.

**Blocked by:** 01 (Visual foundation, header and pill tabs)

**Status:** ready-for-agent

- [ ] Each agent renders as a card with a 24px status avatar and dot plus text status.
- [ ] Running, completed, failed and unknown states use the intended tones and remain distinguishable without color.
- [ ] Child cards are indented by depth and show their parent.
- [ ] Cards show model, cost, tokens and tool count.
- [ ] Child cards are keyboard-operable and show a discreet “Abrir” affordance.
- [ ] Figures align right on wide panels and stack under the title on narrow ones.
- [ ] A session with only the main conversation shows a styled empty state for subagents.
- [ ] View-model tests cover depth, status tone and openability; typecheck and build pass.
- [ ] The installed Agents tab shows the cards and opens a child session.
