export const LENS_TOKENS = `
:root {
  color-scheme: light dark;
  --lens-bg: var(--oc-bg, #0b0f14);
  --lens-surface: var(--oc-elevated, #12171d);
  --lens-surface-2: var(--oc-muted-surface, #161b22);
  --lens-border: var(--oc-border, #2a323d);
  --lens-text: var(--oc-fg, #e6edf3);
  --lens-muted: var(--oc-muted, #8b949e);
  --lens-accent: var(--oc-primary, #2f81f7);
  --lens-accent-text: var(--oc-primary-text, #58a6ff);
  --lens-accent-fg: var(--oc-primary-fg, #ffffff);
  --lens-ok: var(--oc-success, #3fb950);
  --lens-ok-text: var(--oc-success-text, #3fb950);
  --lens-warn: var(--oc-warning, #d29922);
  --lens-warn-text: var(--oc-warning-text, #d29922);
  --lens-danger: var(--oc-error, #f85149);
  --lens-danger-text: var(--oc-error-text, #f85149);
  --lens-info: var(--oc-info, #58a6ff);
  --lens-mono: var(--oc-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  --lens-radius: var(--oc-radius, 8px);
  --lens-pad: 16px;
}
* { box-sizing: border-box; }
::selection { background: color-mix(in srgb, var(--lens-accent) 30%, transparent); }
:focus-visible { outline: 2px solid var(--lens-accent); outline-offset: 2px; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--lens-muted); flex: 0 0 auto; }
.status-dot.normal { background: var(--lens-ok); box-shadow: 0 0 0 3px color-mix(in srgb, var(--lens-ok) 14%, transparent); }
.status-dot.warning { background: var(--lens-warn); box-shadow: 0 0 0 3px color-mix(in srgb, var(--lens-warn) 14%, transparent); }
.status-dot.danger { background: var(--lens-danger); box-shadow: 0 0 0 3px color-mix(in srgb, var(--lens-danger) 14%, transparent); }
.status-dot.muted { background: var(--lens-muted); }
`;

