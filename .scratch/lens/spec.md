# opencode-lens — Spec

> Tracker target: `.scratch/lens/spec.md` (blocked by Plan mode; staged in `/home/enzo/.opencode/plan`).
> Status: ready-for-agent

## Problem Statement

OpenChamber shows the conversation, the tool calls inside it, and a diff view, but it does not show the session as an instrument panel. A user working with subagents cannot answer, in one place:

- how much context is left before compaction;
- what the session has cost and where the tokens went;
- which subagents are running, who spawned them, and what each one cost;
- what each user request caused (duration, tools, failures, subagents);
- which files the session changed and by how much.

The user has to open separate views, guess context pressure, and track parallel subagent work by memory. Claude Code users have `csr-lens` for this. OpenChamber has no equivalent.

## Solution

Add an OpenChamber extension named **Lens** (`opencode-lens`): a rail panel with four tabs (Overview, Agents, Turns, Diffs) plus a compact Work Status strip.

A local, read-only service reads the OpenChamber app server's loopback API and SSE stream, derives one per-session snapshot, and serves it to the panel and the strip. The panel follows the session currently open in OpenChamber. No writes to the project, no agent control, no persistence, no secrets.

The UI is pt-BR and follows the host theme. The extension works on the desktop app and on a local `openchamber serve` instance. A remote or password-protected instance is explicitly unsupported and shows a clear banner.

## User Stories

1. As an OpenChamber user, I want a Lens icon in the rail, so that I can open session observability without leaving the app.
2. As an OpenChamber user, I want Lens to follow the session I have open, so that I do not have to select it manually.
3. As an OpenChamber user, I want to see the context percentage and used tokens, so that I know when compaction is near.
4. As an OpenChamber user, I want to see the model's context limit, so that the percentage has meaning.
5. As an OpenChamber user, I want to see the session cost in USD, so that I know what the session has spent.
6. As an OpenChamber user, I want input, output, reasoning, and cache token counts, so that I understand where cost comes from.
7. As an OpenChamber user, I want cache read and cache write tokens, so that I can judge cache efficiency.
8. As an OpenChamber user, I want to see the active model, agent, and variant, so that I know who is working and how.
9. As an OpenChamber user, I want session age and last activity, so that I know whether the session is still working.
10. As an OpenChamber user, I want tool-call counts and failures, so that I can spot loops or broken tools.
11. As an OpenChamber user, I want a compact strip in Work Status, so that I see context, cost, agents, model, and changed files without opening the panel.
12. As an OpenChamber user, I want the strip to show how many subagents are running, so that I know parallel work is happening.
13. As an OpenChamber user, I want the strip to show the changed-file count, so that I know the session is producing changes.
14. As an OpenChamber user, I want the Agents tab to show the main conversation and every subagent, so that I see the full delegation tree.
15. As an OpenChamber user, I want to see each agent's parent, model, status, cost, tokens, and tool count, so that I can compare them.
16. As an OpenChamber user, I want to click a subagent and open its session, so that I can read its work without hunting the session list.
17. As an OpenChamber user, I want agents grouped in creation order and nested by parent, so that the tree reads chronologically.
18. As an OpenChamber user, I want the Turns tab to group messages by user request, so that I can see what each prompt caused.
19. As an OpenChamber user, I want per-turn duration, cost, tool count, and failures, so that I can find expensive or broken turns.
20. As an OpenChamber user, I want per-turn subagents, so that I can attribute work to the right request.
21. As an OpenChamber user, I want turn details to collapse, so that long sessions stay readable.
22. As an OpenChamber user, I want the Diffs tab to list changed files with addition and deletion counts, so that I can review the session's footprint.
23. As an OpenChamber user, I want to expand a file and read its patch, so that I can inspect the change.
24. As an OpenChamber user, I want large patches capped with a clear notice, so that the panel does not freeze.
25. As an OpenChamber user, I want the panel to update live while the agent works, so that I can watch progress.
26. As an OpenChamber user, I want the panel to fall back to polling when SSE drops, so that it keeps working.
27. As an OpenChamber user, I want a clear banner when the local API is unreachable or requires auth, so that I know how to fix it.
28. As an OpenChamber user, I want an empty state when no session is open, so that I am not shown stale data.
29. As an OpenChamber user, I want the panel to reset when I switch sessions, so that data never mixes.
30. As an OpenChamber user, I want the UI in pt-BR, so that it matches the rest of my workflow.
31. As an OpenChamber user, I want the panel to follow light and dark theme, so that it looks native.
32. As an OpenChamber user, I want the panel to work in a narrow rail, so that it stays usable.
33. As an OpenChamber user, I want no writes to my project and no agent control, so that the Lens is safe to leave open.
34. As an OpenChamber user on `openchamber serve`, I want Lens to find the local server, so that it works outside the desktop app.
35. As an OpenChamber user on a remote or authenticated instance, I want a clear unsupported message, so that I know why the panel is empty.
36. As an OpenChamber user, I want to install from a folder, so that I can try the extension before publishing.
37. As an OpenChamber user, I want the Overview to show the last turn summary, so that I can catch up at a glance.
38. As an OpenChamber user, I want the Overview to list recent files, so that I know what the session touched.
39. As an OpenChamber user, I want the panel to keep the last good data while a refresh is in flight, so that the UI does not flicker.
40. As a maintainer, I want a documented snapshot contract, so that panel and service can evolve independently.
41. As a maintainer, I want tests driven by recorded fixtures, so that refactors do not break the derivation.
42. As a maintainer, I want the build to produce a classic IIFE panel and a Node service, so that OpenChamber can load it without compiling TypeScript.
43. As a security reviewer, I want the service to read only loopback and never store secrets, so that the trust surface is small.
44. As a security reviewer, I want the service to send only GET requests upstream, so that the observer cannot mutate state.
45. As a maintainer, I want the extension to degrade gracefully when upstream data is partial, so that one missing endpoint does not blank the whole panel.

