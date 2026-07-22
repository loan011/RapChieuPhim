import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  MdConfirmationNumber,
  MdReceiptLong,
  MdFastfood,
  MdQrCodeScanner,
  MdMenu,
  MdLogout,
  MdLocalActivity,
  MdBarChart,
  MdPlayCircleOutline,
  MdLockOutline,
} from "react-icons/md";
import { useState, useEffect } from "react";
import { getUser } from "../services/authService";
import { getCinemaList } from "../pages/Admin/Cinema/cinemaService";
import { getMyProfile } from "../pages/Admin/Personnel/employeeService";

const navItems = [
  { to: "/staff/ban-ve", label: "Bán vé", icon: <MdLocalActivity /> },
  { to: "/staff/quan-ly-ve", label: "Quản lý vé", icon: <MdReceiptLong /> },
  { to: "/staff/combo", label: "Đồ ăn", icon: <MdFastfood /> },
  { to: "/staff/quet-qr", label: "Quét QR Vé", icon: <MdQrCodeScanner /> },
  { to: "/staff/quet-qr-do-an", label: "Quét QR Đồ ăn", icon: <MdFastfood /> },
  { to: "/staff/quan-ly-do-an", label: "Quản lý Đồ ăn", icon: <MdReceiptLong /> },
  { to: "/staff/doanh-thu", label: "Doanh thu ngày và kết ca", icon: <MdBarChart /> },
];

