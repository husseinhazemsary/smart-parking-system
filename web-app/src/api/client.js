const BASE_URL = "http://localhost:8081";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function dispatchAuthExpired() {
  window.dispatchEvent(new CustomEvent("auth:expired"));
}

// Single in-flight refresh promise shared across concurrent 401s
let _refreshing = null;

async function tryRefresh() {
  if (_refreshing) return _refreshing;
  const rt = localStorage.getItem("refreshToken");
  if (!rt) return false;
  _refreshing = fetch(`${BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: rt }),
  })
    .then(async r => {
      if (!r.ok) return false;
      const d = await r.json().catch(() => null);
      if (!d?.accessToken) return false;
      localStorage.setItem("token", d.accessToken);
      if (d.refreshToken) localStorage.setItem("refreshToken", d.refreshToken);
      return true;
    })
    .catch(() => false)
    .finally(() => { _refreshing = null; });
  return _refreshing;
}

export default async function apiFetch(path, options = {}, _retry = false) {
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
    if (res.status === 401 && !_retry) {
      const hadToken = !!localStorage.getItem("token");
      if (hadToken) {
        const refreshed = await tryRefresh();
        if (refreshed) return apiFetch(path, options, true);
        dispatchAuthExpired();
      }
    }
    const message =
      data?.detail ||
      data?.message ||
      data?.error ||
      data?.errors?.join(", ") ||
      res.statusText ||
      "Request failed";
    throw new Error(message);
  }

  return data;
}
