# 06: Work Status strip

**What to build:** A compact Lens section in Work Status shows the session at a glance: context percent, cost, running agents, model, and changed files. It polls the service only while visible, follows the host theme, and stays usable at 76 px height.

**Blocked by:** 02 (Overview metrics), 03 (Diffs tab), 04 (Agents tab)

**Status:** ready-for-agent

- [ ] Manifest declares a `statusSection` with title `Lens` and height 76.
- [ ] `/strip` returns context, cost, running agents, model, changed files, and status.
- [ ] The strip renders those five values plus an empty and an error state.
- [ ] It polls every 2 seconds while visible; a hidden frame does not poll.
- [ ] Light/dark theme and narrow width are verified.
- [ ] A fake-upstream test proves the `/strip` payload.
