import { Link, useNavigate } from "react-router-dom";
import "../../styles/Register.css";

function Register() {
  const navigate = useNavigate();

  function handleRegister(e) {
    e.preventDefault();

    const email = e.target.email.value;
    const password = e.target.password.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (password !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }

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
          <Link to="/login">ĐĂNG NHẬP</Link>
          <button className="active">ĐĂNG KÝ</button>
        </div>

        <form className="register-form" onSubmit={handleRegister}>
          <div>
            <label>* Họ tên</label>
            <input name="name" type="text" placeholder="Họ tên" required />

            <label>* Mật khẩu</label>
            <input
              name="password"
              type="password"
              placeholder="Mật khẩu"
              required
            />

            <label>* Ngày sinh</label>
            <input name="birthday" type="text" placeholder="Ngày sinh" required />

            <label>* Số điện thoại</label>
            <input name="phone" type="text" placeholder="Số điện thoại" required />
          </div>

          <div>
            <label>* Email</label>
            <input name="email" type="email" placeholder="Email" required />

            <label>* Xác nhận lại mật khẩu</label>
            <input
              name="confirmPassword"
              type="password"
              placeholder="Xác nhận lại mật khẩu"
              required
            />

            <label>Giới tính</label>
            <select name="gender">
              <option>Giới tính</option>
              <option>Nam</option>
              <option>Nữ</option>
              <option>Khác</option>
            </select>

            <label>Mã xác thực</label>
            <input name="captcha" type="text" placeholder="Mã xác thực" />
          </div>

          <p className="policy">
            <input type="checkbox" required /> Tôi cam kết tuân theo chính sách
            bảo mật và điều khoản sử dụng.
          </p>

          <button className="blue-btn" type="submit">
            ĐĂNG KÝ
          </button>

          <button type="button" className="pink-btn">
            TIẾP TỤC VỚI GOOGLE
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;