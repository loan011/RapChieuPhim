import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  forgotPasswordApi,
  verifyResetCodeApi,
  resetPasswordApi,
} from "../../services/authService";

export const FORGOT_PASSWORD_TEXT = {
  routes: {
    login: "/login",
  },

  title: "QUÊN MẬT KHẨU",

  links: {
    backToLogin: "← Quay lại đăng nhập",
  },

  fields: {
    email: {
      label: "Email",
      placeholder: "Nhập email",
    },

    code: {
      label: "Mã xác nhận",
      placeholder: "Nhập mã từ Gmail",
    },

    newPassword: {
      label: "Mật khẩu mới",
      placeholder: "Mật khẩu mới",
    },

    confirmPassword: {
      label: "Xác nhận mật khẩu",
      placeholder: "Xác nhận mật khẩu",
    },
  },

  buttons: {
    sendCode: "GỬI MÃ XÁC NHẬN",
    sendingCode: "ĐANG GỬI...",
    verifyCode: "XÁC NHẬN MÃ",
    verifyingCode: "ĐANG XÁC NHẬN...",
    resendCode: "GỬI LẠI MÃ",
    changeEmail: "ĐỔI EMAIL",
    resetPassword: "ĐỔI MẬT KHẨU",
    resetting: "ĐANG ĐỔI...",
  },

  messages: {
    emailRequired: "Vui lòng nhập email trước!",
    codeRequired: "Vui lòng nhập mã xác nhận!",
    newPasswordRequired: "Vui lòng nhập mật khẩu mới!",
    passwordMinLength: "Mật khẩu phải từ 6 ký tự trở lên!",
    passwordNotMatch: "Mật khẩu xác nhận không khớp!",

    sendCodeSuccess: "Mã xác nhận đã được gửi về Gmail!",
    verifyCodeSuccess: "Xác nhận mã thành công!",
    resetPasswordSuccess: "Đổi mật khẩu thành công!",

    serverError: "Không kết nối được tới server!",
    codeInvalid: "Mã xác nhận không đúng!",
    resetPasswordFailed: "Đổi mật khẩu thất bại!",
  },
};

export function useForgotPassword() {
  const navigate = useNavigate();
  const T = FORGOT_PASSWORD_TEXT;

  const [email, setEmail] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [step, setStep] = useState("email");

  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [resetting, setResetting] = useState(false);

  function getApiMessage(data, fallback) {
    return data?.message || data?.Message || fallback;
  }

  function validateEmail() {
    if (!email.trim()) {
      alert(T.messages.emailRequired);
      return false;
    }

    return true;
  }

  function validateCode() {
    if (!codeInput.trim()) {
      alert(T.messages.codeRequired);
      return false;
    }

    return true;
  }

  function validatePassword() {
    if (!newPassword.trim()) {
      alert(T.messages.newPasswordRequired);
      return false;
    }

    if (newPassword.length < 6) {
      alert(T.messages.passwordMinLength);
      return false;
    }

    if (newPassword !== confirmPassword) {
      alert(T.messages.passwordNotMatch);
      return false;
    }

    return true;
  }

  async function sendCode() {
    if (!validateEmail()) return;

    try {
      setSendingCode(true);

      const data = await forgotPasswordApi(email.trim());

      alert(getApiMessage(data, T.messages.sendCodeSuccess));

      setCodeInput("");
      setStep("code");
    } catch (error) {
      console.error("ForgotPassword error:", error);
      alert(error.message || T.messages.serverError);
    } finally {
      setSendingCode(false);
    }
  }

  async function verifyCode() {
    if (!validateEmail()) return;
    if (!validateCode()) return;

    try {
      setVerifyingCode(true);

      const data = await verifyResetCodeApi({
        email: email.trim(),
        otpCode: codeInput.trim(),
      });

      alert(getApiMessage(data, T.messages.verifyCodeSuccess));

      setStep("password");
    } catch (error) {
      console.error("VerifyResetCode error:", error);
      alert(error.message || T.messages.codeInvalid);
    } finally {
      setVerifyingCode(false);
    }
  }

  async function resetPassword() {
    if (!validateEmail()) return;
    if (!validateCode()) return;
    if (!validatePassword()) return;

    try {
      setResetting(true);

      const data = await resetPasswordApi({
        email: email.trim(),
        otpCode: codeInput.trim(),
        newPassword,
        confirmPassword,
      });

      alert(getApiMessage(data, T.messages.resetPasswordSuccess));

      navigate(T.routes.login);
    } catch (error) {
      console.error("ResetPassword error:", error);
      alert(error.message || T.messages.resetPasswordFailed);
    } finally {
      setResetting(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (step === "email") {
      sendCode();
      return;
    }

    if (step === "code") {
      verifyCode();
      return;
    }

    if (step === "password") {
      resetPassword();
    }
  }

  function backToEmailStep() {
    setStep("email");
    setCodeInput("");
  }

  return {
    email,
    setEmail,

    codeInput,
    setCodeInput,

    newPassword,
    setNewPassword,

    confirmPassword,
    setConfirmPassword,

    step,
    sendingCode,
    verifyingCode,
    resetting,

    handleSubmit,
    sendCode,
    verifyCode,
    resetPassword,
    backToEmailStep,
  };
}