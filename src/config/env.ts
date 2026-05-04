export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8001/api/v1",
  useMocks: import.meta.env.VITE_USE_MOCKS === "true",
};
