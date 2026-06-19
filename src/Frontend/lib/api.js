const API_BASE_URL = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:1234");

export async function apiRequest(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = {
        message: response.ok
          ? "The server returned an unexpected response."
          : `Request failed with status ${response.status}.`,
      };
    }
  }

  

  if (!response.ok) {
    const detail = data.detail ? ` ${data.detail}` : "";
    throw new Error(`${data.message || "Request failed."}${detail}`);
  }

  return data;
}

export { API_BASE_URL };
