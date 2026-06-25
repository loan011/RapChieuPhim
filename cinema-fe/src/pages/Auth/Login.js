import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginApi, saveAuthData } from "../../services/authService";

export const LOGIN_TEXT = {
  routes: {
    home: "/",
    register: "/register",
    forgotPassword: "/forgot-password",

    admin: "/admin",
    staff: "/staff",
    customer: "/movies",
    default: "/movies",
  },

  icons: {
    home: "🏠",
  },

  tabs: {
    login: "ĐĂNG NHẬP",
    register: "ĐĂNG KÝ",
  },

  fields: {
    email: {
      label: "Email",
      placeholder: "Email",
    },

    password: {
      label: "Mật khẩu",
      placeholder: "Mật khẩu",
    },
  },

  links: {
    forgotPassword: "Quên mật khẩu?",
  },

  buttons: {
    login: "ĐĂNG NHẬP BẰNG TÀI KHOẢN",
    loggingIn: "ĐANG ĐĂNG NHẬP...",
    googleLogin: "ĐĂNG NHẬP BẰNG GOOGLE",
  },

  titles: {
    backHome: "Về trang chủ",
    showPassword: "Hiện mật khẩu",
    hidePassword: "Ẩn mật khẩu",
  },

  messages: {
    emailRequired: "Vui lòng nhập email!",
    passwordRequired: "Vui lòng nhập mật khẩu!",
    emailInvalid: "Email không đúng định dạng!",
    serverError:
      "Không kết nối được tới server. Vui lòng kiểm tra API đã chạy chưa.",
    googleNotReady: "Chức năng đăng nhập Google chưa được cấu hình!",
  },
};

export function useLogin() {
  const navigate = useNavigate();
  const T = LOGIN_TEXT;

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
      data?.User?.role ||
      data?.User?.Role ||
      localStorage.getItem("role") ||
      "";

    return String(role).trim().toLowerCase();
  }

  function validateLoginForm() {
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setError(T.messages.emailRequired);
      return false;
    }

    if (!cleanPassword) {
      setError(T.messages.passwordRequired);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      setError(T.messages.emailInvalid);
      return false;
    }

    return true;
  }

  function navigateByRole(role) {
    if (role === "admin") {
      navigate(T.routes.admin, { replace: true });
      return;
    }

    if (role === "staff") {
      navigate(T.routes.staff, { replace: true });
      return;
    }

    if (role === "customer") {
      navigate(T.routes.customer, { replace: true });
      return;
    }

    navigate(T.routes.default, { replace: true });
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

      setError(err?.message || T.messages.serverError);
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    alert(T.messages.googleNotReady);
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