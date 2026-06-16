import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../../styles/Register.css";
import { registerApi } from "../../services/authService";

function Register() {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleGoogleRegister() {
    navigate("/register-google");
  }

  async function handleRegister(e) {
    e.preventDefault();

    const name = e.target.name.value.trim();
    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();
    const confirmPassword = e.target.confirmPassword.value.trim();
    const birthday = e.target.birthday.value.trim();
    const phone = e.target.phone.value.trim();
    const gender = e.target.gender.value;
    const policy = e.target.policy.checked;

    setError("");

    if (!name) return setError("Vui lòng nhập họ tên!");
    if (!email) return setError("Vui lòng nhập email!");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return setError("Email không đúng định dạng!");
    }

    if (!password) return setError("Vui lòng nhập mật khẩu!");
    if (password.length < 6) {
      return setError("Mật khẩu phải có ít nhất 6 ký tự!");
    }

    if (password !== confirmPassword) {
      return setError("Mật khẩu xác nhận không khớp!");
    }

    if (!birthday) return setError("Vui lòng nhập ngày sinh!");

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return setError("Số điện thoại phải gồm đúng 10 chữ số!");
    }

    if (gender === "Giới tính") {
      return setError("Vui lòng chọn giới tính!");
    }

    if (!policy) {
      return setError("Bạn phải đồng ý với điều khoản sử dụng!");
    }

    try {
      setLoading(true);

      const data = await registerApi({
        fullName: name,
        email,
        password,
        confirmPassword,
        dateOfBirth: birthday,
        gender,
        phone,
        roleName: "Customer",
      });

      alert(data?.message || data?.Message || "Đăng ký thành công!");
      navigate("/login");
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
          <Link to="/login">ĐĂNG NHẬP</Link>
          <button type="button" className="active">
            ĐĂNG KÝ
          </button>
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
            <input name="birthday" type="date" required />

            <label>* Số điện thoại</label>
            <input
              name="phone"
              type="text"
              placeholder="Số điện thoại"
              required
            />
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
            <select name="gender" defaultValue="Giới tính">
              <option value="Giới tính">Giới tính</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <p className="policy">
            <input type="checkbox" name="policy" /> Tôi cam kết tuân theo chính
            sách bảo mật và điều khoản sử dụng.
          </p>

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

          <button className="blue-btn" type="submit" disabled={loading}>
            {loading ? "ĐANG ĐĂNG KÝ..." : "ĐĂNG KÝ"}
          </button>

          <button
            type="button"
            className="pink-btn"
            onClick={handleGoogleRegister}
          >
            TIẾP TỤC VỚI GOOGLE
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;