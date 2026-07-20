const API_URL = import.meta.env.VITE_API_URL;

async function readResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { message: text };
  }
}

function getErrorMessage(data, defaultMessage) {
  return (
    data?.message ||
    data?.Message ||
    data?.error ||
    data?.Error ||
    defaultMessage
  );
}

export async function loginApi(email, password) {
  const response = await fetch(`${API_URL}/Auth/Login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Đăng nhập thất bại!"));
  }

  return data;
}

export async function registerApi(user) {
  const response = await fetch(`${API_URL}/Auth/Register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Đăng ký thất bại!"));
  }

  return data;
}

export async function forgotPasswordApi(email) {
  const response = await fetch(`${API_URL}/Auth/ForgotPassword`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
    }),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Gửi mã xác nhận thất bại!"));
  }

  return data;
}

export async function verifyResetCodeApi({ email, otpCode }) {
  const response = await fetch(`${API_URL}/Auth/VerifyResetCode`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      otpCode,
    }),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Mã xác nhận không đúng!"));
  }

  return data;
}

export async function resetPasswordApi(payload) {
  const response = await fetch(`${API_URL}/Auth/ResetPassword`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Đổi mật khẩu thất bại!"));
  }

  return data;
}

export function saveAuthData(data) {
  const token = data?.token || data?.Token || "";
  const tokenType = data?.tokenType || data?.TokenType || "Bearer";
  const expiresAt = data?.expiresAt || data?.ExpiresAt || "";
  const user = data?.user || data?.User || {};
  const userEmail = user?.email || user?.Email || "";

  const cleanEmail = String(userEmail).trim().toLowerCase();
  const emailAvatarKey = cleanEmail ? `user_avatar_${cleanEmail}` : null;
  const savedEmailAvatar = emailAvatarKey ? localStorage.getItem(emailAvatarKey) : null;

  const backendAvatar = user?.avatarUrl || user?.AvatarUrl;
  const isValid = (url) => url && typeof url === "string" && url.trim() !== "" && url.toLowerCase() !== "string" && url.toLowerCase() !== "null";

  const finalAvatar = isValid(backendAvatar)
    ? backendAvatar
    : isValid(savedEmailAvatar)
    ? savedEmailAvatar
    : null;

  if (finalAvatar) {
    user.avatarUrl = finalAvatar;
    localStorage.setItem("avatarUrl", finalAvatar);
    if (emailAvatarKey) {
      localStorage.setItem(emailAvatarKey, finalAvatar);
    }
  }

  localStorage.setItem("token", token);
  localStorage.setItem("tokenType", tokenType);
  localStorage.setItem("expiresAt", expiresAt);
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("userEmail", userEmail);
  localStorage.setItem("role", user?.role || user?.Role || "");
}

export function getToken() {
  return localStorage.getItem("token");
}

export function getTokenType() {
  return localStorage.getItem("tokenType") || "Bearer";
}

export function getRole() {
  return localStorage.getItem("role");
}

export function getUserEmail() {
  return localStorage.getItem("userEmail");
}

export function getUser() {
  const user = localStorage.getItem("user");

  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!getToken();
}

export function getAuthHeader() {
  const token = getToken();
  const tokenType = getTokenType();

  if (!token) return {};

  return {
    Authorization: `${tokenType} ${token}`,
  };
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("tokenType");
  localStorage.removeItem("expiresAt");
  localStorage.removeItem("user");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("role");
}