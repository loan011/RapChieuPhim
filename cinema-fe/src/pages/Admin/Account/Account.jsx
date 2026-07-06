import "./Account.css";
import { useAccount } from "./useAccount.js";

export default function TaiKhoan() {
  const {
    profileForm,
    setProfileForm,
    pwForm,
    setPwForm,
    loading,
    error,
    handleProfileSubmit,
    handlePasswordSubmit,
  } = useAccount();

  return (
    <div className="p-1">
      <h4 className="font-bold text-2xl text-gray-800 mb-6">Cài Đặt Tài Khoản</h4>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Thông tin cá nhân */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
          <h5 className="font-bold text-lg text-gray-800 mb-5 pb-3 border-b border-gray-50 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-blue-600 rounded-full"></span>
            Thông Tin Cá Nhân
          </h5>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Họ và Tên</label>
              <input
                type="text"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all duration-200"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                required
                disabled
                className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                value={profileForm.email}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Số Điện Thoại</label>
              <input
                type="text"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all duration-200"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Vai Trò</label>
              <input 
                type="text" 
                className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" 
                value="Quản trị viên" 
                disabled 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-100 active:scale-98 transition-all duration-150"
            >
              {loading ? "Đang lưu..." : "Lưu Thay Đổi"}
            </button>
          </form>
        </div>

        {/* Đổi mật khẩu */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
          <h5 className="font-bold text-lg text-gray-800 mb-5 pb-3 border-b border-gray-50 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-yellow-500 rounded-full"></span>
            Đổi Mật Khẩu
          </h5>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Mật Khẩu Hiện Tại</label>
              <input
                type="password"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-50/50 transition-all duration-200"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Mật Khẩu Mới</label>
              <input
                type="password"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-50/50 transition-all duration-200"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Xác Nhận Mật Khẩu Mới</label>
              <input
                type="password"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-50/50 transition-all duration-200"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              />
            </div>
            <button 
              type="submit" 
              className="bg-yellow-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-yellow-650 hover:shadow-lg hover:shadow-yellow-100 active:scale-98 transition-all duration-150"
            >
              Đổi Mật Khẩu
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
