const authTokenKey = "avaruus:auth-token";

function readAuthToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(authTokenKey) ?? window.sessionStorage.getItem(authTokenKey);
}

function storeAuthToken(token: string, remember: boolean) {
  clearAuthToken();
  const storage = remember ? window.localStorage : window.sessionStorage;
  storage.setItem(authTokenKey, token);
}

function clearAuthToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(authTokenKey);
  window.sessionStorage.removeItem(authTokenKey);
}

export { clearAuthToken, readAuthToken, storeAuthToken };
