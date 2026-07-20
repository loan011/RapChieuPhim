import { useState } from "react";
import {
  MdLock,
  MdSave,
  MdCheckCircle,
  MdError,
  MdKey,
  MdVisibility,
  MdVisibilityOff,
} from "react-icons/md";
import { changePassword } from "../../Admin/User/userService";
import "../../../styles/Customer/CustomerProfile.css";

export default function ChangePassword() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setMessage({ type: "error", text: "Vui lòng nhập đầy đủ các trường thông tin!" });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: "error", text: "Mật khẩu mới phải có ít nhất 6 ký tự!" });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: "error", text: "Mật khẩu mới và xác nhận mật khẩu không khớp!" });
      return;
    }

    try {
      setLoading(true);
      await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      setMessage({
        type: "success",
        text: "Cập nhật mật khẩu thành công!",
      });

      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ!",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="profile-header-wrap">
        <div className="profile-header">
          <h1>
            <span className="page-icon">🔒</span>
            Đổi mật khẩu
          </h1>
        </div>
      </div>

      <div className="profile-card">
        <div className="profile-card-body">
          {message.text && (
            <div
              className={`profile-alert ${
                message.type === "success" ? "success" : "error"
              }`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "14px 16px",
                borderRadius: "8px",
                marginBottom: "24px",
                background: message.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(220, 38, 38, 0.1)",
                border: message.type === "success" ? "1px solid #10b981" : "1px solid #dc2626",
                color: message.type === "success" ? "#10b981" : "#dc2626",
                fontSize: "0.9rem",
              }}
            >
              {message.type === "success" ? <MdCheckCircle size={20} /> : <MdError size={20} />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="profile-form">
            {/* Current Password */}
            <div className="profile-field">
              <label htmlFor="currentPassword">
                <MdKey /> Mật khẩu hiện tại <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  name="currentPassword"
                  placeholder="Nhập mật khẩu hiện tại"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  required
                  style={{ paddingRight: "44px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#888",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                    display: "flex",
                    alignItems: "center",
                    padding: 0,
                  }}
                  title={showCurrentPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showCurrentPassword ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="profile-field">
              <label htmlFor="newPassword">
                <MdLock /> Mật khẩu mới <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  style={{ paddingRight: "44px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#888",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                    display: "flex",
                    alignItems: "center",
                    padding: 0,
                  }}
                  title={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showNewPassword ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="profile-field">
              <label htmlFor="confirmPassword">
                <MdLock /> Xác nhận mật khẩu mới <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Nhập lại mật khẩu mới"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  style={{ paddingRight: "44px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#888",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                    display: "flex",
                    alignItems: "center",
                    padding: 0,
                  }}
                  title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showConfirmPassword ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
            </div>

            <div className="profile-form-actions" style={{ marginTop: "24px" }}>
              <button type="submit" className="profile-save-btn" disabled={loading}>
                <MdSave />
                {loading ? "Đang xử lý..." : "Lưu mật khẩu"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
