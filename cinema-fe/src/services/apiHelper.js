const API_URL = import.meta.env.VITE_API_URL;

export function getApiUrl() {
  return API_URL;
}

/**
 * Khi server trả về 401 (token hết hạn hoặc không hợp lệ),
 * tự động xóa token và chuyển về trang đăng nhập.
 */
function handle401() {
  localStorage.removeItem("token");
  localStorage.removeItem("tokenType");
  localStorage.removeItem("expiresAt");
  localStorage.removeItem("user");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("role");

  // Chỉ redirect nếu chưa ở trang login
  if (!window.location.pathname.includes("/login")) {
    window.location.href = "/login";
  }
}

export async function readResponse(response) {
  // Xử lý 401 trước khi đọc body
  if (response.status === 401) {
    handle401();
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }

  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { message: text };
  }
}

export function getErrorMessage(data, defaultMessage) {
  // Nếu data là chuỗi thần thôi
  if (typeof data === "string" && data.length > 0) return data;
  // ASP.NET Core validation errors (ProblemDetails)
  if (data?.errors) {
    const msgs = Object.values(data.errors).flat();
    if (msgs.length > 0) return msgs.join(" ");
  }
  return (
    data?.message ||
    data?.Message ||
    data?.title ||
    data?.Title ||
    data?.error ||
    data?.Error ||
    data?.detail ||
    data?.Detail ||
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