## Implementation Decisions

### Extension identity

- Package and repository name: `opencode-lens`.
- Panel id: `lens`; display name: `Lens`; icon: `radar`.
- Manifest `apiVersion: 1`; `engines.openchamber: ">=2.3.3"`.
- Version starts at `0.1.0`.

### Contributions

- `panel`: rail entry with the four tabs.
- `statusSection`: compact strip, title `Lens`, height `76`.
- `service`: local Node process, runtime `host`.
- `capabilities`: only `sessions`, for opening a child session.
- No `actions`, `commands`, `tools`, `page`, `fileEditors`, `integration`, `origins`, `filesystem`, `exec`, or `sockets`.

### Service boundary

The service is a local HTTP server bound to `127.0.0.1`. It requires the host-provided bearer token on every request, including `/health`.

- `GET /health` returns readiness.
- `GET /snapshot?sessionId=<id>&directory=<path>` returns the full lens snapshot.
- `GET /strip?sessionId=<id>&directory=<path>` returns the compact strip payload.
- Unknown query or missing session returns a typed error envelope, never a blank 200.

The service is read-only. It sends only `GET` upstream. It never writes to the project, never executes git or shell commands, and never stores the upstream URL beyond memory.

### Server discovery

Discovery order:

1. `settings.json` in the OpenChamber data directory, key `desktopLocalPort` (desktop).
2. `run/openchamber-*.json` in the OpenChamber data directory, key `port` (local `openchamber serve`).
3. No server: return `no-server` with an actionable message.

The data directory is the platform default (`~/.config/openchamber`), unless a future host env var is available. No port guessing. No credential discovery. If the upstream returns `401`, return `auth-required` and explain that remote or password-protected instances are unsupported.

### Upstream contract

The service consumes the OpenChamber app server loopback API:

- session list, with pagination and `parentID`;
- messages for a session;
- session diff, as file/patch entries;
- model catalog, for `limit.context`;
- active-session map;
- SSE event stream.

It tolerates missing or partial fields: the snapshot uses neutral values (`null`, `0`, empty arrays) rather than failing the whole response.

### Snapshot contract

The snapshot is the single shared contract between service and panel:

| Field | Shape |
| --- | --- |
| `session` | id, title, directory, agent, model (`id`, `providerID`, `variant`, `name`, `contextLimit`), cost, tokens (`input`, `output`, `reasoning`, `cacheRead`, `cacheWrite`), times (`created`, `updated`), context (`used`, `limit`, `percent`), status |
| `counts` | messages, userTurns, assistantMessages, toolCalls, toolFailures, filesChanged |
| `turns[]` | index, request, startedAt, durationMs, cost, tokens, toolCalls, failures, agents |
| `agents[]` | id, parentId, title, agent, model, status, cost, tokens, toolCalls, startedAt, endedAt, depth, isMain |
| `diff[]` | path, additions, deletions, status, patch, truncated |
| `recentFiles[]` | path, action, at |
| `error` | `null` or a typed code/message |

`/strip` is a subset: context percent, used and limit; cost; running agent count; model name; changed file count; session status.

### Derivation rules

- A turn starts at each `user` message and includes the assistant messages until the next user message. Synthetic messages do not start a turn and do not appear in turn text.
- A turn with no assistant message is `in progress`.
- Context used is the last assistant message's `input + cache.read + output + reasoning`; the limit comes from the model catalog. If either is missing, `percent` is `null` and the UI shows `–`.
- Session cost comes from the session record; fallback is the sum of assistant message costs. Turn cost is the sum of assistant message costs in that turn.
- Agent status: active map says running; `time.idle` present says completed; child error says failed; otherwise unknown.
- The main conversation is the root agent; every child session is an agent node, recursively.
- Diff entries come from the session diff endpoint. Additions and deletions are counted from patch lines. Each patch is capped at 20,000 characters and the payload at 200,000 characters; capped entries are marked truncated.
- Recent files come from tool calls that read or edit a path, deduplicated by path, newest first, capped at 8.