export default function StaffLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [branchName, setBranchName] = useState("Đang tải...");

  // Quản lý trạng thái ca làm việc
  const [shiftState, setShiftState] = useState(() => {
    try {
      const saved = localStorage.getItem("staff_shift_state");
      return saved ? JSON.parse(saved) : { status: "NOT_STARTED" };
    } catch (e) {
      return { status: "NOT_STARTED" };
    }
  });

  const [selectedShift, setSelectedShift] = useState("Ca 1 (08:00 - 16:00)");
  const [inputCash, setInputCash] = useState(500000);
  const [timeError, setTimeError] = useState("");

  const user = getUser();

  // Lắng nghe thay đổi trạng thái ca từ các tab/trang khác
  useEffect(() => {
    function handleStateUpdate() {
      try {
        const saved = localStorage.getItem("staff_shift_state");
        setShiftState(saved ? JSON.parse(saved) : { status: "NOT_STARTED" });
      } catch (e) {}
    }
    
    window.addEventListener("storage", handleStateUpdate);
    window.addEventListener("shiftStateChange", handleStateUpdate);
    
    return () => {
      window.removeEventListener("storage", handleStateUpdate);
      window.removeEventListener("shiftStateChange", handleStateUpdate);
    };
  }, []);

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
          try {
            const uData = await getMyProfile();
            cId = uData?.cinemaId ?? uData?.CinemaId;
          } catch (e) {
            console.warn("Không thể fetch profile Staff:", e);
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

  // Hàm kiểm tra thời gian vào ca (trước 15 phút)
  function validateShiftTime(shift) {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    if (shift.includes("Ca 1")) {
      // Cho phép: 07:45 -> 16:00 (465 -> 960)
      if (totalMinutes < 465 || totalMinutes > 960) {
        return `Không thể mở khóa. Ca 1 chỉ được phép kích hoạt từ 07:45 đến 16:00. Hiện tại là ${now.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}.`;
      }
    } else if (shift.includes("Ca 2")) {
      // Cho phép: 15:45 -> 24:00 (945 -> 1440)
      if (totalMinutes < 945 || totalMinutes > 1440) {
        return `Không thể mở khóa. Ca 2 chỉ được phép kích hoạt từ 15:45 đến 24:00. Hiện tại là ${now.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}.`;
      }
    }
    return null;
  }

  // Kích hoạt ca làm việc
  function handleStartShift() {
    const validationErr = validateShiftTime(selectedShift);
    if (validationErr) {
      setTimeError(validationErr);
      return;
    }
    setTimeError("");

    const newState = {
      status: "STARTED",
      shiftName: selectedShift,
      initialCash: Number(inputCash),
      startedAt: new Date().toISOString()
    };
    localStorage.setItem("staff_shift_state", JSON.stringify(newState));
    setShiftState(newState);
    window.dispatchEvent(new CustomEvent("shiftStateChange"));
  }

  // Khởi tạo ca mới
  function handleResetShift() {
    setTimeError("");
    const newState = { status: "NOT_STARTED" };
    localStorage.setItem("staff_shift_state", JSON.stringify(newState));
    setShiftState(newState);
    window.dispatchEvent(new CustomEvent("shiftStateChange"));
  }

  const isSalesPath = location.pathname.includes("/staff/ban-ve") || location.pathname.includes("/staff/combo");

  // Quyết định nội dung hiển thị trong main view
  let mainContent;
  if (isSalesPath && shiftState.status === "NOT_STARTED") {
    mainContent = (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 bg-white rounded-2xl border border-gray-200 shadow-sm max-w-xl mx-auto my-8">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-4 animate-pulse">
          <MdPlayCircleOutline style={{ fontSize: '2.5rem' }} />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Yêu Cầu Bắt Đầu Ca Làm Việc</h3>
        <p className="text-sm text-gray-500 text-center mb-6 px-4">
          Bạn cần xác nhận bắt đầu ca làm việc của mình để kích hoạt các chức năng bán vé và dịch vụ tại quầy.
        </p>

        <div className="w-full space-y-4 px-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Chọn Ca Làm Việc</label>
            <select
              value={selectedShift}
              onChange={(e) => {
                setSelectedShift(e.target.value);
                setTimeError("");
              }}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50/50 transition-all duration-200"
            >
              <option value="Ca 1 (08:00 - 16:00)">Ca 1 (08:00 - 16:00)</option>
              <option value="Ca 2 (16:00 - 24:00)">Ca 2 (16:00 - 24:00)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Số Tiền Mặt Bàn Giao Đầu Ca (VNĐ)</label>
            <input
              type="number"
              value={inputCash}
              onChange={(e) => setInputCash(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50/50 transition-all duration-200"
              placeholder="500000"
            />
          </div>

          {timeError && (
            <div className="p-3.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-semibold flex items-start gap-2">
              <span className="shrink-0">⚠️</span>
              <span>{timeError}</span>
            </div>
          )}

          <button
            onClick={handleStartShift}
            className="w-full bg-green-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-700 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-md shadow-green-200 mt-2"
          >
            Kích Hoạt & Bắt Đầu Ca
          </button>
        </div>
      </div>
    );
  } else if (isSalesPath && shiftState.status === "ENDED") {
    mainContent = (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 bg-white rounded-2xl border border-gray-200 shadow-sm max-w-xl mx-auto my-8">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
          <MdLockOutline style={{ fontSize: '2.5rem' }} />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Ca Làm Việc Đã Kết Thúc & Đã Khóa Giao Dịch</h3>
        <p className="text-sm text-gray-500 text-center mb-6 px-4">
          Bạn đã hoàn thành kết ca và gửi báo cáo cho Admin. Hệ thống đã tự động khóa các chức năng giao dịch bán hàng của ca này để bảo mật.
        </p>

        <div className="w-full space-y-4 px-4">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Ca đã đóng:</span>
              <span className="font-semibold text-gray-800">{shiftState.shiftName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Thời gian đóng ca:</span>
              <span className="font-semibold text-gray-800">
                {shiftState.endedAt ? new Date(shiftState.endedAt).toLocaleTimeString("vi-VN") : ""}
              </span>
            </div>
          </div>

          <button
            onClick={handleResetShift}
            className="w-full bg-gray-800 text-white py-3 rounded-xl text-sm font-semibold hover:bg-gray-900 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-md"
          >
            Mở Ca Làm Việc Mới
          </button>
        </div>
      </div>
    );
  } else {
    mainContent = <Outlet />;
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-14"
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
          {mainContent}
        </main>
      </div>
    </div>
  );
}