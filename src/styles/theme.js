export const THEME_MODES = {
  dark: "dark",
  light: "light",
};

export const getThemeMode = (database) => {
  const mode = database?.settings?.themeMode;
  return mode === THEME_MODES.light ? THEME_MODES.light : THEME_MODES.dark;
};

export const THEME_CSS = `
:root,
[data-kaleido-theme="dark"] {
  --k-bg: #0D0D1A;
  --k-bg-soft: #111128;
  --k-surface: #1A1A2E;
  --k-surface-2: #1E1E32;
  --k-field: #13131F;
  --k-card: #111128;
  --k-text: #F1F0EE;
  --k-text-soft: #E2E0DC;
  --k-muted: #A8A6B8;
  --k-muted-2: #6B6A7A;
  --k-muted-3: #77758A;
  --k-border: rgba(255,255,255,0.08);
  --k-border-strong: #33334A;
  --k-muted-fill: rgba(255,255,255,0.06);
  --k-muted-fill-2: rgba(255,255,255,0.10);
  --k-control-border: transparent;
  --k-divider: rgba(255,255,255,0.12);
  --k-segment-bg: #1E1E32;
  --k-segment-border: transparent;
  --k-segment-idle-bg: transparent;
  --k-segment-idle-color: #6B6A7A;
  --k-backdrop: rgba(0,0,0,0.75);
  --k-modal-backdrop: rgba(0,0,0,0.75);
  --k-header-gradient: linear-gradient(180deg, #1A0A2E 0%, #0D0D1A 100%);
  --k-panel-gradient: linear-gradient(135deg, rgba(30,30,50,0.98), rgba(20,20,36,0.96));
  --k-client-url-bg: rgba(13,13,26,0.58);
  --k-client-url-border: rgba(255,255,255,0.06);
  --k-client-url-color: #A8A6B8;
  --k-client-secondary-bg: rgba(255,255,255,0.07);
  --k-client-secondary-bg-soft: rgba(255,255,255,0.05);
  --k-client-secondary-border: rgba(255,255,255,0.10);
  --k-client-secondary-color: #F1F0EE;
  --k-client-chat-bg: rgba(13,13,26,0.58);
  --k-client-chat-fullscreen-bg: rgba(13,13,26,0.32);
  --k-client-chat-field-bg: rgba(13,13,26,0.72);
  --k-client-chat-header-end: rgba(13,13,26,0.96);
  --k-client-close-border: rgba(255,255,255,0.14);
  --k-client-close-color: #fff;
  --k-client-summary-accent-weight: 19%;
  --k-client-summary-main-stop: 46%;
  --k-client-summary-border-weight: 20%;
  --k-client-summary-glow-weight: 9%;
  color-scheme: dark;
}

[data-kaleido-theme="light"] {
  --k-bg: #F7F4FB;
  --k-bg-soft: #EFE9F8;
  --k-surface: #FFFFFF;
  --k-surface-2: #F0EAF8;
  --k-field: #FFFFFF;
  --k-card: #FFFFFF;
  --k-text: #171321;
  --k-text-soft: #2D263A;
  --k-muted: #6E647C;
  --k-muted-2: #8A8096;
  --k-muted-3: #7C7288;
  --k-border: rgba(70,50,95,0.14);
  --k-border-strong: #D7CCE6;
  --k-muted-fill: rgba(70,50,95,0.06);
  --k-muted-fill-2: rgba(70,50,95,0.10);
  --k-control-border: rgba(70,50,95,0.24);
  --k-divider: rgba(40,32,52,0.24);
  --k-segment-bg: linear-gradient(135deg, rgba(124,58,237,0.12), rgba(219,39,119,0.10));
  --k-segment-border: transparent;
  --k-segment-idle-bg: transparent;
  --k-segment-idle-color: #5A496C;
  --k-backdrop: rgba(24,18,35,0.38);
  --k-modal-backdrop: rgba(24,18,35,0.42);
  --k-header-gradient: linear-gradient(180deg, #F3EAFE 0%, #F7F4FB 100%);
  --k-panel-gradient: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(244,239,250,0.96));
  --k-client-url-bg: var(--k-muted-fill);
  --k-client-url-border: var(--k-border);
  --k-client-url-color: var(--k-text-soft);
  --k-client-secondary-bg: var(--k-muted-fill-2);
  --k-client-secondary-bg-soft: var(--k-muted-fill-2);
  --k-client-secondary-border: var(--k-border);
  --k-client-secondary-color: var(--k-text);
  --k-client-chat-bg: var(--k-muted-fill);
  --k-client-chat-fullscreen-bg: var(--k-bg);
  --k-client-chat-field-bg: var(--k-field);
  --k-client-chat-header-end: var(--k-surface);
  --k-client-close-border: var(--k-border);
  --k-client-close-color: var(--k-text);
  --k-client-summary-accent-weight: 9%;
  --k-client-summary-main-stop: 52%;
  --k-client-summary-border-weight: 16%;
  --k-client-summary-glow-weight: 6%;
  color-scheme: light;
}

body {
  background: var(--k-bg);
}

[data-kaleido-theme="light"] [data-kaleido-modal-backdrop] {
  background: var(--k-modal-backdrop) !important;
}

[data-kaleido-theme="light"] [data-kaleido-modal-card] {
  background: var(--k-surface) !important;
  color: var(--k-text) !important;
  box-shadow: 0 22px 70px rgba(41,28,58,0.20) !important;
}
`;
