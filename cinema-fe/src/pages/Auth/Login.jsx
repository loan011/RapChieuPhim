import { Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { MdEmail, MdLockOutline, MdOutlineShield } from "react-icons/md";
import { FcGoogle } from "react-icons/fc";
import { useLogin } from "./useLogin.js";
import "../../styles/Login.css";

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
    <div className="login-wrapper">
      <div className="login-container">
        
        {/* Left Side */}
        <div className="login-left">
          <div className="login-brand">
            <h1>Cinemas <span>HCM</span></h1>
            <p>TRẢI NGHIỆM PHIM ĐỈNH CAO</p>
          </div>
          
          <div className="login-welcome">
            <div className="welcome-icon">🎬</div>
            <h2>Chào mừng bạn<br/>trở lại!</h2>
            <p>Đăng nhập để đặt vé, theo dõi lịch chiếu và nhận ưu đãi hấp dẫn từ Cinemas HCM.</p>
          </div>
          
          <img src="/images/login-illustration.png" alt="Cinema Illustration" className="login-illustration" />
        </div>

        {/* Right Side */}
        <div className="login-right">
          <div className="login-tabs">
            <button type="button" className="tab active">
               <MdEmail style={{ marginRight: 6 }} /> ĐĂNG NHẬP
            </button>
            <Link to="/register" className="tab">
               <svg style={{ marginRight: 6 }} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
               ĐĂNG KÝ
            </Link>
          </div>

          <form className="login-form-content" onSubmit={handleLogin}>
            <div className="form-group">
              <label>EMAIL</label>
              <div className="input-with-icon">
                <MdEmail className="input-icon" />
                <input
                  name="email"
                  type="email"
                  placeholder="Nhập email của bạn"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>MẬT KHẨU</label>
              <div className="input-with-icon">
                <MdLockOutline className="input-icon" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={toggleShowPassword}
                  title="Hiển thị mật khẩu"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {error && <div className="login-error-text" style={{ color: "#dc2626", fontSize: "0.85rem", marginTop: "-10px", marginBottom: "10px" }}>{error}</div>}

            <div className="login-links">
              <Link to="/forgot-password">Quên mật khẩu?</Link>
              <span className="divider">|</span>
              <Link to="/change-password">Đổi mật khẩu</Link>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "ĐANG XỬ LÝ..." : "ĐĂNG NHẬP BẰNG TÀI KHOẢN →"}
            </button>

            <div className="login-or">
              <span>HOẶC</span>
            </div>

            <button type="button" className="btn-google" onClick={handleGoogleLogin}>
              <FcGoogle size={20} />
              ĐĂNG NHẬP BẰNG GOOGLE
            </button>

            <div className="login-secure-text">
              <MdOutlineShield size={16} /> Thông tin của bạn được bảo mật tuyệt đối
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}

export default Login;