### Live updates

- The service keeps one SSE connection per discovered server and reconnects with backoff.
- Relevant events mark the snapshot dirty; the service debounces rebuilds by 500 ms.
- If SSE is unavailable, the panel's poll rebuilds from upstream.
- The panel polls `/snapshot` every 1.5 s while visible, with one in-flight request at a time. Hidden frames do not poll.
- The strip polls `/strip` every 2 s while visible.
- Switching the current session resets the panel state immediately; no old session data is rendered under the new title.

### Panel behavior

- Vanilla TypeScript and CSS; no UI framework.
- Theme comes from the host's ready context; charts are inline SVG; numeric text uses tabular numbers where available.
- Narrow rail is the default layout; all tabs must remain usable without horizontal page scroll.
- Strings live in a single pt-BR module.
- Error banner states: `no-server`, `auth-required`, `upstream-failed`, `bad-answer`, `paused`.
- Empty state when there is no current session or the session has no data yet.

### Build and packaging

- TypeScript sources compiled to a classic IIFE for the panel and strip, and to Node JS for the service.
- The package ships built JS, HTML, manifest, and README only; no `node_modules`, no TS sources.
- One build script produces all three entries and runs the type check.
- The extension is installed from a folder in Settings → Extensions for v1.

## Testing Decisions

A good test asserts external behavior: given upstream data and a host session, what the user sees or what the service returns. Tests must not reach into private helpers or assert call order.

### Seam 1 — service HTTP boundary

Start the service against a fake upstream OpenChamber server and a temporary data directory. Assert the JSON of `/snapshot` and `/strip` for:

- a session with a main conversation and two child sessions;
- turns with tools, failures, and a running turn;
- a session diff with additions, deletions, and a capped patch;
- no current session;
- upstream `401`, unreachable host, and malformed JSON;
- discovery through `settings.json` and through `run/openchamber-*.json`;
- an SSE tool event changing a running tool to completed.

No internal mocks; the fake is at the HTTP/SSE boundary.

### Seam 2 — panel view model

Pure functions turn a snapshot fixture into each tab's view model: overview metrics, agent rows and nesting, turn rows, diff rows, empty and error states, and pt-BR labels. Assert ordering, grouping, formatting, and truncation. No DOM assertions in v1.

### Prior art

The repository is greenfield, so there is no prior test suite. The closest pattern is the OpenChamber resource-monitor extension: a service polled by a panel and by a status section, with pure formatting helpers. Tests use the Bun test runner and JSON fixtures recorded from a real session, sanitized of private content.

### Manual smoke

Install from a folder, open a real session, spawn a subagent, edit a file, and verify: live context/cost, agent tree, turn grouping, diff list, strip updates, session switch reset, and the unsupported-instance banner.

## Out of Scope

- Live file tree of the whole project.
- Inventory of agents, skills, commands, hooks, plugins, or MCP servers.
- Stopping, pausing, or interrupting an agent.
- Per-turn diff reconstruction.
- Git working-tree diff.
- Remote or password-protected OpenChamber instances.
- Persisted history across app restarts.
- Dollar-to-real conversion.
- A `/lens` slash command.
- Writes to project files or to OpenCode storage.
- Mobile and VS Code clients.

## Further Notes

### Evidence used

- `csr-lens` is a Claude Code mod with 41 files and an in-process event API (`session.start`, `tool.call`, `agent.spawn`, `turn.step`, `session.measure`, `ui.render`). Its seven tabs and above-prompt strip are the product reference, not the implementation model.
- OpenChamber extensions are sandboxed iframes with a `postMessage` host SDK. They cannot intercept tool calls or agent lifecycle; only `onSessionLifecycle` (started/completed/failure) and `onSessions` (activity) are exposed.
- OpenChamber extensions can run one local service, which is the only way to obtain live tool, cost, and turn data.
- The app server on loopback exposes session, message, diff, model, active-session, and SSE endpoints; the service uses those directly, so no OpenCode password discovery is needed.
- The direct OpenCode server requires HTTP Basic auth with a per-launch password; the app server already proxies it, which is why discovery targets the app server instead.

### Security posture

The service reads loopback HTTP only, sends only GET, keeps no secrets, and writes nothing. The only capability requested is `sessions`, used for navigation to a child session. The extension must stay a pure observer.

### Known limitation

If the local app server requires a UI password or the instance is remote, the service cannot authenticate. The panel must say so explicitly instead of showing an empty or stale lens. This is the accepted v1 boundary.
