const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const authHeaders = (token) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

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

export const fetchHistory = async (token) => {
  let response;
  try {
    response = await fetch(`${API_BASE}/api/history`, {
      headers: authHeaders(token),
    });
  } catch {
    throw new Error(`Cannot reach VidCraft API at ${API_BASE}.`);
  }
  if (!response.ok) throw new Error(await readErrorMessage(response));
  const data = await response.json();
  return data.history || [];
};

export const saveHistoryEntry = async (token, entry) => {
  let response;
  try {
    response = await fetch(`${API_BASE}/api/history`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(entry),
    });
  } catch {
    throw new Error(`Cannot reach VidCraft API at ${API_BASE}.`);
  }
  if (!response.ok) throw new Error(await readErrorMessage(response));
  const data = await response.json();
  return data.entry;
};

export const deleteHistoryEntry = async (token, id) => {
  let response;
  try {
    response = await fetch(`${API_BASE}/api/history/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
  } catch {
    throw new Error(`Cannot reach VidCraft API at ${API_BASE}.`);
  }
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return true;
};
