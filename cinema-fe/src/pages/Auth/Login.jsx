import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../../styles/Login.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Login() {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();

    setError("");

    if (!email) {
      setError("Vui lòng nhập email!");
      return;
    }

    if (!password) {
      setError("Vui lòng nhập mật khẩu!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setError("Email không đúng định dạng!");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("https://localhost:7013/api/Auth/Login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.Message || "Đăng nhập thất bại!");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("tokenType", data.tokenType || "Bearer");
      localStorage.setItem("expiresAt", data.expiresAt);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("role", data.user.role);

      alert("Đăng nhập thành công!");

      if (data.user.role === "Admin") {
        navigate("/admin");
      } else if (data.user.role === "Staff") {
        navigate("/staff");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      setError("Không kết nối được tới server. Vui lòng kiểm tra API đã chạy chưa.");
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
          <button className="active">ĐĂNG NHẬP</button>
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