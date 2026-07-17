const productCards = document.querySelectorAll(".product-card");

productCards.forEach((card) => {
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
  button.addEventListener("click", () => {
    button.classList.toggle("is-active");
    button.style.background = button.classList.contains("is-active")
      ? "rgba(232, 75, 148, 0.14)"
      : "rgba(255, 255, 255, 0.78)";
  });
});
