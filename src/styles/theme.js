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
  --k-backdrop: rgba(0,0,0,0.75);
  --k-modal-backdrop: rgba(0,0,0,0.75);
  --k-header-gradient: linear-gradient(180deg, #1A0A2E 0%, #0D0D1A 100%);
  --k-panel-gradient: linear-gradient(135deg, rgba(30,30,50,0.98), rgba(20,20,36,0.96));
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
  --k-backdrop: rgba(24,18,35,0.38);
  --k-modal-backdrop: rgba(24,18,35,0.42);
  --k-header-gradient: linear-gradient(180deg, #F3EAFE 0%, #F7F4FB 100%);
  --k-panel-gradient: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(244,239,250,0.96));
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
