import { useNavigate } from "react-router-dom";

export const LOGOUT_TEXT = {
  greeting: "Xin chào",

  button: {
    logout: "Logout",
  },

  routes: {
    login: "/login",
  },

  fallbackUser: "Customer",
};

export const LOGOUT_STORAGE_KEYS = [
  "token",
  "tokenType",
  "expiresAt",
  "user",
  "userEmail",
  "role",
  "email",
  "fullName",
  "avatarUrl",
];

export function getLogoutUserEmail() {
  return (
    localStorage.getItem("userEmail") ||
    localStorage.getItem("email") ||
    LOGOUT_TEXT.fallbackUser
  );
}

export function clearAuthStorage() {
  LOGOUT_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });
}

export function useLogout() {
  const navigate = useNavigate();

  const userEmail = getLogoutUserEmail();

  function handleLogout() {
    clearAuthStorage();

    navigate(LOGOUT_TEXT.routes.login, {
      replace: true,
    });
  }

  return {
    userEmail,
    handleLogout,
  };
}