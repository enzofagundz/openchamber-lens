# 09: Release-ready package and documentation

**What to build:** A release-ready folder package with a pt-BR README. Another user can install it, understand the service permission, see the supported environments and limits, and run the manual smoke. The package contains only built assets.

**Blocked by:** 01 (Installable Lens shell with live session identity), 02 (Overview metrics), 03 (Diffs tab), 04 (Agents tab), 05 (Turns tab), 06 (Work Status strip), 07 (Live updates), 08 (Failure modes and resilience)

**Status:** ready-for-agent

- [ ] README pt-BR covers folder install, the service permission, the four tabs, the strip, what is read, that nothing is written, desktop and local `serve` support, the remote limitation, and troubleshooting.
- [ ] Package version is `0.1.0`, the icon is present, and `engines.openchamber` is correct.
- [ ] The package contains no `node_modules`, TypeScript sources, or development artifacts.
- [ ] Build, typecheck, and test commands are documented and pass.
- [ ] Manual smoke: install, open a session, spawn a subagent, edit a file, check diffs, check the strip, switch session, and see the unsupported-instance banner.
- [ ] Out of scope is documented: no `/lens` command, no stop agent, no history, no file tree, no inventory.
