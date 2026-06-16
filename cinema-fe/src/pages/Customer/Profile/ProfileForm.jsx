export default function ProfileForm({ form, error, success, saving, onChange, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="profile-form">
      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}

      <label>Họ tên</label>
      <input name="fullName" value={form.fullName} onChange={onChange} placeholder="Nhập họ tên" />

      <label>Email</label>
      <input name="email" value={form.email} disabled placeholder="Email" />

      <label>Số điện thoại</label>
      <input name="phone" value={form.phone} onChange={onChange} placeholder="Nhập số điện thoại" />

      <label>Ngày sinh</label>
      <input name="dateOfBirth" type="date" value={form.dateOfBirth ? form.dateOfBirth.slice(0, 10) : ""} onChange={onChange} />

      <label>Giới tính</label>
      <select name="gender" value={form.gender} onChange={onChange}>
        <option value="">Chọn giới tính</option>
        <option value="Nam">Nam</option>
        <option value="Nữ">Nữ</option>
        <option value="Khác">Khác</option>
      </select>

      <label>Địa chỉ</label>
      <input name="address" value={form.address} onChange={onChange} placeholder="Nhập địa chỉ" />

      <button type="submit" className="profile-save-btn" disabled={saving}>
        {saving ? "Đang lưu..." : "Lưu thông tin"}
      </button>
    </form>
  );
}
