import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../../styles/Register.css";

function Register() {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

    if (!name) {
      setError("Vui lòng nhập họ tên!");
      return;
    }

    if (!email) {
      setError("Vui lòng nhập email!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setError("Email không đúng định dạng!");
      return;
    }

    if (!password) {
      setError("Vui lòng nhập mật khẩu!");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }

    if (!birthday) {
      setError("Vui lòng nhập ngày sinh!");
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;

    if (!phoneRegex.test(phone)) {
      setError("Số điện thoại phải gồm đúng 10 chữ số!");
      return;
    }

    if (gender === "Giới tính") {
      setError("Vui lòng chọn giới tính!");
      return;
    }

    if (!policy) {
      setError("Bạn phải đồng ý với điều khoản sử dụng!");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("https://localhost:7013/api/Auth/Register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: name,
          email: email,
          password: password,
          confirmPassword: confirmPassword,
          dateOfBirth: birthday,
          gender: gender,
          phone: phone,
          roleName: "Customer",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.Message || "Đăng ký thất bại!");
        return;
      }

      alert(data.message || data.Message || "Đăng ký thành công!");

      navigate("/login");
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
          <Link to="/login">ĐĂNG NHẬP</Link>
          <button className="active">ĐĂNG KÝ</button>
        </div>

        <form className="register-form" onSubmit={handleRegister}>
          <div>
            <label>* Họ tên</label>
            <input
              name="name"
              type="text"
              placeholder="Họ tên"
              required
            />

            <label>* Mật khẩu</label>
            <input
              name="password"
              type="password"
              placeholder="Mật khẩu"
              required
            />

            <label>* Ngày sinh</label>
            <input
              name="birthday"
              type="date"
              required
            />

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
            <input
              name="email"
              type="email"
              placeholder="Email"
              required
            />

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
            <input type="checkbox" name="policy" />{" "}
            Tôi cam kết tuân theo chính sách bảo mật và điều khoản sử dụng.
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

          <button type="button" className="pink-btn">
            TIẾP TỤC VỚI GOOGLE
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;