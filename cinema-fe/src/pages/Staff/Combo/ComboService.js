import { getApiUrl, getAuthHeaders, readResponse, cachedFetch } from "../../../services/apiHelper";

const API_URL = getApiUrl();

function normalizeArray(arr) {
  if (!arr) return [];
  if (Array.isArray(arr)) return arr;
  if (arr.$values && Array.isArray(arr.$values)) return arr.$values;
  return [];
}

export async function getCombosList() {
  {
    const userObj = JSON.parse(localStorage.getItem("user") || "{}");
    const cinemaId = userObj.cinemaId ?? userObj.CinemaId;
    if (!cinemaId) throw new Error("Tài khoản nhân viên chưa được gán rạp.");
    const response = await fetch(`${API_URL}/food-inventory/menu?cinemaId=${encodeURIComponent(cinemaId)}`, {
      headers: getAuthHeaders(), cache: "no-store"
    });
    const menu = await readResponse(response);
    if (!response.ok) throw new Error(menu?.message || menu?.Message || "Không tải được tồn kho rạp.");
    const foods = normalizeArray(menu?.foods).map(f => ({ uid:`food-${f.foodId}`, id:f.foodId, type:"food", name:f.foodName,
      description:f.category || "", price:Number(f.price || 0), imageUrl:f.imageUrl, quantity:Number(f.quantity || 0),
      category:String(f.category || "").toLowerCase().includes("nước") ? "drink" : "food", rawCategory:f.category || "", isAvailable:Boolean(f.isAvailable) }));
    const combos = normalizeArray(menu?.combos).map(c => ({ uid:`combo-${c.comboId}`, id:c.comboId, type:"combo", name:c.comboName,
      description:c.description || "", price:Number(c.price || 0), imageUrl:c.imageUrl, quantity:Number(c.quantity || 0),
      category:"combo", isAvailable:Boolean(c.isAvailable), allowsCustomization:Boolean(c.allowsCustomization),
      drinkSlotCount:Number(c.drinkSlotCount || 0), popcornSlotCount:Number(c.popcornSlotCount || 0),
      foodItems:normalizeArray(c.foodItems).map(x => ({ foodId:x.foodId, foodName:x.foodName, category:x.category, itemType:x.itemType })),
      availableOptions:normalizeArray(c.foodItems).map(x => {
        const inventory = foods.find(f => Number(f.id) === Number(x.foodId));
        return inventory ? {...inventory, itemType:x.itemType} : {id:x.foodId,name:x.foodName,rawCategory:x.category,quantity:0,isAvailable:false,itemType:x.itemType};
      }) }));
    return [...combos, ...foods];
  }
}


/**
 * Tạo đơn hàng với trạng thái Pending (dùng cho luồng QR - tạo trước, confirm sau)
 */
export async function createPendingOrder(payload) {
  let staffId = null;
  let cinemaId = null;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    staffId = user?.userId ?? user?.UserId ?? user?.staffId ?? user?.StaffId;
    cinemaId = user?.cinemaId ?? user?.CinemaId;
  } catch (e) {}

  const orderPayload = {
    staffId: staffId,
    cinemaId: cinemaId,
    bookingId: null,
    discountId: null,
    orderType: "Takeaway",
    items: payload.items.map(item => ({
      foodId: item.type === "food" ? item.id : null,
      comboId: item.type === "combo" ? item.id : null,
      quantity: item.quantity,
      selectedComponents: item.type === "combo" ? (item.selectedComponents || []).map(x => ({ foodId:x.foodId, quantity:x.quantity })) : null
    })),
    paymentMethod: payload.paymentMethod || "QR"
  };

  const response = await fetch(`${API_URL}/Orders`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(orderPayload)
  });

  if (!response.ok) {
    const errData = await readResponse(response);
    throw new Error(errData?.message || errData?.Message || "Tạo đơn hàng thất bại!");
  }

  const orderResult = await readResponse(response);
  const orderId =
    orderResult?.Data?.OrderId ??
    orderResult?.data?.OrderId ??
    orderResult?.Data?.orderId ??
    orderResult?.data?.orderId ??
    orderResult?.OrderId ??
    orderResult?.orderId;

  if (!orderId) {
    console.error("[createPendingOrder] Response:", JSON.stringify(orderResult));
    throw new Error("Không nhận được mã đơn hàng từ máy chủ!");
  }

  if (orderId && cinemaId) {
    try {
      const map = JSON.parse(localStorage.getItem("order_cinema_map") || "{}");
      map[String(orderId)] = String(cinemaId);
      localStorage.setItem("order_cinema_map", JSON.stringify(map));
    } catch (e) {}
  }

  return { orderId, orderResult };
}

/**
 * Kiểm tra trạng thái đơn hàng (polling để xem QR đã được thanh toán chưa)
 * Trả về: "Pending" | "Confirmed" | "Cancelled" | null
 */
