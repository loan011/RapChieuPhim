import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import "../../styles/Login.css";

import { FaEye, FaEyeSlash } from "react-icons/fa";
import { loginApi, saveAuthData } from "../../services/authService";

function Login() {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function getRole(data) {
    return (
      data?.user?.role ||
      data?.user?.Role ||
      data?.User?.role ||
      data?.User?.Role ||
      localStorage.getItem("role") ||
      ""
    );
  }

  async function handleLogin(e) {
    e.preventDefault();

    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();

    setError("");

    if (!email) return setError("Vui lòng nhập email!");
    if (!password) return setError("Vui lòng nhập mật khẩu!");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return setError("Email không đúng định dạng!");
    }

    try {
      setLoading(true);

      const data = await loginApi(email, password);

      saveAuthData(data);

      alert("Đăng nhập thành công!");

      const role = getRole(data);

      if (role === "Admin") {
        navigate("/admin", { replace: true });
      } else if (role === "Staff") {
        navigate("/staff", { replace: true });
      } else {
        navigate("/movies", { replace: true });
      }
    } catch (err) {
      console.error(err);
      setError(
        err.message ||
          "Không kết nối được tới server. Vui lòng kiểm tra API đã chạy chưa."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <Link to="/" className="back-home-btn" title="Về trang chủ">
        🏠
      </Link>

      <div className="auth-box-page">
        <div className="auth-tabs">
          <button type="button" className="active">
            ĐĂNG NHẬP
          </button>

          <Link to="/register">ĐĂNG KÝ</Link>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <label>Email</label>
          <input
            name="email"
            type="email"
            placeholder="Email"
            autoComplete="email"
          />

          <label>Mật khẩu</label>

          <div className="password-wrapper">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mật khẩu"
              autoComplete="current-password"
            />

            <button
              type="button"
              className="password-eye"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {error && (
            <p
              style={{
                color: "red",
                fontSize: "14px",
                marginTop: "10px",
                marginBottom: "10px",
              }}
            >
              {error}
            </p>
          )}

          <Link to="/forgot-password" className="forgot">
            Quên mật khẩu?
          </Link>

          <button className="blue-btn" type="submit" disabled={loading}>
            {loading ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP BẰNG TÀI KHOẢN"}
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