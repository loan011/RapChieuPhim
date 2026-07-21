import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import "./QuetQRDoAn.css";
import { useQuetQRDoAn } from "./useQuetQRDoAn.js";
import { 
  MdQrCodeScanner, 
  MdFastfood, 
  MdCheckCircle, 
  MdError, 
  MdWarning, 
  MdArrowForward,
  MdRestaurant,
  MdPerson,
  MdDateRange,
  MdShoppingCart
} from "react-icons/md";

export default function StaffQuetQRDoAn() {
  const {
    ticketCode,
    setTicketCode,
    ticketDetails,
    orders,
    loading,
    statusMessage,
    setStatusMessage,
    handleFindTicket,
    handleConfirmPickup,
    handleSimulateScan,
  } = useQuetQRDoAn();

  const html5QrCodeRef = useRef(null);
  const lastScanTimeRef = useRef(0);
  const lastScanCodeRef = useRef("");

  // Tự động mở camera quét khi tải trang
  useEffect(() => {
    startScanner();

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(err => console.error("Error stopping scanner on unmount:", err));
      }
    };
  }, []);

  async function startScanner() {
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("reader-food");
        html5QrCodeRef.current = html5QrCode;
        
        const config = { 
          fps: 15
        };
        
        await html5QrCode.start(
          { facingMode: "user" },
          config,
          (decodedText) => {
            const now = Date.now();
            if (decodedText === lastScanCodeRef.current && now - lastScanTimeRef.current < 3000) {
              return; // Cooldown 3 giây
            }
            lastScanCodeRef.current = decodedText;
            lastScanTimeRef.current = now;

            console.log("Food QR Code Scanned:", decodedText);
            
            // Bóc tách mã vé sạch sẽ
            let cleanCode = decodedText.trim();
            try {
              if (cleanCode.includes("%")) {
                cleanCode = decodeURIComponent(cleanCode);
              }
            } catch (e) {}

            if (cleanCode.includes("/ticket-info/")) {
              const parts = cleanCode.split("/ticket-info/");
              cleanCode = parts[parts.length - 1];
            } else if (cleanCode.includes("data=VE:")) {
              const match = cleanCode.match(/data=VE:([^|&]+)/);
              if (match) cleanCode = match[1];
            } else if (cleanCode.includes("VE:")) {
              const match = cleanCode.match(/VE:([^|&]+)/);
              if (match) cleanCode = match[1];
            }

            setTicketCode(cleanCode);
            handleFindTicket(cleanCode);
          },
          (errorMessage) => {
            // Quét từng khung hình
          }
        );
      } catch (err) {
        console.error("Camera startup error:", err);
        setStatusMessage({
          type: "error",
          text: "Không thể khởi động camera. Vui lòng cấp quyền truy cập camera ở góc trái thanh địa chỉ trình duyệt."
        });
      }
    }, 100);
  }

  return (
    <div className="staff-qr-food-container">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-2xl text-gray-800 flex items-center gap-2">
          <MdFastfood className="text-orange-500 text-3xl" /> Quét QR Nhận Đồ Ăn Online
        </h4>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scanner Component */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
          <h5 className="font-bold text-gray-800 text-base mb-4 self-start border-b border-gray-50 pb-2 w-full flex items-center gap-1.5">
            <MdQrCodeScanner className="text-orange-500" /> Trình Quét QR Camera
          </h5>
          
          <div className="relative w-full max-w-sm aspect-square bg-gray-50 rounded-2xl overflow-hidden flex flex-col items-center justify-center border border-gray-200 shadow-inner">
            <div id="reader-food" style={{ width: "100%", height: "100%" }}></div>
            
            {/* Laser line effect */}
            <div className="absolute left-0 right-0 h-0.5 bg-orange-500 top-1/2 -translate-y-1/2 animate-pulse shadow-[0_0_10px_#f97316] pointer-events-none z-10"></div>
          </div>
        </div>

        {/* Search and Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h5 className="font-bold text-gray-800 text-base mb-4 border-b border-gray-50 pb-2">
                Nhập Mã Vé / Mã Đơn (CB...) Thủ Công
              </h5>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleFindTicket(ticketCode);
                }}
                className="flex gap-3"
              >
                <input
                  type="text"
                  placeholder="Nhập mã vé hoặc mã đơn (VD: CB73)..."
                  value={ticketCode}
                  onChange={e => setTicketCode(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50/50 transition-all duration-200"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-orange-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-600 active:scale-98 transition-all flex items-center gap-1 shadow-md shadow-orange-100"
                >
                  Tìm Kiếm <MdArrowForward />
                </button>
              </form>
            </div>

            {statusMessage && (
              <div className={`p-4 rounded-xl text-sm flex items-start gap-2.5 border ${
                statusMessage.type === "success" 
                  ? "bg-green-50 text-green-800 border-green-200"
                  : statusMessage.type === "warning"
                  ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}>
                <span className="text-lg shrink-0 mt-0.5">
                  {statusMessage.type === "success" && <MdCheckCircle className="text-green-600" />}
                  {statusMessage.type === "warning" && <MdWarning className="text-yellow-600" />}
                  {statusMessage.type === "error" && <MdError className="text-red-500" />}
                </span>
                <span>{statusMessage.text}</span>
              </div>
            )}

            {ticketDetails && (
              <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/40">
                <h6 className="font-bold text-gray-800 text-sm mb-3.5 pb-2 border-b border-gray-200/50 flex justify-between items-center">
                  <span className="flex items-center gap-1.5"><MdPerson className="text-gray-400" /> Khách Hàng & Vé</span>
                  <span className="text-xs text-gray-500">{ticketDetails.ticketCode || `VE${ticketDetails.ticketId || ticketDetails.id}`}</span>
                </h6>

                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-gray-600">
                  <div>Tên khách hàng:</div>
                  <div className="font-semibold text-gray-800 text-right">{ticketDetails.customerName || "Khách vãng lai"}</div>
                  
                  <div>Phim chiếu:</div>
                  <div className="font-semibold text-gray-800 text-right">{ticketDetails.movieTitle || "—"}</div>
                  
                  <div>Phòng / Ghế:</div>
                  <div className="font-bold text-orange-600 text-right">{ticketDetails.roomName || "—"} / {ticketDetails.seatCode || "—"}</div>
                </div>
              </div>
            )}

            {orders && orders.length > 0 && (
              <div className="space-y-4">
                <h5 className="font-bold text-gray-800 text-sm flex items-center gap-1.5 border-b border-gray-50 pb-2">
                  <MdShoppingCart className="text-orange-500" /> Đơn Hàng Đồ Ăn Đã Đặt:
                </h5>

                {orders.map((order) => {
                  const rawItems = order.items ?? order.orderitems ?? order.orderItems ?? [];
                  const items = Array.isArray(rawItems) ? rawItems : (rawItems?.$values || []);
                  const isCompleted = order.status === "Completed" || order.status === "Đã lấy" || order.status === "Đã nhận";

                  return (
                    <div key={order.orderId} className={`border rounded-2xl p-4 transition-all ${
                      isCompleted ? "bg-gray-50/80 border-gray-200 opacity-75" : "bg-orange-50/20 border-orange-100"
                    }`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="font-bold text-sm text-gray-800">Đơn hàng #{order.orderId}</span>
                          <div className="text-xxs text-gray-400 flex items-center gap-1 mt-0.5">
                            <MdDateRange /> {new Date(order.orderDate).toLocaleString("vi-VN")}
                          </div>
                        </div>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider ${
                          isCompleted
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-850"
                        }`}>
                          {isCompleted ? "ĐÃ LẤY ĐỒ" : "CHƯA LẤY ĐỒ"}
                        </span>
                      </div>

                      {/* Items List */}
                      <div className="space-y-2 border-t border-gray-100/50 pt-3 text-xs text-gray-600">
                        {items.length === 0 ? (
                          <div className="italic text-gray-400">Không có chi tiết món ăn.</div>
                        ) : (
                          items.map((item, idx) => {
                            const isCombo = item.comboId || item.ComboId || item.combo || item.Combo;
                            const itemName = isCombo 
                              ? (item.comboName ?? item.ComboName ?? item.combo?.comboName ?? item.Combo?.ComboName ?? "Combo")
                              : (item.foodName ?? item.FoodName ?? item.food?.foodName ?? item.Food?.FoodName ?? "Món ăn/Combo");
                            const itemDetails = item.food?.category ?? item.combo?.description ?? "";
                            return (
                              <div key={idx} className="flex justify-between items-center py-1">
                                <div className="flex items-center gap-2">
                                  <span className="p-1 bg-white rounded-lg border border-gray-150 text-sm">🍿</span>
                                  <div>
                                    <div className="font-semibold text-gray-800">{itemName}</div>
                                    {itemDetails && <div className="text-[10px] text-gray-400">{itemDetails}</div>}
                                  </div>
                                </div>
                                <div className="font-bold text-gray-800">x{item.quantity}</div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Confirm Pick up Button or Expired Warning */}
                      {order.isExpired ? (
                        <div className="mt-4 pt-3 border-t border-red-100">
                          <div className="w-full text-center bg-red-100 text-red-800 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-red-200">
                            <MdError /> ĐƠN HÀNG ĐÃ HẾT HẠN QUÉT (KHÔNG THỂ GIAO ĐỒ)
                          </div>
                        </div>
                      ) : !isCompleted ? (
                        <div className="mt-4 pt-3 border-t border-gray-100/50">
                          <button
                            onClick={() => handleConfirmPickup(order.orderId)}
                            disabled={loading}
                            className="w-full bg-orange-500 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-orange-600 active:scale-98 transition-all hover:shadow-lg hover:shadow-orange-100 flex items-center justify-center gap-1.5"
                          >
                            <MdRestaurant /> {loading ? "Đang xác nhận..." : "XÁC NHẬN ĐÃ GIAO ĐỒ ĂN CHO KHÁCH"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
