# 03: Diffs tab

**What to build:** The Diffs tab lists the files the session changed, with addition and deletion counts and an expandable patch. A session with no changes shows an empty state. Large patches are capped and clearly marked as truncated. The tab never runs git or shell commands.

**Blocked by:** 01 (Installable Lens shell with live session identity)

**Status:** ready-for-agent

- [ ] The session diff endpoint is consumed; file rows show path, status, additions, and deletions.
- [ ] Expanding a file shows its patch.
- [ ] Patch size is capped at 20,000 characters per file and 200,000 characters per response.
- [ ] Truncated entries show a clear notice.
- [ ] Files with no patch or binary content render safely.
- [ ] A session with no diff shows an empty state.
- [ ] Fake-upstream tests cover normal, empty, binary, and capped patches.
