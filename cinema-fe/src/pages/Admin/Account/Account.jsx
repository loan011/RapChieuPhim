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
      <h4 className="font-bold text-2xl text-white mb-6">Cài Đặt Tài Khoản</h4>

      {error && (
        <div className="mb-6 p-4 bg-red-950/40 border border-red-900 text-red-400 rounded-xl text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Thông tin cá nhân */}
        <div className="bg-[#161619] rounded-2xl shadow-sm border border-[#2c2c2e] p-6 hover:shadow-md transition-shadow duration-300">
          <h5 className="font-bold text-lg text-white mb-5 pb-3 border-b border-[#2c2c2e] flex items-center gap-2">
            <span className="w-1.5 h-5 bg-[#ff3b30] rounded-full"></span>
            Thông Tin Cá Nhân
          </h5>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Họ và Tên</label>
              <input
                type="text"
                required
                className="w-full bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl px-4 py-2.5 text-sm text-gray-100 font-medium focus:outline-none focus:border-[#ff3b30] transition-all duration-200"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                required
                disabled
                className="w-full border border-[#2c2c2e]/60 rounded-xl px-4 py-2.5 text-sm bg-[#2c2c2e]/80 text-gray-300 font-medium cursor-not-allowed"
                value={profileForm.email}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Số Điện Thoại</label>
              <input
                type="text"
                required
                className="w-full bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl px-4 py-2.5 text-sm text-gray-100 font-medium focus:outline-none focus:border-[#ff3b30] transition-all duration-200"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Vai Trò</label>
              <input 
                type="text" 
                className="w-full border border-[#2c2c2e]/60 rounded-xl px-4 py-2.5 text-sm bg-[#2c2c2e]/80 text-gray-300 font-medium cursor-not-allowed" 
                value="Quản trị viên" 
                disabled 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-[#ff3b30] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#e02d24] active:scale-95 transition-all duration-150 cursor-pointer"
            >
              {loading ? "Đang lưu..." : "Lưu Thay Đổi"}
            </button>
          </form>
        </div>

        {/* Đổi mật khẩu */}
        <div className="bg-[#161619] rounded-2xl shadow-sm border border-[#2c2c2e] p-6 hover:shadow-md transition-shadow duration-300">
          <h5 className="font-bold text-lg text-white mb-5 pb-3 border-b border-[#2c2c2e] flex items-center gap-2">
            <span className="w-1.5 h-5 bg-[#ffd60a] rounded-full"></span>
            Đổi Mật Khẩu
          </h5>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Mật Khẩu Hiện Tại</label>
              <input
                type="password"
                required
                className="w-full bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl px-4 py-2.5 text-sm text-gray-100 font-medium focus:outline-none focus:border-[#ffd60a] transition-all duration-200"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Mật Khẩu Mới</label>
              <input
                type="password"
                required
                className="w-full bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl px-4 py-2.5 text-sm text-gray-100 font-medium focus:outline-none focus:border-[#ffd60a] transition-all duration-200"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Xác Nhận Mật Khẩu Mới</label>
              <input
                type="password"
                required
                className="w-full bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl px-4 py-2.5 text-sm text-gray-100 font-medium focus:outline-none focus:border-[#ffd60a] transition-all duration-200"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              />
            </div>
            <button 
              type="submit" 
              className="bg-[#ffd60a] text-black px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#e0b400] active:scale-95 transition-all duration-150 cursor-pointer"
            >
              Đổi Mật Khẩu
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
