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
    ],
    payload
  );

  return data?.data || data?.result || data;
}

export async function checkPaymentStatus(bookingId) {
  try {
    const response = await fetch(`${API_URL}/Payments/Status/${bookingId}`, {
      headers: getAuthHeaders(),
    });
    if (response.ok) {
      const data = await readResponse(response);
      return data?.isPaid || data?.IsPaid || false;
    }
  } catch (e) {
    console.error("Lỗi kiểm tra trạng thái thanh toán:", e);
  }
  return false;
}

export async function updatePaymentStatus(paymentId, status, notes = "") {
  const response = await fetch(`${API_URL}/Payments/${paymentId}/Status`, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status, notes }),
  });
  const data = await readResponse(response);
  if (!response.ok) {
    throw new Error(getErrorMessage?.(data) || "Cập nhật trạng thái thanh toán thất bại!");
  }
  return data;
}