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

const defaultColors = [
  { id: "coral", label: "Corail", value: "#f05b4f" },
  { id: "teal", label: "Turquoise", value: "#30c7c9" },
  { id: "creamPink", label: "Crème rosée", value: "#f2d9c9" },
  { id: "honey", label: "Miel", value: "#f3b51b" },
  { id: "pink", label: "Rose", value: "#e84b94" },
  { id: "violet", label: "Violet", value: "#7c3aed" },
];

const colorSectionsConfig = [
  { optionId: "mainColor", name: "mainColors", title: "Couleur principale" },
  { optionId: "accentColor", name: "accentColors", title: "Couleur secondaire" },
];

const draftsKey = "kaleido-storefront-product-drafts";
const customColorsKey = "kaleido-storefront-custom-colors";
const form = document.querySelector("#productForm");
const optionSelector = document.querySelector("#optionSelector");
const colorSections = document.querySelector("#colorSections");
const previewName = document.querySelector("#previewName");
const previewPrice = document.querySelector("#previewPrice");
const previewOptions = document.querySelector("#previewOptions");
const previewSwatches = document.querySelector("#previewSwatches");
const draftList = document.querySelector("#draftList");
const clearDraftsButton = document.querySelector("#clearDrafts");

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const readDrafts = () => readJson(draftsKey, []);
const saveDrafts = (drafts) => writeJson(draftsKey, drafts);
const readCustomColors = () => readJson(customColorsKey, []);
const saveCustomColors = (colors) => writeJson(customColorsKey, colors);

const getAvailableColors = () => [...defaultColors, ...readCustomColors()];

const getSelectedOptions = () =>
  Array.from(optionSelector?.querySelectorAll("input:checked") || []).map((input) => input.value);

const getSelectedColors = (name) =>
  Array.from(colorSections?.querySelectorAll(`input[name="${name}"]:checked`) || []).map((input) => input.value);

const getAllSelectedColors = () =>
  colorSectionsConfig.flatMap((section) => getSelectedColors(section.name));

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

const renderColorSections = () => {
  const selectedOptions = getSelectedOptions();
  const visibleSections = colorSectionsConfig.filter((section) => selectedOptions.includes(section.optionId));

  if (!colorSections) {
    return;
  }

  if (visibleSections.length === 0) {
    colorSections.innerHTML = "";
    return;
  }

  const colors = getAvailableColors();
  colorSections.innerHTML = visibleSections
    .map(
      (section) => `
        <fieldset class="color-section" data-color-section="${section.name}">
          <legend>${section.title}</legend>
          <div class="color-select-grid">
            ${colors
              .map(
                (color, index) => `
                  <label class="color-toggle" style="--swatch:${color.value}">
                    <input
                      type="checkbox"
                      name="${section.name}"
                      value="${color.value}"
                      ${index < 3 ? "checked" : ""}
                    />
                    ${color.label}
                  </label>
                `,
              )
              .join("")}
          </div>
          <div class="custom-color-row">
            <label>
              Ajouter une couleur
              <input type="text" name="${section.name}Label" placeholder="Nom" />
            </label>
            <label>
              Code
              <input type="color" name="${section.name}Value" value="#f05b4f" />
            </label>
            <button class="add-color-button" type="button" data-add-color="${section.name}">Ajouter</button>
          </div>
        </fieldset>
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

  const selectedColors = [...new Set(getAllSelectedColors())];
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
      const colorCount = [...new Set([...(draft.colors?.main || []), ...(draft.colors?.accent || [])])].length;

      return `
        <article class="draft-card">
          <strong>${draft.name}</strong>
          <small>${draft.category} · À partir de ${draft.price || "prix à définir"}</small>
          <small>${colorCount ? `${colorCount} couleur(s)` : "Couleurs à définir"}</small>
          <small>${options || "Aucune option"}</small>
        </article>
      `;
    })
    .join("");
};

const addCustomColor = (button) => {
  const sectionName = button.dataset.addColor;
  const section = button.closest(".color-section");
  const labelInput = section?.querySelector(`input[name="${sectionName}Label"]`);
  const valueInput = section?.querySelector(`input[name="${sectionName}Value"]`);
  const label = labelInput?.value.trim() || "Nouvelle couleur";
  const value = valueInput?.value || "#f05b4f";
  const customColors = readCustomColors();

  if (!customColors.some((color) => color.value.toLowerCase() === value.toLowerCase())) {
    saveCustomColors([...customColors, { id: crypto.randomUUID(), label, value }]);
  }

  renderColorSections();
  updatePreview();
};

form?.addEventListener("input", updatePreview);

form?.addEventListener("change", (event) => {
  if (event.target.name === "options") {
    renderColorSections();
  }
  updatePreview();
});

form?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-color]");
  if (button) {
    addCustomColor(button);
  }
});

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
    colors: {
      main: getSelectedColors("mainColors"),
      accent: getSelectedColors("accentColors"),
    },
    createdAt: new Date().toISOString(),
  };

  saveDrafts([draft, ...readDrafts()]);
  renderDrafts();
  form.reset();
  renderColorSections();
  updatePreview();
});

clearDraftsButton?.addEventListener("click", () => {
  saveDrafts([]);
  renderDrafts();
});

renderOptionSelector();
renderColorSections();
renderPreviewOptions();
renderPreviewSwatches();
renderDrafts();
