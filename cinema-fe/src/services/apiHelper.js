const API_URL = import.meta.env.VITE_API_URL;

export function getApiUrl() {
  return API_URL;
}

export async function readResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { message: text };
  }
}

export function getErrorMessage(data, defaultMessage) {
  return (
    data?.message ||
    data?.Message ||
    data?.error ||
    data?.Error ||
    defaultMessage
  );
}

export function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
