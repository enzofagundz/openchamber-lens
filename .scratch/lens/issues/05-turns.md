# 05: Turns tab

**What to build:** The Turns tab groups the conversation by user request. Each turn shows the request head, duration, cost, tokens, tool count, failures, and the subagents that worked in it. In-progress turns are marked. Long details collapse.

**Blocked by:** 02 (Overview metrics), 04 (Agents tab)

**Status:** ready-for-agent

- [ ] Each user message starts a turn; assistant messages until the next user message belong to it; synthetic messages are ignored.
- [ ] Duration runs from the first to the last message time; an in-progress turn is marked.
- [ ] Cost and tokens are summed per turn; tool calls and failures are counted.
- [ ] Subagents are attributed by child creation time inside the turn window; a task call is preferred when available.
- [ ] Long requests truncate with an expand control; turn details collapse.
- [ ] Tests cover consecutive turns, an empty turn, an in-progress turn, and subagent attribution.
