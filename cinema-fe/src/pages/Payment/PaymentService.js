import {
  getApiUrl,
  readResponse,
  getErrorMessage,
  getAuthHeaders,
} from "../../services/apiHelper";

const API_URL = getApiUrl();

async function apiPost(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage?.(data) ||
        data?.message ||
        data?.title ||
        `Lỗi API status: ${response.status}`
    );
  }

  return data;
}

async function tryPost(urls, body) {
  let lastError = null;

  for (const url of urls) {
    try {
      return await apiPost(url, body);
    } catch (err) {
      lastError = err;
      console.warn("API POST lỗi:", url, err.message);

      if (
        err.message.includes("Phiên đăng nhập") ||
        err.message.includes("hết hạn")
      ) {
        throw err;
      }
    }
  }

  throw lastError || new Error("Không gọi được API");
}

export async function createPayment(payload) {
  const data = await tryPost(
    [
      `${API_URL}/Payments`,
      `${API_URL}/Payment`,
      `${API_URL}/api/Payments`,
      `${API_URL}/api/Payment`,
    ],
    payload
  );

  return data?.data || data?.result || data;
}