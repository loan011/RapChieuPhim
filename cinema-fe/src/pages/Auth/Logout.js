import { useNavigate } from "react-router-dom";



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
    "Customer"
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

    navigate("/login", {
      replace: true,
    });
  }

  return {
    userEmail,
    handleLogout,
  };
}