import { Link } from "react-router-dom";
import "../../styles/Register.css";

import { useRegister } from "./Register.js";

function Register() {
  const {
    form,
    error,
    loading,

    handleChange,
    handleCheckboxChange,
    handleRegister,
    handleGoogleRegister,
  } = useRegister();

  const genderOptions = [
    { value: "Giới tính", label: "Giới tính" },
    { value: "Nam", label: "Nam" },
    { value: "Nữ", label: "Nữ" },
    { value: "Khác", label: "Khác" },
  ];

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
            <input
              name="name"
              type="text"
              placeholder="Họ tên"
              value={form.name}
              onChange={handleChange}
              required
            />

            <label>* Mật khẩu</label>
            <input
              name="password"
              type="password"
              placeholder="Mật khẩu"
              value={form.password}
              onChange={handleChange}
              required
            />

            <label>* Ngày sinh</label>
            <input
              name="birthday"
              type="date"
              value={form.birthday}
              onChange={handleChange}
              required
            />

            <label>* Số điện thoại</label>
            <input
              name="phone"
              type="text"
              placeholder="Số điện thoại"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>* Email</label>
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <label>* Xác nhận lại mật khẩu</label>
            <input
              name="confirmPassword"
              type="password"
              placeholder="Xác nhận lại mật khẩu"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />

            <label>Giới tính</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
            >
              {genderOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <p className="policy">
            <input
              type="checkbox"
              name="policy"
              checked={form.policy}
              onChange={handleCheckboxChange}
            />{" "}
            Tôi cam kết tuân theo chính sách bảo mật và điều khoản sử dụng.
          </p>

          {error && <p className="register-error-text">{error}</p>}

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