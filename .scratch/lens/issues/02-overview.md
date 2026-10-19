# 02: Overview metrics

**What to build:** The Overview tab shows the session's instrument numbers: a context ring (used, limit, percent), cost in USD, input/output/reasoning/cache tokens, model/agent/variant, session age and last activity, tool-call and failure counts, the last turn summary, and recent files. Unknown values show `–`; the panel stays readable in a narrow rail.

**Blocked by:** 01 (Installable Lens shell with live session identity)

**Status:** ready-for-agent

- [ ] Context uses the last assistant message's tokens and the model catalog limit; an unknown limit yields `–`, not `0%`.
- [ ] Cost and token breakdown match the session record; when session cost is absent, the sum of assistant costs is used.
- [ ] Tool counts and failures cover every tool part in the session.
- [ ] Last turn summary shows the request head, duration, cost, tools, and failures.
- [ ] Recent files deduplicate by path, newest first, capped at 8.
- [ ] Fixture tests cover a normal session, an empty session, and a session with missing fields.
- [ ] Light/dark theme and narrow-rail layout are verified.
