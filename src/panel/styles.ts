export const PANEL_STYLE = `
:root {
  color-scheme: light dark;
}
html, body {
  margin: 0;
  height: 100%;
  background: var(--oc-bg, transparent);
  color: var(--oc-fg, inherit);
  font-family: var(--oc-font, system-ui, sans-serif);
}
#root {
  height: 100%;
  overflow: auto;
  padding: 12px;
  box-sizing: border-box;
  font-size: 12px;
  line-height: 1.45;
}
.lens-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 10px;
}
.lens-header-main {
  min-width: 0;
  flex: 1;
}
.lens-title {
  font-weight: 650;
  font-size: 14px;
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lens-sub {
  color: var(--oc-muted, #888);
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.badge {
  border: 1px solid var(--oc-border, #ddd);
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 10px;
  color: var(--oc-muted, #888);
  white-space: nowrap;
}
.badge.normal { color: var(--oc-primary-text, #2563eb); border-color: currentColor; }
.badge.warning { color: var(--oc-warning-text, #b45309); border-color: currentColor; }
.badge.danger { color: var(--oc-error-text, #b91c1c); border-color: currentColor; }
.lens-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--oc-border, #ddd);
  margin-bottom: 12px;
  overflow-x: auto;
  scrollbar-width: none;
}
.lens-tab {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--oc-muted, #888);
  font: inherit;
  font-size: 11px;
  padding: 6px 7px;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  white-space: nowrap;
}
.lens-tab:hover { color: var(--oc-fg, inherit); }
.lens-tab.active {
  color: var(--oc-fg, inherit);
  border-bottom-color: var(--oc-primary, #2563eb);
  font-weight: 600;
}
.banner {
  border: 1px solid var(--oc-warning, #d97706);
  background: color-mix(in srgb, var(--oc-warning, #d97706) 10%, transparent);
  border-radius: var(--oc-radius, 6px);
  padding: 8px 10px;
  margin-bottom: 12px;
}
.banner.error {
  border-color: var(--oc-error, #dc2626);
  background: color-mix(in srgb, var(--oc-error, #dc2626) 10%, transparent);
}
.banner-title { font-weight: 600; margin-bottom: 2px; }
.banner-body { color: var(--oc-muted, #888); font-size: 11px; }
.empty {
  color: var(--oc-muted, #888);
  border: 1px dashed var(--oc-border, #ddd);
  border-radius: var(--oc-radius, 6px);
  padding: 18px 12px;
  text-align: center;
}
.empty-title { font-weight: 600; color: var(--oc-fg, inherit); margin-bottom: 3px; }
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.card {
  border: 1px solid var(--oc-border, #ddd);
  border-radius: var(--oc-radius, 6px);
  background: var(--oc-elevated, transparent);
  padding: 9px 10px;
  min-width: 0;
}
.card-label {
  color: var(--oc-muted, #888);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 3px;
}
.card-value {
  font-size: 16px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-value.normal { color: var(--oc-primary-text, #2563eb); }
.card-value.warning { color: var(--oc-warning-text, #b45309); }
.card-value.danger { color: var(--oc-error-text, #b91c1c); }
.card-value.muted { color: var(--oc-fg, inherit); }
.card-hint {
  color: var(--oc-muted, #888);
  font-size: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.context-card {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.context-ring { flex: 0 0 auto; }
.context-copy { min-width: 0; }
.context-value { font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums; }
.section { margin-top: 14px; }
.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}
.section-title {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--oc-muted, #888);
  font-weight: 600;
}
.section-meta { color: var(--oc-muted, #888); font-size: 10px; }
.chips { display: flex; flex-wrap: wrap; gap: 4px; }
.chip {
  border: 1px solid var(--oc-border, #ddd);
  border-radius: 999px;
  padding: 2px 7px;
  font-size: 10px;
  color: var(--oc-muted, #888);
  font-variant-numeric: tabular-nums;
}
.chip strong { color: var(--oc-fg, inherit); font-weight: 600; }
.row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border: 1px solid var(--oc-border, #ddd);
  border-radius: var(--oc-radius, 6px);
  background: var(--oc-elevated, transparent);
  margin-bottom: 5px;
  min-width: 0;
}
.row.clickable { cursor: pointer; }
.row.clickable:hover { background: var(--oc-hover, rgba(0,0,0,.04)); }
.row-main { min-width: 0; flex: 1; }
.row-title {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.row-sub {
  color: var(--oc-muted, #888);
  font-size: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.row-figures {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--oc-muted, #888);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.agent-row { align-items: flex-start; }
.agent-main { width: 100%; }
.agent-head { display: flex; align-items: center; gap: 6px; min-width: 0; }
.agent-title { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.agent-meta { color: var(--oc-muted, #888); font-size: 10px; display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px; }
.agent-toggle { cursor: default; }
.turn-card { padding: 0; overflow: hidden; }
.turn-head {
  padding: 8px 10px;
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.turn-head:hover { background: var(--oc-hover, rgba(0,0,0,.04)); }
.turn-index {
  color: var(--oc-muted, #888);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  padding-top: 2px;
  min-width: 18px;
}
.turn-request {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}
.turn-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  color: var(--oc-muted, #888);
  font-size: 10px;
  margin-top: 3px;
}
.turn-detail {
  border-top: 1px solid var(--oc-border, #ddd);
  padding: 8px 10px;
  background: var(--oc-muted-surface, transparent);
}
.turn-detail-label {
  color: var(--oc-muted, #888);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 6px 0 3px;
}
.turn-detail-text { white-space: pre-wrap; word-break: break-word; font-size: 11px; }
.diff-row { padding: 0; overflow: hidden; }
.diff-head {
  padding: 7px 9px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.diff-head:hover { background: var(--oc-hover, rgba(0,0,0,.04)); }
.diff-path {
  flex: 1;
  min-width: 0;
  font-family: var(--oc-mono, monospace);
  font-size: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.diff-counts { font-variant-numeric: tabular-nums; font-size: 10px; white-space: nowrap; }
.add { color: var(--oc-success-text, #15803d); }
.del { color: var(--oc-error-text, #b91c1c); }
.patch {
  margin: 0;
  border-top: 1px solid var(--oc-border, #ddd);
  padding: 8px 9px;
  max-height: 360px;
  overflow: auto;
  font-family: var(--oc-mono, monospace);
  font-size: 10px;
  line-height: 1.5;
  white-space: pre;
  background: var(--oc-muted-surface, transparent);
}
.truncated { color: var(--oc-warning-text, #b45309); font-size: 10px; padding: 4px 9px 8px; }
.file-line { display: flex; align-items: center; gap: 8px; }
.file-action { font-size: 10px; color: var(--oc-muted, #888); }
.muted { color: var(--oc-muted, #888); }
@media (max-width: 340px) {
  .grid.three { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  #root { padding: 9px; }
}
`;
