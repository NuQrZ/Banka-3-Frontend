import api from "./api.js";

export const login = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });
  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
  };
};

export const requestPasswordReset = (email) => {
  return api.post("/password-reset/request", { email });
};

export const confirmPasswordReset = (data) => {
  return api.post("/password-reset/confirm", data);
};
