const productOptions = [
  {
    id: "mainColor",
    label: "Couleur principale",
    color: "#f05b4f",
    values: ["Corail", "Crème", "Turquoise", "Rose doux", "Miel"],
  },
  {
    id: "accentColor",
    label: "Couleur secondaire",
    color: "#30c7c9",
    values: ["Bordure contrastante", "Rayures", "Détails"],
  },
  {
    id: "recipient",
    label: "Pour qui ?",
    color: "#e84b94",
    values: ["Homme", "Femme", "Enfant"],
  },
  {
    id: "shoeSize",
    label: "Pointure",
    color: "#7c3aed",
    values: ["Bébé", "Enfant", "Adulte", "Sur mesure"],
  },
  {
    id: "keychain",
    label: "Porte-clé",
    color: "#f3b51b",
    values: ["Oui", "Non", "Anneau", "Mousqueton"],
  },
  {
    id: "personalization",
    label: "Personnalisation",
    color: "#8bbf3f",
    values: ["Prénom", "Initiales", "Petit mot"],
  },
  {
    id: "finish",
    label: "Finition",
    color: "#f4831f",
    values: ["Simple", "Pompon", "Bouton", "Bordure"],
  },
  {
    id: "delay",
    label: "Délai",
    color: "#188f91",
    values: ["Standard", "Prioritaire", "Date souhaitée"],
  },
];

const draftsKey = "kaleido-storefront-product-drafts";
const form = document.querySelector("#productForm");
const optionSelector = document.querySelector("#optionSelector");
const colorSelector = document.querySelector("#colorSelector");
const previewName = document.querySelector("#previewName");
const previewPrice = document.querySelector("#previewPrice");
const previewOptions = document.querySelector("#previewOptions");
const previewSwatches = document.querySelector("#previewSwatches");
const draftList = document.querySelector("#draftList");
const clearDraftsButton = document.querySelector("#clearDrafts");

const readDrafts = () => {
  try {
    return JSON.parse(localStorage.getItem(draftsKey) || "[]");
  } catch {
    return [];
  }
};

const saveDrafts = (drafts) => {
  localStorage.setItem(draftsKey, JSON.stringify(drafts));
};

const getSelectedOptions = () =>
  Array.from(optionSelector?.querySelectorAll("input:checked") || []).map((input) => input.value);

const getSelectedColors = () =>
  Array.from(colorSelector?.querySelectorAll("input:checked") || []).map((input) => input.value);

const findOption = (id) => productOptions.find((option) => option.id === id);

const renderOptionSelector = () => {
  if (!optionSelector) {
    return;
  }

  optionSelector.innerHTML = productOptions
    .map(
      (option) => `
        <label class="option-toggle" style="--option-color:${option.color}">
          <input type="checkbox" name="options" value="${option.id}" />
          ${option.label}
        </label>
      `,
    )
    .join("");
};

const renderPreviewOptions = () => {
  const selectedOptions = getSelectedOptions();

  if (!previewOptions) {
    return;
  }

  if (selectedOptions.length === 0) {
    previewOptions.innerHTML = '<span class="preview-option" style="--option-color:#30c7c9">Aucune option choisie</span>';
    return;
  }

  previewOptions.innerHTML = selectedOptions
    .map((id) => {
      const option = findOption(id);
      return `<span class="preview-option" style="--option-color:${option.color}">${option.label}</span>`;
    })
    .join("");
};

const renderPreviewSwatches = () => {
  if (!previewSwatches) {
    return;
  }

  const selectedColors = getSelectedColors();
  const colors = selectedColors.length > 0 ? selectedColors : ["#f05b4f", "#30c7c9", "#f2d9c9"];

  previewSwatches.innerHTML = [
    ...colors.slice(0, 4).map((color) => `<span style="--swatch:${color}"></span>`),
    '<button type="button" aria-label="Voir plus de couleurs">+</button>',
  ].join("");
};

const updatePreview = () => {
  const formData = new FormData(form);
  const name = formData.get("name")?.toString().trim() || "Pantoufles douillettes";
  const price = formData.get("price")?.toString().trim() || "42,00 $";

  previewName.textContent = name;
  previewPrice.textContent = price;
  renderPreviewOptions();
  renderPreviewSwatches();
};

const renderDrafts = () => {
  const drafts = readDrafts();

  if (drafts.length === 0) {
    draftList.innerHTML = '<p class="empty-drafts">Aucun produit préparé pour le moment.</p>';
    return;
  }

  draftList.innerHTML = drafts
    .map((draft) => {
      const options = (draft.options || [])
        .map((id) => findOption(id)?.label)
        .filter(Boolean)
        .join(", ");

      return `
        <article class="draft-card">
          <strong>${draft.name}</strong>
          <small>${draft.category} · À partir de ${draft.price || "prix à définir"}</small>
          <small>${draft.colors?.length ? `${draft.colors.length} couleur(s)` : "Couleurs à définir"}</small>
          <small>${options || "Aucune option"}</small>
        </article>
      `;
    })
    .join("");
};

form?.addEventListener("input", updatePreview);
form?.addEventListener("change", updatePreview);

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const draft = {
    id: crypto.randomUUID(),
    name: formData.get("name")?.toString().trim() || "Produit sans nom",
    category: formData.get("category")?.toString() || "Catalogue",
    price: formData.get("price")?.toString().trim(),
    description: formData.get("description")?.toString().trim(),
    shopify: formData.get("shopify")?.toString().trim(),
    options: getSelectedOptions(),
    colors: getSelectedColors(),
    createdAt: new Date().toISOString(),
  };

  saveDrafts([draft, ...readDrafts()]);
  renderDrafts();
  form.reset();
  updatePreview();
});

clearDraftsButton?.addEventListener("click", () => {
  saveDrafts([]);
  renderDrafts();
});

renderOptionSelector();
renderPreviewOptions();
renderPreviewSwatches();
renderDrafts();
