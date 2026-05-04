import axios from "axios";

import { env } from "../config/env";
import { useAuthStore } from "../store/authStore";
import type { AuthTokens } from "../types/api";

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 12000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const auth = useAuthStore.getState();
    if (error.response?.status !== 401 || originalRequest?._retry || !auth.refreshToken) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      const response = await axios.post<AuthTokens>(
        `${apiClient.defaults.baseURL}/auth/refresh`,
        { refresh_token: auth.refreshToken },
      );
      auth.setTokens(response.data.access_token, response.data.refresh_token);
      originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      auth.logout();
      return Promise.reject(refreshError);
    }
  },
);
