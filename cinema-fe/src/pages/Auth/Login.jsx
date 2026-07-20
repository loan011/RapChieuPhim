import { Link } from "react-router-dom";
import "../../styles/Login.css";

import { FaEye, FaEyeSlash } from "react-icons/fa";

import { useLogin } from "./useLogin.js";

function Login() {
  const {
    email,
    setEmail,
    password,
    setPassword,

    error,
    loading,
    showPassword,
    toggleShowPassword,

    handleLogin,
    handleGoogleLogin,
  } = useLogin();

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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Mật khẩu</label>

          <div className="password-wrapper">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mật khẩu"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              className="password-eye"
              onClick={toggleShowPassword}
              title={
                showPassword
                  ? "Ẩn mật khẩu"
                  : "Hiện mật khẩu"
              }
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {error && <p className="login-error-text">{error}</p>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "-4px" }}>
            <Link to="/forgot-password" className="forgot">
              Quên mật khẩu?
            </Link>
            <span style={{ color: "rgba(255, 255, 255, 0.3)", fontSize: "13px" }}>|</span>
            <Link to="/change-password" className="forgot">
              Đổi mật khẩu
            </Link>
          </div>

          <button className="blue-btn" type="submit" disabled={loading}>
            {loading ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP BẰNG TÀI KHOẢN"}
          </button>

          <button
            type="button"
            className="pink-btn"
            onClick={handleGoogleLogin}
          >
            ĐĂNG NHẬP BẰNG GOOGLE
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;