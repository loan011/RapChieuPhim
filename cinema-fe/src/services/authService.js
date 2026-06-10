const API_URL = import.meta.env.VITE_API_URL;

async function readResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { message: text };
  }
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
    throw new Error(
      data?.message || data?.Message || "Đăng nhập thất bại!"
    );
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
    throw new Error(
      data?.message || data?.Message || "Đăng ký thất bại!"
    );
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
    throw new Error(
      data?.message || data?.Message || "Gửi mã xác nhận thất bại!"
    );
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
    throw new Error(
      data?.message || data?.Message || "Đổi mật khẩu thất bại!"
    );
  }

  return data;
}

export function saveAuthData(data) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("tokenType", data.tokenType || "Bearer");
  localStorage.setItem("expiresAt", data.expiresAt || "");
  localStorage.setItem("user", JSON.stringify(data.user));
  localStorage.setItem("userEmail", data.user?.email || "");
  localStorage.setItem("role", data.user?.role || "");
}

export function getToken() {
  return localStorage.getItem("token");
}

export function getRole() {
  return localStorage.getItem("role");
}

export function getUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("tokenType");
  localStorage.removeItem("expiresAt");
  localStorage.removeItem("user");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("role");
}