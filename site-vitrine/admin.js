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
const draftList = document.querySelector("#draftList");
const clearDraftsButton = document.querySelector("#clearDrafts");
const colorEditModal = document.querySelector("#colorEditModal");
const colorEditName = document.querySelector("#colorEditName");
const colorEditValue = document.querySelector("#colorEditValue");
const saveColorEditButton = document.querySelector("#saveColorEdit");
const colorPhotoModal = document.querySelector("#colorPhotoModal");
const colorPhotoDescription = document.querySelector("#colorPhotoDescription");
const colorPhotoInput = document.querySelector("#colorPhotoInput");
const colorPhotoGrid = document.querySelector("#colorPhotoGrid");

let activeColorMenuId = null;
let selectedColorsBySection = { mainColors: [], accentColors: [] };
let editingColorContext = null;
let photoColorContext = null;

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
const normalizeColorPhoto = (photo) =>
  typeof photo === "string" ? { id: crypto.randomUUID(), name: photo, url: "" } : photo;

const normalizeColor = (color) => ({
  ...color,
  photoNames: undefined,
  photoName: undefined,
  photos: [...(color.photos || []), ...(color.photoNames || []), ...(color.photoName ? [color.photoName] : [])].map(
    normalizeColorPhoto,
  ),
});

const emptyColorStore = () => ({ mainColors: [], accentColors: [] });

const readCustomColorStore = () => {
  const storedColors = readJson(customColorsKey, emptyColorStore());

  if (Array.isArray(storedColors)) {
    return { mainColors: storedColors.map(normalizeColor), accentColors: [] };
  }

  return {
    mainColors: (storedColors.mainColors || []).map(normalizeColor),
    accentColors: (storedColors.accentColors || []).map(normalizeColor),
  };
};

const saveCustomColorStore = (store) => writeJson(customColorsKey, store);

const readCustomColors = (sectionName) => {
  const store = readCustomColorStore();
  return sectionName ? store[sectionName] || [] : colorSectionsConfig.flatMap((section) => store[section.name] || []);
};

const saveCustomColors = (sectionName, colors) => {
  const store = readCustomColorStore();
  saveCustomColorStore({ ...store, [sectionName]: colors });
};

const getSelectedOptions = () =>
  Array.from(optionSelector?.querySelectorAll("input:checked") || []).map((input) => input.value);

const syncSelectedColors = () => {
  const selectedOptions = getSelectedOptions();

  selectedColorsBySection = {
    mainColors: selectedOptions.includes("mainColor") ? readCustomColors("mainColors").map((color) => color.value) : [],
    accentColors: selectedOptions.includes("accentColor")
      ? readCustomColors("accentColors").map((color) => color.value)
      : [],
  };
};

const getAllSelectedColors = () =>
  colorSectionsConfig.flatMap((section) => selectedColorsBySection[section.name] || []);

const findOption = (id) => productOptions.find((option) => option.id === id);
const getColorPhotos = (color) => (color.photos || []).map(normalizeColorPhoto);

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
    <button type="button" data-edit-color="${color.id}" data-color-section-name="${sectionName}">Modifier</button>
    <button type="button" data-manage-color-photos="${color.id}" data-color-section-name="${sectionName}">Photos</button>
    <button type="button" data-delete-color="${color.id}" data-color-section-name="${sectionName}">Supprimer</button>
    <small>${getColorPhotos(color).length ? `${getColorPhotos(color).length} photo(s)` : "Aucune photo associée"}</small>
  </div>
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

  colorSections.innerHTML = visibleSections
    .map((section) => {
      const colors = readCustomColors(section.name);

      return `
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
      `;
    })
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

const getColorFromContext = (context) => {
  if (!context) return null;
  return readCustomColors(context.sectionName).find((color) => color.id === context.colorId) || null;
};

