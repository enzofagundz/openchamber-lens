# 01: Installable Lens shell with live session identity

**What to build:** A folder-installable OpenChamber extension named Lens. Opening it from the rail shows the current session's identity: title, agent, model, directory, and status. The panel follows the session the user switches to. A local read-only service discovers the OpenChamber app server (desktop or local `openchamber serve`), fetches the minimal session data, and serves it to the panel. This is the tracer bullet: manifest, service, upstream call, panel, build, install, and one automated seam.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Manifest declares panel id `lens`, name `Lens`, icon `radar`, apiVersion 1, engines `>=2.3.3`, a service entry, and only the `sessions` capability.
- [ ] Folder install from Settings → Extensions succeeds; the rail icon opens the panel.
- [ ] Service binds loopback, requires `OPENCHAMBER_SERVICE_TOKEN`, and answers `/health`.
- [ ] Discovery finds the port from `settings.json` (`desktopLocalPort`) and from `run/openchamber-*.json` (`port`); no port guessing.
- [ ] Panel reads the current session from the host and refreshes when the session changes; no data from the previous session remains.
- [ ] Panel renders title, agent, model, directory, and status; no session shows an empty state.
- [ ] Service sends only GET upstream and writes no project files.
- [ ] Build produces a classic IIFE panel and a Node service; typecheck passes.
- [ ] A fake upstream server test proves discovery, the minimal `/snapshot` response, and the no-server error.
