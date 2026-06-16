export default function ProfileAvatar({ avatarUrl, onAvatarChange }) {
  return (
    <div className="avatar-section">
      <img src={avatarUrl} alt="avatar" className="profile-avatar-preview" />

      <label className="avatar-upload-btn">
        Đổi ảnh đại diện
        <input type="file" accept="image/*" onChange={onAvatarChange} hidden />
      </label>
    </div>
  );
}
