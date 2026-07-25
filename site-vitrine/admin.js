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

const choiceSectionsConfig = [
  {
    optionId: "recipient",
    name: "recipient",
    title: "Pour qui ?",
    emptyText: "Aucun public choisi",
    addLabel: "Ajouter un public",
    values: ["Femme", "Homme", "Enfant"],
  },
  {
    optionId: "shoeSize",
    name: "shoeSize",
    title: "Pointure",
    emptyText: "Aucune pointure choisie",
    addLabel: "Ajouter une pointure",
    values: ["Bébé", "Enfant", "Femme", "Homme", "Sur mesure"],
  },
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
const colorManageModal = document.querySelector("#colorManageModal");
const colorManageTitle = document.querySelector("#colorManageTitle");
const colorManageDescription = document.querySelector("#colorManageDescription");
const colorManageGrid = document.querySelector("#colorManageGrid");
const modalColorLabel = document.querySelector("#modalColorLabel");
const modalColorValue = document.querySelector("#modalColorValue");
const modalAddColor = document.querySelector("#modalAddColor");
const colorPhotoModal = document.querySelector("#colorPhotoModal");
const colorPhotoDescription = document.querySelector("#colorPhotoDescription");
const colorPhotoInput = document.querySelector("#colorPhotoInput");
const colorPhotoGrid = document.querySelector("#colorPhotoGrid");
const colorManagePage = document.querySelector("#colorManagePage");
const colorPageKicker = document.querySelector("#colorPageKicker");
const colorPageTitle = document.querySelector("#colorPageTitle");
const colorPageDescription = document.querySelector("#colorPageDescription");
const colorPageContent = document.querySelector("#colorPageContent");

let activeColorMenuId = null;
let selectedColorsBySection = { mainColors: [], accentColors: [] };
let selectedChoicesBySection = {};
let editingColorContext = null;
let managingColorSection = null;
let photoColorContext = null;
let colorManageView = "list";

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

const getChoiceSectionValues = (section) => [
  ...new Set([...(section.values || []), ...(selectedChoicesBySection[section.name] || [])]),
];

const syncSelectedChoices = () => {
  const selectedOptions = getSelectedOptions();

  choiceSectionsConfig.forEach((section) => {
    if (!selectedOptions.includes(section.optionId)) {
      delete selectedChoicesBySection[section.name];
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(selectedChoicesBySection, section.name)) {
      selectedChoicesBySection[section.name] = [...(section.values || [])];
    }
  });
};

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
const colorCardMarkup = (color, sectionName) => `
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
    ${activeColorMenuId === `${sectionName}:${color.id}` ? colorMenuMarkup(color, sectionName) : ""}
  </div>
`;

const renderColorManagementModal = () => {
  if (!colorPageContent || !colorPageTitle || !colorPageDescription || !colorPageKicker) return;
  const section = colorSectionsConfig.find((item) => item.name === managingColorSection);
  const colors = section ? readCustomColors(section.name) : [];

  if (colorManageView === "edit") {
    const color = getColorFromContext(editingColorContext);
    const photos = color ? getColorPhotos(color) : [];
    colorPageKicker.textContent = section?.title || "Couleur";
    colorPageTitle.textContent = color ? color.label : "Couleur";
    colorPageDescription.textContent = color
      ? "Modifie la couleur et ajoute les photos de pelotes associées."
      : "Cette couleur n’est plus disponible.";
    colorPageContent.innerHTML = color
      ? `
          <div class="admin-detail-card color-detail-editor" style="--swatch:${color.value}">
            <label>
              Nom
              <input id="colorInlineEditName" type="text" value="${color.label}" />
            </label>
            <label>
              Couleur
              <input id="colorInlineEditValue" type="color" value="${color.value}" />
            </label>
            <div class="admin-modal-actions">
              <button class="secondary-button" type="button" data-back-color-manage>Retour</button>
              <button class="buy-button" type="button" data-save-color-edit>Enregistrer</button>
            </div>
            <button
              class="secondary-button color-delete-page-button"
              type="button"
              data-delete-color="${color.id}"
              data-color-section-name="${editingColorContext.sectionName}"
            >
              Supprimer cette couleur
            </button>
          </div>
          <div class="admin-detail-card color-detail-photos" style="--swatch:${color.value}">
            <div class="admin-section-heading">
              <div>
                <span class="admin-kicker">Photos</span>
                <h2>Pelotes associées</h2>
              </div>
            </div>
            <label class="photo-drop modal-photo-drop">
              <input id="colorInlinePhotoInput" type="file" accept="image/*" multiple />
              <span>Ajouter des photos</span>
              <small>Tu peux en sélectionner plusieurs à la fois.</small>
            </label>
            <div class="modal-photo-grid">
              ${
                photos.length
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
                  : '<p class="empty-drafts">Aucune photo associée pour le moment.</p>'
              }
            </div>
          </div>
        `
      : '<p class="empty-colors">Cette couleur n’est plus disponible.</p>';
    requestAnimationFrame(() => document.querySelector("#colorInlineEditName")?.focus());
    return;
  }

  colorPageKicker.textContent = "Options couleur";
  colorPageTitle.textContent = section ? section.title : "Gérer les couleurs";
  colorPageDescription.textContent = section
    ? `${colors.length} couleur(s) offerte(s) dans ${section.title.toLowerCase()}.`
    : "Ajoute les couleurs offertes pour cette option.";
  colorPageContent.innerHTML = `
    <div class="admin-detail-card custom-color-row page-color-add">
      <label>
        Ajouter une couleur
        <input type="text" id="colorPageLabel" placeholder="Nom" />
      </label>
      <label>
        Code
        <input type="color" id="colorPageValue" value="#f05b4f" />
      </label>
      <button class="add-color-button" type="button" data-add-page-color>Ajouter</button>
    </div>
    <div class="color-select-grid page-color-grid">
      ${
        colors.length
          ? colors
              .map(
                (color) => `
                  <button
                    class="color-toggle"
                    style="--swatch:${color.value}"
                    data-open-color-detail="${color.id}"
                    data-color-section-name="${section.name}"
                    type="button"
                    aria-label="Ouvrir ${color.label}"
                  >
                    <span class="color-check" aria-hidden="true"></span>
                    <span class="color-name-button">${color.label}</span>
                  </button>
                `,
              )
              .join("")
          : '<p class="empty-colors">Aucune couleur ajoutée pour le moment.</p>'
      }
    </div>
  `;
};

const renderColorSections = () => {
  const selectedOptions = getSelectedOptions();
  const visibleSections = colorSectionsConfig.filter((section) => selectedOptions.includes(section.optionId));
  const visibleChoiceSections = choiceSectionsConfig.filter((section) => selectedOptions.includes(section.optionId));

  if (!colorSections) return;

  if (visibleSections.length === 0 && visibleChoiceSections.length === 0) {
    colorSections.innerHTML = "";
    selectedColorsBySection = { mainColors: [], accentColors: [] };
    selectedChoicesBySection = {};
    activeColorMenuId = null;
    return;
  }

  const colorMarkup = visibleSections
    .map((section) => {
      const colors = readCustomColors(section.name);
      const previewColors = colors.slice(0, 5);

      return `
        <fieldset class="color-section" data-color-section="${section.name}">
          <legend>${section.title}</legend>
          <button class="color-summary-card" type="button" data-manage-color-section="${section.name}">
            <span>
              <strong>${colors.length} couleur(s)</strong>
              <small>${colors.length ? "Cliquer pour gérer les choix" : "Aucune couleur ajoutée"}</small>
            </span>
            <span class="summary-swatches" aria-hidden="true">
              ${
                previewColors.length
                  ? previewColors.map((color) => `<i style="--swatch:${color.value}"></i>`).join("")
                  : "<i></i>"
              }
            </span>
          </button>
        </fieldset>
      `;
    })
    .join("");

  const choiceMarkup = visibleChoiceSections
    .map((section) => {
      const values = getChoiceSectionValues(section);
      const selectedValues = selectedChoicesBySection[section.name] || [];

      return `
        <fieldset class="choice-section" data-choice-section="${section.name}">
          <legend>${section.title}</legend>
          <div class="choice-pill-grid">
            ${values
              .map(
                (value) => `
                  <label class="choice-pill">
                    <input
                      type="checkbox"
                      data-choice-value="${value}"
                      ${selectedValues.includes(value) ? "checked" : ""}
                    />
                    <span>${value}</span>
                  </label>
                `,
              )
              .join("")}
          </div>
          <div class="choice-add-row">
            <input type="text" placeholder="${section.addLabel}" data-choice-input="${section.name}" />
            <button type="button" data-add-choice="${section.name}">Ajouter</button>
          </div>
          <small>${selectedValues.length ? `${selectedValues.length} choix proposé(s)` : section.emptyText}</small>
        </fieldset>
      `;
    })
    .join("");

  colorSections.innerHTML = `${colorMarkup}${choiceMarkup}`;
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
      const choiceCount = Object.values(draft.optionChoices || {}).flat().length;
      const photoCount = (draft.productPhotos || []).length + (draft.colorPhotos || []).length;

      return `
        <article class="draft-card">
          <strong>${draft.name}</strong>
          <small>${draft.category} · À partir de ${draft.price || "prix à définir"}</small>
          <small>${colorCount ? `${colorCount} couleur(s)` : "Couleurs à définir"}</small>
          <small>${choiceCount ? `${choiceCount} choix d’option` : "Choix à définir"}</small>
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

const addCustomColor = (sectionName = managingColorSection) => {
  if (!sectionName) return;

  const pageLabel = document.querySelector("#colorPageLabel");
  const pageValue = document.querySelector("#colorPageValue");
  const label = pageLabel?.value.trim() || modalColorLabel?.value.trim() || "Nouvelle couleur";
  const value = pageValue?.value || modalColorValue?.value || "#f05b4f";
  const customColors = readCustomColors(sectionName);
  const existingColor = customColors.find((color) => color.value.toLowerCase() === value.toLowerCase());

  if (!existingColor) {
    saveCustomColors(sectionName, [...customColors, { id: crypto.randomUUID(), label, value, photos: [] }]);
  }

  syncSelectedColors();
  renderColorSections();
  renderColorManagementModal();
  updatePreview();

  if (modalColorLabel) modalColorLabel.value = "";
  if (pageLabel) pageLabel.value = "";
};

const editCustomColor = (colorId, sectionName) => {
  const color = readCustomColors(sectionName).find((item) => item.id === colorId);
  if (!color) return;

  editingColorContext = { colorId, sectionName };
  activeColorMenuId = null;
  colorManageView = "edit";
  renderColorManagementModal();
};

const closeColorEditModal = () => {
  editingColorContext = null;
  colorManageView = "list";
  renderColorManagementModal();
};

const openColorManageModal = (sectionName) => {
  managingColorSection = sectionName;
  activeColorMenuId = null;
  editingColorContext = null;
  photoColorContext = null;
  colorManageView = "list";
  if (colorManagePage) colorManagePage.hidden = false;
  renderColorManagementModal();
};

const closeColorManageModal = () => {
  managingColorSection = null;
  activeColorMenuId = null;
  editingColorContext = null;
  photoColorContext = null;
  colorManageView = "list";
  if (colorManagePage) colorManagePage.hidden = true;
  if (colorManageModal) colorManageModal.hidden = true;
  if (modalColorLabel) modalColorLabel.value = "";
};

const saveColorEdit = () => {
  const inlineName = document.querySelector("#colorInlineEditName");
  const inlineValue = document.querySelector("#colorInlineEditValue");
  const nameInput = inlineName || colorEditName;
  const valueInput = inlineValue || colorEditValue;
  if (!editingColorContext || !nameInput || !valueInput) return;
  const { colorId, sectionName } = editingColorContext;

  saveCustomColors(
    sectionName,
    readCustomColors(sectionName).map((item) =>
      item.id === colorId
        ? { ...item, label: nameInput.value.trim() || item.label, value: valueInput.value || item.value }
        : item,
    ),
  );
  closeColorEditModal();
  syncSelectedColors();
  renderColorSections();
  renderColorManagementModal();
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
  renderColorManagementModal();
  updatePreview();
};

const openColorPhotoModal = (colorId, sectionName) => {
  const color = readCustomColors(sectionName).find((item) => item.id === colorId);
  if (!color) return;

  photoColorContext = { colorId, sectionName };
  activeColorMenuId = null;
  colorManageView = "photos";
  renderColorSections();
  renderColorManagementModal();
};

const closeColorPhotoModal = () => {
  photoColorContext = null;
  colorManageView = "list";
  renderColorManagementModal();
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
  renderColorManagementModal();
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
  renderColorManagementModal();
  renderColorPhotoModal();
  updatePreview();
};

form?.addEventListener("input", updatePreview);

form?.addEventListener("change", (event) => {
  if (event.target.name === "options") {
    syncSelectedChoices();
    syncSelectedColors();
    renderColorSections();
  }

  const choiceSectionElement = event.target.closest("[data-choice-section]");
  if (choiceSectionElement && event.target.matches("[data-choice-value]")) {
    const sectionName = choiceSectionElement.dataset.choiceSection;
    const value = event.target.dataset.choiceValue;
    const currentValues = selectedChoicesBySection[sectionName] || [];

    selectedChoicesBySection[sectionName] = event.target.checked
      ? [...new Set([...currentValues, value])]
      : currentValues.filter((item) => item !== value);

    renderColorSections();
  }

  if (event.target.name === "productPhotos") {
    renderProductPhotoList();
  }

  syncSelectedChoices();
  syncSelectedColors();
  updatePreview();
});

form?.addEventListener("click", (event) => {
  const manageSectionButton = event.target.closest("[data-manage-color-section]");
  const openMenuButton = event.target.closest("[data-open-color-menu]");
  const editButton = event.target.closest("[data-edit-color]");
  const photoButton = event.target.closest("[data-manage-color-photos]");
  const deleteButton = event.target.closest("[data-delete-color]");
  const colorMenu = event.target.closest(".color-menu");
  const addChoiceButton = event.target.closest("[data-add-choice]");

  if (addChoiceButton) {
    event.preventDefault();
    const sectionName = addChoiceButton.dataset.addChoice;
    const input = form.querySelector(`[data-choice-input="${sectionName}"]`);
    const value = input?.value.trim();

    if (value) {
      selectedChoicesBySection[sectionName] = [...new Set([...(selectedChoicesBySection[sectionName] || []), value])];
      input.value = "";
      renderColorSections();
      updatePreview();
    }

    return;
  }

  if (manageSectionButton) {
    event.preventDefault();
    openColorManageModal(manageSectionButton.dataset.manageColorSection);
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
  renderColorManagementModal();
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
  renderColorManagementModal();
});

colorManageModal?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const colorCard = event.target.closest("[data-open-color-menu]");
  if (!colorCard) return;

  event.preventDefault();
  const sectionName = managingColorSection;
  activeColorMenuId =
    activeColorMenuId === `${sectionName}:${colorCard.dataset.openColorMenu}`
      ? null
      : `${sectionName}:${colorCard.dataset.openColorMenu}`;
  renderColorManagementModal();
});

colorManageModal?.addEventListener("click", (event) => {
  const addButton = event.target.closest("#modalAddColor");
  const backButton = event.target.closest("[data-back-color-manage]");
  const saveEditButton = event.target.closest("[data-save-color-edit]");
  const openMenuButton = event.target.closest("[data-open-color-menu]");
  const editButton = event.target.closest("[data-edit-color]");
  const photoButton = event.target.closest("[data-manage-color-photos]");
  const deleteButton = event.target.closest("[data-delete-color]");
  const deletePhotoButton = event.target.closest("[data-delete-color-photo]");
  const colorMenu = event.target.closest(".color-menu");

  if (addButton) {
    event.preventDefault();
    addCustomColor(managingColorSection);
    return;
  }

  if (backButton) {
    event.preventDefault();
    editingColorContext = null;
    photoColorContext = null;
    colorManageView = "list";
    renderColorManagementModal();
    return;
  }

  if (saveEditButton) {
    event.preventDefault();
    saveColorEdit();
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

  if (deletePhotoButton) {
    event.preventDefault();
    deleteColorPhoto(deletePhotoButton.dataset.deleteColorPhoto);
    return;
  }

  if (colorMenu) {
    event.stopPropagation();
    return;
  }

  if (openMenuButton) {
    event.preventDefault();
    event.stopPropagation();
    const sectionName = managingColorSection;
    activeColorMenuId =
      activeColorMenuId === `${sectionName}:${openMenuButton.dataset.openColorMenu}`
        ? null
        : `${sectionName}:${openMenuButton.dataset.openColorMenu}`;
    renderColorManagementModal();
  }
});

colorManageModal?.addEventListener("change", (event) => {
  if (event.target.closest("#colorInlinePhotoInput")) {
    addColorPhotos(Array.from(event.target.files || []));
  }
});

colorManagePage?.addEventListener("click", (event) => {
  const closeButton = event.target.closest("[data-close-color-page]");
  const addButton = event.target.closest("[data-add-page-color]");
  const detailButton = event.target.closest("[data-open-color-detail]");
  const backButton = event.target.closest("[data-back-color-manage]");
  const saveEditButton = event.target.closest("[data-save-color-edit]");
  const deleteColorButton = event.target.closest("[data-delete-color]");
  const deletePhotoButton = event.target.closest("[data-delete-color-photo]");

  if (closeButton || backButton) {
    event.preventDefault();
    if (colorManageView === "edit") {
      editingColorContext = null;
      photoColorContext = null;
      colorManageView = "list";
      renderColorManagementModal();
      return;
    }

    closeColorManageModal();
    return;
  }

  if (addButton) {
    event.preventDefault();
    addCustomColor(managingColorSection);
    return;
  }

  if (detailButton) {
    event.preventDefault();
    editingColorContext = {
      colorId: detailButton.dataset.openColorDetail,
      sectionName: detailButton.dataset.colorSectionName,
    };
    photoColorContext = { ...editingColorContext };
    activeColorMenuId = null;
    colorManageView = "edit";
    renderColorManagementModal();
    return;
  }

  if (saveEditButton) {
    event.preventDefault();
    saveColorEdit();
    return;
  }

  if (deleteColorButton) {
    event.preventDefault();
    deleteCustomColor(deleteColorButton.dataset.deleteColor, deleteColorButton.dataset.colorSectionName);
    editingColorContext = null;
    photoColorContext = null;
    colorManageView = "list";
    renderColorManagementModal();
    return;
  }

  if (deletePhotoButton) {
    event.preventDefault();
    deleteColorPhoto(deletePhotoButton.dataset.deleteColorPhoto);
  }
});

colorManagePage?.addEventListener("change", (event) => {
  if (event.target.closest("#colorInlinePhotoInput")) {
    addColorPhotos(Array.from(event.target.files || []));
  }
});

colorManageModal?.addEventListener("click", (event) => {
  if (event.target === colorManageModal || event.target.closest("[data-close-color-manage]")) {
    closeColorManageModal();
  }
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
  if (event.key === "Escape" && !colorManagePage?.hidden) {
    if (colorManageView === "edit") {
      editingColorContext = null;
      photoColorContext = null;
      colorManageView = "list";
      renderColorManagementModal();
      return;
    }

    closeColorManageModal();
    return;
  }

  if (event.key === "Escape" && !colorEditModal?.hidden) {
    closeColorEditModal();
  }

  if (event.key === "Escape" && !colorPhotoModal?.hidden) {
    closeColorPhotoModal();
  }

  if (event.key === "Escape" && !colorManageModal?.hidden) {
    closeColorManageModal();
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
    optionChoices: Object.fromEntries(
      choiceSectionsConfig.map((section) => [section.name, selectedChoicesBySection[section.name] || []]),
    ),
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
  selectedChoicesBySection = {};
  activeColorMenuId = null;
  closeColorEditModal();
  closeColorManageModal();
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
