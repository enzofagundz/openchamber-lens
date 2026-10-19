# 07: Live updates

**What to build:** The panel and the strip update while the session works. The service holds an SSE connection to the app server, reconnects with backoff, and rebuilds the snapshot on relevant events with a 500 ms debounce. If SSE fails, polling drives the rebuild. The last good data stays visible during a refresh.

**Blocked by:** 02 (Overview metrics), 03 (Diffs tab), 04 (Agents tab), 05 (Turns tab), 06 (Work Status strip)

**Status:** ready-for-agent

- [ ] SSE connects to `/api/event`; tool, message, and session events mark the snapshot dirty.
- [ ] Reconnection uses backoff and never opens duplicate connections.
- [ ] Rebuild is debounced by 500 ms and the snapshot is served after it.
- [ ] Panel and strip refresh without clearing content or flickering.
- [ ] An SSE failure falls back to polling; recovery reconnects.
- [ ] The service stops after an idle period with no requests and restarts on the next request.
- [ ] A test proves that an SSE tool event changes a running tool to completed in `/snapshot`.
