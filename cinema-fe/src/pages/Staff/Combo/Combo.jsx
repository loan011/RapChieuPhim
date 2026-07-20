import "./Combo.css";
import React, { useState, useEffect } from "react";
import { useCombo } from "./useCombo.js";
import {
  MdFastfood, MdAdd, MdRemove, MdShoppingCart,
  MdReceipt, MdCheckCircle, MdQrCode2, MdAttachMoney,
  MdClose, MdWarning, MdHourglassTop, MdPendingActions
} from "react-icons/md";

// ===== Cấu hình ngân hàng VietQR - thay bằng thông tin thực tế =====
const BANK_ID = "TPB";              // Mã ngân hàng: TPBank
const ACCOUNT_NO = "15145686888";   // Số tài khoản
const ACCOUNT_NAME = "Nguyen Quang Vinh"; // Tên chủ tài khoản

// ===== Component ảnh sản phẩm =====
function ComboImage({ item }) {
  const [imgError, setImgError] = useState(false);
  const showEmoji = !item.imageUrl || imgError;

  if (showEmoji) {
    return (
      <span className="text-3xl bg-gray-50 p-2.5 rounded-xl border border-gray-100 w-14 h-14 flex items-center justify-center select-none">
        {item.imageEmoji || "🍿"}
      </span>
    );
  }

  return (
    <img
      src={item.imageUrl}
      alt={item.name}
      onError={() => setImgError(true)}
      className="w-14 h-14 rounded-xl object-cover border border-gray-100 bg-gray-50"
    />
  );
}

