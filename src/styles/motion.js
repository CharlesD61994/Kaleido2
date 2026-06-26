const KALEIDO_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const KALEIDO_TIMING_FAST = "180ms";
const KALEIDO_TIMING_BASE = "220ms";
const KALEIDO_TIMING_SCREEN = "260ms";

export const GLOBAL_MOTION_CSS = `
  button, [data-kaleido-pressable="true"] {
    -webkit-tap-highlight-color: transparent;
    transition:
      transform ${KALEIDO_TIMING_FAST} ${KALEIDO_EASE},
      box-shadow ${KALEIDO_TIMING_BASE} ${KALEIDO_EASE},
      filter ${KALEIDO_TIMING_FAST} ease,
      opacity ${KALEIDO_TIMING_FAST} ease;
    will-change: transform, filter, box-shadow;
    transform: translateZ(0);
    backface-visibility: hidden;
  }
  button[data-kaleido-pressed="true"], [data-kaleido-pressable="true"][data-kaleido-pressed="true"] {
    transform: scale(0.955) translateY(1.5px);
    filter: brightness(1.04) saturate(1.03);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), 0 8px 20px rgba(0,0,0,0.16);
  }
  button:active, [data-kaleido-pressable="true"]:active {
    transform: scale(0.955) translateY(1.5px);
    filter: brightness(1.04) saturate(1.03);
  }
  [data-kaleido-modal-backdrop="true"] {
    animation: kaleidoFadeIn ${KALEIDO_TIMING_BASE} ease both;
    backdrop-filter: blur(3px);
  }
  [data-kaleido-modal-card="true"] {
    animation: kaleidoModalIn ${KALEIDO_TIMING_SCREEN} ${KALEIDO_EASE} both;
    transform-origin: center center;
    border: 1px solid rgba(167,139,250,0.28);
    box-shadow:
      0 22px 70px rgba(0,0,0,0.46),
      0 0 0 1px rgba(255,255,255,0.045),
      inset 0 1px 0 rgba(255,255,255,0.08);
  }
  [data-kaleido-screen="true"] {
    min-height: 100vh;
  }
  @keyframes kaleidoFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes kaleidoModalIn {
    from { opacity: 0; transform: translateY(14px) scale(0.975); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes kaleidoScreenInRight {
    from { opacity: 0.72; transform: translate3d(20px, 0, 0) scale(0.992); }
    to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
  }
  @keyframes kaleidoScreenInLeft {
    from { opacity: 0.78; transform: translate3d(-18px, 0, 0) scale(0.995); }
    to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
  }
  @keyframes kaleidoScreenFade {
    from { opacity: 0.74; transform: translate3d(0, 10px, 0) scale(0.996); }
    to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
  }
  @keyframes kaleidoParallaxFloat {
    0%, 100% { transform: translate3d(var(--kx, 0px), var(--ky, 0px), 0); }
    50% { transform: translate3d(calc(var(--kx, 0px) * 1.35), calc(var(--ky, 0px) * 1.35 - 2px), 0); }
  }
  @keyframes kaleidoProgressBreath {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.018); }
  }
  @keyframes kaleidoProgressPulse {
    0% { transform: scale(0.965); filter: brightness(0.98); }
    55% { transform: scale(1.085); filter: brightness(1.1); }
    100% { transform: scale(1); filter: brightness(1); }
  }
  @keyframes kaleidoProgressArcNudge {
    0% { stroke-dashoffset: var(--ring-final); }
    44% { stroke-dashoffset: var(--ring-overshoot); }
    100% { stroke-dashoffset: var(--ring-final); }
  }
  @keyframes kaleidoProgressCleanPulse {
    0%, 100% { transform: scale(1); }
    42% { transform: scale(1.012); }
  }
  @keyframes kaleidoProgressCleanGlow {
    0%, 100% { filter: drop-shadow(0 0 0 rgba(255,255,255,0)); }
    42% { filter: drop-shadow(0 0 5px currentColor) drop-shadow(0 0 9px currentColor); }
  }
  @keyframes kaleidoBarCleanPulse {
    0%, 100% { transform: scaleX(1); }
    42% { transform: scaleX(1.0045); }
  }
  @keyframes kaleidoBarCleanGlow {
    0%, 100% { box-shadow: 0 0 0 rgba(255,255,255,0); }
    42% { box-shadow: 0 0 7px rgba(255,255,255,0.10), 0 0 12px currentColor; }
  }
`;

export const getViewMotionStyle = () => {
  return { animation: "none" };
};
