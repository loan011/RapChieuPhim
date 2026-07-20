import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { changePassword } from "../Admin/User/userService";
import { loginApi } from "../../services/authService";
import "../../styles/Login.css";

function ChangePassword() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username.trim()) {
      setError("Vui lòng nhập Email!");
      return;
    }

    if (!currentPassword) {
      setError("Vui lòng nhập Mật khẩu cũ!");
      return;
    }

    if (!newPassword) {
      setError("Vui lòng nhập Mật khẩu mới!");
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải từ 6 ký tự trở lên!");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới và Nhập lại mật khẩu mới không khớp!");
      return;
    }

    try {
      setLoading(true);

      // 1. Try to login if token is missing
      let token = localStorage.getItem("token");
      if (!token) {
        try {
          const loginData = await loginApi(username.trim(), currentPassword);
          token = loginData?.token || loginData?.Token;
          if (token) {
            localStorage.setItem("token", token);
          }
        } catch (loginErr) {
          throw new Error("Tên đăng nhập hoặc mật khẩu cũ không đúng!");
        }
      }

      // 2. Call changePassword API
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setSuccess("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error("ChangePassword error:", err);
      setError(err.message || "Đổi mật khẩu thất bại. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <Link to="/login" className="back-home-btn" title="Về trang đăng nhập">
        🏠
      </Link>

      <div className="auth-box-page" style={{ maxWidth: "480px" }}>
        <div className="auth-tabs">
          <Link to="/login">ĐĂNG NHẬP</Link>
          <Link to="/register">ĐĂNG KÝ</Link>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div style={{ textAlign: "center", marginBottom: "12px" }}>
            <h2 style={{ color: "#df0a5d", fontSize: "22px", fontWeight: "800", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "1px" }}>
              ĐỔI MẬT KHẨU
            </h2>
          </div>

          {error && <div style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", textTransform: "none" }}>⚠️ {error}</div>}
          {success && <div style={{ color: "#10b981", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", textTransform: "none" }}>✅ {success}</div>}

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "rgba(255, 255, 255, 0.85)" }}>
              Email
            </label>
            <input
              type="email"
              placeholder="Email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "rgba(255, 255, 255, 0.85)" }}>
              Mật khẩu cũ
            </label>
            <input
              type="password"
              placeholder="Nhập mật khẩu hiện tại"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "rgba(255, 255, 255, 0.85)" }}>
              Mật khẩu mới
            </label>
            <input
              type="password"
              placeholder="Nhập mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "rgba(255, 255, 255, 0.85)" }}>
              Nhập lại mật khẩu mới
            </label>
            <input
              type="password"
              placeholder="Xác nhận lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button className="blue-btn" type="submit" disabled={loading} style={{ marginTop: "10px" }}>
            {loading ? "ĐANG CẬP NHẬT..." : "CẬP NHẬT"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;
