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
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith("apicache_")) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {}
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(urlPattern)) {
      memoryCache.delete(key);
    }
  }
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith("apicache_") && key.includes(urlPattern)) {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {}
}

export async function cachedFetch(url, options = {}, ttlMs = 300000) {
  const method = (options.method || "GET").toUpperCase();
  if (method !== "GET") {
    // Invalidate cache on mutations
    clearApiCache();
    const response = await fetch(url, options);
    return readResponse(response);
  }

  const cacheKey = url;
  const now = Date.now();
  let cachedData = null;
  let cachedTime = 0;

  const inMem = memoryCache.get(cacheKey);
  if (inMem && inMem.data) {
    cachedData = inMem.data;
    cachedTime = inMem.timestamp;
  } else {
    const lsKey = "apicache_" + url;
    try {
      const lsItem = localStorage.getItem(lsKey);
      if (lsItem) {
        const parsed = JSON.parse(lsItem);
        if (parsed && parsed.data) {
          cachedData = parsed.data;
          cachedTime = parsed.timestamp || 0;
          memoryCache.set(cacheKey, { timestamp: cachedTime, data: cachedData });
        }
      }
    } catch (e) {}
  }

  const isStale = now - cachedTime > ttlMs;

  const triggerFetch = () => {
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }
    const lsKey = "apicache_" + url;
    const fetchPromise = (async () => {
      try {
        const response = await fetch(url, {
          headers: getAuthHeaders(),
          ...options,
        });
        const data = await readResponse(response);
        const timestamp = Date.now();
        memoryCache.set(cacheKey, { timestamp, data });
        try {
          localStorage.setItem(lsKey, JSON.stringify({ timestamp, data }));
        } catch (e) {}
        return data;
      } finally {
        pendingRequests.delete(cacheKey);
      }
    })();

    pendingRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  };

  if (cachedData !== null) {
    if (isStale) {
      // Revalidate in background without blocking rendering
      triggerFetch().catch(() => {});
    }
    return cachedData;
  }

  return await triggerFetch();
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
