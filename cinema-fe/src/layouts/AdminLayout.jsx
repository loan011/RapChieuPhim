import "../styles/Admin/AdminLayout.css";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  MdDashboard,
  MdPeople,
  MdMovie,
  MdMeetingRoom,
  MdCalendarMonth,
  MdChair,
  MdNotifications,
  MdNotificationsNone,
  MdMenu,
  MdLogout,
  MdTheaters,
  MdSearch,
  MdKeyboardArrowDown,
} from "react-icons/md";
import { useState } from "react";

const navItems = [
  { to: "/admin/dashboard",             label: "Dashboard",              icon: <MdDashboard /> },
  { to: "/admin/quan-ly-nguoi-dung",    label: "Quản Lý Người Dùng",    icon: <MdPeople /> },
  { to: "/admin/phim",                  label: "Phim",                   icon: <MdMovie /> },
  { to: "/admin/rap-chieu",             label: "Quản Lí Chi Nhánh",     icon: <MdTheaters /> },
  { to: "/admin/phong-chieu",           label: "Phong Chieu",            icon: <MdMeetingRoom /> },
  { to: "/admin/suat-chieu",            label: "Suat Chieu",             icon: <MdCalendarMonth /> },
  { to: "/admin/ghe",                   label: "Ghe",                    icon: <MdChair /> },
  { to: "/admin/thong-bao",             label: "Thong Bao",              icon: <MdNotifications /> },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

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
        } bg-[#0d3875] text-white flex flex-col transition-all duration-200 shrink-0`}
      >
        <div className="flex items-center gap-2 px-3 py-4 border-b border-white/10">
          <MdMovie className="text-blue-400 text-2xl shrink-0" />
          {sidebarOpen && (
            <span className="text-sm font-bold leading-tight">T&M Admin</span>
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
                    ? "bg-blue-600 text-white"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
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
          className={`flex items-center gap-3 rounded-xl text-sm font-medium text-white transition-all duration-200 ${
            sidebarOpen
              ? "px-4 py-2.5 mx-3 mb-4 bg-white/10 hover:bg-white/20"
              : "p-2 mx-1 mb-4 justify-center bg-white/10 hover:bg-white/20"
          }`}
        >
          <MdLogout className="text-lg shrink-0" />
          {sidebarOpen && <span>Đăng xuất</span>}
        </button>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white border-b border-gray-200 flex items-center justify-between px-6 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="text-gray-500 hover:text-gray-800 transition-colors p-1 rounded-md hover:bg-gray-100"
              aria-label="Toggle sidebar"
            >
              <MdMenu className="text-2xl" />
            </button>
            <span className="text-gray-700 font-semibold text-sm hidden md:inline">
              Hệ Thống Quản Lý Rạp Chiếu Phim T&M
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative w-48 sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <MdSearch className="text-gray-400 text-lg" />
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Notification Bell */}
            <button className="relative w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-all shrink-0">
              <MdNotificationsNone className="text-xl" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                5
              </span>
            </button>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="flex items-center gap-2 cursor-pointer focus:outline-none shrink-0"
              >
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                  BM
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  Business Manager
                </span>
                <MdKeyboardArrowDown className={`text-gray-500 text-lg shrink-0 transition-transform ${profileMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>Cấu hình tài khoản</span>
                  </button>
                  <hr className="border-gray-100 my-1" />
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <MdLogout />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}