export async function checkOrderStatus(orderId) {
  try {
    const response = await fetch(`${API_URL}/Orders/${orderId}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) return null;
    const data = await readResponse(response);
    return data?.status ?? data?.Status ?? null;
  } catch (err) {
    console.warn("[checkOrderStatus] Lỗi:", err);
    return null;
  }
}

/**
 * Xác nhận đơn hàng đã thanh toán (Staff bấm confirm sau khi nhận tiền)
 */
export async function confirmOrder(orderId) {
  const confirmRes = await fetch(`${API_URL}/Orders/${orderId}/Status`, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status: "Confirmed" })
  });

  if (!confirmRes.ok) {
    const errData = await readResponse(confirmRes);
    throw new Error(errData?.message || errData?.Message || "Xác nhận thanh toán thất bại!");
  }
  return true;
}

/**
 * Hủy đơn hàng (khi Staff hủy QR)
 */
export async function cancelOrder(orderId) {
  try {
    await fetch(`${API_URL}/Orders/${orderId}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
  } catch (err) {
    console.warn("[cancelOrder] Lỗi:", err);
  }
}

export async function deductInventory(items) {
  if (!Array.isArray(items) || items.length === 0) return;

  // Load fallback lists in parallel using cachedFetch
  let allFoods = [];
  let allCombos = [];
  try {
    const [fData, cData] = await Promise.all([
      cachedFetch(`${API_URL}/Foods/Available`),
      cachedFetch(`${API_URL}/Combos/Available`)
    ]);
    const fUnwrapped = fData?.data ?? fData?.Data ?? fData?.result ?? fData?.Result ?? fData;
    const cUnwrapped = cData?.data ?? cData?.Data ?? cData?.result ?? cData?.Result ?? cData;
    allFoods = normalizeArray(fUnwrapped);
    allCombos = normalizeArray(cUnwrapped);
  } catch (e) {}

  let overrides = {};
  try {
    overrides = JSON.parse(localStorage.getItem("inventory_qty_overrides") || "{}");
  } catch (e) {}

  let activeCinemaId = "1";
  try {
    const userObj = JSON.parse(localStorage.getItem("user") || "{}");
    const cid = userObj.cinemaId ?? userObj.CinemaId;
    if (cid) activeCinemaId = String(cid);
  } catch (e) {}

  for (const item of items) {
    const qty = Number(item.quantity || 1);
    if (qty <= 0) continue;

    const isFood = item.type === "food" || item.foodId != null;
    const isCombo = item.type === "combo" || item.comboId != null;
    const id = item.id ?? item.foodId ?? item.comboId;

    if (!id) continue;
    const key = `${isFood ? 'food' : 'combo'}_${id}_c${activeCinemaId}`;

    try {
      if (isFood) {
        const foodData = allFoods.find(f => String(f.foodId ?? f.FoodId ?? f.id ?? f.Id) === String(id));
        const baseQty = Number(foodData?.quantity ?? foodData?.Quantity ?? item.quantity ?? 100);
        const currentQty = overrides[key] !== undefined ? Number(overrides[key]) : baseQty;
        const newQty = Math.max(0, currentQty - qty);
        overrides[key] = newQty;
      } else if (isCombo) {
        const comboData = allCombos.find(c => String(c.comboId ?? c.ComboId ?? c.id ?? c.Id) === String(id));
        const baseQty = Number(comboData?.quantity ?? comboData?.Quantity ?? item.quantity ?? 100);
        const currentQty = overrides[key] !== undefined ? Number(overrides[key]) : baseQty;
        const newQty = Math.max(0, currentQty - qty);
        overrides[key] = newQty;
      }
    } catch (e) {
      console.warn("[deductInventory] Không thể cập nhật tồn kho:", e);
    }
  }

  try {
    localStorage.setItem("inventory_qty_overrides", JSON.stringify(overrides));
  } catch (e) {}
}

/**
 * Hoàn lại tồn kho khi hủy đơn hàng - ngược lại của deductInventory
 */
export async function restoreInventory(items) {
  if (!Array.isArray(items) || items.length === 0) return;

  // Load current foods/combos data
  let allFoods = [];
  let allCombos = [];
  try {
    const [fData, cData] = await Promise.all([
      cachedFetch(`${API_URL}/Foods/Available`),
      cachedFetch(`${API_URL}/Combos/Available`)
    ]);
    const fUnwrapped = fData?.data ?? fData?.Data ?? fData?.result ?? fData?.Result ?? fData;
    const cUnwrapped = cData?.data ?? cData?.Data ?? cData?.result ?? cData?.Result ?? cData;
    allFoods = normalizeArray(fUnwrapped);
    allCombos = normalizeArray(cUnwrapped);
  } catch (e) {}

  let overrides = {};
  try {
    overrides = JSON.parse(localStorage.getItem("inventory_qty_overrides") || "{}");
  } catch (e) {}

  let activeCinemaId = "1";
  try {
    const userObj = JSON.parse(localStorage.getItem("user") || "{}");
    const cid = userObj.cinemaId ?? userObj.CinemaId;
    if (cid) activeCinemaId = String(cid);
  } catch (e) {}

  for (const item of items) {
    const qty = Number(item.quantity || 1);
    if (qty <= 0) continue;

    const isFood = item.type === "food" || item.foodId != null;
    const isCombo = item.type === "combo" || item.comboId != null;
    const id = item.id ?? item.foodId ?? item.comboId;

    if (!id) continue;
    const key = `${isFood ? 'food' : 'combo'}_${id}_c${activeCinemaId}`;

    try {
      if (isFood) {
        const foodData = allFoods.find(f => String(f.foodId ?? f.FoodId ?? f.id ?? f.Id) === String(id));
        const baseQty = Number(foodData?.quantity ?? foodData?.Quantity ?? 100);
        const currentQty = overrides[key] !== undefined ? Number(overrides[key]) : baseQty;
        // Cộng lại số lượng đã trừ khi bán, nhưng không vượt quá baseQty
        overrides[key] = Math.min(baseQty, currentQty + qty);
      } else if (isCombo) {
        const comboData = allCombos.find(c => String(c.comboId ?? c.ComboId ?? c.id ?? c.Id) === String(id));
        const baseQty = Number(comboData?.quantity ?? comboData?.Quantity ?? 100);
        const currentQty = overrides[key] !== undefined ? Number(overrides[key]) : baseQty;
        overrides[key] = Math.min(baseQty, currentQty + qty);
      }
    } catch (e) {
      console.warn("[restoreInventory] Không thể cập nhật tồn kho:", e);
    }
  }

  try {
    localStorage.setItem("inventory_qty_overrides", JSON.stringify(overrides));
    // Thông báo cho các component cập nhật lại danh sách đồ ăn
    window.dispatchEvent(new Event("inventoryUpdated"));
  } catch (e) {}
}

export async function sellCombo(payload) {
  let staffId = null;
  let cinemaId = null;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    staffId = user?.userId ?? user?.UserId ?? user?.staffId ?? user?.StaffId;
    cinemaId = user?.cinemaId ?? user?.CinemaId;
  } catch (e) {}

  const orderPayload = {
    staffId: staffId,
    cinemaId: cinemaId,
    bookingId: null,
    discountId: null,
    orderType: "Takeaway",
    items: payload.items.map(item => ({
      foodId: item.type === "food" ? item.id : null,
      comboId: item.type === "combo" ? item.id : null,
      quantity: item.quantity,
      selectedComponents: item.type === "combo" ? (item.selectedComponents || []).map(x => ({ foodId:x.foodId, quantity:x.quantity })) : null
    })),
    paymentMethod: payload.paymentMethod || "Cash"
  };

  // 1. Create Order in Database
  const response = await fetch(`${API_URL}/Orders`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(orderPayload)
  });

  if (!response.ok) {
    const errData = await readResponse(response);
    throw new Error(errData?.message || "Tạo đơn hàng thất bại!");
  }

  const orderResult = await readResponse(response);
  const orderId =
    orderResult?.Data?.OrderId ??
    orderResult?.data?.OrderId ??
    orderResult?.Data?.orderId ??
    orderResult?.data?.orderId ??
    orderResult?.OrderId ??
    orderResult?.orderId;

  if (!orderId) {
    console.error("[sellCombo] Response từ server:", JSON.stringify(orderResult));
    throw new Error("Không nhận được mã đơn hàng từ máy chủ! Kiểm tra console để biết thêm.");
  }

  if (orderId && cinemaId) {
    try {
      const map = JSON.parse(localStorage.getItem("order_cinema_map") || "{}");
      map[String(orderId)] = String(cinemaId);
      localStorage.setItem("order_cinema_map", JSON.stringify(map));
    } catch (e) {}
  }

  // 2. Confirm payment by patching order status to "Confirmed"
  const confirmRes = await fetch(`${API_URL}/Orders/${orderId}/Status`, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status: "Confirmed" })
  });

  if (!confirmRes.ok) {
    throw new Error("Xác nhận thanh toán đơn hàng thất bại!");
  }

  return {
    success: true,
    id: `CB${orderId}`,
    orderId: orderId,
    customerName: payload.customerName,
    items: payload.items,
    totalAmount: payload.totalAmount,
    time: new Date().toLocaleString("vi-VN"),
    date: new Date().toLocaleDateString("en-CA"),
    createdAt: new Date().toISOString()
  };
}
