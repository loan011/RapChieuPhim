import "./Combo.css";
import { useState } from "react";
import { useCombo } from "./Combo.js";
import { MdFastfood, MdAdd, MdRemove, MdShoppingCart, MdReceipt, MdCheckCircle, MdClose, MdAddCircleOutline, MdDeleteOutline } from "react-icons/md";

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
    handleSell,
    showAddCombo,
    setShowAddCombo,
    addingCombo,
    handleAddCombo,
    showAddFood,
    setShowAddFood,
    addingFood,
    handleAddFood,
    handleDeleteItem,
  } = useCombo();

  const [foodForm, setFoodForm] = useState({ foodName: "", category: "", price: "", quantity: "", imageUrl: "" });
  const [comboForm, setComboForm] = useState({ comboName: "", price: "", description: "", quantity: "100", imageUrl: "" });
  const [comboFoodQtys, setComboFoodQtys] = useState({});
  const availableFoods = combos.filter(item => item.type === "food");

  return (
    <>
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
            <h5 className="font-bold text-gray-800 text-base mb-4 flex items-center justify-between gap-2 border-b border-gray-50 pb-2">
              <span className="flex items-center gap-2"><span className="w-1.5 h-5 bg-green-600 rounded-full"></span>Danh Sách Combo & Đồ Ăn</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setFoodForm({ foodName: "", category: "Đồ ăn", price: "", quantity: "", imageUrl: "" }); setShowAddFood(true); }}
                  className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  <MdAddCircleOutline className="text-base" /> Thêm Đồ Ăn
                </button>
                <button
                  onClick={() => { setFoodForm({ foodName: "", category: "Đồ uống", price: "", quantity: "", imageUrl: "" }); setShowAddFood(true); }}
                  className="flex items-center gap-1 text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  <MdAddCircleOutline className="text-base" /> Thêm Đồ Uống
                </button>
                <button
                  onClick={() => { setComboForm({ comboName: "", price: "", description: "", quantity: "100", imageUrl: "" }); setComboFoodQtys({}); setShowAddCombo(true); }}
                  className="flex items-center gap-1 text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  <MdAddCircleOutline className="text-base" /> Thêm Combo
                </button>

              </div>
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
                    <button
                      onClick={() => handleDeleteItem(item.id, item.type)}
                      className="w-8 h-8 rounded-lg border border-red-100 hover:bg-red-50 flex items-center justify-center text-red-400 hover:text-red-600 active:scale-95 transition-all ml-1"
                      title="Xóa món"
                    >
                      <MdDeleteOutline />
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

            <button
              type="submit"
              disabled={selectedItems.length === 0 || loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <MdReceipt /> {loading ? "Đang xử lý..." : "THANH TOÁN"}
            </button>
          </form>
        </div>
      </div>
    </div>

      {/* Modal Thêm Đồ Ăn */}
      {showAddFood && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h5 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <MdFastfood className="text-green-600" /> Thêm Đồ Ăn Mới
              </h5>
              <button onClick={() => setShowAddFood(false)} className="text-gray-400 hover:text-gray-700"><MdClose className="text-xl" /></button>
            </div>
            <form
              onSubmit={async e => {
                e.preventDefault();
                await handleAddFood({
                  foodName: foodForm.foodName,
                  category: foodForm.category,
                  price: parseFloat(foodForm.price),
                  quantity: parseInt(foodForm.quantity),
                  imageUrl: foodForm.imageUrl || null,
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Tên món <span className="text-red-500">*</span></label>
                <input required value={foodForm.foodName} onChange={e => setFoodForm(f => ({...f, foodName: e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" placeholder="VD: Bắp Ngọt Lớn" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Phân loại</label>
                  <input value={foodForm.category} onChange={e => setFoodForm(f => ({...f, category: e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" placeholder="VD: Đồ uống" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Số lượng <span className="text-red-500">*</span></label>
                  <input required type="number" min="0" value={foodForm.quantity} onChange={e => setFoodForm(f => ({...f, quantity: e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" placeholder="100" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Giá (VNĐ) <span className="text-red-500">*</span></label>
                <input required type="number" min="0" value={foodForm.price} onChange={e => setFoodForm(f => ({...f, price: e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" placeholder="35000" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">URL Hình ảnh</label>
                <input value={foodForm.imageUrl} onChange={e => setFoodForm(f => ({...f, imageUrl: e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" placeholder="https://... (để trống dùng icon mặc định)" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddFood(false)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors">Hủy</button>
                <button type="submit" disabled={addingFood} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
                  {addingFood ? "Đang thêm..." : "Thêm Món"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm Combo */}
      {showAddCombo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h5 className="font-bold text-gray-800 text-base flex items-center gap-2">
                🍿 Tạo Combo Mới
              </h5>
              <button onClick={() => setShowAddCombo(false)} className="text-gray-400 hover:text-gray-700"><MdClose className="text-xl" /></button>
            </div>
            <form
              className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
              onSubmit={async e => {
                e.preventDefault();
                await handleAddCombo(
                  { comboName: comboForm.comboName, price: parseFloat(comboForm.price), description: comboForm.description, quantity: parseInt(comboForm.quantity), imageUrl: comboForm.imageUrl || null }
                );
              }}
            >
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Tên Combo <span className="text-red-500">*</span></label>
                <input required value={comboForm.comboName} onChange={e => setComboForm(f => ({...f, comboName: e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" placeholder="VD: Combo Solo, Combo Đôi..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Giá (VNĐ) <span className="text-red-500">*</span></label>
                  <input required type="number" min="0" value={comboForm.price} onChange={e => setComboForm(f => ({...f, price: e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" placeholder="85000" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Số lượng tồn kho</label>
                  <input type="number" min="0" value={comboForm.quantity} onChange={e => setComboForm(f => ({...f, quantity: e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" placeholder="100" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Mô tả</label>
                <input value={comboForm.description} onChange={e => setComboForm(f => ({...f, description: e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" placeholder="VD: 2 Bắp ngọt lớn + 1 Nước ngọt" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Thành phần (chọn số lượng từng món)</label>
                {availableFoods.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Chưa có đồ ăn/uống. Hãy thêm trước.</p>
                ) : (
                  <div className="border border-gray-100 rounded-xl divide-y divide-gray-50">
                    {availableFoods.map(food => (
                      <div key={food.id} className="flex items-center justify-between px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{food.image}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{food.name}</p>
                            <p className="text-xs text-gray-400">{food.price.toLocaleString("vi-VN")} đ</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setComboFoodQtys(q => ({...q, [food.id]: Math.max(0, (q[food.id]||0) - 1)}))} className="w-7 h-7 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 text-sm"><MdRemove /></button>
                          <span className="w-5 text-center text-sm font-bold text-gray-800">{comboFoodQtys[food.id] || 0}</span>
                          <button type="button" onClick={() => setComboFoodQtys(q => ({...q, [food.id]: (q[food.id]||0) + 1}))} className="w-7 h-7 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 text-sm"><MdAdd /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowAddCombo(false)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors">Hủy</button>
                <button type="submit" disabled={addingCombo} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
                  {addingCombo ? "Đang tạo..." : "Tạo Combo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
