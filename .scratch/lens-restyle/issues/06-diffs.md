# 06: Diff rows and line-level patches

**What to build:** The Diffs tab lists changed files as cards with a monospace path, status badge, `+N` in success, `−N` in danger and a chevron. Expanding a file renders the patch line by line: additions with a success-tinted background, deletions with a danger-tinted background, context lines on the surface, hunk headers muted. Large patches scroll and remain marked truncated.

**Blocked by:** 01 (Visual foundation, header and pill tabs)

**Status:** ready-for-agent

- [x] File rows show monospace path, status badge and colored addition/deletion counts.
- [x] New, modified, deleted and unknown files have distinct labels.
- [x] Expanded patches render as individual lines, not one raw preformatted block.
- [x] Addition/deletion lines have tinted backgrounds and preserve whitespace.
- [x] Hunk headers are visually distinct from code lines.
- [x] The patch scrolls internally and keeps the truncation notice.
- [x] A session with no diff shows a styled empty card.
- [x] View-model tests cover status labels and counts; typecheck and build pass.
- [x] The installed Diffs tab expands a file and reads like a code review.
