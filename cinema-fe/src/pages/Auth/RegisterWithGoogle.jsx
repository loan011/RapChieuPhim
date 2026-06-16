import { Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { useState } from "react";
import "../../styles/RegisterWithGoogle.css";
import { registerWithGoogle } from "../../services/RegisterWithGoogle";

function RegisterWithGoogle() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGoogleRegister() {
    setError("");

    try {
      setLoading(true);

      const data = await registerWithGoogle();

      if (data?.url) {
        window.location.href = data.url;    
        return;
      }

      if (data?.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      alert(data?.message || data?.Message || "Gọi Google Register thành công");
    } catch (err) {
      console.error(err);
      setError(err.message || "Không gọi được API Google Register");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="google-register-page">
      <div className="google-register-card">
        <h2>Đăng ký tài khoản</h2>

        <p>Tạo tài khoản nhanh bằng Google để đặt vé xem phim.</p>

        <button
          type="button"
          className="google-register-btn"
          onClick={handleGoogleRegister}
          disabled={loading}
        >
          <FcGoogle className="google-icon" />
          <span>{loading ? "Đang xử lý..." : "Tiếp tục với Google"}</span>
        </button>

        {error && (
          <p style={{ color: "red", fontSize: "14px", marginTop: "10px" }}>
            {error}
          </p>
        )}

        <div className="divider">
          <span>hoặc</span>
        </div>

        <Link to="/register" className="normal-register-btn">
          Đăng ký bằng Email
        </Link>

        <p className="login-text">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterWithGoogle;