import { Link, useNavigate } from "react-router-dom";
import "../../styles/Register.css";

function Register() {
  const navigate = useNavigate();

  function handleRegister(e) {
    e.preventDefault();

    const name = e.target.name.value.trim();
    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();
    const confirmPassword = e.target.confirmPassword.value.trim();
    const birthday = e.target.birthday.value.trim();
    const phone = e.target.phone.value.trim();
    const gender = e.target.gender.value;
    const policy = e.target.policy.checked;

    // Họ tên
    if (!name) {
      alert("Vui lòng nhập họ tên!");
      return;
    }

    // Email
    if (!email) {
      alert("Vui lòng nhập email!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      alert("Email không đúng định dạng!");
      return;
    }

    // Kiểm tra email đã tồn tại chưa
    const existingUser = JSON.parse(localStorage.getItem("user"));

    if (existingUser && existingUser.email === email) {
      alert("Email đã được đăng ký!");
      return;
    }

    // Mật khẩu
    if (!password) {
      alert("Vui lòng nhập mật khẩu!");
      return;
    }

    if (password.length < 6) {
      alert("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    // Xác nhận mật khẩu
    if (password !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }

    // Ngày sinh
    if (!birthday) {
      alert("Vui lòng nhập ngày sinh!");
      return;
    }

    // Số điện thoại
    const phoneRegex = /^[0-9]{10}$/;

    if (!phoneRegex.test(phone)) {
      alert("Số điện thoại phải gồm đúng 10 chữ số!");
      return;
    }

    // Giới tính
    if (gender === "Giới tính") {
      alert("Vui lòng chọn giới tính!");
      return;
    }

    // Điều khoản
    if (!policy) {
      alert("Bạn phải đồng ý với điều khoản sử dụng!");
      return;
    }

    // Tạo user
    const user = {
      name,
      email,
      password,
      birthday,
      phone,
      gender,
    };

    localStorage.setItem("user", JSON.stringify(user));

    alert("Đăng ký thành công!");

    navigate("/login");
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
            <input type="checkbox" name="policy" />
            {" "}
            Tôi cam kết tuân theo chính sách bảo mật và điều khoản sử dụng.
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