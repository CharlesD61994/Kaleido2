export const ADMIN_ROUTES = Object.freeze({
  HOME: "admin_home",
  PREVIEW: "admin_preview",
  PRODUCTS: "admin_products",
  STOREFRONT: "admin_storefront",
  PRODUCT_EDITOR: "admin_product_editor",
});

export const createAdminRoute = (name, params = {}) => ({
  id: `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name,
  params,
});
