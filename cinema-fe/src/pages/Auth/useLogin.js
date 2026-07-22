import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginApi, saveAuthData } from "../../services/authService";



export function useLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function toggleShowPassword() {
    setShowPassword((prev) => !prev);
  }

  function getRole(data) {
    const role =
      data?.role ||
      data?.Role ||
      data?.user?.role ||
      data?.user?.Role ||
      data?.user?.role ||
      data?.User?.Role ||
      localStorage.getItem("role") ||
      "";

    return String(role).trim().toLowerCase();
  }

  function validateLoginForm() {
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setError("Vui lòng nhập email!");
      return false;
    }

    if (!cleanPassword) {
      setError("Vui lòng nhập mật khẩu!");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      setError("Email không đúng định dạng!");
      return false;
    }

    return true;
  }

  function navigateByRole(role) {
    if (role === "admin") {
      navigate("/admin", { replace: true });
      return;
    }

    if (role === "staff") {
      navigate("/staff", { replace: true });
      return;
    }

    if (role === "customer") {
      navigate("/", { replace: true });
      return;
    }

    navigate("/", { replace: true });
  }

  async function handleLogin(e) {
    e.preventDefault();

    setError("");

    if (!validateLoginForm()) return;

    try {
      setLoading(true);

      const data = await loginApi(email.trim(), password.trim());

      saveAuthData(data);

      const role = getRole(data);

      console.log("LOGIN DATA:", data);
      console.log("LOGIN ROLE:", role);

      navigateByRole(role);
    } catch (err) {
      console.error("Login error:", err);

      setError(err?.message || "Không kết nối được tới server. Vui lòng kiểm tra API đã chạy chưa.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    alert("Chức năng đăng nhập Google chưa được cấu hình!");
  }

  return {
    email,
    setEmail,

    password,
    setPassword,

    error,
    loading,
    showPassword,

    toggleShowPassword,
    handleLogin,
    handleGoogleLogin,
  };
}