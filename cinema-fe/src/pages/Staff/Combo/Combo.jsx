import "./Combo.css";
import { useState } from "react";
import { useCombo } from "./Combo.js";
import { MdFastfood, MdAdd, MdRemove, MdAddCircleOutline, MdDeleteOutline, MdClose } from "react-icons/md";

export default function StaffCombo() {
  const {
    combos,
    showAddCombo, setShowAddCombo,
    addingCombo, handleAddCombo,
    showAddFood, setShowAddFood,
    addingFood, handleAddFood,
    handleDeleteItem,
  } = useCombo();

  const [foodForm, setFoodForm] = useState({ foodName: "", category: "", price: "", quantity: "", imageUrl: "" });
  const [comboForm, setComboForm] = useState({ comboName: "", price: "", description: "", quantity: "100", imageUrl: "" });
  const [comboFoodQtys, setComboFoodQtys] = useState({});
  const availableFoods = combos.filter(item => item.type === "food");

  const outOfStock = combos.filter(f => (f.quantity ?? 0) <= 0).length;
  const lowStock = combos.filter(f => (f.quantity ?? 0) > 0 && (f.quantity ?? 0) <= 10).length;

  return (
    <>
    <div className="staff-combo-container">
      <h4 className="font-bold text-2xl text-gray-805 mb-6 flex items-center gap-2">
        <MdFastfood className="text-green-600" /> Đồ Ăn & Tồn Kho
      </h4>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-gray-800">{combos.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Tổng mặt hàng</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-center">
          <div className="text-2xl font-bold text-amber-700">{lowStock}</div>
          <div className="text-xs text-amber-600 mt-0.5">Sắp hết (≤ 10)</div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100 text-center">
          <div className="text-2xl font-bold text-red-600">{outOfStock}</div>
          <div className="text-xs text-red-500 mt-0.5">Hết hàng</div>
        </div>
      </div>

      {/* Danh sách tồn kho */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-4 mb-4 flex-wrap gap-y-2">
          <h5 className="font-bold text-gray-800 text-base flex items-center gap-2">
            <span className="w-1.5 h-5 bg-green-600 rounded-full" />
            Danh Sách Tồn Kho
          </h5>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => { setFoodForm({ foodName: "", category: "Đồ ăn", price: "", quantity: "", imageUrl: "" }); setShowAddFood(true); }}
              className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              <MdAddCircleOutline /> Thêm Đồ Ăn
            </button>
            <button
              onClick={() => { setFoodForm({ foodName: "", category: "Đồ uống", price: "", quantity: "", imageUrl: "" }); setShowAddFood(true); }}
              className="flex items-center gap-1 text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              <MdAddCircleOutline /> Thêm Đồ Uống
            </button>
            <button
              onClick={() => { setComboForm({ comboName: "", price: "", description: "", quantity: "100", imageUrl: "" }); setComboFoodQtys({}); setShowAddCombo(true); }}
              className="flex items-center gap-1 text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              <MdAddCircleOutline /> Thêm Combo
            </button>
          </div>
        </div>

        {combos.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-16">Chưa có mặt hàng nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                  <th className="pb-3 text-left font-semibold w-12"></th>
                  <th className="pb-3 text-left font-semibold">Tên món</th>
                  <th className="pb-3 text-left font-semibold">Loại</th>
                  <th className="pb-3 text-right font-semibold pr-6">Giá bán</th>
                  <th className="pb-3 text-center font-semibold w-36">Còn lại</th>
                  <th className="pb-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {combos.map(item => {
                  const qty = item.quantity ?? 0;
                  return (
                    <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 pr-2">
                        <span className="text-2xl bg-gray-50 rounded-xl w-10 h-10 flex items-center justify-center border border-gray-100 select-none">
                          {item.image}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="font-semibold text-gray-800">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          item.type === "combo" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {item.type === "combo" ? "Combo" : item.description || "Đồ ăn"}
                        </span>
                      </td>
                      <td className="py-3 text-right pr-6 font-bold text-gray-800">
                        {item.price.toLocaleString("vi-VN")} đ
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-flex items-center justify-center px-4 py-1 rounded-full font-bold text-sm min-w-[4rem] ${
                          qty <= 0
                            ? "bg-red-100 text-red-700"
                            : qty <= 10
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {qty <= 0 ? "Hết hàng" : qty}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleDeleteItem(item.id, item.type)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                          title="Xóa"
                        >
                          <MdDeleteOutline className="text-base" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
