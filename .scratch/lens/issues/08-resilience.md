# 08: Failure modes and resilience

**What to build:** Clear failure states and safe degradation. The panel shows distinct banners for no server, authentication required, upstream failure, bad answer, and paused extension. Partial upstream data uses neutral values. Switching sessions resets the view. No session shows an empty state, and every cap holds.

**Blocked by:** 01 (Installable Lens shell with live session identity), 02 (Overview metrics), 03 (Diffs tab), 04 (Agents tab), 05 (Turns tab), 06 (Work Status strip), 07 (Live updates)

**Status:** ready-for-agent

- [ ] `no-server`, `auth-required`, `upstream-failed`, `bad-answer`, and `paused` each render a distinct banner with actionable text.
- [ ] A `401` from upstream maps to `auth-required`, explaining that remote and password-protected instances are unsupported.
- [ ] Malformed or partial JSON yields neutral values, never a blank panel or a crash.
- [ ] Switching sessions clears the previous session's data immediately.
- [ ] No session shows an empty state; no stale data is rendered.
- [ ] Patch, message, and recent-file caps are enforced.
- [ ] Tests cover each failure and a partial-data response.