export const PANEL_STYLE = `${LENS_TOKENS}
html, body {
  margin: 0;
  height: 100%;
  background: var(--lens-bg);
  color: var(--lens-text);
  font-family: var(--oc-font, system-ui, sans-serif);
  font-size: 12px;
  line-height: 1.45;
}
#root {
  height: 100%;
  overflow: auto;
  padding: var(--lens-pad);
  scrollbar-width: thin;
  scrollbar-color: var(--lens-border) transparent;
}
#root::-webkit-scrollbar { width: 8px; height: 8px; }
#root::-webkit-scrollbar-thumb { background: var(--lens-border); border-radius: 999px; }
#root::-webkit-scrollbar-track { background: transparent; }

.lens-header { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
.lens-header-main { flex: 1; min-width: 0; }
.lens-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.015em;
  color: var(--lens-text);
  overflow-wrap: anywhere;
}
.lens-sub {
  margin-top: 2px;
  color: var(--lens-muted);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lens-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  min-height: 22px;
  padding: 2px 8px;
  border: 1px solid var(--lens-border);
  border-radius: 999px;
  background: var(--lens-surface);
  color: var(--lens-muted);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.lens-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  padding-bottom: 2px;
  overflow-x: auto;
  scrollbar-width: none;
}
.lens-tabs::-webkit-scrollbar { display: none; }
.lens-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--lens-border);
  border-radius: 999px;
  background: var(--lens-surface);
  color: var(--lens-muted);
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
}
.lens-tab:hover { color: var(--lens-text); background: var(--lens-surface-2); }
.lens-tab.active {
  border-color: transparent;
  background: var(--lens-accent);
  color: var(--lens-accent-fg);
}
.lens-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: color-mix(in srgb, currentColor 14%, transparent);
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.lens-tab.active .lens-tab-count { background: color-mix(in srgb, var(--lens-accent-fg) 22%, transparent); }
.lens-settings-toggle {
  flex: 0 0 auto;
  padding: 3px 7px;
  border: 1px solid var(--lens-border);
  border-radius: 6px;
  background: transparent;
  color: var(--lens-muted);
  font: inherit;
  font-size: 10px;
  cursor: pointer;
}
.lens-settings-toggle:hover { color: var(--lens-text); border-color: var(--lens-accent); }
.settings-card {
  display: grid;
  gap: 7px;
  margin-bottom: 12px;
  padding: 10px;
  border: 1px solid var(--lens-border);
  border-radius: var(--lens-radius);
  background: var(--lens-surface);
}
.settings-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.settings-input {
  width: 100px;
  padding: 4px 6px;
  border: 1px solid var(--lens-border);
  border-radius: 6px;
  background: var(--lens-bg);
  color: var(--lens-text);
  font: inherit;
  font-size: 11px;
}
.settings-hint { color: var(--lens-muted); font-size: 10px; }
.lens-small {
  justify-self: start;
  padding: 3px 7px;
  border: 1px solid var(--lens-border);
  border-radius: 6px;
  background: transparent;
  color: var(--lens-muted);
  font: inherit;
  font-size: 10px;
  cursor: pointer;
}
.lens-small:hover { color: var(--lens-text); border-color: var(--lens-accent); }

.lens-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.stat-card {
  min-width: 0;
  padding: 10px 11px;
  border: 1px solid var(--lens-border);
  border-radius: var(--lens-radius);
  background: var(--lens-surface);
}
.stat-label {
  color: var(--lens-muted);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.stat-value {
  margin-top: 3px;
  color: var(--lens-text);
  font-size: 22px;
  font-weight: 650;
  line-height: 1.15;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.stat-value.normal { color: var(--lens-accent-text); }
.stat-value.warning { color: var(--lens-warn-text); }
.stat-value.danger { color: var(--lens-danger-text); }
.stat-value.muted { color: var(--lens-text); }
.model-card .stat-value {
  font-size: 16px;
  line-height: 1.25;
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  overflow-wrap: anywhere;
}
.stat-hint {
  margin-top: 2px;
  color: var(--lens-muted);
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.context-card { grid-column: 1 / -1; }
.duration-card { grid-column: 1 / -1; }
.context-meter {
  height: 4px;
  margin-top: 9px;
  border-radius: 999px;
  background: var(--lens-border);
  overflow: hidden;
}
.context-fill { width: 100%; height: 100%; transform-origin: left center; transform: scaleX(0); border-radius: inherit; background: var(--lens-accent); transition: transform 200ms ease; }
.context-fill.normal { background: var(--lens-accent); }
.context-fill.warning { background: var(--lens-warn); }
.context-fill.danger { background: var(--lens-danger); }
.context-fill.muted { background: var(--lens-muted); }
.context-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-top: 5px;
  color: var(--lens-muted);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}
.token-card { grid-column: 1 / -1; }
.token-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; margin-top: 7px; }
.token-value { margin-top: 1px; font-size: 14px; font-weight: 650; font-variant-numeric: tabular-nums; color: var(--lens-text); }

.lens-section { display: flex; flex-direction: column; gap: 7px; margin-top: 14px; }
.section-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding: 4px 9px 4px 7px;
  border: 1px solid color-mix(in srgb, var(--lens-accent) 20%, var(--lens-border));
  border-left: 1px solid var(--lens-accent);
  border-radius: 6px;
  background: color-mix(in srgb, var(--lens-accent) 7%, var(--lens-surface));
}
.section-number {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border: 1px solid color-mix(in srgb, var(--lens-warn) 75%, var(--lens-border));
  border-radius: 50%;
  color: var(--lens-warn-text);
  font-size: 9px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.section-label { font-size: 12px; font-weight: 600; color: var(--lens-text); }
.section-count { margin-left: auto; color: var(--lens-muted); font-size: 10px; font-variant-numeric: tabular-nums; }

.panel-card {
  border: 1px solid var(--lens-border);
  border-radius: var(--lens-radius);
  background: var(--lens-surface);
  overflow: hidden;
}
.list-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 7px 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--lens-border) 65%, transparent);
}
.list-row:last-child { border-bottom: 0; }
.list-main { flex: 1; min-width: 0; }
.list-path {
  font-family: var(--lens-mono);
  font-size: 11px;
  color: var(--lens-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.list-meta { margin-top: 1px; color: var(--lens-muted); font-size: 10px; }
.list-age { color: var(--lens-muted); font-size: 10px; white-space: nowrap; font-variant-numeric: tabular-nums; }

.turn-summary { padding: 10px 11px; }
.turn-summary-request { font-size: 12px; font-weight: 600; color: var(--lens-text); overflow-wrap: anywhere; }
.turn-meta { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 6px; margin-top: 3px; color: var(--lens-muted); font-size: 10px; font-variant-numeric: tabular-nums; }
.meta-sep { color: color-mix(in srgb, var(--lens-muted) 55%, transparent); }
.meta-warning { color: var(--lens-warn-text); }
.meta-danger { color: var(--lens-danger-text); }
.meta-normal { color: var(--lens-accent-text); }
.meta-muted { color: var(--lens-muted); }

.agent-card {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  min-width: 0;
  padding: 9px 10px;
  border: 1px solid var(--lens-border);
  border-radius: var(--lens-radius);
  background: var(--lens-surface);
  margin-bottom: 6px;
}
.agent-card:last-child { margin-bottom: 0; }
.agent-card.clickable { cursor: pointer; transition: border-color 150ms ease, background 150ms ease; }
.agent-card.clickable:hover { border-color: color-mix(in srgb, var(--lens-accent) 45%, var(--lens-border)); background: var(--lens-surface-2); }
.agent-avatar {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  border: 1px solid var(--lens-border);
  border-radius: 50%;
  color: var(--lens-muted);
  background: var(--lens-surface-2);
}
.agent-avatar.normal { border-color: color-mix(in srgb, var(--lens-ok) 55%, var(--lens-border)); color: var(--lens-ok-text); }
.agent-avatar.warning { border-color: color-mix(in srgb, var(--lens-warn) 55%, var(--lens-border)); color: var(--lens-warn-text); }
.agent-avatar.danger { border-color: color-mix(in srgb, var(--lens-danger) 55%, var(--lens-border)); color: var(--lens-danger-text); }
.agent-body { flex: 1; min-width: 0; }
.agent-head { display: flex; align-items: center; gap: 6px; min-width: 0; }
.agent-title { font-size: 12px; font-weight: 600; color: var(--lens-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.agent-meta { display: flex; flex-wrap: wrap; gap: 3px 7px; margin-top: 2px; color: var(--lens-muted); font-size: 10px; }
.agent-figures { display: flex; flex-wrap: wrap; gap: 6px 10px; margin-top: 4px; color: var(--lens-muted); font-size: 10px; font-variant-numeric: tabular-nums; }
.agent-figures b { color: var(--lens-text); font-weight: 600; }
.agent-open {
  align-self: center;
  flex: 0 0 auto;
  padding: 3px 7px;
  border: 1px solid var(--lens-border);
  border-radius: 6px;
  background: transparent;
  color: var(--lens-muted);
  font: inherit;
  font-size: 10px;
  cursor: pointer;
}
.agent-open:hover { color: var(--lens-text); border-color: var(--lens-accent); }
.agent-stop {
  align-self: center;
  flex: 0 0 auto;
  padding: 3px 7px;
  border: 1px solid color-mix(in srgb, var(--lens-danger) 40%, var(--lens-border));
  border-radius: 6px;
  background: transparent;
  color: var(--lens-danger-text);
  font: inherit;
  font-size: 10px;
  cursor: pointer;
}
.agent-stop:hover { background: color-mix(in srgb, var(--lens-danger) 10%, transparent); }
.agent-stop:disabled { opacity: .65; cursor: default; }

.turn-card { border: 1px solid var(--lens-border); border-radius: var(--lens-radius); background: var(--lens-surface); margin-bottom: 6px; overflow: hidden; }
.turn-card:last-child { margin-bottom: 0; }
.turn-head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.turn-head:hover { background: var(--lens-surface-2); }
.turn-index {
  flex: 0 0 auto;
  min-width: 20px;
  padding-top: 1px;
  color: var(--lens-muted);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}
.turn-request { flex: 1; min-width: 0; font-size: 12px; font-weight: 600; color: var(--lens-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.turn-chevron { flex: 0 0 auto; color: var(--lens-muted); transition: transform 150ms ease; }
.turn-chevron.open { transform: rotate(90deg); }
.turn-state { display: inline-flex; align-items: center; gap: 4px; flex: 0 0 auto; color: var(--lens-muted); font-size: 10px; white-space: nowrap; }
.turn-detail {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px 14px;
  padding: 10px;
  border-top: 1px solid var(--lens-border);
  background: var(--lens-surface-2);
}
.detail-item { min-width: 0; }
.detail-label { color: var(--lens-muted); font-size: 9px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
.detail-value { margin-top: 2px; color: var(--lens-text); font-size: 11px; overflow-wrap: anywhere; }
.detail-full { grid-column: 1 / -1; }

.diff-tools { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 8px; }
.diff-source { display: inline-flex; padding: 2px; border: 1px solid var(--lens-border); border-radius: 999px; background: var(--lens-surface); }
.diff-source button {
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--lens-muted);
  font: inherit;
  font-size: 10px;
  padding: 3px 8px;
  cursor: pointer;
}
.diff-source button.active { background: var(--lens-accent); color: var(--lens-accent-fg); }
.diff-turn-select {
  max-width: 100%;
  padding: 3px 7px;
  border: 1px solid var(--lens-border);
  border-radius: 6px;
  background: var(--lens-surface);
  color: var(--lens-text);
  font: inherit;
  font-size: 10px;
}
.diff-meta { margin-left: auto; color: var(--lens-muted); font-size: 10px; font-variant-numeric: tabular-nums; }
.diff-card { border: 1px solid var(--lens-border); border-radius: var(--lens-radius); background: var(--lens-surface); margin-bottom: 6px; overflow: hidden; }.diff-card:last-child { margin-bottom: 0; }
.diff-head {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 9px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.diff-head:hover { background: var(--lens-surface-2); }
.diff-path {
  flex: 1;
  min-width: 0;
  font-family: var(--lens-mono);
  font-size: 11px;
  color: var(--lens-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.diff-badge {
  flex: 0 0 auto;
  padding: 1px 5px;
  border: 1px solid var(--lens-border);
  border-radius: 999px;
  color: var(--lens-muted);
  font-size: 9px;
  white-space: nowrap;
}
.diff-badge.normal { color: var(--lens-ok-text); border-color: color-mix(in srgb, var(--lens-ok) 45%, var(--lens-border)); }
.diff-badge.danger { color: var(--lens-danger-text); border-color: color-mix(in srgb, var(--lens-danger) 45%, var(--lens-border)); }
.diff-counts { display: inline-flex; gap: 5px; flex: 0 0 auto; font-size: 10px; font-variant-numeric: tabular-nums; }
.add { color: var(--lens-ok-text); }
.del { color: var(--lens-danger-text); }
.patch {
  border-top: 1px solid var(--lens-border);
  background: var(--lens-bg);
  max-height: 380px;
  overflow: auto;
  padding: 6px 0;
  scrollbar-width: thin;
  scrollbar-color: var(--lens-border) transparent;
}
.patch-line {
  display: block;
  min-width: max-content;
  padding: 0 10px;
  font-family: var(--lens-mono);
  font-size: 11px;
  line-height: 1.55;
  white-space: pre;
  color: var(--lens-text);
}
.patch-line.add { background: color-mix(in srgb, var(--lens-ok) 13%, transparent); color: var(--lens-ok-text); }
.patch-line.del { background: color-mix(in srgb, var(--lens-danger) 13%, transparent); color: var(--lens-danger-text); }
.patch-line.hunk { background: var(--lens-surface-2); color: var(--lens-muted); }
.patch-line.meta { color: var(--lens-muted); }
.truncated { padding: 5px 10px 8px; color: var(--lens-warn-text); font-size: 10px; }
.diff-note { padding: 6px 10px 2px; color: var(--lens-muted); font-size: 10px; }

.tree-row {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  min-height: 25px;
  padding: 2px 6px;
  border: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--lens-border) 55%, transparent);
  background: transparent;
  color: var(--lens-text);
  font: inherit;
  text-align: left;
  cursor: default;
}
.tree-row:last-child { border-bottom: 0; }
.tree-row.directory { cursor: pointer; }
.tree-row:hover { background: var(--lens-surface-2); }
.tree-chevron { flex: 0 0 auto; color: var(--lens-muted); transition: transform 150ms ease; }
.tree-chevron.open { transform: rotate(90deg); }
.tree-icon { flex: 0 0 auto; color: var(--lens-muted); }
.tree-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; }
.tree-touched { width: 5px; height: 5px; border-radius: 50%; background: var(--lens-accent); margin-left: auto; flex: 0 0 auto; }
.tree-git { margin-left: auto; font-size: 9px; font-weight: 700; font-variant-numeric: tabular-nums; }
.tree-git.added { color: var(--lens-ok-text); }
.tree-git.deleted { color: var(--lens-danger-text); }
.tree-git.modified { color: var(--lens-warn-text); }
.tree-root { color: var(--lens-muted); font-size: 10px; font-family: var(--lens-mono); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.inventory-filter {
  width: 100%;
  margin-bottom: 8px;
  padding: 5px 7px;
  border: 1px solid var(--lens-border);
  border-radius: 6px;
  background: var(--lens-surface);
  color: var(--lens-text);
  font: inherit;
  font-size: 11px;
}
.inventory-section { margin-bottom: 8px; }
.inventory-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
.inventory-count { color: var(--lens-muted); font-size: 10px; font-variant-numeric: tabular-nums; }
.inventory-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 8px;
  border-bottom: 1px solid color-mix(in srgb, var(--lens-border) 60%, transparent);
}
.inventory-item:last-child { border-bottom: 0; }
.inventory-body { min-width: 0; flex: 1; }
.inventory-name { font-size: 11px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.inventory-desc { color: var(--lens-muted); font-size: 10px; margin-top: 1px; overflow-wrap: anywhere; }
.inventory-meta { color: var(--lens-muted); font-size: 9px; margin-top: 1px; overflow-wrap: anywhere; }

.history-card { padding: 9px 10px; }
.history-row { display: grid; grid-template-columns: 70px minmax(0, 1fr) auto; align-items: center; gap: 8px; padding: 4px 0; }
.history-label { color: var(--lens-muted); font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
.history-value { color: var(--lens-text); font-size: 11px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.history-empty { color: var(--lens-muted); font-size: 10px; }
.sparkline { color: var(--lens-accent-text); overflow: visible; }
.sparkline.muted { color: var(--lens-muted); }
.sparkline.normal { color: var(--lens-accent-text); }
.history-card .lens-small { margin-top: 4px; }

.banner {
  padding: 9px 11px;
  margin-bottom: 12px;
  border: 1px solid color-mix(in srgb, var(--lens-warn) 45%, var(--lens-border));
  border-radius: var(--lens-radius);
  background: color-mix(in srgb, var(--lens-warn) 9%, var(--lens-surface));
}
.banner.error { border-color: color-mix(in srgb, var(--lens-danger) 45%, var(--lens-border)); background: color-mix(in srgb, var(--lens-danger) 8%, var(--lens-surface)); }
.banner-title { font-size: 11px; font-weight: 700; color: var(--lens-text); }
.banner-body { margin-top: 2px; color: var(--lens-muted); font-size: 10px; line-height: 1.4; }

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-height: 72px;
  padding: 18px 12px;
  border: 1px dashed var(--lens-border);
  border-radius: var(--lens-radius);
  background: var(--lens-surface);
  text-align: center;
}
.empty-title { color: var(--lens-text); font-size: 12px; font-weight: 600; }
.empty-body { color: var(--lens-muted); font-size: 10px; }
.muted { color: var(--lens-muted); }

@media (min-width: 480px) {
  .lens-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .context-card { grid-column: auto; }
  .duration-card { grid-column: auto; }
}
@media (max-width: 520px) {
  .token-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .turn-detail { grid-template-columns: 1fr; }
  .detail-full { grid-column: auto; }
}
@media (max-width: 560px) {
  .lens-tabs { gap: 4px; }
  .lens-tab { height: 26px; padding: 0 8px; gap: 5px; font-size: 11px; }
  .lens-tab-count { min-width: 14px; height: 14px; font-size: 8px; }
}
@media (max-width: 360px) {
  :root { --lens-pad: 12px; }
  .lens-title { font-size: 16px; }
  .lens-status { padding: 2px 6px; }
  .lens-tabs { gap: 4px; }
  .lens-tab { height: 26px; padding: 0 8px; gap: 5px; font-size: 11px; }
  .lens-tab-count { min-width: 14px; height: 14px; font-size: 8px; }
  .stat-value { font-size: 19px; }
  .token-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .agent-figures { width: 100%; }
}
@media (max-width: 300px) {
  .lens-grid { grid-template-columns: 1fr; }
  .context-card { grid-column: auto; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; }
}
`;