const renderColorPhotoModal = () => {
  if (!colorPhotoGrid || !colorPhotoDescription) return;
  const color = getColorFromContext(photoColorContext);

  if (!color) {
    colorPhotoGrid.innerHTML = "";
    colorPhotoDescription.textContent = "Ajoute les photos des pelotes pour aider les clients à visualiser la couleur.";
    return;
  }

  const photos = getColorPhotos(color);
  colorPhotoDescription.textContent = `Photos associées à ${color.label}.`;
  colorPhotoGrid.innerHTML = photos.length
    ? photos
        .map(
          (photo) => `
            <article class="modal-photo-card">
              ${
                photo.url
                  ? `<img src="${photo.url}" alt="${photo.name}" />`
                  : `<div class="modal-photo-placeholder" style="--swatch:${color.value}"></div>`
              }
              <div>
                <strong>${photo.name}</strong>
                <button type="button" data-delete-color-photo="${photo.id}">Supprimer</button>
              </div>
            </article>
          `,
        )
        .join("")
    : '<p class="empty-drafts">Aucune photo associée pour le moment.</p>';
};

const updatePreview = () => {
  const formData = new FormData(form);
  previewName.textContent = formData.get("name")?.toString().trim() || "Pantoufles douillettes";
  previewPrice.textContent = formData.get("price")?.toString().trim() || "42,00 $";
  renderPreviewOptions();
  renderPreviewSwatches();
  renderProductPhotoList();
  renderColorPhotoModal();
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

const readFileAsPhoto = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener("load", () =>
      resolve({ id: crypto.randomUUID(), name: file.name, url: reader.result?.toString() || "" }),
    );
    reader.addEventListener("error", () => resolve({ id: crypto.randomUUID(), name: file.name, url: "" }));
    reader.readAsDataURL(file);
  });

const addCustomColor = (button) => {
  const sectionName = button.dataset.addColor;
  const section = button.closest(".color-section");
  const labelInput = section?.querySelector(`input[name="${sectionName}Label"]`);
  const valueInput = section?.querySelector(`input[name="${sectionName}Value"]`);
  const label = labelInput?.value.trim() || "Nouvelle couleur";
  const value = valueInput?.value || "#f05b4f";
  const customColors = readCustomColors(sectionName);
  const existingColor = customColors.find((color) => color.value.toLowerCase() === value.toLowerCase());

  if (!existingColor) {
    saveCustomColors(sectionName, [...customColors, { id: crypto.randomUUID(), label, value, photos: [] }]);
  }

  syncSelectedColors();
  renderColorSections();
  updatePreview();
};

const editCustomColor = (colorId, sectionName) => {
  const color = readCustomColors(sectionName).find((item) => item.id === colorId);
  if (!color || !colorEditModal || !colorEditName || !colorEditValue) return;

  editingColorContext = { colorId, sectionName };
  activeColorMenuId = null;
  colorEditName.value = color.label;
  colorEditValue.value = color.value;
  colorEditModal.hidden = false;
  requestAnimationFrame(() => colorEditName.focus());
};

const closeColorEditModal = () => {
  editingColorContext = null;
  if (colorEditModal) colorEditModal.hidden = true;
};

const saveColorEdit = () => {
  if (!editingColorContext || !colorEditName || !colorEditValue) return;
  const { colorId, sectionName } = editingColorContext;

  saveCustomColors(
    sectionName,
    readCustomColors(sectionName).map((item) =>
      item.id === colorId
        ? { ...item, label: colorEditName.value.trim() || item.label, value: colorEditValue.value || item.value }
        : item,
    ),
  );
  closeColorEditModal();
  syncSelectedColors();
  renderColorSections();
  updatePreview();
  renderColorPhotoModal();
};

const deleteCustomColor = (colorId, sectionName) => {
  const customColors = readCustomColors(sectionName);
  const color = customColors.find((item) => item.id === colorId);
  if (!color || !window.confirm(`Supprimer la couleur "${color.label}" ?`)) return;

  saveCustomColors(
    sectionName,
    customColors.filter((item) => item.id !== colorId),
  );
  selectedColorsBySection = {
    mainColors: selectedColorsBySection.mainColors.filter((value) => value !== color.value),
    accentColors: selectedColorsBySection.accentColors.filter((value) => value !== color.value),
  };
  activeColorMenuId = null;
  renderColorSections();
  updatePreview();
};

