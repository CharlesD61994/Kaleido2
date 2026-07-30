(() => {
  const isInstalledApp = window.location.protocol === "capacitor:";
  const isLocalDevelopment = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (isInstalledApp || isLocalDevelopment) return;

  const renderBlocked = () => {
    document.body.innerHTML = `
      <main style="
        min-height: 100vh;
        margin: 0;
        display: grid;
        place-items: center;
        padding: 24px;
        color: #102744;
        background: #f7f4fb;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">
        <section style="
          width: min(360px, 100%);
          display: grid;
          gap: 12px;
          padding: 22px;
          border-radius: 24px;
          background: rgba(255,255,255,.86);
          border: 1px solid rgba(16,39,68,.12);
          box-shadow: 0 24px 60px rgba(16,39,68,.16);
          text-align: center;
        ">
          <strong style="font-size: 22px;">Admin non disponible</strong>
          <p style="margin: 0; color: #667086; font-weight: 700; line-height: 1.4;">
            Ce module est reserve a l'application Kaleido installee.
          </p>
        </section>
      </main>
    `;
  };

  if (document.body) renderBlocked();
  else window.addEventListener("DOMContentLoaded", renderBlocked, { once: true });
})();
