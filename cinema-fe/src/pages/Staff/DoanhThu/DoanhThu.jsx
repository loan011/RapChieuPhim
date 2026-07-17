import { useState, useEffect } from "react";
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
  MdSearch
} from "react-icons/md";
import { getDailyRevenue, sendDailyRevenueReport } from "./dailyRevenueService";
import "./DoanhThu.css";

export default function DoanhThu() {
  const [date, setDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Trạng thái modal gửi báo cáo
  const [showSendModal, setShowSendModal] = useState(false);
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [sendTime, setSendTime] = useState("");

  function handleOpenSendModal() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSendTime(timeStr);
    setShowSendModal(true);
  }

  // Trạng thái hóa đơn chi tiết được chọn
  const [selectedBill, setSelectedBill] = useState(null);

  // Tìm kiếm theo mã hóa đơn
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBills = reportData?.bills?.filter(bill =>
    bill.billCode.toLowerCase().includes(searchQuery.toLowerCase().trim())
  ) || [];

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

  // Xử lý gửi báo cáo cho Admin
  async function handleSendReport(e) {
    e.preventDefault();
    if (!reportData) return;

    try {
      setSending(true);
      await sendDailyRevenueReport({
        date: date,
        notes: notes,
        sendTime: sendTime
      });
      alert(`Đã gửi báo cáo doanh thu ngày ${date} cho Admin thành công!`);
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
            {/* THẺ THỐNG KÊ DOANH THU */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Thẻ 1: Tổng doanh thu */}
              <div className="relative overflow-hidden bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-2xl shadow-md p-6 transition-all duration-200 hover:shadow-lg">
                <div className="absolute right-2 -bottom-4 text-white/10 text-9xl pointer-events-none">
                  <MdAttachMoney />
                </div>
                <p className="text-xs font-semibold text-white/80 uppercase tracking-wider">Tổng Doanh Thu Ngày</p>
                <h3 className="text-3xl font-extrabold mt-2 tracking-tight">
                  {formatVND(reportData.totalOverallRevenue)}
                </h3>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/20 text-xs text-white/90">
                  <span>Số lượng hóa đơn:</span>
                  <span className="font-bold text-sm bg-white/20 px-2.5 py-0.5 rounded-full">
                    {reportData.totalBillsCount} đơn
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
                    {formatVND(reportData.totalTicketRevenue)}
                  </h3>
                </div>
                <div className="flex justify-between items-center mt-6 pt-3 border-t border-gray-50 text-xs text-gray-500">
                  <span>Tổng số vé bán ra:</span>
                  <span className="font-bold text-gray-800 text-sm">{reportData.totalTicketsCount} vé</span>
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
                    {formatVND(reportData.totalConcessionRevenue)}
                  </h3>
                </div>
                <div className="flex justify-between items-center mt-6 pt-3 border-t border-gray-50 text-xs text-gray-500">
                  <span>Khấu trừ giảm giá:</span>
                  <span className="font-bold text-red-500 text-sm">-{formatVND(reportData.totalDiscount)}</span>
                </div>
              </div>
            </div>

            {/* BẢNG TỔNG QUAN & NÚT GỬI BÁO CÁO */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl text-2xl ${date === new Date().toLocaleDateString("en-CA") ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  <MdCheckCircle />
                </div>
                <div>
                  <h5 className="font-bold text-gray-800 text-base">Xác Nhận & Gửi Doanh Thu</h5>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {date === new Date().toLocaleDateString("en-CA")
                      ? "Báo cáo sẽ tổng hợp doanh thu vé, đồ ăn và gửi trực tiếp tới hòm thư của Admin quản lý."
                      : "Chỉ cho phép gửi báo cáo doanh thu của ngày hiện tại (hôm nay)."}
                  </p>
                </div>
              </div>
              <button
                onClick={handleOpenSendModal}
                disabled={date !== new Date().toLocaleDateString("en-CA")}
                className="w-full md:w-auto bg-green-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-green-700 hover:shadow-lg hover:shadow-green-100 active:scale-98 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
                title={date !== new Date().toLocaleDateString("en-CA") ? "Chỉ có thể gửi báo cáo cho ngày hôm nay" : ""}
              >
                <MdSend className="text-base" /> Gửi báo cáo cho Admin
              </button>
            </div>

            {/* DANH SÁCH CHI TIẾT CÁC HÓA ĐƠN TRONG NGÀY */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4 pb-2 border-b border-gray-50">
                <h5 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-green-600 rounded-full"></span>
                  Chi Tiết Các Hóa Đơn ({searchQuery ? `${filteredBills.length} / ${reportData.bills.length}` : reportData.bills.length})
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
                      <th className="px-4 py-3 text-left">Giao Dịch Viên</th>
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
                        <td colSpan={9} className="text-center py-12 text-gray-400 font-medium">
                          {searchQuery
                            ? `Không tìm thấy hóa đơn nào khớp với từ khóa "${searchQuery}"`
                            : `Chưa có giao dịch thành công nào trong ngày ${date}`}
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
                            <div className="text-[11px] text-gray-400">{bill.customerEmail}</div>
                          </td>

                          {/* Giao Dịch Viên */}
                          <td className="px-4 py-3.5 text-xs text-gray-600">
                            {bill.staffName}
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
                          <td className="px-4 py-3.5 text-right font-bold text-gray-800">
                            {formatVND(bill.totalAmount)}
                          </td>

                          {/* Hành Động */}
                          <td className="px-4 py-3.5 text-center">
                            <button
                              onClick={() => setSelectedBill(bill)}
                              className="text-green-600 hover:text-green-800 hover:underline font-bold text-xs"
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

      {/* PORTAL MODAL GỬI BÁO CÁO CHO ADMIN */}
      {showSendModal && reportData &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                <h5 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <MdSend className="text-green-600" /> Xác Nhận Gửi Báo Cáo Doanh Thu
                </h5>
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
                >
                  <MdClose />
                </button>
              </div>

              <form onSubmit={handleSendReport} className="p-6 space-y-4">
                {/* Tóm tắt thông số gửi */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ngày báo cáo:</span>
                    <span className="font-bold text-gray-805">{date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Giờ báo cáo:</span>
                    <span className="font-bold text-gray-800">{sendTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tổng doanh thu:</span>
                    <span className="font-bold text-green-700 text-base">{formatVND(reportData.totalOverallRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400"> + Tiền vé ({reportData.totalTicketsCount} vé):</span>
                    <span className="font-semibold text-gray-600">{formatVND(reportData.totalTicketRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400"> + Tiền nước/đồ ăn:</span>
                    <span className="font-semibold text-gray-600">{formatVND(reportData.totalConcessionRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-gray-200/60 pt-1.5 mt-1.5">
                    <span className="text-gray-405">Khấu trừ giảm giá:</span>
                    <span className="font-semibold text-red-500">-{formatVND(reportData.totalDiscount)}</span>
                  </div>
                </div>

                {/* Ghi chú thêm */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Ghi Chú / Báo Cáo Chi Tiết (Tùy chọn)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Nhập ghi chú hoặc tóm tắt ca làm việc gửi kèm..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50/50 transition-all duration-200"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {/* Nút hành động */}
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-55/60">
                  <button
                    type="button"
                    onClick={() => setShowSendModal(false)}
                    className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-55 transition-all"
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
                        <MdSend /> Xác Nhận Gửi
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
                    <div className="text-gray-500 pl-5 text-[11px]">{selectedBill.customerEmail}</div>
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
                      <span>Mã giảm giá (Khấu trừ):</span>
                      <span>-{formatVND(selectedBill.discountAmt)}</span>
                    </div>
                    <div className="flex justify-between font-black text-sm text-gray-900 border-t border-gray-100 pt-2 mt-2">
                      <span>TỔNG CỘNG:</span>
                      <span className="text-green-700 text-base">{formatVND(selectedBill.totalAmount)}</span>
                    </div>
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
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 rounded-xl text-sm transition-all"
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
