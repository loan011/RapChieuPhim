import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  MdConfirmationNumber,
  MdReceiptLong,
  MdFastfood,
  MdQrCodeScanner,
  MdPersonOutline,
  MdMenu,
  MdLogout,
  MdLocalActivity,
  MdBarChart,
} from "react-icons/md";
import { useState } from "react";

const navItems = [
  { to: "/staff/ban-ve", label: "Bán vé", icon: <MdLocalActivity /> },
  { to: "/staff/quan-ly-ve", label: "Quản lý vé", icon: <MdReceiptLong /> },
  { to: "/staff/combo", label: "Combo", icon: <MdFastfood /> },
  { to: "/staff/quet-qr", label: "Quét QR", icon: <MdQrCodeScanner /> },
  { to: "/staff/doanh-thu", label: "Doanh thu ngày", icon: <MdBarChart /> },
  { to: "/staff/ho-so", label: "Hồ sơ", icon: <MdPersonOutline /> },
];

export default function StaffLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside
        className={`${
          sidebarOpen ? "w-56" : "w-14"
        } bg-gray-800 text-white flex flex-col transition-all duration-200 shrink-0`}
      >
        <div className="flex items-center gap-2 px-3 py-4 border-b border-gray-700">
          <MdConfirmationNumber className="text-green-400 text-2xl shrink-0" />
          {sidebarOpen && (
            <span className="text-sm font-bold leading-tight">T&M Staff</span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 mx-1 rounded text-sm transition-colors ${
                  isActive
                    ? "bg-green-600 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`
              }
            >
              <span className="text-lg shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3 mx-1 mb-2 rounded text-sm text-gray-300 hover:bg-red-700 hover:text-white transition-colors"
        >
          <MdLogout className="text-lg shrink-0" />
          {sidebarOpen && <span>Đăng xuất</span>}
        </button>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white border-b border-gray-200 flex items-center gap-3 px-4 py-3 shrink-0">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-gray-500 hover:text-gray-800"
          >
            <MdMenu className="text-2xl" />
          </button>
          <span className="text-gray-700 font-semibold text-sm">
            Hệ Thống Nhân Viên Rạp Chiếu Phim T&M
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}