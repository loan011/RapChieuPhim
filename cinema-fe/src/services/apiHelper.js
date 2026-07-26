const API_URL = import.meta.env.VITE_API_URL || "https://localhost:7013/api";

export function getApiUrl() {
  if (typeof window !== "undefined" && window.location.hostname && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return API_URL.replace("localhost", window.location.hostname).replace("127.0.0.1", window.location.hostname);
  }
  return API_URL;
}

/**
 * In-memory cache manager for GET requests with TTL & promise deduplication
 */
const memoryCache = new Map();
const pendingRequests = new Map();

export function clearApiCache(urlPattern = null) {
  if (!urlPattern) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(urlPattern)) {
      memoryCache.delete(key);
    }
  }
}

export async function cachedFetch(url, options = {}, ttlMs = 60000) {
  const method = (options.method || "GET").toUpperCase();
  if (method !== "GET") {
    // Invalidate cache on mutations
    clearApiCache();
    const response = await fetch(url, options);
    return readResponse(response);
  }

  const cacheKey = url;
  const now = Date.now();
  const cached = memoryCache.get(cacheKey);

  if (cached && now - cached.timestamp < ttlMs) {
    return cached.data;
  }

  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(url, {
        headers: getAuthHeaders(),
        ...options,
      });
      const data = await readResponse(response);
      memoryCache.set(cacheKey, { timestamp: Date.now(), data });
      return data;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
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