const openColorPhotoModal = (colorId, sectionName) => {
  const color = readCustomColors(sectionName).find((item) => item.id === colorId);
  if (!color || !colorPhotoModal) return;

  photoColorContext = { colorId, sectionName };
  activeColorMenuId = null;
  colorPhotoModal.hidden = false;
  renderColorSections();
  renderColorPhotoModal();
};

const closeColorPhotoModal = () => {
  photoColorContext = null;
  if (colorPhotoModal) colorPhotoModal.hidden = true;
  if (colorPhotoInput) colorPhotoInput.value = "";
};

const addColorPhotos = async (files) => {
  if (!photoColorContext || files.length === 0) return;
  const { colorId, sectionName } = photoColorContext;
  const newPhotos = await Promise.all(files.map(readFileAsPhoto));

  saveCustomColors(
    sectionName,
    readCustomColors(sectionName).map((item) =>
      item.id === colorId ? { ...item, photos: [...getColorPhotos(item), ...newPhotos] } : item,
    ),
  );
  syncSelectedColors();
  renderColorSections();
  renderColorPhotoModal();
  updatePreview();
};

const deleteColorPhoto = (photoId) => {
  if (!photoColorContext) return;
  const { colorId, sectionName } = photoColorContext;

  saveCustomColors(
    sectionName,
    readCustomColors(sectionName).map((item) =>
      item.id === colorId ? { ...item, photos: getColorPhotos(item).filter((photo) => photo.id !== photoId) } : item,
    ),
  );
  renderColorSections();
  renderColorPhotoModal();
  updatePreview();
};

form?.addEventListener("input", updatePreview);

form?.addEventListener("change", (event) => {
  if (event.target.name === "options") {
    syncSelectedColors();
    renderColorSections();
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
  const photoButton = event.target.closest("[data-manage-color-photos]");
  const deleteButton = event.target.closest("[data-delete-color]");
  const colorMenu = event.target.closest(".color-menu");

  if (addButton) {
    event.preventDefault();
    addCustomColor(addButton);
    return;
  }

  if (editButton) {
    event.preventDefault();
    event.stopPropagation();
    editCustomColor(editButton.dataset.editColor, editButton.dataset.colorSectionName);
    return;
  }

  if (photoButton) {
    event.preventDefault();
    event.stopPropagation();
    openColorPhotoModal(photoButton.dataset.manageColorPhotos, photoButton.dataset.colorSectionName);
    return;
  }

  if (deleteButton) {
    event.preventDefault();
    event.stopPropagation();
    deleteCustomColor(deleteButton.dataset.deleteColor, deleteButton.dataset.colorSectionName);
    return;
  }

  if (colorMenu) {
    event.stopPropagation();
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
    syncSelectedColors();
    renderColorSections();
    return;
  }
});

document.addEventListener("click", (event) => {
  if (!activeColorMenuId) return;
  if (event.target.closest(".color-toggle")) return;

  activeColorMenuId = null;
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
  renderColorSections();
});

saveColorEditButton?.addEventListener("click", saveColorEdit);

colorEditModal?.addEventListener("click", (event) => {
  if (event.target === colorEditModal || event.target.closest("[data-close-color-edit]")) {
    closeColorEditModal();
  }
});

colorPhotoModal?.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-color-photo]");

  if (deleteButton) {
    event.preventDefault();
    deleteColorPhoto(deleteButton.dataset.deleteColorPhoto);
    return;
  }

  if (event.target === colorPhotoModal || event.target.closest("[data-close-color-photos]")) {
    closeColorPhotoModal();
  }
});

colorPhotoInput?.addEventListener("change", (event) => {
  addColorPhotos(Array.from(event.target.files || []));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !colorEditModal?.hidden) {
    closeColorEditModal();
  }

  if (event.key === "Escape" && !colorPhotoModal?.hidden) {
    closeColorPhotoModal();
  }
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
      .filter((color) => getColorPhotos(color).length > 0)
      .map((color) => ({ label: color.label, value: color.value, photos: getColorPhotos(color) })),
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
  closeColorEditModal();
  closeColorPhotoModal();
  renderColorSections();
  renderProductPhotoList();
  renderColorPhotoModal();
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
renderColorPhotoModal();
renderDrafts();
