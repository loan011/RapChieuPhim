import "./Combo.css";
import { useCombo } from "./Combo.js";
import { MdFastfood, MdAdd, MdRemove, MdShoppingCart, MdReceipt, MdCheckCircle } from "react-icons/md";

export default function StaffCombo() {
  const {
    combos,
    quantities,
    customerName,
    setCustomerName,
    loading,
    success,
    setSuccess,
    handleQuantityChange,
    selectedItems,
    totalAmount,
    handleSell,
  } = useCombo();

  return (
    <div className="staff-combo-container">
      <h4 className="font-bold text-2xl text-gray-805 mb-6 flex items-center gap-2">
        <MdFastfood className="text-green-600" /> Bán Combo & Thức Ăn Kèm
      </h4>

      {success && (
        <div className="mb-6 p-6 bg-green-50 border border-green-200 text-green-800 rounded-2xl flex flex-col md:flex-row gap-6 items-start shadow-sm">
          <div className="text-4xl text-green-600 pt-1 shrink-0">
            <MdCheckCircle />
          </div>
          <div className="flex-1">
            <h5 className="font-bold text-lg text-green-900 mb-2">Đơn Hàng Combo Thành Công!</h5>
            <div className="text-sm bg-white/50 p-4 rounded-xl border border-green-100 max-w-xl">
              <div className="flex justify-between border-b border-green-150 pb-2 mb-2">
                <strong>Mã đơn hàng: {success.id}</strong>
                <span>{success.time}</span>
              </div>
              <div className="mb-2"><strong>Khách hàng:</strong> {success.customerName}</div>
              <div className="space-y-1.5 border-b border-green-150 pb-3 mb-2">
                {success.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.name} x {item.quantity}</span>
                    <span>{(item.price * item.quantity).toLocaleString("vi-VN")} đ</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center text-base font-extrabold text-green-955">
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
        {/* Combo List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h5 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2 border-b border-gray-50 pb-2">
              <span className="w-1.5 h-5 bg-green-600 rounded-full"></span>
              Danh Sách Combo & Đồ Ăn
            </h5>
            <div className="divide-y divide-gray-100">
              {combos.map(item => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl bg-gray-50 p-2.5 rounded-xl border border-gray-100 w-14 h-14 flex items-center justify-center select-none">{item.image}</span>
                    <div>
                      <h6 className="font-semibold text-gray-800 text-sm">{item.name}</h6>
                      <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      <span className="text-sm font-bold text-green-650 inline-block mt-1">{item.price.toLocaleString("vi-VN")} đ</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleQuantityChange(item.id, -1)}
                      className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 active:scale-95 transition-all"
                    >
                      <MdRemove />
                    </button>
                    <span className="w-6 text-center font-bold text-sm text-gray-800">{quantities[item.id] || 0}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, 1)}
                      className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 active:scale-95 transition-all"
                    >
                      <MdAdd />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart & Billing details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between h-fit">
          <div>
            <h5 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2 border-b border-gray-50 pb-2">
              <MdShoppingCart className="text-green-600" />
              Chi Tiết Đơn Hàng
            </h5>
            {selectedItems.length === 0 ? (
              <p className="text-gray-400 text-sm italic py-8 text-center">Chưa có món nào được chọn.</p>
            ) : (
              <div className="space-y-3 mb-6">
                {selectedItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 font-medium">{item.name} <span className="text-gray-400 font-normal">x{quantities[item.id]}</span></span>
                    <span className="text-gray-800 font-semibold">{(item.price * quantities[item.id]).toLocaleString("vi-VN")} đ</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between items-center">
                  <span className="font-bold text-gray-850">Tổng cộng:</span>
                  <span className="font-extrabold text-lg text-green-700">{totalAmount.toLocaleString("vi-VN")} đ</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSell} className="space-y-4 border-t border-gray-50 pt-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tên Khách Hàng <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                placeholder="Nhập tên khách hàng"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50/50 transition-all duration-200"
              />
            </div>
            <button
              type="submit"
              disabled={selectedItems.length === 0 || loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <MdReceipt /> {loading ? "Đang xử lý..." : "BÁN COMBO & NHẬN TIỀN"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
