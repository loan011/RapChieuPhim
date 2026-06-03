import { Link, useNavigate } from "react-router-dom";
import "../../styles/Login.css";

function Login() {
  const navigate = useNavigate();

  function handleLogin(e) {
    e.preventDefault();

    const email = e.target.email.value;
    localStorage.setItem("userEmail", email);

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
          <input name="email" type="email" placeholder="Email" required />

          <label>Mật khẩu</label>
          <input
            name="password"
            type="password"
            placeholder="Mật khẩu"
            required
          />

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