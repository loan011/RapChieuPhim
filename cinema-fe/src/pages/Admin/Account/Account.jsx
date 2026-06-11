import "./Account.css";
import { useState } from "react";

export default function TaiKhoan() {
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  function handleProfileSubmit(e) {
    e.preventDefault();
    // TODO: Gắn API cập nhật thông tin cá nhân
    // await updateProfile(profileForm);
    alert("Lưu thay đổi thành công!");
  }

  function handlePasswordSubmit(e) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }
    // TODO: Gắn API đổi mật khẩu
    // await changePassword(pwForm);
    alert("Đổi mật khẩu thành công!");
  }

  return (
    <div>
      <h4 className="font-bold text-xl mb-6">Tài Khoản</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Thông tin cá nhân */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h5 className="font-semibold text-gray-700 mb-4">Thông Tin Cá Nhân</h5>
          <form onSubmit={handleProfileSubmit} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Họ và Tên</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Số Điện Thoại</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Vai Trò</label>
              <input type="text" className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50" value="Quản trị viên" disabled />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
              Lưu Thay Đổi
            </button>
          </form>
        </div>

        {/* Đổi mật khẩu */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h5 className="font-semibold text-gray-700 mb-4">Đổi Mật Khẩu</h5>
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Mật Khẩu Hiện Tại</label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Mật Khẩu Mới</label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Xác Nhận Mật Khẩu Mới</label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              />
            </div>
            <button type="submit" className="bg-yellow-500 text-white px-4 py-2 rounded text-sm hover:bg-yellow-600">
              Đổi Mật Khẩu
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
