const productOptions = [
  { id: "mainColor", label: "Couleur principale", color: "#f05b4f" },
  { id: "accentColor", label: "Couleur secondaire", color: "#30c7c9" },
  { id: "recipient", label: "Pour qui ?", color: "#e84b94", values: ["Homme", "Femme", "Enfant"] },
  { id: "shoeSize", label: "Pointure", color: "#7c3aed" },
  { id: "keychain", label: "Porte-clé", color: "#f3b51b" },
  { id: "personalization", label: "Personnalisation", color: "#8bbf3f" },
  { id: "finish", label: "Finition", color: "#f4831f" },
  { id: "delay", label: "Délai", color: "#188f91" },
];

const colorSectionsConfig = [
  { optionId: "mainColor", name: "mainColors", key: "main", title: "Couleur principale" },
  { optionId: "accentColor", name: "accentColors", key: "accent", title: "Couleur secondaire" },
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
const productPhotoList = document.querySelector("#productPhotoList");
const colorPhotoList = document.querySelector("#colorPhotoList");
const draftList = document.querySelector("#draftList");
const clearDraftsButton = document.querySelector("#clearDrafts");

let activeColorMenuId = null;
let selectedColorsBySection = { mainColors: [], accentColors: [] };
let pendingColorEditId = null;

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

const getSelectedOptions = () =>
  Array.from(optionSelector?.querySelectorAll("input:checked") || []).map((input) => input.value);

const syncSelectedColors = () => {
  const selectedOptions = getSelectedOptions();
  const colors = readCustomColors().map((color) => color.value);

  selectedColorsBySection = {
    mainColors: selectedOptions.includes("mainColor") ? colors : [],
    accentColors: selectedOptions.includes("accentColor") ? colors : [],
  };
};

const getAllSelectedColors = () =>
  colorSectionsConfig.flatMap((section) => selectedColorsBySection[section.name] || []);

const findOption = (id) => productOptions.find((option) => option.id === id);
const getColorPhotoNames = (color) => color.photoNames || (color.photoName ? [color.photoName] : []);

const renderOptionSelector = () => {
  if (!optionSelector) return;

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

const colorMenuMarkup = (color, sectionName) => `
  <div class="color-menu" role="menu">
    <button type="button" data-edit-color="${color.id}">Modifier</button>
    <button type="button" data-attach-color-photo="${color.id}">Associer une photo</button>
    <button type="button" data-delete-color="${color.id}">Supprimer</button>
    <small>${getColorPhotoNames(color).length ? `${getColorPhotoNames(color).length} photo(s)` : "Aucune photo associée"}</small>
    <input hidden type="file" accept="image/*" multiple data-color-photo-input="${color.id}" data-section-name="${sectionName}" />
  </div>
`;

const colorEditMarkup = (color) => `
  <input
    class="floating-color-picker"
    type="color"
    value="${color.value}"
    data-editing-color="${color.id}"
    aria-label="Choisir la couleur"
  />
`;

const renderColorSections = () => {
  const selectedOptions = getSelectedOptions();
  const visibleSections = colorSectionsConfig.filter((section) => selectedOptions.includes(section.optionId));

  if (!colorSections) return;

  if (visibleSections.length === 0) {
    colorSections.innerHTML = "";
    selectedColorsBySection = { mainColors: [], accentColors: [] };
    activeColorMenuId = null;
    return;
  }

  const colors = readCustomColors();

  colorSections.innerHTML = visibleSections
    .map(
      (section) => `
        <fieldset class="color-section" data-color-section="${section.name}">
          <legend>${section.title}</legend>
          ${
            colors.length
              ? `<div class="color-select-grid">
                  ${colors
                    .map(
                      (color) => `
                        <div
                          class="color-toggle"
                          style="--swatch:${color.value}"
                          data-open-color-menu="${color.id}"
                          role="button"
                          tabindex="0"
                          aria-label="Gérer ${color.label}"
                        >
                          <span class="color-check" aria-hidden="true"></span>
                          <span class="color-name-button">
                            ${color.label}
                          </span>
                          ${activeColorMenuId === `${section.name}:${color.id}` ? colorMenuMarkup(color, section.name) : ""}
                          ${pendingColorEditId === color.id ? colorEditMarkup(color) : ""}
                        </div>
                      `,
                    )
                    .join("")}
                </div>`
              : '<p class="empty-colors">Aucune couleur ajoutée pour le moment.</p>'
          }
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
  if (!previewOptions) return;

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
  if (!previewSwatches) return;
  const colors = [...new Set(getAllSelectedColors())];

  previewSwatches.innerHTML = [
    ...colors.slice(0, 4).map((color) => `<span style="--swatch:${color}"></span>`),
    '<button type="button" aria-label="Voir plus de couleurs">+</button>',
  ].join("");
};

const renderProductPhotoList = () => {
  if (!productPhotoList || !form) return;
  const input = form.elements.productPhotos;
  const files = Array.from(input?.files || []);

  productPhotoList.innerHTML = files.length
    ? files.map((file) => `<span>${file.name}</span>`).join("")
    : '<small>Aucune photo du produit ajoutée.</small>';
};

const renderColorPhotoList = () => {
  if (!colorPhotoList) return;
  const colorsWithPhotos = readCustomColors().filter((color) => getColorPhotoNames(color).length > 0);

  colorPhotoList.innerHTML = colorsWithPhotos.length
    ? colorsWithPhotos
        .flatMap((color) =>
          getColorPhotoNames(color).map(
            (photoName) => `
            <span style="--swatch:${color.value}">
              <i></i>
              ${color.label}: ${photoName}
            </span>
          `,
          ),
        )
        .join("")
    : '<small>Aucune photo de couleur associée.</small>';
};

const updatePreview = () => {
  const formData = new FormData(form);
  previewName.textContent = formData.get("name")?.toString().trim() || "Pantoufles douillettes";
  previewPrice.textContent = formData.get("price")?.toString().trim() || "42,00 $";
  renderPreviewOptions();
  renderPreviewSwatches();
  renderProductPhotoList();
  renderColorPhotoList();
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
      const photoCount = (draft.productPhotos || []).length + (draft.colorPhotos || []).length;

      return `
        <article class="draft-card">
          <strong>${draft.name}</strong>
          <small>${draft.category} · À partir de ${draft.price || "prix à définir"}</small>
          <small>${colorCount ? `${colorCount} couleur(s)` : "Couleurs à définir"}</small>
          <small>${photoCount ? `${photoCount} photo(s)` : "Photos à définir"}</small>
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
  const existingColor = customColors.find((color) => color.value.toLowerCase() === value.toLowerCase());

  if (!existingColor) {
    saveCustomColors([...customColors, { id: crypto.randomUUID(), label, value, photoNames: [] }]);
  }

  syncSelectedColors();
  renderColorSections();
  updatePreview();
};

const editCustomColor = (colorId) => {
  const customColors = readCustomColors();
  const color = customColors.find((item) => item.id === colorId);
  if (!color) return;

  const label = window.prompt("Nom de la couleur", color.label);
  if (label === null) return;

  saveCustomColors(
    customColors.map((item) =>
      item.id === colorId ? { ...item, label: label.trim() || item.label } : item,
    ),
  );
  pendingColorEditId = colorId;
  renderColorSections();
  updatePreview();

  const picker = colorSections?.querySelector(".floating-color-picker");
  if (!picker) return;
  picker.click();
};

const deleteCustomColor = (colorId) => {
  const customColors = readCustomColors();
  const color = customColors.find((item) => item.id === colorId);
  if (!color || !window.confirm(`Supprimer la couleur "${color.label}" ?`)) return;

  saveCustomColors(customColors.filter((item) => item.id !== colorId));
  selectedColorsBySection = {
    mainColors: selectedColorsBySection.mainColors.filter((value) => value !== color.value),
    accentColors: selectedColorsBySection.accentColors.filter((value) => value !== color.value),
  };
  activeColorMenuId = null;
  renderColorSections();
  updatePreview();
};

const attachColorPhoto = (colorId) => {
  const input = colorSections?.querySelector(`input[data-color-photo-input="${colorId}"]`);
  input?.click();
};

const saveColorPhotoName = (input) => {
  const files = Array.from(input.files || []);
  const colorId = input.dataset.colorPhotoInput;
  if (files.length === 0 || !colorId) return;

  saveCustomColors(
    readCustomColors().map((item) =>
      item.id === colorId
        ? { ...item, photoNames: [...new Set([...getColorPhotoNames(item), ...files.map((file) => file.name)])] }
        : item,
    ),
  );
  renderColorSections();
  renderColorPhotoList();
};

form?.addEventListener("input", updatePreview);

form?.addEventListener("change", (event) => {
  if (event.target.name === "options") {
    syncSelectedColors();
    renderColorSections();
  }

  if (event.target.matches("[data-color-photo-input]")) {
    saveColorPhotoName(event.target);
  }

  if (event.target.name === "productPhotos") {
    renderProductPhotoList();
  }

  syncSelectedColors();
  updatePreview();
});

form?.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-color]");
  const openMenuButton = event.target.closest("[data-open-color-menu]");
  const editButton = event.target.closest("[data-edit-color]");
  const deleteButton = event.target.closest("[data-delete-color]");
  const photoButton = event.target.closest("[data-attach-color-photo]");

  if (addButton) {
    event.preventDefault();
    addCustomColor(addButton);
    return;
  }

  if (editButton) {
    event.preventDefault();
    event.stopPropagation();
    editCustomColor(editButton.dataset.editColor);
    return;
  }

  if (deleteButton) {
    event.preventDefault();
    event.stopPropagation();
    deleteCustomColor(deleteButton.dataset.deleteColor);
    return;
  }

  if (photoButton) {
    event.preventDefault();
    event.stopPropagation();
    attachColorPhoto(photoButton.dataset.attachColorPhoto);
    return;
  }

  if (openMenuButton) {
    event.preventDefault();
    event.stopPropagation();
    const sectionName = openMenuButton.closest(".color-section")?.dataset.colorSection;
    activeColorMenuId =
      activeColorMenuId === `${sectionName}:${openMenuButton.dataset.openColorMenu}`
        ? null
        : `${sectionName}:${openMenuButton.dataset.openColorMenu}`;
    pendingColorEditId = null;
    syncSelectedColors();
    renderColorSections();
    return;
  }
});

