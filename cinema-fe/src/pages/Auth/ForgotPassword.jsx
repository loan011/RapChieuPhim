import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/ForgotPassword.css";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [codeInput, setCodeInput] = useState("");
  const [sentCode, setSentCode] = useState("");

  function sendCode() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      alert("Chưa có tài khoản nào được đăng ký!");
      return;
    }

    if (!email) {
      alert("Vui lòng nhập email trước!");
      return;
    }

    if (email !== user.email) {
      alert("Email không tồn tại!");
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    setSentCode(code);

    alert("Demo mã xác nhận Gmail của bạn là: " + code);
  }

  function handleReset(e) {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      alert("Chưa có tài khoản nào được đăng ký!");
      return;
    }

    if (email !== user.email) {
      alert("Email không tồn tại!");
      return;
    }

    if (!sentCode) {
      alert("Vui lòng bấm gửi mã xác nhận trước!");
      return;
    }

    if (codeInput !== sentCode) {
      alert("Mã xác nhận không đúng!");
      return;
    }

    if (newPassword.length < 6) {
      alert("Mật khẩu phải từ 6 ký tự trở lên!");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }

    user.password = newPassword;
    localStorage.setItem("user", JSON.stringify(user));

    alert("Đổi mật khẩu thành công!");
    navigate("/login");
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

        <button type="button" className="forgot-btn" onClick={sendCode}>
          GỬI MÃ XÁC NHẬN
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

        <button className="forgot-btn" type="submit">
          ĐỔI MẬT KHẨU
        </button>
      </form>
    </div>
  );
}

export default ForgotPassword;