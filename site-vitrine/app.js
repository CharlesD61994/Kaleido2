const pressableCards = document.querySelectorAll(".product-card, .category-card");
const storefront = document.querySelector(".storefront");
const menuButton = document.querySelector(".menu-button");
const sideMenu = document.querySelector(".side-menu");
const productDetail = document.querySelector("[data-product-detail='pantoufles']");
const productBackButton = document.querySelector(".detail-back");

const closeMenu = () => {
  storefront?.classList.remove("menu-open");
  menuButton?.setAttribute("aria-expanded", "false");
  sideMenu?.setAttribute("aria-hidden", "true");
};

menuButton?.addEventListener("click", () => {
  const isOpen = storefront?.classList.toggle("menu-open") ?? false;
  menuButton.setAttribute("aria-expanded", String(isOpen));
  sideMenu?.setAttribute("aria-hidden", String(!isOpen));
});

sideMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

pressableCards.forEach((card) => {
  card.addEventListener("pointerdown", () => {
    card.style.transform = "scale(0.985)";
  });

  card.addEventListener("pointerup", () => {
    card.style.transform = "";
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

document.querySelectorAll(".heart-button").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    button.classList.toggle("is-active");
    button.style.background = button.classList.contains("is-active")
      ? "rgba(232, 75, 148, 0.14)"
      : "rgba(255, 255, 255, 0.78)";
  });
});

const openProductDetail = () => {
  closeMenu();
  storefront?.classList.add("product-mode");
  if (productDetail) {
    productDetail.hidden = false;
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const closeProductDetail = () => {
  storefront?.classList.remove("product-mode");
  if (productDetail) {
    productDetail.hidden = true;
  }
  document.querySelector("#patrons")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

document.querySelectorAll("[data-product-open]").forEach((card) => {
  card.addEventListener("click", openProductDetail);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProductDetail();
    }
  });
});

productBackButton?.addEventListener("click", closeProductDetail);
