import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { loginApi, loginGoogleApi, registerWithGoogleApi, saveAuthData } from "../../services/authService";

export function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Modal cho hoàn tất đăng ký với Google nếu là tài khoản mới
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleProfile, setGoogleProfile] = useState(null);
  const [googleForm, setGoogleForm] = useState({
    fullName: "",
    phone: "",
    dateOfBirth: "",
    gender: "Nam",
  });

  useEffect(() => {
    if (location.state?.googleToken) {
      setGoogleProfile({
        idToken: location.state.googleToken,
        email: location.state.email,
        fullName: location.state.fullName,
      });
      setGoogleForm((prev) => ({
        ...prev,
        fullName: location.state.fullName || "",
      }));
      setShowGoogleModal(true);
    }
  }, [location.state]);

  function toggleShowPassword() {
    setShowPassword((prev) => !prev);
  }

  function getRole(data) {
    const role =
      data?.role ||
      data?.Role ||
      data?.user?.role ||
      data?.user?.Role ||
      data?.User?.Role ||
      localStorage.getItem("role") ||
      "";

    return String(role).trim().toLowerCase();
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

    navigate("/", { replace: true });
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

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError("");
      setLoading(true);
      try {
        const token = tokenResponse.access_token || tokenResponse.credential;
        const res = await loginGoogleApi(token);

        if (res?.needsAdditionalInfo) {
          setGoogleProfile({
            idToken: token,
            email: res.email,
            fullName: res.fullName,
            avatarUrl: res.avatarUrl,
          });
          setGoogleForm((prev) => ({
            ...prev,
            fullName: res.fullName || "",
          }));
          setShowGoogleModal(true);
          return;
        }

        saveAuthData(res);
        const role = getRole(res);
        navigateByRole(role);
      } catch (err) {
        console.error("Google login error:", err);
        setError(err?.message || "Đăng nhập Google thất bại!");
      } finally {
        setLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.error("Google OAuth error:", errorResponse);
      setError("Đăng nhập bằng Google bị hủy hoặc thất bại.");
    },
  });

  async function handleGoogleRegisterSubmit(e) {
    e.preventDefault();
    setError("");

    if (!googleForm.phone.trim() || !/^[0-9]{10}$/.test(googleForm.phone.trim())) {
      setError("Số điện thoại phải gồm đúng 10 chữ số!");
      return;
    }
    if (!googleForm.dateOfBirth) {
      setError("Vui lòng chọn ngày sinh!");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        idToken: googleProfile.idToken,
        fullName: googleForm.fullName.trim() || googleProfile.fullName,
        phone: googleForm.phone.trim(),
        dateOfBirth: googleForm.dateOfBirth,
        gender: googleForm.gender,
      };

      const res = await registerWithGoogleApi(payload);
      saveAuthData(res);
      setShowGoogleModal(false);
      const role = getRole(res);
      navigateByRole(role);
    } catch (err) {
      console.error("Google register completion error:", err);
      setError(err?.message || "Hoàn tất thông tin thất bại!");
    } finally {
      setLoading(false);
    }
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
    handleGoogleLogin: triggerGoogleLogin,

    showGoogleModal,
    setShowGoogleModal,
    googleProfile,
    googleForm,
    setGoogleForm,
    handleGoogleRegisterSubmit,
  };
}