import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Render's free tier can take 30-50s to wake a sleeping backend, so we
  // allow enough time for that instead of failing fast.
  timeout: 45000,
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

// Statuses/conditions worth retrying: no response at all (network error or
// our own client timeout) or Render's gateway errors while it's booting
// the container back up.
const isRetryableColdStart = (error) => {
  if (error.code === "ECONNABORTED") return true; // client-side timeout
  if (!error.response) return true; // network error, connection refused, etc.
  return [502, 503, 504].includes(error.response.status);
};

const MAX_COLD_START_RETRIES = 2;
const RETRY_DELAY_MS = 4000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // If we previously signaled the server might be waking up, let the UI
    // know it's back.
    window.dispatchEvent(new CustomEvent("server-awake"));
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Cold-start retry (skip for the refresh-token call itself, and skip
    // once we've already retried the max number of times).
    if (
      isRetryableColdStart(error) &&
      !originalRequest.url?.includes("/auth/refresh-token") &&
      (originalRequest._coldStartRetryCount || 0) < MAX_COLD_START_RETRIES
    ) {
      originalRequest._coldStartRetryCount =
        (originalRequest._coldStartRetryCount || 0) + 1;

      window.dispatchEvent(new CustomEvent("server-waking-up"));
      await wait(RETRY_DELAY_MS);

      return api(originalRequest);
    }

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