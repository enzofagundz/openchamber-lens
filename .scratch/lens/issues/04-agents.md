# 04: Agents tab

**What to build:** The Agents tab shows the main conversation plus every subagent as a tree. Each node shows title, parent, model, status, cost, tokens, and tool count. Clicking a subagent opens its session in OpenChamber. Missing or paginated children degrade gracefully.

**Blocked by:** 01 (Installable Lens shell with live session identity)

**Status:** ready-for-agent

- [ ] Child sessions are discovered by `parentID`, recursively; the main conversation is the root.
- [ ] The tree nests by depth and orders siblings by creation time.
- [ ] Status resolves running, completed, failed, or unknown from the active map, idle time, and errors.
- [ ] Each node shows cost, tokens, tool count, model, and parent.
- [ ] Clicking a child calls `host.openSession`; the `sessions` capability is declared.
- [ ] Session list pagination is handled; a missing child does not break the tree.
- [ ] Tests cover nesting, ordering, status resolution, and orphan children.
