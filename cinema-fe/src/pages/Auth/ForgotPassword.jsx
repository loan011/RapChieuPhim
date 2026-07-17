import { Link } from "react-router-dom";
import "../../styles/ForgotPassword.css";

import { useForgotPassword } from "./useForgotPassword.js";

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
    <div className="forgot-page">
      <Link to="/login" className="forgot-back-home">
        {"← Quay lại đăng nhập"}
      </Link>

      <form className="forgot-box" onSubmit={handleSubmit}>
        <h2>QUÊN MẬT KHẨU</h2>

        {step !== "password" && (
          <div className="forgot-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="Nhập email"
              value={email}
              disabled={step !== "email"}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        )}

        {step === "email" && (
          <button className="forgot-btn" type="submit" disabled={sendingCode}>
            {sendingCode ? "ĐANG GỬI..." : "GỬI MÃ XÁC NHẬN"}
          </button>
        )}

        {step === "code" && (
          <>
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

            <button
              className="forgot-btn"
              type="submit"
              disabled={verifyingCode}
            >
              {verifyingCode ? "ĐANG XÁC NHẬN..." : "XÁC NHẬN MÃ"}
            </button>

            <button
              type="button"
              className="forgot-btn"
              onClick={sendCode}
              disabled={sendingCode}
            >
              {sendingCode ? "ĐANG GỬI..." : "GỬI LẠI MÃ"}
            </button>

            <button
              type="button"
              className="forgot-btn secondary"
              onClick={backToEmailStep}
            >
              ĐỔI EMAIL
            </button>
          </>
        )}

        {step === "password" && (
          <>
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
          </>
        )}
      </form>
    </div>
  );
}

export default ForgotPassword;