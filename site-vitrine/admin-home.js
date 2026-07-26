const draftsKey = "kaleido-storefront-product-drafts";
const homeConfigKey = "kaleido-storefront-home-config";
const draftCount = document.querySelector("#draftCount");
const readyCount = document.querySelector("#readyCount");
const catalogCount = document.querySelector("#catalogCount");
const dashboardDraftList = document.querySelector("#dashboardDraftList");
const publishStorefrontButton = document.querySelector("#publishStorefront");
const publishStorefrontStatus = document.querySelector("#publishStorefrontStatus");

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character],
  );

const readDrafts = () => {
  try {
    return JSON.parse(localStorage.getItem(draftsKey) || "[]");
  } catch {
    return [];
  }
};

const setPublishState = (state, message) => {
  if (publishStorefrontButton) {
    publishStorefrontButton.dataset.state = state;
    publishStorefrontButton.disabled = state === "saving";
    publishStorefrontButton.textContent =
      state === "saving" ? "Publication..." : state === "saved" ? "Publiee" : "Publier";
  }
  if (publishStorefrontStatus) {
    publishStorefrontStatus.hidden = state !== "error";
    publishStorefrontStatus.textContent = state === "error" ? message : "";
  }
};

const publishStorefront = async () => {
  if (!window.KaleidoStorefrontCloud?.isConfigured) {
    setPublishState("error", "Cloud non configure. Verifie storefront-config.js.");
    return;
  }
  if (publishStorefrontButton?.disabled) return;

  setPublishState("saving", "Publication vers Supabase en cours...");
  const result = await window.KaleidoStorefrontCloud.publishLocalStorefront({
    productsKey: draftsKey,
    homeConfigKey,
  });

  if (!result.ok) {
    setPublishState(
      "error",
      `Publication impossible (${result.reason}). Verifie que le SQL boutique a ete lance dans Supabase.`,
    );
    return;
  }

  setPublishState("saved", "Boutique publiee. La vitrine lira cette version au prochain chargement.");
  window.setTimeout(
    () => setPublishState("idle", ""),
    2600,
  );
};

const renderDashboard = () => {
  const drafts = readDrafts();
  const draftProducts = drafts.filter((draft) => draft.status !== "ready");
  const readyProducts = drafts.filter((draft) => draft.status === "ready");
  const catalogProducts = readyProducts.filter((draft) => draft.inCatalog !== false);

  if (draftCount) draftCount.textContent = draftProducts.length.toString();
  if (readyCount) readyCount.textContent = readyProducts.length.toString();
  if (catalogCount) catalogCount.textContent = catalogProducts.length.toString();
  if (!dashboardDraftList) return;

  dashboardDraftList.innerHTML = drafts.length
    ? drafts
        .slice(0, 3)
        .map(
          (draft) => `
            <article class="draft-card">
              <strong>${escapeHtml(draft.name || "Produit sans nom")}</strong>
              <small>${escapeHtml(draft.category || "Catalogue")} · À partir de ${escapeHtml(
                draft.price || "prix à définir",
              )}</small>
              <small>${(draft.options || []).length ? `${draft.options.length} option(s)` : "Aucune option"}</small>
            </article>
          `,
        )
        .join("")
    : '<p class="empty-drafts">Aucun produit préparé pour le moment.</p>';
};

renderDashboard();
publishStorefrontButton?.addEventListener("click", publishStorefront);
