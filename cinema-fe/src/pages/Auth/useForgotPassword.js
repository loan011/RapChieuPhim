import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  forgotPasswordApi,
  verifyResetCodeApi,
  resetPasswordApi,
} from "../../services/authService";



export function useForgotPassword() {
  const navigate = useNavigate();

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
      alert("Vui lòng nhập email trước!");
      return false;
    }

    return true;
  }

  function validateCode() {
    if (!codeInput.trim()) {
      alert("Vui lòng nhập mã xác nhận!");
      return false;
    }

    return true;
  }

  function validatePassword() {
    if (!newPassword.trim()) {
      alert("Vui lòng nhập mật khẩu mới!");
      return false;
    }

    if (newPassword.length < 6) {
      alert("Mật khẩu phải từ 6 ký tự trở lên!");
      return false;
    }

    if (newPassword !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return false;
    }

    return true;
  }

  async function sendCode() {
    if (!validateEmail()) return;

    try {
      setSendingCode(true);

      const data = await forgotPasswordApi(email.trim());

      alert(getApiMessage(data, "Mã xác nhận đã được gửi về Gmail!"));

      setCodeInput("");
      setStep("code");
    } catch (error) {
      console.error("ForgotPassword error:", error);
      alert(error.message || "Không kết nối được tới server!");
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

      alert(getApiMessage(data, "Xác nhận mã thành công!"));

      setStep("password");
    } catch (error) {
      console.error("VerifyResetCode error:", error);
      alert(error.message || "Mã xác nhận không đúng!");
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

      alert(getApiMessage(data, "Đổi mật khẩu thành công!"));

      navigate("/login");
    } catch (error) {
      console.error("ResetPassword error:", error);
      alert(error.message || "Đổi mật khẩu thất bại!");
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