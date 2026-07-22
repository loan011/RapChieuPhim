import "../styles/Admin/AdminLayout.css";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
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
  MdFastfood,
  MdDashboard,
  MdAssignment,
} from "react-icons/md";
import { useState, useEffect } from "react";
import { getApiUrl, getAuthHeaders, readResponse } from "../services/apiHelper";

const navItems = [
  { to: "/admin/dashboard",             label: "Doanh Thu",              icon: <MdDashboard /> },
  { to: "/admin/quan-ly-nguoi-dung",    label: "Quản Lý Người Dùng",    icon: <MdPeople /> },
  { to: "/admin/phim",                  label: "Phim",                   icon: <MdMovie /> },
  { to: "/admin/phong-chieu",           label: "Phòng Chiếu & Ghế",      icon: <MdMeetingRoom /> },
  { to: "/admin/suat-chieu",            label: "Suất Chiếu",             icon: <MdCalendarMonth /> },
  { to: "/admin/bao-cao",               label: "Báo Cáo",                icon: <MdAssignment /> },
  { to: "/admin/thong-bao",             label: "Thông Báo",              icon: <MdNotifications /> },
  { to: "/admin/do-an",                 label: "Đồ Ăn & Combo",          icon: <MdFastfood /> },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const navigate = useNavigate();

  const [readReportIds, setReadReportIds] = useState(() => {
    try {
      const saved = localStorage.getItem("read_report_ids");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const saveReadReportIds = (ids) => {
    setReadReportIds(ids);
    try {
      localStorage.setItem("read_report_ids", JSON.stringify(ids));
    } catch (e) {}
  };

  const getReportKey = (r) => {
    if (!r) return "";
    return String(r.reportId || r.ReportId || r.reportDate || r.ReportDate || '');
  };

  const unreadCount = reports.filter(r => {
    const key = getReportKey(r);
    return key && !readReportIds.includes(key);
  }).length;

  useEffect(() => {
    fetch(`${getApiUrl()}/StaffReports`, { headers: getAuthHeaders() })
      .then(res => {
        if (res.ok) return readResponse(res);
        return [];
      })
      .then(data => {
        const arr = data?.$values || data || [];
        const safeArr = Array.isArray(arr) ? arr : [];
        setReports(safeArr.sort((a, b) => {
          const dateA = new Date(a.reportDate || a.ReportDate || 0);
          const dateB = new Date(b.reportDate || b.ReportDate || 0);
          return dateB - dateA;
        }));
      })
      .catch(err => console.error("Lỗi tải thông báo:", err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  }

  return (
    <div className="flex h-screen bg-[#0c0c0e] overflow-hidden text-gray-200">
      <aside
        className={`${
          sidebarOpen ? "w-56" : "w-14"
        } bg-[#111115] border-r border-[#2c2c2e]/60 text-white flex flex-col transition-all duration-200 shrink-0`}
      >
        <div className="flex items-center gap-2 px-3 py-4 border-b border-[#2c2c2e]/60">
          <MdMovie className="text-[#ff3b30] text-2xl shrink-0" />
          {sidebarOpen && (
            <span className="text-sm font-bold leading-tight tracking-wider text-white">T&M ADMIN</span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 mx-1 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? "bg-[#ff3b30] text-white font-bold shadow-[0_2px_10px_rgba(255,59,48,0.2)]"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
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
              ? "px-4 py-2.5 mx-3 mb-4 bg-white/5 hover:bg-white/10"
              : "p-2 mx-1 mb-4 justify-center bg-white/5 hover:bg-white/10"
          }`}
        >
          <MdLogout className="text-lg shrink-0" />
          {sidebarOpen && <span>Đăng xuất</span>}
        </button>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden bg-[#0c0c0e]">
        <header className="bg-[#151518] border-b border-[#2c2c2e]/60 flex items-center justify-between px-6 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5"
              aria-label="Toggle sidebar"
            >
              <MdMenu className="text-2xl" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                className="relative w-9 h-9 flex items-center justify-center bg-[#2c2c2e]/60 border border-[#2c2c2e]/80 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-all shrink-0"
              >
                <MdNotificationsNone className="text-xl" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff3b30] text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[#1c1c1e] rounded-lg shadow-xl border border-[#2c2c2e] py-2 z-50 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-[#2c2c2e] flex justify-between items-center">
                    <span className="font-semibold text-white">Thông báo báo cáo doanh thu</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const allKeys = reports.map(getReportKey).filter(Boolean);
                          saveReadReportIds(allKeys);
                        }}
                        className="text-xs text-[#ff3b30] hover:underline cursor-pointer bg-transparent border-none outline-none font-medium"
                      >
                        Đọc tất cả
                      </button>
                    )}
                  </div>
                  {reports.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-gray-400 text-center">Không có báo cáo nào</div>
                  ) : (
                    reports.map(r => {
                      const isRead = readReportIds.includes(getReportKey(r));
                      return (
                        <div 
                          key={r.reportId || Math.random()} 
                          onClick={() => {
                            const key = getReportKey(r);
                            if (key && !readReportIds.includes(key)) {
                              saveReadReportIds([...readReportIds, key]);
                            }
                            setNotifMenuOpen(false);
                            navigate("/admin/bao-cao");
                          }}
                          className={`px-4 py-3 hover:bg-white/5 border-b border-[#2c2c2e] last:border-0 cursor-pointer transition-colors relative ${!isRead ? "bg-white/[0.02]" : ""}`}
                        >
                          {!isRead && (
                            <span className="absolute left-1.5 top-4.5 w-1.5 h-1.5 bg-[#ff3b30] rounded-full"></span>
                          )}
                          <div className="flex justify-between items-start mb-1 pl-1">
                            <span className={`text-sm ${!isRead ? "font-semibold text-white" : "font-medium text-gray-300"}`}>
                              {r.staff?.fullName || r.staff?.FullName || 'Nhân viên'} báo cáo
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(r.reportDate || r.ReportDate).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mb-1 pl-1 whitespace-pre-wrap">{r.summary || r.Summary}</p>
                          <div className="text-sm font-bold text-[#10b981] pl-1">
                            {(r.totalRevenue || r.TotalRevenue || 0).toLocaleString('vi-VN')}đ
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="flex items-center gap-2 cursor-pointer focus:outline-none shrink-0"
              >
                <div className="w-9 h-9 rounded-full bg-[#ff3b30] flex items-center justify-center text-white font-semibold text-sm shrink-0">
                  BM
                </div>
                <span className="text-sm font-medium text-white hidden sm:inline">
                  Business Manager
                </span>
                <MdKeyboardArrowDown className={`text-gray-400 text-lg shrink-0 transition-transform ${profileMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#1c1c1e] rounded-lg shadow-xl border border-[#2c2c2e] py-1 z-50">
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[#ff453a] hover:bg-white/5 flex items-center gap-2"
                  >
                    <MdLogout />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-[#0c0c0e]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}