import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
  MdBarChart, 
  MdAttachMoney, 
  MdReceiptLong, 
  MdLocalActivity, 
  MdSend, 
  MdClose, 
  MdChevronLeft, 
  MdChevronRight, 
  MdToday,
  MdInfoOutline,
  MdCheckCircle,
  MdFastfood,
  MdPerson,
  MdSearch,
  MdPayments,
  MdQrCode2,
  MdAccessTime,
  MdAccountBalanceWallet,
  MdCheck,
  MdWarning
} from "react-icons/md";
import { getDailyRevenue, sendDailyRevenueReport } from "./dailyRevenueService";
import "./DoanhThu.css";

export default function DoanhThu() {
  const [date, setDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Trạng thái lọc Ca làm việc trên giao diện: "ALL" | "CA1" | "CA2"
  const [selectedShiftFilter, setSelectedShiftFilter] = useState("ALL");

  // Trạng thái modal gửi báo cáo kết ca
  const [showSendModal, setShowSendModal] = useState(false);
  const [shiftForReport, setShiftForReport] = useState("Ca 1 (08:00 - 16:00)");
  const [initialCash, setInitialCash] = useState(500000); // 500k mặc định tiền đầu ca
  const [actualCash, setActualCash] = useState(0);
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [sendTime, setSendTime] = useState("");

  // Trạng thái hóa đơn chi tiết được chọn
  const [selectedBill, setSelectedBill] = useState(null);

  // Tìm kiếm theo mã hóa đơn
  const [searchQuery, setSearchQuery] = useState("");

  // Gọi API lấy dữ liệu mỗi khi date thay đổi
  useEffect(() => {
    fetchData();
  }, [date]);

  async function fetchData() {
    try {
      setLoading(true);
      setError("");
      setSearchQuery(""); // Reset search query when switching date
      const data = await getDailyRevenue(date);
      setReportData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Không thể tải báo cáo doanh thu.");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }

  // Lọc danh sách hóa đơn theo Ca được chọn
  const shiftBills = useMemo(() => {
    if (!reportData?.bills) return [];
    if (selectedShiftFilter === "ALL") return reportData.bills;

    return reportData.bills.filter(bill => {
      if (!bill.paymentDate) return true;
      const hours = new Date(bill.paymentDate).getHours();
      if (selectedShiftFilter === "CA1") {
        return hours >= 8 && hours < 16; // Ca 1: 08:00 - 15:59
      } else if (selectedShiftFilter === "CA2") {
        return hours >= 16 || hours < 8;  // Ca 2: 16:00 - 23:59
      }
      return true;
    });
  }, [reportData, selectedShiftFilter]);

  // Danh sách hóa đơn sau khi áp dụng cả lọc Ca & Tìm kiếm
  const filteredBills = useMemo(() => {
    return shiftBills.filter(bill =>
      bill.billCode.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [shiftBills, searchQuery]);

  // Thống kê doanh thu theo Ca được chọn
  const currentShiftMetrics = useMemo(() => {
    if (!shiftBills) return {
      totalTicketRevenue: 0,
      totalConcessionRevenue: 0,
      totalDiscount: 0,
      totalOverallRevenue: 0,
      totalTicketsCount: 0,
      totalCashRevenue: 0,
      totalTransferRevenue: 0,
      totalCashBillsCount: 0,
      totalTransferBillsCount: 0,
      billsCount: 0
    };

    let ticketRev = 0;
    let concessionRev = 0;
    let discount = 0;
    let overallRev = 0;
    let ticketsCount = 0;
    let cashRev = 0;
    let transferRev = 0;
    let cashCount = 0;
    let transferCount = 0;

    for (const b of shiftBills) {
      ticketRev += b.ticketSubtotal || 0;
      concessionRev += b.concessionSubtotal || 0;
      discount += b.discountAmt || 0;
      overallRev += b.totalAmount || 0;
      ticketsCount += (b.tickets?.length || 0);

      const pm = (b.paymentMethod || "").toLowerCase();
      if (pm === "cash" || pm === "tiền mặt") {
        cashRev += b.totalAmount || 0;
        cashCount += 1;
      } else {
        transferRev += b.totalAmount || 0;
        transferCount += 1;
      }
    }

    return {
      totalTicketRevenue: ticketRev,
      totalConcessionRevenue: concessionRev,
      totalDiscount: discount,
      totalOverallRevenue: overallRev,
      totalTicketsCount: ticketsCount,
      totalCashRevenue: cashRev,
      totalTransferRevenue: transferRev,
      totalCashBillsCount: cashCount,
      totalTransferBillsCount: transferCount,
      billsCount: shiftBills.length
    };
  }, [shiftBills]);

  // Lấy chi tiết thông số thống kê của một Ca hoặc Cả ngày
  function getShiftMetricsByName(sName) {
    if (!reportData?.bills) return {
      totalTicketRevenue: 0,
      totalConcessionRevenue: 0,
      totalDiscount: 0,
      totalOverallRevenue: 0,
      totalTicketsCount: 0,
      totalCashRevenue: 0,
      totalTransferRevenue: 0,
      totalCashBillsCount: 0,
      totalTransferBillsCount: 0,
      bills: []
    };

    const isFullDay = sName.includes("Cả ngày") || sName.includes("Cả Ngày") || sName.includes("Full Day") || sName.includes("Ca 2");
    const isCa1 = sName.includes("Ca 1");

    const billsForShift = reportData.bills.filter(bill => {
      if (isFullDay) return true;
      if (!bill.paymentDate) return true;
      const hours = new Date(bill.paymentDate).getHours();
      return isCa1 ? (hours >= 8 && hours < 16) : (hours >= 16 || hours < 8);
    });

    let ticketRev = 0;
    let concessionRev = 0;
    let discount = 0;
    let overallRev = 0;
    let ticketsCount = 0;
    let cashRev = 0;
    let transferRev = 0;
    let cashCount = 0;
    let transferCount = 0;

    for (const b of billsForShift) {
      ticketRev += b.ticketSubtotal || 0;
      concessionRev += b.concessionSubtotal || 0;
      discount += b.discountAmt || 0;
      overallRev += b.totalAmount || 0;
      ticketsCount += (b.tickets?.length || 0);

      const pm = (b.paymentMethod || "").toLowerCase();
      if (pm === "cash" || pm === "tiền mặt") {
        cashRev += b.totalAmount || 0;
        cashCount += 1;
      } else {
        transferRev += b.totalAmount || 0;
        transferCount += 1;
      }
    }

    return {
      totalTicketRevenue: ticketRev,
      totalConcessionRevenue: concessionRev,
      totalDiscount: discount,
      totalOverallRevenue: overallRev,
      totalTicketsCount: ticketsCount,
      totalCashRevenue: cashRev,
      totalTransferRevenue: transferRev,
      totalCashBillsCount: cashCount,
      totalTransferBillsCount: transferCount,
      bills: billsForShift
    };
  }

  // Mở modal gửi báo cáo kết ca
  function handleOpenSendModal() {
    const now = new Date();
    const currentHour = now.getHours();
    
    let defaultShift = selectedShiftFilter === "CA2" ? "Ca 2 (16:00 - 24:00)" : "Ca 1 (08:00 - 16:00)";
    let initCash = 500000;
    
    try {
      const savedState = JSON.parse(localStorage.getItem("staff_shift_state") || "{}");
      if (savedState) {
        if (savedState.shiftName) defaultShift = savedState.shiftName;
        if (savedState.initialCash !== undefined) initCash = Number(savedState.initialCash);
      }
    } catch (e) {}

    // Kiểm tra thời gian kết ca (chỉ được thực hiện khi qua khung giờ ca đó)
    const todayStr = now.toLocaleDateString("en-CA");
    if (date === todayStr) {
      if (defaultShift.includes("Ca 1") && currentHour < 16) {
        alert("Không thể thực hiện kết ca. Ca 1 chỉ được phép gửi báo cáo từ 16:00 trở đi.");
        return;
      }
      if (defaultShift.includes("Ca 2") && currentHour >= 8 && currentHour < 24) {
        alert("Không thể thực hiện kết ca. Ca 2 chỉ được phép gửi báo cáo từ 24:00 (00:00 ngày hôm sau) trở đi.");
        return;
      }
    }

    setShiftForReport(defaultShift);

    const timeStr = now.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSendTime(timeStr);

    const metrics = getShiftMetricsByName(defaultShift);
    setInitialCash(initCash);
    setActualCash(initCash + metrics.totalCashRevenue); // Mặc định lý tưởng
    setShowSendModal(true);
  }

  // Đổi Ca trong modal kết ca
  function handleShiftChangeInModal(newShift) {
    // Kiểm tra thời gian nếu đổi ca trong modal
    const now = new Date();
    const todayStr = now.toLocaleDateString("en-CA");
    if (date === todayStr) {
      const currentHour = now.getHours();
      if (newShift.includes("Ca 1") && currentHour < 16) {
        alert("Ca 1 chỉ được phép kết ca từ 16:00 trở đi.");
        return;
      }
      if (newShift.includes("Ca 2")) {
        alert("Ca 2 chỉ được phép kết ca từ 24:00 (00:00 ngày hôm sau) trở đi.");
        return;
      }
    }

    setShiftForReport(newShift);
    const metrics = getShiftMetricsByName(newShift);
    setActualCash(initialCash + metrics.totalCashRevenue);
  }

  // Điều hướng ngày
  function handlePrevDay() {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    setDate(d.toLocaleDateString("en-CA"));
  }

  function handleNextDay() {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    setDate(d.toLocaleDateString("en-CA"));
  }

  function handleJumpToToday() {
    setDate(new Date().toLocaleDateString("en-CA"));
  }

  // Xử lý gửi báo cáo kết ca cho Admin
  async function handleSendReport(e) {
    e.preventDefault();
    if (!reportData) return;

    const now = new Date();
    const todayStr = now.toLocaleDateString("en-CA");
    if (date === todayStr) {
      const currentHour = now.getHours();
      if (shiftForReport.includes("Ca 1") && currentHour < 16) {
        alert("Không thể gửi báo cáo. Ca 1 chỉ được phép kết ca từ 16:00 trở đi.");
        return;
      }
      if (shiftForReport.includes("Ca 2")) {
        alert("Không thể gửi báo cáo. Ca 2 chỉ được phép gửi báo cáo từ 24:00 (00:00 ngày hôm sau) trở đi.");
        return;
      }
    }

    const isFullDayReport = shiftForReport.includes("Cả ngày") || shiftForReport.includes("Cả Ngày") || shiftForReport.includes("Full Day");
    const modalShiftMetrics = getShiftMetricsByName(shiftForReport);

    const theoreticalCash = isFullDayReport ? 0 : (Number(initialCash || 0) + modalShiftMetrics.totalCashRevenue);
    const cashDiff = isFullDayReport ? 0 : (Number(actualCash || 0) - theoreticalCash);

    try {
      setSending(true);
      await sendDailyRevenueReport({
        date: date,
        shiftName: shiftForReport,
        initialCash: isFullDayReport ? 0 : Number(initialCash || 0),
        actualCash: isFullDayReport ? 0 : Number(actualCash || 0),
        cashDifference: cashDiff,
        notes: notes,
        sendTime: sendTime,
        shiftRevenueData: modalShiftMetrics
      });

      // Cập nhật trạng thái ca sang ENDED để khóa giao dịch
      const currentShiftState = {
        status: "ENDED",
        shiftName: shiftForReport,
        endedAt: new Date().toISOString(),
        initialCash: isFullDayReport ? 0 : Number(initialCash || 0)
      };
      localStorage.setItem("staff_shift_state", JSON.stringify(currentShiftState));
      window.dispatchEvent(new CustomEvent("shiftStateChange"));

      alert(`Đã gửi ${isFullDayReport ? 'báo cáo tổng doanh thu cả ngày' : `báo cáo kết ca ${shiftForReport}`} ngày ${date} cho Admin thành công!`);
      setShowSendModal(false);
      setNotes("");
    } catch (err) {
      console.error(err);
      alert(err.message || "Gửi báo cáo thất bại.");
    } finally {
      setSending(false);
    }
  }

  // Định dạng tiền tệ VND
  function formatVND(value) {
    return (value || 0).toLocaleString("vi-VN") + " đ";
  }

  return (
    <div className="staff-doanhthu-container space-y-6">
      {/* TIÊU ĐỀ & ĐIỀU HƯỚNG NGÀY */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h4 className="font-bold text-2xl text-gray-805 flex items-center gap-2">
            <MdBarChart className="text-green-600 text-3xl" /> Doanh Thu Hằng Ngày
          </h4>
          <p className="text-sm text-gray-500 mt-1">Xem, kiểm tra các hóa đơn bán vé & đồ ăn và gửi kết quả về cho Admin.</p>
        </div>

        {/* Bộ lọc Ngày */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-xs">
          <button 
            onClick={handlePrevDay} 
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
            title="Ngày trước"
          >
            <MdChevronLeft className="text-xl" />
          </button>
          
          <div className="relative flex items-center">
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="border-0 bg-transparent text-sm font-semibold text-gray-800 focus:ring-0 focus:outline-none cursor-pointer py-1 px-2"
            />
          </div>

          <button 
            onClick={handleNextDay} 
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
            title="Ngày sau"
          >
            <MdChevronRight className="text-xl" />
          </button>

          <button 
            onClick={handleJumpToToday}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-700 transition-colors ml-1"
          >
            <MdToday className="text-sm" /> Hôm nay
          </button>
        </div>
      </div>

      {/* THÔNG BÁO LỖI */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2 shadow-xs">
          <MdInfoOutline className="text-lg shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* DỮ LIỆU ĐANG TẢI */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-xs">
          <span className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-green-600 rounded-full mb-3"></span>
          <p className="text-gray-500 text-sm font-medium">Đang tải báo cáo doanh thu ngày {date}...</p>
        </div>
      ) : (
        reportData && (
          <>
            {/* BỘ LỌC CA LÀM VIỆC (SHIFT FILTER TABS) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1 flex items-center gap-1">
                  <MdAccessTime className="text-base text-green-600" /> Chọn Ca Làm Việc:
                </span>
                <div className="flex bg-gray-100/80 p-1 rounded-xl gap-1">
                  <button
                    onClick={() => setSelectedShiftFilter("ALL")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedShiftFilter === "ALL"
                        ? "bg-white text-green-700 shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Toàn Bộ Ngày
                  </button>
                  <button
                    onClick={() => setSelectedShiftFilter("CA1")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      selectedShiftFilter === "CA1"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <span>Ca 1</span>
                    <span className="text-[10px] opacity-80">(08:00 - 16:00)</span>
                  </button>
                  <button
                    onClick={() => setSelectedShiftFilter("CA2")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      selectedShiftFilter === "CA2"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <span>Ca 2</span>
                    <span className="text-[10px] opacity-80">(16:00 - 24:00)</span>
                  </button>
                </div>
              </div>

              <div className="text-xs text-gray-500 font-medium">
                Hiển thị <span className="font-bold text-gray-800">{shiftBills.length}</span> hóa đơn ({selectedShiftFilter === "ALL" ? "Cả ngày" : selectedShiftFilter === "CA1" ? "Ca 1" : "Ca 2"})
              </div>
            </div>

            {/* THẺ THỐNG KÊ DOANH THU */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Thẻ 1: Tổng doanh thu */}
              <div className="relative overflow-hidden bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-2xl shadow-md p-6 transition-all duration-200 hover:shadow-lg">
                <div className="absolute right-2 -bottom-4 text-white/10 text-9xl pointer-events-none">
                  <MdAttachMoney />
                </div>
                <p className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Tổng Doanh Thu {selectedShiftFilter === "ALL" ? "Ngày" : selectedShiftFilter === "CA1" ? "Ca 1" : "Ca 2"}
                </p>
                <h3 className="text-3xl font-extrabold mt-2 tracking-tight">
                  {formatVND(currentShiftMetrics.totalOverallRevenue)}
                </h3>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/20 text-xs text-white/90">
                  <span>Số lượng hóa đơn:</span>
                  <span className="font-bold text-sm bg-white/20 px-2.5 py-0.5 rounded-full">
                    {currentShiftMetrics.billsCount} đơn
                  </span>
                </div>
              </div>

              {/* Thẻ 2: Doanh thu vé */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Doanh Thu Bán Vé</span>
                    <span className="p-2 bg-green-50 rounded-xl text-green-600"><MdLocalActivity className="text-xl" /></span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mt-2">
                    {formatVND(currentShiftMetrics.totalTicketRevenue)}
                  </h3>
                </div>
                <div className="flex justify-between items-center mt-6 pt-3 border-t border-gray-50 text-xs text-gray-500">
                  <span>Tổng số vé bán ra:</span>
                  <span className="font-bold text-gray-800 text-sm">{currentShiftMetrics.totalTicketsCount} vé</span>
                </div>
              </div>

              {/* Thẻ 3: Doanh thu đồ ăn, nước uống */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Doanh Thu Nước & Đồ Ăn</span>
                    <span className="p-2 bg-blue-50 rounded-xl text-blue-600"><MdFastfood className="text-xl" /></span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mt-2">
                    {formatVND(currentShiftMetrics.totalConcessionRevenue)}
                  </h3>
                </div>
                <div className="flex justify-between items-center mt-6 pt-3 border-t border-gray-50 text-xs text-gray-500">
                  <span>Khấu trừ giảm giá:</span>
                  <span className="font-bold text-red-500 text-sm">-{formatVND(currentShiftMetrics.totalDiscount)}</span>
                </div>
              </div>
            </div>

            {/* THẺ THỐNG KÊ PHƯƠNG THỨC THANH TOÁN (TIỀN MẶT & TIỀN CK) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Thẻ 1: Tiền mặt */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 text-2xl">
                    <MdPayments />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tổng Tiền Mặt</span>
                    <h3 className="text-xl font-bold text-gray-800 mt-0.5">
                      {formatVND(currentShiftMetrics.totalCashRevenue)}
                    </h3>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-amber-50 text-amber-700 font-bold text-xs px-2.5 py-1 rounded-full border border-amber-100">
                    {currentShiftMetrics.totalCashBillsCount || 0} đơn
                  </span>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {currentShiftMetrics.totalOverallRevenue > 0
                      ? `${Math.round(((currentShiftMetrics.totalCashRevenue || 0) / currentShiftMetrics.totalOverallRevenue) * 100)}% ca`
                      : "0% ca"}
                  </p>
                </div>
              </div>

              {/* Thẻ 2: Tiền Chuyển Khoản / CK */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 text-2xl">
                    <MdQrCode2 />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tổng Tiền Chuyển Khoản (CK)</span>
                    <h3 className="text-xl font-bold text-gray-800 mt-0.5">
                      {formatVND(currentShiftMetrics.totalTransferRevenue)}
                    </h3>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-blue-50 text-blue-700 font-bold text-xs px-2.5 py-1 rounded-full border border-blue-100">
                    {currentShiftMetrics.totalTransferBillsCount || 0} đơn
                  </span>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {currentShiftMetrics.totalOverallRevenue > 0
                      ? `${Math.round(((currentShiftMetrics.totalTransferRevenue || 0) / currentShiftMetrics.totalOverallRevenue) * 100)}% ca`
                      : "0% ca"}
                  </p>
                </div>
              </div>
            </div>

            {/* BẢNG TỔNG QUAN & NÚT GỬI BÁO CÁO KẾT CA */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl text-2xl ${date === new Date().toLocaleDateString("en-CA") ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  <MdCheckCircle />
                </div>
                <div>
                  <h5 className="font-bold text-gray-800 text-base">Xác Nhận & Kết Ca Làm Việc</h5>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {date === new Date().toLocaleDateString("en-CA")
                      ? "Bàn giao tiền mặt kiểm két, số liệu vé & đồ ăn của Ca làm việc gửi trực tiếp cho Admin duyệt."
                      : "Chỉ cho phép gửi báo cáo kết ca của ngày hiện tại (hôm nay)."}
                  </p>
                </div>
              </div>
              <button
                onClick={handleOpenSendModal}
                disabled={date !== new Date().toLocaleDateString("en-CA")}
                className="w-full md:w-auto bg-green-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-green-700 hover:shadow-lg hover:shadow-green-100 active:scale-98 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
                title={
                  date !== new Date().toLocaleDateString("en-CA")
                    ? "Chỉ có thể gửi báo cáo cho ngày hôm nay"
                    : ""
                }
              >
                <MdSend className="text-base" />{" "}
                {selectedShiftFilter === "ALL"
                  ? "Tổng doanh thu ngày"
                  : selectedShiftFilter === "CA1"
                  ? "Kết Ca 1 & Gửi Báo Cáo"
                  : "Kết Ca 2 & Gửi Doanh Thu Ngày"}
              </button>
            </div>

            {/* DANH SÁCH CHI TIẾT CÁC HÓA ĐƠN TRONG NGÀY/CA */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4 pb-2 border-b border-gray-50">
                <h5 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-green-600 rounded-full"></span>
                  Chi Tiết Các Hóa Đơn ({searchQuery ? `${filteredBills.length} / ${shiftBills.length}` : shiftBills.length})
                </h5>
                <div className="relative w-full sm:w-64">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 text-lg">
                    <MdSearch />
                  </span>
                  <input
                    type="text"
                    placeholder="Tìm mã hóa đơn (BILL.../CB...)"
                    className="w-full pl-9 pr-4 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50/50 transition-all duration-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-600 font-semibold">
                      <th className="px-4 py-3 text-left">Mã HĐ</th>
                      <th className="px-4 py-3 text-left">Thời Gian</th>
                      <th className="px-4 py-3 text-left">Khách Hàng</th>
                      <th className="px-4 py-3 text-left">Vé (Ghế)</th>
                      <th className="px-4 py-3 text-left">Nước / Combo</th>
                      <th className="px-4 py-3 text-left">Thanh Toán</th>
                      <th className="px-4 py-3 text-right">Tổng Tiền</th>
                      <th className="px-4 py-3 text-center">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredBills.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-gray-400 font-medium">
                          {searchQuery
                            ? `Không tìm thấy hóa đơn nào khớp với từ khóa "${searchQuery}"`
                            : `Chưa có giao dịch thành công nào trong ca này (${date})`}
                        </td>
                      </tr>
                    ) : (
                      filteredBills.map((bill) => (
                        <tr key={bill.paymentId} className="hover:bg-gray-50/50 transition-colors">
                          {/* Mã HĐ */}
                          <td className="px-4 py-3.5 font-bold text-gray-800">{bill.billCode}</td>
                          
                          {/* Thời Gian */}
                          <td className="px-4 py-3.5 text-gray-500">
                            {new Date(bill.paymentDate).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </td>
                          
                          {/* Khách Hàng */}
                          <td className="px-4 py-3.5">
                            <div className="font-medium text-gray-805">{bill.customerName}</div>
                            {bill.customerEmail && bill.customerEmail !== "Tại quầy" && bill.customerEmail !== "N/A" && (
                              <div className="text-[11px] text-gray-400">{bill.customerEmail}</div>
                            )}
                          </td>

                          {/* Vé (Ghế) */}
                          <td className="px-4 py-3.5">
                            {bill.tickets.length > 0 ? (
                              <div className="space-y-1">
                                <div className="font-medium text-gray-700 truncate max-w-[150px]" title={bill.tickets[0].movieTitle}>
                                  {bill.tickets[0].movieTitle}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {bill.tickets.map(t => (
                                    <span key={t.bookingId} className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono border border-green-100">
                                      {t.seatNumber}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-xs">Không mua vé</span>
                            )}
                          </td>
                          
                          {/* Nước / Combo */}
                          <td className="px-4 py-3.5 text-xs">
                            {bill.concessions.length > 0 ? (
                              <div className="text-gray-600 space-y-0.5 max-w-[150px] truncate" title={bill.concessions.map(c => `${c.name} (x${c.quantity})`).join(", ")}>
                                {bill.concessions.map((c, idx) => (
                                  <div key={idx}>
                                    • {c.name} <span className="font-bold text-gray-800">x{c.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-xs">Không mua nước</span>
                            )}
                          </td>
                          
                          {/* Phương thức thanh toán */}
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                              bill.paymentMethod === "Cash" || bill.paymentMethod === "Tiền mặt"
                                ? "bg-amber-50 text-amber-700 border border-amber-100"
                                : "bg-blue-50 text-blue-700 border border-blue-100"
                            }`}>
                              {bill.paymentMethod === "Cash" ? "Tiền mặt" : bill.paymentMethod}
                            </span>
                          </td>

                          {/* Tổng Tiền */}
                          <td className="px-4 py-3.5 text-right font-bold text-green-700">
                            {formatVND(bill.totalAmount)}
                          </td>

                          {/* Hành Động */}
                          <td className="px-4 py-3.5 text-center">
                            <button
                              onClick={() => setSelectedBill(bill)}
                              className="text-xs font-semibold text-green-700 hover:text-green-800 hover:bg-green-50 px-2.5 py-1 rounded-lg transition-colors border border-green-200"
                            >
                              Xem hóa đơn
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      )}

      {/* PORTAL MODAL GỬI BÁO CÁO KẾT CA & KIỂM KÉT TIỀN MẶT */}
      {showSendModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 text-green-700 rounded-xl">
                    <MdAccountBalanceWallet className="text-xl" />
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-800 text-base">Xác Nhận Kết Ca & Gửi Admin</h5>
                    <p className="text-xs text-gray-500">Kiểm kê quỹ tiền mặt và tổng kết doanh thu ca làm việc</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSendModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
                >
                  <MdClose />
                </button>
              </div>

              <form onSubmit={handleSendReport} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                {/* 1. Chọn Loại Báo Cáo / Ca làm việc */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <MdAccessTime className="text-green-600 text-sm" /> Phạm Vi Báo Cáo / Ca Kết Thúc:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleShiftChangeInModal("Ca 1 (08:00 - 16:00)")}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex flex-col gap-0.5 ${
                        shiftForReport.includes("Ca 1")
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-100"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-xs">Ca 1</span>
                      <span className="text-[10px] font-normal text-gray-500">08:00 - 16:00</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShiftChangeInModal("Ca 2 (16:00 - 24:00)")}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex flex-col gap-0.5 ${
                        shiftForReport.includes("Ca 2")
                          ? "bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-100"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-xs">Ca 2</span>
                      <span className="text-[10px] font-normal text-gray-500">16:00 - 24:00</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShiftChangeInModal("Cả ngày (08:00 - 24:00)")}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex flex-col gap-0.5 ${
                        shiftForReport.includes("Cả ngày") || shiftForReport.includes("Full Day")
                          ? "bg-purple-50 border-purple-500 text-purple-800 ring-2 ring-purple-100"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-xs">Cả ngày</span>
                      <span className="text-[10px] font-normal text-gray-500">08:00 - 24:00</span>
                    </button>
                  </div>
                </div>

                {/* 2. Tóm tắt thông số ca / cả ngày */}
                {(() => {
                  const isFullDayReport = shiftForReport.includes("Cả ngày") || shiftForReport.includes("Cả Ngày") || shiftForReport.includes("Full Day");
                  const modalShiftMetrics = getShiftMetricsByName(shiftForReport);
                  const expectedCashInShift = modalShiftMetrics.totalCashRevenue;
                  const theoreticalCash = Number(initialCash || 0) + expectedCashInShift;
                  const cashDiff = Number(actualCash || 0) - theoreticalCash;

                  return (
                    <>
                      <div className="bg-gray-50 rounded-xl p-3.5 space-y-2 border border-gray-100 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Ngày gửi báo cáo:</span>
                          <span className="font-bold text-gray-800">{date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Giờ gửi báo cáo:</span>
                          <span className="font-bold text-gray-800">{sendTime}</span>
                        </div>

                        <div className="flex justify-between items-center border-t border-gray-200/60 pt-2 mt-1 font-bold text-sm">
                          <span className="text-gray-800">{isFullDayReport ? "TỔNG DOANH THU CẢ NGÀY:" : "TỔNG DOANH THU CA:"}</span>
                          <span className="text-green-700 text-base">{formatVND(modalShiftMetrics.totalOverallRevenue)}</span>
                        </div>

                        <div className="flex justify-between text-xs text-gray-600">
                          <span>+ Tiền chuyển khoản (CK) {isFullDayReport ? "cả ngày" : "ca"}:</span>
                          <span className="font-bold text-blue-700">{formatVND(modalShiftMetrics.totalTransferRevenue)} <span className="font-normal text-gray-500 text-[11px]">({modalShiftMetrics.totalTransferBillsCount} đơn)</span></span>
                        </div>

                        <div className="flex justify-between text-xs text-gray-600">
                          <span>+ Tiền mặt thu {isFullDayReport ? "cả ngày" : "trong ca"}:</span>
                          <span className="font-bold text-emerald-700">{formatVND(modalShiftMetrics.totalCashRevenue)} <span className="font-normal text-gray-500 text-[11px]">({modalShiftMetrics.totalCashBillsCount} đơn)</span></span>
                        </div>

                        <div className="flex justify-between text-[11px] text-gray-400 border-t border-gray-100 pt-1.5 mt-1">
                          <span>Doanh thu vé & đồ ăn:</span>
                          <span>Vé: {formatVND(modalShiftMetrics.totalTicketRevenue)} ({modalShiftMetrics.totalTicketsCount} vé) | Đồ ăn: {formatVND(modalShiftMetrics.totalConcessionRevenue)}</span>
                        </div>
                      </div>

                      {/* 3. Kiểm kê Két tiền mặt (Chỉ hiển thị khi kết ca, ẩn khi báo cáo tổng cả ngày) */}
                      {!isFullDayReport && (
                        <div className="bg-amber-50/40 border border-amber-200/80 rounded-xl p-4 space-y-3">
                          <h6 className="font-bold text-xs text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                            <MdAccountBalanceWallet className="text-base text-amber-600" />
                            Bàn Giao & Kiểm Két Tiền Mặt:
                          </h6>

                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                Tiền đầu ca (bàn giao):
                              </label>
                              <input
                                type="number"
                                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 font-bold text-gray-800 bg-white focus:outline-none focus:border-amber-500"
                                value={initialCash}
                                onChange={(e) => setInitialCash(Number(e.target.value))}
                                placeholder="500000"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                Tiền đếm thực tế cuối ca:
                              </label>
                              <input
                                type="number"
                                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 font-bold text-gray-800 bg-white focus:outline-none focus:border-amber-500"
                                value={actualCash}
                                onChange={(e) => setActualCash(Number(e.target.value))}
                                placeholder="0"
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-xs pt-1 border-t border-amber-200/60">
                            <span className="text-gray-600 font-medium">Tiền mặt lý thuyết trong két:</span>
                            <span className="font-bold text-gray-900">{formatVND(theoreticalCash)}</span>
                          </div>

                          {/* Status chênh lệch */}
                          <div className={`p-2.5 rounded-lg text-xs font-bold flex items-center justify-between border ${
                            cashDiff === 0
                              ? "bg-green-100/70 border-green-300 text-green-800"
                              : cashDiff > 0
                              ? "bg-amber-100/70 border-amber-300 text-amber-800"
                              : "bg-red-100/70 border-red-300 text-red-800"
                          }`}>
                            <span className="flex items-center gap-1">
                              {cashDiff === 0 ? <MdCheck className="text-base" /> : <MdWarning className="text-base" />}
                              Chênh lệch két tiền:
                            </span>
                            <span>
                              {cashDiff === 0 ? "Khớp 0 đ" : (cashDiff > 0 ? `Dư +${formatVND(cashDiff)}` : `Thiếu ${formatVND(cashDiff)}`)}
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* 4. Ghi chú thêm */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Ghi Chú Bàn Giao (Tùy chọn)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Nhập ghi chú bàn giao ca, lý do chênh lệch (nếu có)..."
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50/50 transition-all duration-200"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {/* Nút hành động */}
                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowSendModal(false)}
                    className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-5 py-2 text-sm font-semibold rounded-xl bg-green-600 text-white hover:bg-green-700 hover:shadow-lg hover:shadow-green-100 disabled:opacity-60 transition-all flex items-center gap-1.5"
                  >
                    {sending ? (
                      <>
                        <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <MdSend /> Xác Nhận Kết Ca & Gửi
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* PORTAL MODAL CHI TIẾT HÓA ĐƠN (RECEIPT STYLE) */}
      {selectedBill &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
              {/* Header Modal */}
              <div className="flex justify-between items-center px-5 py-3.5 border-b border-gray-100 bg-gray-50 shrink-0">
                <span className="font-bold text-sm text-gray-550 uppercase tracking-wider">Chi Tiết Hóa Đơn Thanh Toán</span>
                <button
                  onClick={() => setSelectedBill(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  <MdClose />
                </button>
              </div>

              {/* Receipt Area (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 bg-amber-50/10">
                <div className="receipt-paper bg-white border border-gray-200 rounded-xl p-5 shadow-xs relative text-gray-800">
                  {/* Decorative Cutout Edge Top */}
                  <div className="receipt-top-edge"></div>

                  {/* Cinema Brand */}
                  <div className="text-center space-y-1 mt-2">
                    <h3 className="font-black text-xl tracking-wider text-green-700">RẠP CHIẾU PHIM T&M</h3>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Hóa Đơn Bán Hàng</p>
                  </div>

                  <div className="border-t border-dashed border-gray-300 my-4"></div>

                  {/* Metadata */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Số hóa đơn:</span>
                      <span className="font-bold">{selectedBill.billCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Thời gian:</span>
                      <span>
                        {new Date(selectedBill.paymentDate).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Thanh toán:</span>
                      <span className="font-semibold">{selectedBill.paymentMethod === "Cash" ? "Tiền mặt" : selectedBill.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Nhân viên:</span>
                      <span>{selectedBill.staffName}</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-gray-300 my-4"></div>

                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-lg p-2.5 text-xs space-y-1 border border-gray-100">
                    <div className="flex items-center gap-1.5 text-gray-500 font-semibold mb-1">
                      <MdPerson className="text-sm" /> Khách hàng:
                    </div>
                    <div className="font-bold text-gray-700 pl-5">{selectedBill.customerName}</div>
                    {selectedBill.customerEmail && selectedBill.customerEmail !== "Tại quầy" && selectedBill.customerEmail !== "N/A" && (
                      <div className="text-gray-500 pl-5 text-[11px]">{selectedBill.customerEmail}</div>
                    )}
                  </div>

                  {/* Ticket Items */}
                  {selectedBill.tickets.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <MdLocalActivity /> Chi Tiết Vé Phim
                      </div>
                      
                      <div className="bg-green-50/20 border border-green-100/50 rounded-lg p-3 space-y-2">
                        <div className="font-bold text-sm text-gray-800">{selectedBill.tickets[0].movieTitle}</div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div className="flex justify-between">
                            <span>Suất chiếu:</span>
                            <span className="font-medium text-gray-750">
                              {new Date(selectedBill.tickets[0].showtime).toLocaleString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Phòng chiếu:</span>
                            <span className="font-medium text-gray-750">{selectedBill.tickets[0].roomName}</span>
                          </div>
                          <div className="flex justify-between items-start">
                            <span>Danh sách ghế ({selectedBill.tickets.length}):</span>
                            <div className="flex flex-wrap justify-end gap-1 max-w-[150px]">
                              {selectedBill.tickets.map(t => (
                                <span key={t.bookingId} className="bg-green-600 text-white font-bold font-mono px-1 rounded text-[10px]">
                                  {t.seatNumber}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Concession Items */}
                  {selectedBill.concessions.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <MdFastfood /> Đồ Ăn & Nước Uống
                      </div>
                      <div className="space-y-2 text-xs">
                        {selectedBill.concessions.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start">
                            <div className="max-w-[200px]">
                              <span className="font-semibold text-gray-700">{item.name}</span>
                              <span className="text-gray-400 ml-1.5">x{item.quantity}</span>
                            </div>
                            <span className="font-medium">{formatVND(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-dashed border-gray-300 my-4"></div>

                  {/* Calculation Details */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tiền vé:</span>
                      <span>{formatVND(selectedBill.ticketSubtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tiền nước:</span>
                      <span>{formatVND(selectedBill.concessionSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-red-500 font-medium">
                      <span>{selectedBill.discountReason || "Khấu trừ giảm giá"}:</span>
                      <span>-{formatVND(selectedBill.discountAmt)}</span>
                    </div>
                    <div className="flex justify-between font-black text-sm text-gray-900 border-t border-gray-100 pt-2 mt-2">
                      <span>TỔNG CỘNG:</span>
                      <span className="text-green-700 text-base">{formatVND(selectedBill.totalAmount)}</span>
                    </div>

                    {(selectedBill.paymentMethod === "Cash" || selectedBill.paymentMethod === "Tiền mặt") && (
                      <div className="space-y-1 text-xs border-t border-dashed border-gray-300 pt-2 mt-2 font-medium">
                        <div className="flex justify-between text-gray-700 font-semibold">
                          <span>+ Thanh toán tiền mặt:</span>
                          <span>{formatVND(selectedBill.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                          <span>Tiền nhận:</span>
                          <span>{formatVND(selectedBill.cashReceived || selectedBill.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-gray-900 font-bold">
                          <span>Tiền thừa:</span>
                          <span>{formatVND(selectedBill.changeAmount ?? (selectedBill.cashReceived ? Math.max(0, selectedBill.cashReceived - selectedBill.totalAmount) : 0))}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-dashed border-gray-300 my-4"></div>

                  {/* Receipt Footer */}
                  <div className="text-center text-[10px] text-gray-400 space-y-1 pb-2">
                    <p>Cảm ơn quý khách đã đồng hành cùng T&M!</p>
                    <p>Chúc quý khách xem phim vui vẻ!</p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
                <button
                  onClick={() => setSelectedBill(null)}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md shadow-gray-200"
                  style={{ color: "#ffffff" }}
                >
                  Đóng Hóa Đơn
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
