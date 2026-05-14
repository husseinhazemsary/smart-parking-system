const BASE_URL = "http://localhost:8081";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Dispatched when the backend returns 401 so AppShell can force-logout.
export function dispatchAuthExpired() {
  window.dispatchEvent(new CustomEvent("auth:expired"));
}

export default async function apiFetch(path, options = {}) {
  const { method = "GET", headers = {}, body } = options;
  const init = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...headers,
    },
  };

  if (body !== undefined) init.body = body;

  const res = await fetch(`${BASE_URL}${path}`, init);

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Try every field shape backends typically use
    const message =
      data?.detail ||
      data?.message ||
      data?.error ||
      data?.errors?.join(", ") ||
      res.statusText ||
      "Request failed";

    // Automatically signal session expiry so the UI can show the login modal
    if (res.status === 401) dispatchAuthExpired();

    throw new Error(message);
  }

  return data;
}
