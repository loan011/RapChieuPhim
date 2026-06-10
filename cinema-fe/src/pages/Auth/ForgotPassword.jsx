import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/ForgotPassword.css";
import {
  forgotPasswordApi,
  resetPasswordApi,
} from "../../services/authService";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [sendingCode, setSendingCode] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function sendCode() {
    if (!email.trim()) {
      alert("Vui lòng nhập email trước!");
      return;
    }

    try {
      setSendingCode(true);

      const data = await forgotPasswordApi(email.trim());

      alert(data?.message || data?.Message || "Mã xác nhận đã được gửi về Gmail!");
    } catch (error) {
      console.error("ForgotPassword error:", error);
      alert(error.message || "Không kết nối được tới server!");
    } finally {
      setSendingCode(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();

    if (!email.trim()) return alert("Vui lòng nhập email!");
    if (!codeInput.trim()) return alert("Vui lòng nhập mã xác nhận!");
    if (!newPassword.trim()) return alert("Vui lòng nhập mật khẩu mới!");
    if (newPassword.length < 6) return alert("Mật khẩu phải từ 6 ký tự trở lên!");
    if (newPassword !== confirmPassword) return alert("Mật khẩu xác nhận không khớp!");

    try {
      setResetting(true);

      const data = await resetPasswordApi({
        email: email.trim(),
        otpCode: codeInput.trim(),
        newPassword,
        confirmPassword,
      });

      alert(data?.message || data?.Message || "Đổi mật khẩu thành công!");
      navigate("/login");
    } catch (error) {
      console.error("ResetPassword error:", error);
      alert(error.message || "Không kết nối được tới server!");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="forgot-page">
      <Link to="/login" className="forgot-back-home">
        ← Quay lại đăng nhập
      </Link>

      <form className="forgot-box" onSubmit={handleReset}>
        <h2>QUÊN MẬT KHẨU</h2>

        <div className="forgot-field">
          <label>Email</label>
          <input
            type="email"
            placeholder="Nhập email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <button
          type="button"
          className="forgot-btn"
          onClick={sendCode}
          disabled={sendingCode}
        >
          {sendingCode ? "ĐANG GỬI..." : "GỬI MÃ XÁC NHẬN"}
        </button>

        <div className="forgot-field">
          <label>Mã xác nhận</label>
          <input
            type="text"
            placeholder="Nhập mã từ Gmail"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            required
          />
        </div>

        <div className="forgot-field">
          <label>Mật khẩu mới</label>
          <input
            type="password"
            placeholder="Mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        <div className="forgot-field">
          <label>Xác nhận mật khẩu</label>
          <input
            type="password"
            placeholder="Xác nhận mật khẩu"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button className="forgot-btn" type="submit" disabled={resetting}>
          {resetting ? "ĐANG ĐỔI..." : "ĐỔI MẬT KHẨU"}
        </button>
      </form>
    </div>
  );
}

export default ForgotPassword;