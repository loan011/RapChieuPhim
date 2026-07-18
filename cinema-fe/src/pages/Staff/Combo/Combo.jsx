import "./Combo.css";
import { useState } from "react";
import { useCombo } from "./useCombo.js";
import {
  MdFastfood, MdAdd, MdRemove, MdShoppingCart,
  MdReceipt, MdCheckCircle, MdQrCode2, MdAttachMoney,
  MdClose, MdCheckBox, MdCheckBoxOutlineBlank, MdWarning
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

// ===== Modal thanh toán QR =====
function QRPaymentModal({ totalAmount, onCancel, onConfirm, loading }) {
  const [confirmed, setConfirmed] = useState(false);
  const [qrError, setQrError] = useState(false);

  // Đúng format VietQR: /image/{BANK_ID}-{ACCOUNT_NO}-compact.png
  const addInfo = encodeURIComponent(`THANH TOAN COMBO`);
  const accountNameEncoded = encodeURIComponent(ACCOUNT_NAME);
  const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact.png?amount=${totalAmount}&addInfo=${addInfo}&accountName=${accountNameEncoded}`;
  const amountText = totalAmount.toLocaleString("vi-VN");

  return (
    <div className="qr-modal-overlay" onClick={onCancel}>
      <div className="qr-modal-card" onClick={e => e.stopPropagation()}>
        <button onClick={onCancel} className="qr-close-btn">
          <MdClose />
        </button>

        <h3 className="qr-modal-title">QUÉT MÃ THANH TOÁN QR</h3>
        <p className="qr-modal-subtitle">
          Vui lòng hướng dẫn khách hàng quét mã QR dưới đây để<br />
          thực hiện thanh toán chuyển khoản tại quầy.
        </p>

        <div className="qr-image-wrapper">
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
            />
          )}
        </div>

        <div className="qr-info-box">
          <div><span className="qr-info-icon">💰</span> Số tiền: <strong>{amountText}đ</strong></div>
          <div><span className="qr-info-icon">🏦</span> Ngân hàng: <strong>TPBank - {ACCOUNT_NO}</strong></div>
          <div><span className="qr-info-icon">👤</span> Chủ TK: <strong>{ACCOUNT_NAME}</strong></div>
          <div><span className="qr-info-icon">📋</span> Nội dung: <strong>THANH TOAN COMBO</strong></div>
        </div>

        <label className="qr-confirm-check" onClick={() => setConfirmed(v => !v)}>
          <span className="qr-check-icon">
            {confirmed
              ? <MdCheckBox className="text-green-600 text-xl" />
              : <MdCheckBoxOutlineBlank className="text-gray-400 text-xl" />
            }
          </span>
          <span>Tôi xác nhận khách hàng đã <strong>chuyển khoản thành công</strong></span>
        </label>

        <div className="qr-modal-actions">
          <button onClick={onCancel} className="qr-btn-cancel">HỦY GIAO DỊCH</button>
          <button
            onClick={onConfirm}
            disabled={!confirmed || loading}
            className="qr-btn-confirm"
          >
            {loading ? "Đang xử lý..." : "XÁC NHẬN ĐÃ NHẬN TIỀN"}
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
    showQRModal,
    setShowQRModal,
    handleSell,
    executeSell,
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
        {/* Danh sách combo */}
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
                    <div key={item.id} className={`py-4 flex items-center justify-between gap-4 ${outOfStock ? "opacity-50" : ""}`}>
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
                          onClick={() => handleQuantityChange(item.id, -1)}
                          disabled={currentQty === 0}
                          className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 active:scale-95 transition-all disabled:opacity-30"
                        >
                          <MdRemove />
                        </button>
                        <span className="w-6 text-center font-bold text-sm text-gray-800">{currentQty}</span>
                        <button
                          onClick={() => handleQuantityChange(item.id, 1)}
                          disabled={outOfStock || currentQty >= item.quantity}
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
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 font-medium">
                      {item.name} <span className="text-gray-400 font-normal">x{quantities[item.id]}</span>
                    </span>
                    <span className="text-gray-800 font-semibold">
                      {(item.price * quantities[item.id]).toLocaleString("vi-VN")} đ
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
            {/* Chọn hình thức thanh toán */}
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
            </div>

            <button
              type="submit"
              disabled={selectedItems.length === 0 || loading}
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
          loading={loading}
          onCancel={() => setShowQRModal(false)}
          onConfirm={executeSell}
        />
      )}
    </div>
  );
}
