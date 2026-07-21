import { Link } from "react-router-dom";
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { MdEmail, MdLockOutline, MdOutlineShield, MdPerson, MdDateRange, MdPhone, MdWc } from "react-icons/md";
import { FcGoogle } from "react-icons/fc";
import { useRegister } from "./useRegister";
import "../../styles/Login.css";
import "../../styles/Register.css";

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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const genderOptions = [
    { value: "", label: "Chọn giới tính" },
    { value: "Nam", label: "Nam" },
    { value: "Nữ", label: "Nữ" },
    { value: "Khác", label: "Khác" },
  ];

  return (
    <div className="login-wrapper">
      <div className="login-container register-container">
        
        {/* Left Side */}
        <div className="login-left">
          <div className="login-brand">
            <h1>Cinemas <span>HCM</span></h1>
            <p>TRẢI NGHIỆM PHIM ĐỈNH CAO</p>
          </div>
          
          <div className="login-welcome">
            <div className="welcome-icon">🎬</div>
            <h2>Đăng ký thành viên</h2>
            <p>Tham gia cùng Cinemas HCM để nhận ngay nhiều ưu đãi đặc quyền, đặt vé nhanh chóng và tiện lợi.</p>
          </div>
          
          <img src="/images/login-illustration.png" alt="Cinema Illustration" className="login-illustration" />
        </div>

        {/* Right Side */}
        <div className="login-right register-right">
          <div className="login-tabs">
            <Link to="/login" className="tab">
               <MdEmail style={{ marginRight: 6 }} /> ĐĂNG NHẬP
            </Link>
            <button type="button" className="tab active">
               <svg style={{ marginRight: 6 }} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
               ĐĂNG KÝ
            </button>
          </div>

          <form className="login-form-content" onSubmit={handleRegister}>
            <div className="register-grid">
              {/* Column 1 */}
              <div>
                <div className="form-group">
                  <label>HỌ TÊN *</label>
                  <div className="input-with-icon">
                    <MdPerson className="input-icon" />
                    <input
                      name="name"
                      type="text"
                      placeholder="Nhập họ tên"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>MẬT KHẨU *</label>
                  <div className="input-with-icon">
                    <MdLockOutline className="input-icon" />
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mật khẩu"
                      value={form.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>NGÀY SINH *</label>
                  <div className="input-with-icon">
                    <MdDateRange className="input-icon" />
                    <input
                      name="birthday"
                      type="date"
                      value={form.birthday}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>GIỚI TÍNH</label>
                  <div className="input-with-icon">
                    <MdWc className="input-icon" />
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "8px",
                        padding: "12px 16px 12px 46px",
                        color: "#fff",
                        fontSize: "0.95rem",
                        outline: "none",
                        appearance: "none",
                        cursor: "pointer"
                      }}
                    >
                      {genderOptions.map((item) => (
                        <option key={item.label} value={item.value} style={{ background: "#1a1a1a", color: "#fff" }}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Column 2 */}
              <div>
                <div className="form-group">
                  <label>EMAIL *</label>
                  <div className="input-with-icon">
                    <MdEmail className="input-icon" />
                    <input
                      name="email"
                      type="email"
                      placeholder="Nhập email"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>XÁC NHẬN MẬT KHẨU *</label>
                  <div className="input-with-icon">
                    <MdLockOutline className="input-icon" />
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Nhập lại mật khẩu"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>SỐ ĐIỆN THOẠI *</label>
                  <div className="input-with-icon">
                    <MdPhone className="input-icon" />
                    <input
                      name="phone"
                      type="text"
                      placeholder="Số điện thoại"
                      value={form.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
              </div>
            </div>

            <label className="register-policy">
              <input
                type="checkbox"
                name="policy"
                checked={form.policy}
                onChange={handleCheckboxChange}
              />
              <span>Tôi cam kết tuân theo chính sách bảo mật và điều khoản sử dụng của hệ thống Cinemas HCM.</span>
            </label>

            {error && <div className="login-error-text" style={{ color: "#dc2626", fontSize: "0.85rem", marginTop: "-10px", marginBottom: "10px" }}>{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading || !form.policy}>
              {loading ? "ĐANG XỬ LÝ..." : "ĐĂNG KÝ TÀI KHOẢN →"}
            </button>

            <div className="login-or">
              <span>HOẶC</span>
            </div>

            <button type="button" className="btn-google" onClick={handleGoogleRegister}>
              <FcGoogle size={20} />
              ĐĂNG KÝ BẰNG GOOGLE
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

export default Register;