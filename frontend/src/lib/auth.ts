const AUTH_TOKEN_KEY = "authToken";

export const saveAuthToken = (token: string) => {
  if (typeof window !== "undefined") {
    // Перевірка для Next.js (бо localStorage тільки в браузері)
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
};

export const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return null;
};

export const removeAuthToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
};
