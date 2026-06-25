import { Link } from "react-router-dom";
import "../../../styles/Customer/CustomerProfile.css";
import {
  MdCameraAlt,
  MdLock,
  MdSave,
  MdRefresh,
  MdCheckCircle,
  MdArrowBack,
} from "react-icons/md";

import {
  PROFILE_FIELDS,
  GENDER_OPTIONS,
  useProfile,
  getProfileFallbackAvatar,
} from "./Profile.js";

export default function Profile() {
  const {
    form,
    showToast,
    loading,
    error,
    fileInputRef,
    handleChange,
    handleAvatarChange,
    handleReset,
    handleSubmit,
  } = useProfile();

  return (
    <div className="profile-page">
      <div className="profile-wrapper">
        <div className="profile-header-wrap">
          <Link to="/" className="back-arrow-btn" title="Quay lại trang chủ">
            <MdArrowBack />
          </Link>
          <div className="profile-header">
            <h1>Thông tin cá nhân</h1>
            <p>Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
          </div>
        </div>

        <div className="profile-card">
          <div className="profile-card-banner" />

          <div className="profile-card-body">
            <div className="profile-avatar-section">
              <div className="profile-avatar-wrapper">
                <img
                  src={form.avatarUrl}
                  alt="Avatar"
                  className="profile-avatar-img"
                  onError={(e) => {
                    e.target.src = getProfileFallbackAvatar(form.fullName);
                  }}
                />

                <label
                  className="profile-avatar-overlay"
                  htmlFor="avatarFileInput"
                >
                  <MdCameraAlt />
                </label>

                <input
                  id="avatarFileInput"
                  type="file"
                  accept="image/*"
                  className="avatar-file-input"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="profile-avatar-info">
                <p className="profile-avatar-name">
                  {form.fullName || "Người dùng"}
                </p>
                <p className="profile-avatar-email">{form.email}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="profile-form">
              {error && (
                <div className="profile-error-box">
                  <span>⚠️</span>
                  {error}
                </div>
              )}

              <div className="profile-section-label">
                Thông tin cơ bản
              </div>

              <div className="profile-form-grid">
                {PROFILE_FIELDS.map((field) => {
                  const Icon = field.Icon;
                  const isEmailField = field.name === "email";

                  return (
                    <div className="profile-field" key={field.name}>
                      <label>
                        <Icon />
                        {field.label}

                        {isEmailField && (
                          <span className="profile-disabled-badge">
                            <MdLock className="profile-lock-icon" />
                            Không thể sửa
                          </span>
                        )}
                      </label>

                      {field.type === "select" ? (
                        <select
                          name={field.name}
                          value={form[field.name]}
                          onChange={handleChange}
                        >
                          {GENDER_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          name={field.name}
                          type={field.type}
                          value={
                            field.name === "dateOfBirth"
                              ? form.dateOfBirth
                                ? form.dateOfBirth.slice(0, 10)
                                : ""
                              : form[field.name]
                          }
                          disabled={field.disabled}
                          placeholder={field.placeholder}
                          autoComplete={field.autoComplete}
                          onChange={handleChange}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="profile-form-actions">
                <button
                  type="button"
                  className="profile-reset-btn"
                  onClick={handleReset}
                >
                  <MdRefresh className="profile-btn-icon" />
                  Đặt lại
                </button>

                <button
                  type="submit"
                  className="profile-save-btn"
                  disabled={loading}
                >
                  <MdSave />
                  {loading ? "Đang lưu..." : "Lưu thông tin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showToast && (
        <div className="profile-toast">
          <MdCheckCircle className="profile-toast-icon" />
          Cập nhật thông tin thành công!
        </div>
      )}
    </div>
  );
}