import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../../styles/Login.css";

function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  function handleLogin(e) {
    e.preventDefault();

    const customerEmail = "customer@gmail.com";
    const customerPassword = "123456";

    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();

    setError("");

    // Kiểm tra email rỗng
    if (!email) {
      setError("Vui lòng nhập email!");
      return;
    }

    // Kiểm tra mật khẩu rỗng
    if (!password) {
      setError("Vui lòng nhập mật khẩu!");
      return;
    }

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setError("Email không đúng định dạng!");
      return;
    }

    // Kiểm tra tài khoản tồn tại
    if (email !== customerEmail) {
      setError("Tài khoản không tồn tại!");
      return;
    }

    // Kiểm tra mật khẩu
    if (password !== customerPassword) {
      setError("Mật khẩu không đúng!");
      return;
    }

    // Đăng nhập thành công
    localStorage.setItem("userEmail", email);
    localStorage.setItem("role", "user");

    navigate("/");
  }

  return (
    <div className="auth-page">
      <Link to="/" className="back-home-btn" title="Về trang chủ">
        🏠
      </Link>

      <div className="auth-box-page">
        <div className="auth-tabs">
          <button className="active">ĐĂNG NHẬP</button>
          <Link to="/register">ĐĂNG KÝ</Link>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <label>Email</label>
          <input
            name="email"
            type="email"
            placeholder="Email"
          />

          <label>Mật khẩu</label>
          <input
            name="password"
            type="password"
            placeholder="Mật khẩu"
          />

          {error && (
            <p
              style={{
                color: "red",
                marginTop: "10px",
                marginBottom: "10px",
                fontSize: "14px",
              }}
            >
              {error}
            </p>
          )}

          <p className="forgot">Quên mật khẩu?</p>

          <button className="blue-btn" type="submit">
            ĐĂNG NHẬP BẰNG TÀI KHOẢN
          </button>

          <button type="button" className="pink-btn">
            ĐĂNG NHẬP BẰNG GOOGLE
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;