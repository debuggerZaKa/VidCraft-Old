const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const readErrorMessage = async (response) => {
  const raw = await response.text();
  if (!raw) return `Request failed (${response.status})`;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.message) return parsed.message;
    if (typeof parsed?.detail === "string") return parsed.detail;
  } catch {
    // keep raw
  }
  return raw;
};

const postAuth = async (path, body) => {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(`Cannot reach VidCraft API at ${API_BASE}. Make sure the server is running.`);
  }
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return response.json();
};

export const registerRequest = ({ name, email, password }) =>
  postAuth("/api/auth/register", { name, email, password });

export const loginRequest = ({ email, password }) =>
  postAuth("/api/auth/login", { email, password });

export const fetchMe = async (token) => {
  let response;
  try {
    response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error(`Cannot reach VidCraft API at ${API_BASE}.`);
  }
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return response.json();
};
