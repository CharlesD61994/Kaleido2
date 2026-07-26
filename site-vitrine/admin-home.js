const draftsKey = "kaleido-storefront-product-drafts";
const draftCount = document.querySelector("#draftCount");
const dashboardDraftList = document.querySelector("#dashboardDraftList");

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

const renderDashboard = () => {
  const drafts = readDrafts();

  if (draftCount) draftCount.textContent = drafts.length.toString();
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