// ===== Modal thanh toán QR (với polling trạng thái tự động) =====
function QRPaymentModal({ totalAmount, orderId, paymentStatus, onCancel, onConfirm, loading }) {
  const [qrError, setQrError] = useState(false);

  // Khôi phục QR động theo đúng số tiền thực tế của đơn hàng
  const addInfo = encodeURIComponent(`CB${orderId || ""}`);
  const accountNameEncoded = encodeURIComponent(ACCOUNT_NAME);
  const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${totalAmount}&addInfo=${addInfo}&accountName=${accountNameEncoded}`;
  const amountText = totalAmount.toLocaleString("vi-VN");

  const isPaid = paymentStatus === "paid";
  const isError = paymentStatus === "error";

  // Reset trạng thái lỗi khi thay đổi đơn hàng hoặc số tiền
  useEffect(() => {
    setQrError(false);
  }, [totalAmount, orderId]);

  return (
    <div className="qr-modal-overlay">
      <div className="qr-modal-card" onClick={e => e.stopPropagation()}>
        <button onClick={onCancel} className="qr-close-btn">
          <MdClose />
        </button>

        <h3 className="qr-modal-title">QUÉT MÃ THANH TOÁN QR</h3>
        <p className="qr-modal-subtitle">
          Vui lòng hướng dẫn khách hàng quét mã QR dưới đây để<br />
          thực hiện thanh toán chuyển khoản tại quầy.
        </p>

        {/* QR Image + overlay trạng thái */}
        <div className="qr-image-wrapper" style={{ position: "relative" }}>
          {qrError ? (
            <div className="qr-image-fallback">
              <span>⚠️</span>
              <p>Không tải được mã QR</p>
              <small>Vui lòng nhận tiền mặt hoặc kiểm tra kết nối</small>
            </div>
          ) : (
            <img
              src={qrUrl}
              alt="VietQR Payment"
              className="qr-image"
              onError={() => setQrError(true)}
              style={{ opacity: isPaid ? 0.35 : 1, transition: "opacity 0.4s ease" }}
            />
          )}
          {isPaid && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              background: "rgba(240,253,244,0.93)",
              borderRadius: "12px", gap: "8px"
            }}>
              <MdCheckCircle style={{ fontSize: "3.5rem", color: "#16a34a" }} />
              <span style={{ fontWeight: 700, color: "#15803d", fontSize: "1.1rem" }}>
                Đã nhận được tiền!
              </span>
            </div>
          )}
        </div>

        {/* Thông tin tài khoản */}
        <div className="qr-info-box">
          <div><span className="qr-info-icon">💰</span> Số tiền: <strong>{amountText}đ</strong></div>
          <div><span className="qr-info-icon">🏦</span> Ngân hàng: <strong>TPBank - {ACCOUNT_NO}</strong></div>
          <div><span className="qr-info-icon">👤</span> Chủ TK: <strong>{ACCOUNT_NAME}</strong></div>
          <div><span className="qr-info-icon">📋</span> Nội dung: <strong>CB{orderId || ""}</strong></div>
        </div>

        {/* Banner trạng thái thanh toán */}
        <div style={{
          margin: "14px 0 6px",
          padding: "11px 16px",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "0.9rem",
          fontWeight: 600,
          ...(isPaid
            ? { background: "#dcfce7", color: "#15803d", border: "1.5px solid #86efac" }
            : isError
              ? { background: "#fef2f2", color: "#b91c1c", border: "1.5px solid #fca5a5" }
              : { background: "#fffbeb", color: "#b45309", border: "1.5px solid #fcd34d" }
          )
        }}>
          {isPaid ? (
            <><MdCheckCircle style={{ fontSize: "1.3rem", flexShrink: 0 }} /> Khách hàng đã thanh toán thành công!</>
          ) : isError ? (
            <><MdWarning style={{ fontSize: "1.3rem", flexShrink: 0 }} /> Giao dịch bị lỗi hoặc đã hủy.</>
          ) : (
            <>
              <MdHourglassTop style={{ fontSize: "1.3rem", flexShrink: 0, animation: "spin 1.5s linear infinite" }} />
              Đang chờ khách hàng quét mã và chuyển khoản...
            </>
          )}
        </div>

        {!isPaid && !isError && (
          <p style={{ fontSize: "0.78rem", color: "#9ca3af", textAlign: "center", margin: "2px 0 10px" }}>
            Hệ thống tự động xác nhận khi nhận được thanh toán. Nút xác nhận sẽ mở khóa sau khi nhận tiền.
          </p>
        )}

        {/* Action buttons */}
        <div className="qr-modal-actions">
          <button onClick={onCancel} className="qr-btn-cancel">HỦY GIAO DỊCH</button>
          <button
            onClick={onConfirm}
            disabled={!isPaid || loading}
            className="qr-btn-confirm"
            style={!isPaid ? { opacity: 0.45, cursor: "not-allowed" } : {}}
          >
            {loading ? "Đang xử lý..." : isPaid ? "XÁC NHẬN ĐÃ NHẬN TIỀN" : "Chờ thanh toán..."}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Main component =====
export default function StaffCombo() {
  const {
    combos,
    quantities,
    loading,
    success,
    setSuccess,
    handleQuantityChange,
    selectedItems,
    totalAmount,
    paymentMethod,
    setPaymentMethod,
    cashReceived,
    setCashReceived,
    showQRModal,
    handleSell,
    qrPendingOrderId,
    qrPaymentStatus,
    executeQrConfirm,
    handleCancelQr,
  } = useCombo();

  return (
    <div className="staff-combo-container">
      <h4 className="font-bold text-2xl text-gray-805 mb-6 flex items-center gap-2">
        <MdFastfood className="text-green-600" /> Bán Combo & Thức Ăn Kèm
      </h4>

      {/* Success banner */}
      {success && (
        <div className="mb-6 p-6 bg-green-50 border border-green-200 text-green-800 rounded-2xl flex flex-col md:flex-row gap-6 items-start shadow-sm">
          <div className="text-4xl text-green-600 pt-1 shrink-0">
            <MdCheckCircle />
          </div>
          <div className="flex-1">
            <h5 className="font-bold text-lg text-green-900 mb-2">Đơn Hàng Combo Thành Công!</h5>
            <div className="text-sm bg-white/50 p-4 rounded-xl border border-green-100 max-w-xl">
              <div className="flex justify-between border-b border-green-100 pb-2 mb-2">
                <strong>Mã đơn hàng: {success.id}</strong>
                <span>{success.time}</span>
              </div>
              <div className="space-y-1.5 border-b border-green-100 pb-3 mb-2">
                {success.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.name} x {item.quantity}</span>
                    <span>{(item.price * item.quantity).toLocaleString("vi-VN")} đ</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center text-base font-extrabold text-green-800">
                <span>Tổng tiền:</span>
                <span>{success.totalAmount.toLocaleString("vi-VN")} đ</span>
              </div>
              {success.cashReceived > 0 && (
                <div className="border-t border-dashed border-green-200 pt-2 mt-2 space-y-1 text-xs font-semibold text-green-900">
                  <div className="flex justify-between">
                    <span>Tiền nhận:</span>
                    <span>{success.cashReceived.toLocaleString("vi-VN")} đ</span>
                  </div>
                  <div className="flex justify-between font-bold text-green-800">
                    <span>Tiền thừa trả khách:</span>
                    <span>{Math.max(0, success.cashReceived - success.totalAmount).toLocaleString("vi-VN")} đ</span>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="mt-4 bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              Tiếp tục bán combo
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Danh sách combo & food */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h5 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              <span className="w-1.5 h-5 bg-green-600 rounded-full"></span>
              Danh Sách Combo & Đồ Ăn
            </h5>
            <div className="divide-y divide-gray-100">
              {combos.length === 0 ? (
                <p className="text-gray-400 text-sm italic py-8 text-center">Đang tải danh sách...</p>
              ) : (
                combos.map(item => {
                  const outOfStock = item.quantity === 0;
                  const currentQty = quantities[item.id] || 0;
                  return (
                    <div key={item.uid} className={`py-4 flex items-center justify-between gap-4 ${outOfStock ? "opacity-50" : ""}`}>
                      <div className="flex items-center gap-4">
                        <ComboImage item={item} />
                        <div>
                          <h6 className="font-semibold text-gray-800 text-sm">{item.name}</h6>
                          <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-bold text-green-700">
                              {item.price.toLocaleString("vi-VN")} đ
                            </span>
                            {outOfStock ? (
                              <span className="text-xs text-red-500 font-medium flex items-center gap-0.5">
                                <MdWarning className="text-xs" /> Hết hàng
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">Còn: {item.quantity}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleQuantityChange(item.uid, -1)}
                          disabled={quantities[item.uid] === 0 || !quantities[item.uid]}
                          className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 active:scale-95 transition-all disabled:opacity-30"
                        >
                          <MdRemove />
                        </button>
                        <span className="w-6 text-center font-bold text-sm text-gray-800">{quantities[item.uid] || 0}</span>
                        <button
                          onClick={() => handleQuantityChange(item.uid, 1)}
                          disabled={outOfStock || (quantities[item.uid] || 0) >= item.quantity}
                          className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 active:scale-95 transition-all disabled:opacity-30"
                        >
                          <MdAdd />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Giỏ hàng & thanh toán */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between h-fit">
          <div>
            <h5 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              <MdShoppingCart className="text-green-600" />
              Chi Tiết Đơn Hàng
            </h5>
            {selectedItems.length === 0 ? (
              <p className="text-gray-400 text-sm italic py-8 text-center">Chưa có món nào được chọn.</p>
            ) : (
              <div className="space-y-3 mb-6">
                {selectedItems.map(item => (
                  <div key={item.uid} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 font-medium">
                      {item.name} <span className="text-gray-400 font-normal">x{quantities[item.uid]}</span>
                    </span>
                    <span className="text-gray-800 font-semibold">
                      {(item.price * quantities[item.uid]).toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between items-center">
                  <span className="font-bold text-gray-800">Tổng cộng:</span>
                  <span className="font-extrabold text-lg text-green-700">
                    {totalAmount.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSell} className="space-y-4 border-t border-gray-100 pt-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Hình Thức Thanh Toán
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    paymentMethod === "cash"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <MdAttachMoney className="text-lg" /> Tiền mặt
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("qr")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    paymentMethod === "qr"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <MdQrCode2 className="text-lg" /> Quét QR
                </button>
              </div>

              {paymentMethod === "cash" && (
                <div className="mt-3 p-3 bg-gray-50 border border-gray-150 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-600">
                    <span>Tiền nhận (khách đưa):</span>
                  </div>
                  <input
                    type="number"
                    placeholder="Nhập số tiền khách đưa..."
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                  <div className="flex flex-wrap gap-1">
                    {totalAmount > 0 && (
                      <button
                        type="button"
                        onClick={() => setCashReceived(totalAmount)}
                        className="px-2.5 py-1 bg-green-50 border border-green-200 rounded text-xxs font-bold text-green-700 hover:bg-green-100 transition-colors"
                      >
                        {totalAmount.toLocaleString("vi-VN")}đ (Đúng tiền)
                      </button>
                    )}
                    {[50000, 100000, 200000, 500000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashReceived(amt)}
                        className="px-2 py-1 bg-white border border-gray-200 rounded text-xxs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        {amt.toLocaleString("vi-VN")}đ
                      </button>
                    ))}
                  </div>

                  {cashReceived !== "" && Number(cashReceived) < totalAmount ? (
                    <div className="pt-2 border-t border-red-200 text-xs font-bold text-red-600 flex items-center justify-between">
                      <span>⚠️ Tiền nhận chưa đủ</span>
                      <span>Thiếu: {(totalAmount - Number(cashReceived)).toLocaleString("vi-VN")} đ</span>
                    </div>
                  ) : Number(cashReceived) >= totalAmount && totalAmount > 0 ? (
                    <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-600">Tiền thừa trả khách:</span>
                      <span className="text-green-600 text-sm font-extrabold">
                        {(Number(cashReceived) - totalAmount).toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={selectedItems.length === 0 || loading || (paymentMethod === "cash" && cashReceived !== "" && Number(cashReceived) < totalAmount)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <MdReceipt />
              {loading ? "Đang xử lý..." : "BÁN COMBO & NHẬN TIỀN"}
            </button>
          </form>
        </div>
      </div>

      {/* Modal QR thanh toán */}
      {showQRModal && (
        <QRPaymentModal
          totalAmount={totalAmount}
          orderId={qrPendingOrderId}
          paymentStatus={qrPaymentStatus}
          loading={loading}
          onCancel={handleCancelQr}
          onConfirm={executeQrConfirm}
        />
      )}

      {/* Keyframe animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
