import "../../../styles/Customer/CustomerProfile.css";

import {
  PROFILE_TEXT as T,
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
        <div className="profile-header">
          <h1>{T.header.title}</h1>
          <p>{T.header.description}</p>
        </div>

        <div className="profile-card">
          <div className="profile-card-banner" />

          <div className="profile-card-body">
            <div className="profile-avatar-section">
              <div className="profile-avatar-wrapper">
                <img
                  src={form.avatarUrl}
                  alt={T.avatar.alt}
                  className="profile-avatar-img"
                  onError={(e) => {
                    e.target.src = getProfileFallbackAvatar(form.fullName);
                  }}
                />

                <label
                  className="profile-avatar-overlay"
                  htmlFor={T.avatar.inputId}
                >
                  <T.icons.camera />
                </label>

                <input
                  id={T.avatar.inputId}
                  type="file"
                  accept="image/*"
                  className="avatar-file-input"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="profile-avatar-info">
                <p className="profile-avatar-name">
                  {form.fullName || T.avatar.fallbackName}
                </p>

                <p className="profile-avatar-email">{form.email}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="profile-form">
              {error && (
                <div className="profile-error-box">
                  <span>{T.error.icon}</span>
                  {error}
                </div>
              )}

              <div className="profile-section-label">
                {T.sections.basicInfo}
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
                            <T.icons.lock className="profile-lock-icon" />
                            {T.badges.cannotEdit}
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
                  <T.icons.refresh className="profile-btn-icon" />
                  {T.buttons.reset}
                </button>

                <button
                  type="submit"
                  className="profile-save-btn"
                  disabled={loading}
                >
                  <T.icons.save />
                  {loading ? T.buttons.saving : T.buttons.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showToast && (
        <div className="profile-toast">
          <T.icons.check className="profile-toast-icon" />
          {T.toast.success}
        </div>
      )}
    </div>
  );
}