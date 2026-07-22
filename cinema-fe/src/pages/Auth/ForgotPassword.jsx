import { Link } from "react-router-dom";
import "../../styles/Login.css";
import "../../styles/ForgotPassword.css";

import { useForgotPassword } from "./useForgotPassword";

function ForgotPassword() {
  const {
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
    backToEmailStep,
  } = useForgotPassword();

  return (
    <div className="auth-page">
      <Link to="/login" className="back-home-btn" title="Về trang đăng nhập">
        🏠
      </Link>

      <div className="auth-box-page" style={{ maxWidth: "520px" }}>
        <div className="auth-tabs">
          <Link to="/login">ĐĂNG NHẬP</Link>
          <Link to="/register">ĐĂNG KÝ</Link>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div style={{ textAlign: "center", marginBottom: "8px" }}>
            <h2 style={{ color: "#df0a5d", fontSize: "20px", fontWeight: "800", margin: "0 0 6px" }}>
              {step === "email" && "🔑 ĐỔI MẬT KHẨU"}
              {step === "code" && "📧 XÁC NHẬN MÃ GMAIL"}
              {step === "password" && "🔒 ĐẶT MẬT KHẨU MỚI"}
            </h2>
            <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "13px", margin: 0 }}>
              {step === "email" && "Nhập địa chỉ Gmail để hệ thống gửi mã xác nhận đổi mật khẩu."}
              {step === "code" && `Hệ thống đã gửi mã xác nhận 6 chữ số tới ${email}`}
              {step === "password" && "Nhập mật khẩu mới từ 6 ký tự trở lên để hoàn tất."}
            </p>
          </div>

          {step === "email" && (
            <>
              <label>Email đã đăng ký</label>
              <input
                type="email"
                placeholder="Ví dụ: user@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <button className="blue-btn" type="submit" disabled={sendingCode}>
                {sendingCode ? "ĐANG GỬI MÃ VỀ GMAIL..." : "GỬI MÃ XÁC NHẬN VỀ GMAIL"}
              </button>
            </>
          )}

          {step === "code" && (
            <>
              <label>Mã xác nhận OTP (từ Gmail)</label>
              <input
                type="text"
                placeholder="Nhập mã xác nhận..."
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                required
              />

              <button className="blue-btn" type="submit" disabled={verifyingCode}>
                {verifyingCode ? "ĐANG XÁC NHẬN..." : "XÁC NHẬN MÃ OTP"}
              </button>

              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <button
                  type="button"
                  className="pink-btn"
                  style={{ flex: 1 }}
                  onClick={sendCode}
                  disabled={sendingCode}
                >
                  {sendingCode ? "ĐANG GỬI..." : "GỬI LẠI MÃ"}
                </button>

                <button
                  type="button"
                  className="pink-btn"
                  style={{ flex: 1 }}
                  onClick={backToEmailStep}
                >
                  ĐỔI EMAIL
                </button>
              </div>
            </>
          )}

          {step === "password" && (
            <>
              <label>Mật khẩu mới</label>
              <input
                type="password"
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <label>Xác nhận lại mật khẩu</label>
              <input
                type="password"
                placeholder="Xác nhận mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <button className="blue-btn" type="submit" disabled={resetting}>
                {resetting ? "ĐANG ĐỔI MẬT KHẨU..." : "ĐỔI MẬT KHẨU MỚI"}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;