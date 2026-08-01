import api from "./api";

const unwrapApiData = (response) => response?.data?.data ?? response?.data ?? null;

export const authService = {
  async login(email, password) {
    const response = await api.post("/auth/login", { email, password });
    return unwrapApiData(response);
  },

  async register(userData) {
    const response = await api.post("/auth/register", userData);
    return unwrapApiData(response);
  },

  async logout() {
    const response = await api.post("/auth/logout");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get("/auth/me");
    return unwrapApiData(response);
  },

  async forgotPassword(email) {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  },

  async resetPassword(token, password) {
    const response = await api.post("/auth/reset-password", {
      token,
      password,
    });
    return response.data;
  },
};
