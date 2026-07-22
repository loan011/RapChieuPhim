import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  MdConfirmationNumber,
  MdReceiptLong,
  MdFastfood,
  MdQrCodeScanner,
  MdMenu,
  MdLogout,
  MdLocalActivity,
  MdBarChart,
} from "react-icons/md";
import { useState, useEffect } from "react";
import { getUser } from "../services/authService";
import { getCinemaList } from "../pages/Admin/Cinema/cinemaService";
import { getEmployeeById } from "../pages/Admin/Personnel/employeeService";

const navItems = [
  { to: "/staff/ban-ve", label: "Bán vé", icon: <MdLocalActivity /> },
  { to: "/staff/quan-ly-ve", label: "Quản lý vé", icon: <MdReceiptLong /> },
  { to: "/staff/combo", label: "Đồ ăn", icon: <MdFastfood /> },
  { to: "/staff/quet-qr", label: "Quét QR Vé", icon: <MdQrCodeScanner /> },
  { to: "/staff/quet-qr-do-an", label: "Quét QR Đồ ăn", icon: <MdFastfood /> },
  { to: "/staff/quan-ly-do-an", label: "Quản lý Đồ ăn", icon: <MdReceiptLong /> },
  { to: "/staff/doanh-thu", label: "Doanh thu ngày", icon: <MdBarChart /> },
];

export default function StaffLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [branchName, setBranchName] = useState("Đang tải...");

  const user = getUser();

  useEffect(() => {
    async function loadBranchName() {
      try {
        let cId = user?.cinemaId ?? user?.CinemaId;
        
        // Nếu API thiếu cinemaId, tìm trong mappings fallback do Admin phân quyền
        if (!cId) {
          const email = user?.email ?? user?.Email;
          if (email) {
            const mappings = JSON.parse(localStorage.getItem("staff_cinema_mappings") || "{}");
            cId = mappings[email];
          }
        }

        // TỰ ĐỘNG FETCH CHI NHÁNH TỪ PROFILE NẾU VẪN KHÔNG TÌM THẤY (dành cho Staff đăng nhập ở máy mới)
        if (!cId) {
          const uId = user?.userId ?? user?.UserId ?? user?.id ?? user?.Id;
          if (uId) {
            try {
              const uData = await getEmployeeById(uId);
              cId = uData?.cinemaId ?? uData?.CinemaId;
            } catch (e) {
              console.warn("Không thể fetch profile Staff:", e);
            }
          }
        }

        if (cId) {
          // Gắn ngược lại vào localStorage để các trang như Quản Lý Vé, Doanh Thu lọc đúng chi nhánh
          if (user && !user.cinemaId && !user.CinemaId) {
            user.cinemaId = cId;
            localStorage.setItem("user", JSON.stringify(user));
          }

          const cinemas = await getCinemaList();
          const found = cinemas.find(c => String(c.cinemaId ?? c.CinemaId ?? c.id ?? c.Id) === String(cId));
          if (found) {
            setBranchName(found.cinemaName ?? found.CinemaName ?? "T&M Cinema");
            return;
          }
        }
        setBranchName("T&M Cinema");
      } catch (e) {
        setBranchName("T&M Cinema");
      }
    }
    loadBranchName();
  }, []);

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
            <span className="text-sm font-bold leading-tight truncate">{branchName}</span>
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
            Hệ Thống Nhân Viên Rạp Chiếu Phim T&M - {branchName}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}