export const STATUS_STYLE = `${LENS_TOKENS}
html, body {
  margin: 0;
  height: 100%;
  background: var(--lens-bg);
  color: var(--lens-text);
  font-family: var(--oc-font, system-ui, sans-serif);
  font-size: 11px;
  line-height: 1.4;
}
#root {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 5px;
  height: 100%;
  padding: 8px 10px;
  overflow: hidden;
}
.strip-head { display: flex; align-items: center; gap: 6px; min-width: 0; }
.strip-session {
  flex: 1;
  min-width: 0;
  color: var(--lens-muted);
  font-size: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.strip-status { display: inline-flex; align-items: center; gap: 4px; color: var(--lens-muted); font-size: 9px; white-space: nowrap; }
.strip-pills { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; }
#root.open-panel { cursor: pointer; }
.strip-pill { display: inline-flex; align-items: baseline; gap: 4px; white-space: nowrap; }
.strip-pill .label { color: var(--lens-muted); font-size: 9px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
.strip-pill .value { color: var(--lens-text); font-size: 12px; font-weight: 650; font-variant-numeric: tabular-nums; }
.strip-pill .value.normal { color: var(--lens-accent-text); }
.strip-pill .value.warning { color: var(--lens-warn-text); }
.strip-pill .value.danger { color: var(--lens-danger-text); }
.strip-pill .value.muted { color: var(--lens-text); }
.strip-empty { color: var(--lens-muted); font-size: 10px; }
.strip-error { color: var(--lens-danger-text); font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 340px) {
  .strip-pills { gap: 3px 5px; }
  .strip-pill .label { font-size: 8px; letter-spacing: 0.04em; }
  .strip-pill .value { font-size: 11px; }
  .strip-model { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; }
}
`;
