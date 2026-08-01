import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Track an in-flight refresh so concurrent 401s share one refresh call
// instead of each rotating the refresh token and invalidating the others.
let refreshPromise = null;

async function performRefresh() {
  const refreshToken = localStorage.getItem("refreshToken");
  const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
    refreshToken,
  });

  // Backend wraps payloads as { statusCode, success, message, data: {...} }
  // so the tokens live at response.data.data, not response.data.
  const { accessToken, refreshToken: newRefreshToken } = response.data.data;

  localStorage.setItem("accessToken", accessToken);
  if (newRefreshToken) {
    localStorage.setItem("refreshToken", newRefreshToken);
  }

  return accessToken;
}

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Reuse a single in-flight refresh across concurrent 401s.
        if (!refreshPromise) {
          refreshPromise = performRefresh().finally(() => {
            refreshPromise = null;
          });
        }

        const accessToken = await refreshPromise;

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;