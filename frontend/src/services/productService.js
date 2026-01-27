import api from "./api";

export const productService = {
  async getProducts(params = {}) {
    const response = await api.get("/products", { params });
    return response.data;
  },

  async getProductById(id) {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  async getProductBySlug(slug) {
    const response = await api.get(`/products/slug/${slug}`);
    return response.data;
  },

  async getFeaturedProducts() {
    const response = await api.get("/products/featured");
    return response.data;
  },
};
