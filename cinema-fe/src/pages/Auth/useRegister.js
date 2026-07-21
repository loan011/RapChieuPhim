import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { registerApi, loginGoogleApi, registerWithGoogleApi, saveAuthData } from "../../services/authService";

const INITIAL_REGISTER_FORM = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  birthday: "",
  phone: "",
  gender: "Giới tính",
  policy: false,
};

export function useRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_REGISTER_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleCheckboxChange(e) {
    const { name, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: checked,
    }));
  }

  function getApiMessage(data, fallback) {
    return data?.message || data?.Message || fallback;
  }

  function validateRegisterForm() {
    const name = form.name.trim();
    const email = form.email.trim();
    const password = form.password.trim();
    const confirmPassword = form.confirmPassword.trim();
    const birthday = form.birthday.trim();
    const phone = form.phone.trim();
    const gender = form.gender;
    const policy = form.policy;

    if (!name) {
      setError("Vui lòng nhập họ tên!");
      return false;
    }

    if (!email) {
      setError("Vui lòng nhập email!");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setError("Email không đúng định dạng!");
      return false;
    }

    if (!password) {
      setError("Vui lòng nhập mật khẩu!");
      return false;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự!");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return false;
    }

    if (!birthday) {
      setError("Vui lòng nhập ngày sinh!");
      return false;
    }

    const phoneRegex = /^[0-9]{10}$/;

    if (!phoneRegex.test(phone)) {
      setError("Số điện thoại phải gồm đúng 10 chữ số!");
      return false;
    }

    if (gender === "Giới tính") {
      setError("Vui lòng chọn giới tính!");
      return false;
    }

    if (!policy) {
      setError("Bạn phải đồng ý với điều khoản sử dụng!");
      return false;
    }

    return true;
  }

  function buildRegisterPayload() {
    return {
      fullName: form.name.trim(),
      email: form.email.trim(),
      password: form.password.trim(),
      confirmPassword: form.confirmPassword.trim(),
      dateOfBirth: form.birthday.trim(),
      gender: form.gender,
      phone: form.phone.trim(),
      roleName: "Customer",
    };
  }

  async function handleRegister(e) {
    e.preventDefault();

    setError("");

    if (!validateRegisterForm()) return;

    try {
      setLoading(true);

      const data = await registerApi(buildRegisterPayload());

      alert(getApiMessage(data, "Đăng ký thành công!"));

      navigate("/login");
    } catch (err) {
      console.error("Register error:", err);

      setError(err?.message || "Không kết nối được tới server. Vui lòng kiểm tra API đã chạy chưa.");
    } finally {
      setLoading(false);
    }
  }

  const triggerGoogleRegister = useGoogleLogin({
    scope: "openid email profile",
    onSuccess: async (tokenResponse) => {
      setError("");
      setLoading(true);
      try {
        const token = tokenResponse.access_token || tokenResponse.credential;
        const res = await loginGoogleApi(token);

        if (res?.needsAdditionalInfo) {
          // Nếu chưa có tài khoản, chuyển hướng về Login với state mở Modal hoàn tất thông tin
          navigate("/login", { state: { googleToken: token, email: res.email, fullName: res.fullName } });
          return;
        }

        saveAuthData(res);
        navigate("/", { replace: true });
      } catch (err) {
        console.error("Google register error:", err);
        setError(err?.message || "Đăng ký Google thất bại!");
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError("Đăng ký bằng Google bị hủy hoặc thất bại.");
    },
  });

  return {
    form,
    error,
    loading,

    handleChange,
    handleCheckboxChange,
    handleRegister,
    handleGoogleRegister: triggerGoogleRegister,
  };
}