document.addEventListener("click", (event) => {
  if (!activeColorMenuId && !pendingColorEditId) return;
  if (event.target.closest(".color-toggle")) return;

  activeColorMenuId = null;
  pendingColorEditId = null;
  renderColorSections();
});

colorSections?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const colorCard = event.target.closest("[data-open-color-menu]");
  if (!colorCard) return;

  event.preventDefault();
  const sectionName = colorCard.closest(".color-section")?.dataset.colorSection;
  activeColorMenuId =
    activeColorMenuId === `${sectionName}:${colorCard.dataset.openColorMenu}`
      ? null
      : `${sectionName}:${colorCard.dataset.openColorMenu}`;
  pendingColorEditId = null;
  renderColorSections();
});

colorSections?.addEventListener("input", (event) => {
  if (!event.target.matches(".floating-color-picker")) return;
  const colorId = event.target.dataset.editingColor;
  if (!colorId) return;

  saveCustomColors(
    readCustomColors().map((item) => (item.id === colorId ? { ...item, value: event.target.value } : item)),
  );
  syncSelectedColors();
  updatePreview();
  renderColorPhotoList();
});

colorSections?.addEventListener("change", (event) => {
  if (!event.target.matches(".floating-color-picker")) return;

  pendingColorEditId = null;
  activeColorMenuId = null;
  renderColorSections();
  updatePreview();
});

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  syncSelectedColors();
  const formData = new FormData(form);
  const draft = {
    id: crypto.randomUUID(),
    name: formData.get("name")?.toString().trim() || "Produit sans nom",
    category: formData.get("category")?.toString() || "Catalogue",
    price: formData.get("price")?.toString().trim(),
    description: formData.get("description")?.toString().trim(),
    shopify: formData.get("shopify")?.toString().trim(),
    options: getSelectedOptions(),
    productPhotos: Array.from(form.elements.productPhotos?.files || []).map((file) => file.name),
    colorPhotos: readCustomColors()
      .filter((color) => getColorPhotoNames(color).length > 0)
      .map((color) => ({ label: color.label, value: color.value, photoNames: getColorPhotoNames(color) })),
    colors: {
      main: selectedColorsBySection.mainColors,
      accent: selectedColorsBySection.accentColors,
    },
    createdAt: new Date().toISOString(),
  };

  saveDrafts([draft, ...readDrafts()]);
  renderDrafts();
  form.reset();
  selectedColorsBySection = { mainColors: [], accentColors: [] };
  activeColorMenuId = null;
  renderColorSections();
  renderProductPhotoList();
  renderColorPhotoList();
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
renderProductPhotoList();
renderColorPhotoList();
renderDrafts();
