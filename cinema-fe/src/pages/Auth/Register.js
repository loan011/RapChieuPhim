import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { registerApi } from "../../services/authService";

export const REGISTER_TEXT = {
  routes: {
    home: "/",
    login: "/login",
  },

  icons: {
    home: "🏠",
  },

  tabs: {
    login: "ĐĂNG NHẬP",
    register: "ĐĂNG KÝ",
  },

  titles: {
    backHome: "Về trang chủ",
  },

  fields: {
    name: {
      label: "* Họ tên",
      placeholder: "Họ tên",
    },

    email: {
      label: "* Email",
      placeholder: "Email",
    },

    password: {
      label: "* Mật khẩu",
      placeholder: "Mật khẩu",
    },

    confirmPassword: {
      label: "* Xác nhận lại mật khẩu",
      placeholder: "Xác nhận lại mật khẩu",
    },

    birthday: {
      label: "* Ngày sinh",
    },

    phone: {
      label: "* Số điện thoại",
      placeholder: "Số điện thoại",
    },

    gender: {
      label: "Giới tính",
    },
  },

  genderOptions: [
    {
      value: "Giới tính",
      label: "Giới tính",
    },
    {
      value: "Nam",
      label: "Nam",
    },
    {
      value: "Nữ",
      label: "Nữ",
    },
    {
      value: "Khác",
      label: "Khác",
    },
  ],

  policy: "Tôi cam kết tuân theo chính sách bảo mật và điều khoản sử dụng.",

  buttons: {
    register: "ĐĂNG KÝ",
    registering: "ĐANG ĐĂNG KÝ...",
    googleRegister: "TIẾP TỤC VỚI GOOGLE",
  },

  roleName: "Customer",

  messages: {
    nameRequired: "Vui lòng nhập họ tên!",
    emailRequired: "Vui lòng nhập email!",
    emailInvalid: "Email không đúng định dạng!",
    passwordRequired: "Vui lòng nhập mật khẩu!",
    passwordMinLength: "Mật khẩu phải có ít nhất 6 ký tự!",
    confirmPasswordNotMatch: "Mật khẩu xác nhận không khớp!",
    birthdayRequired: "Vui lòng nhập ngày sinh!",
    phoneInvalid: "Số điện thoại phải gồm đúng 10 chữ số!",
    genderRequired: "Vui lòng chọn giới tính!",
    policyRequired: "Bạn phải đồng ý với điều khoản sử dụng!",
    registerSuccess: "Đăng ký thành công!",
    serverError:
      "Không kết nối được tới server. Vui lòng kiểm tra API đã chạy chưa.",
    googleNotReady: "Chức năng đăng ký Google chưa được cấu hình!",
  },
};

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
  const T = REGISTER_TEXT;

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
      setError(T.messages.nameRequired);
      return false;
    }

    if (!email) {
      setError(T.messages.emailRequired);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setError(T.messages.emailInvalid);
      return false;
    }

    if (!password) {
      setError(T.messages.passwordRequired);
      return false;
    }

    if (password.length < 6) {
      setError(T.messages.passwordMinLength);
      return false;
    }

    if (password !== confirmPassword) {
      setError(T.messages.confirmPasswordNotMatch);
      return false;
    }

    if (!birthday) {
      setError(T.messages.birthdayRequired);
      return false;
    }

    const phoneRegex = /^[0-9]{10}$/;

    if (!phoneRegex.test(phone)) {
      setError(T.messages.phoneInvalid);
      return false;
    }

    if (gender === "Giới tính") {
      setError(T.messages.genderRequired);
      return false;
    }

    if (!policy) {
      setError(T.messages.policyRequired);
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
      roleName: T.roleName,
    };
  }

  async function handleRegister(e) {
    e.preventDefault();

    setError("");

    if (!validateRegisterForm()) return;

    try {
      setLoading(true);

      const data = await registerApi(buildRegisterPayload());

      alert(getApiMessage(data, T.messages.registerSuccess));

      navigate(T.routes.login);
    } catch (err) {
      console.error("Register error:", err);

      setError(err?.message || T.messages.serverError);
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleRegister() {
    alert(T.messages.googleNotReady);
  }

  return {
    form,
    error,
    loading,

    handleChange,
    handleCheckboxChange,
    handleRegister,
    handleGoogleRegister,
  };
}