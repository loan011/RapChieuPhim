import { getApiUrl, getAuthHeaders, readResponse } from "../../../services/apiHelper";

const API_URL = getApiUrl();

function normalizeArray(arr) {
  if (!arr) return [];
  if (Array.isArray(arr)) return arr;
  if (arr.$values && Array.isArray(arr.$values)) return arr.$values;
  return [];
}

export async function getCombosList() {
  let combosData = [];
  let foodsData = [];

  // 1. Fetch Combos
  try {
    const res = await fetch(`${API_URL}/Combos/Available`, {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const text = await res.text();
      const raw = text ? JSON.parse(text) : null;
      console.log("[Combo] Combos raw:", raw);
      const unwrapped = raw?.data ?? raw?.Data ?? raw?.result ?? raw?.Result ?? raw;
      combosData = normalizeArray(unwrapped);
    } else {
      console.warn("[Combo] Combos/Available trả về", res.status);
    }
  } catch (err) {
    console.warn("[Combo] Failed to load combos:", err);
  }

  // 2. Fetch Foods
  try {
    const res = await fetch(`${API_URL}/Foods/Available`, {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const text = await res.text();
      const raw = text ? JSON.parse(text) : null;
      console.log("[Combo] Foods raw:", raw);
      const unwrapped = raw?.data ?? raw?.Data ?? raw?.result ?? raw?.Result ?? raw;
      foodsData = normalizeArray(unwrapped);
    } else {
      console.warn("[Combo] Foods/Available trả về", res.status);
    }
  } catch (err) {
    console.warn("[Combo] Failed to load foods:", err);
  }

  console.log("[Combo] Combos:", combosData.length, "| Foods:", foodsData.length);

  let activeCinemaId = "1";
  try {
    const userObj = JSON.parse(localStorage.getItem("user") || "{}");
    const cid = userObj.cinemaId ?? userObj.CinemaId;
    if (cid) activeCinemaId = String(cid);
  } catch (e) {}

  let overrides = {};
  try {
    overrides = JSON.parse(localStorage.getItem("inventory_qty_overrides") || "{}");
  } catch (e) {}

  const combos = combosData.map(c => {
    const rawId = c.comboId ?? c.ComboId;
    const baseQty = Number(c.quantity ?? c.Quantity ?? 0);
    const key = `combo_${rawId}_c${activeCinemaId}`;
    const availKey = `combo_avail_${rawId}_c${activeCinemaId}`;
    
    const isAvail = overrides[availKey] !== undefined ? Boolean(overrides[availKey]) : (c.isAvailable ?? c.IsAvailable ?? true);
    const finalQty = isAvail ? (overrides[key] !== undefined ? Number(overrides[key]) : baseQty) : 0;

    return {
      uid: `combo-${rawId}`,   // unique React key
      id: rawId,               // numeric ID dùng cho API
      type: "combo",
      name: c.comboName ?? c.ComboName ?? "",
      description: c.description ?? c.Description ?? "",
      price: Number(c.price ?? c.Price ?? 0),
      imageUrl: c.imageUrl ?? c.ImageUrl ?? null,
      imageEmoji: "🍿🥤",
      quantity: finalQty,
      category: "combo",
    };
  });

  const foods = foodsData.map(f => {
    const rawId = f.foodId ?? f.FoodId;
    const cat = (f.category ?? f.Category ?? "").toLowerCase();
    const isDrink = cat.includes("nước") || cat.includes("uống");
    const baseQty = Number(f.quantity ?? f.Quantity ?? 0);
    const key = `food_${rawId}_c${activeCinemaId}`;
    const availKey = `food_avail_${rawId}_c${activeCinemaId}`;

    const isAvail = overrides[availKey] !== undefined ? Boolean(overrides[availKey]) : (f.isAvailable ?? f.IsAvailable ?? true);
    const finalQty = isAvail ? (overrides[key] !== undefined ? Number(overrides[key]) : baseQty) : 0;

    return {
      uid: `food-${rawId}`,    // unique React key
      id: rawId,               // numeric ID dùng cho API
      type: "food",
      name: f.foodName ?? f.FoodName ?? "",
      description: f.category ?? f.Category ?? "",
      price: Number(f.price ?? f.Price ?? 0),
      imageUrl: f.imageUrl ?? f.ImageUrl ?? null,
      imageEmoji: isDrink ? "🥤" : "🍿",
      quantity: finalQty,
      category: isDrink ? "drink" : "food",
    };
  });

  if (combos.length === 0 && foods.length === 0) {
    return [
      { uid: "combo-1", id: 1, type: "combo", name: "Combo Solo",   description: "1 Bắp ngọt lớn + 1 Nước ngọt lớn", price: 85000,  imageUrl: null, imageEmoji: "🍿🥤",       quantity: 99 },
      { uid: "combo-2", id: 2, type: "combo", name: "Combo Couple", description: "1 Bắp ngọt lớn + 2 Nước ngọt lớn", price: 115000, imageUrl: null, imageEmoji: "🍿🥤🥤",     quantity: 99 },
      { uid: "combo-3", id: 3, type: "combo", name: "Combo Family", description: "2 Bắp ngọt lớn + 3 Nước ngọt lớn", price: 185000, imageUrl: null, imageEmoji: "🍿🍿🥤🥤🥤", quantity: 99 },
      { uid: "food-4",  id: 4, type: "food",  name: "Bắp Ngọt Lớn",   description: "Bắp ngọt giòn thơm nóng hổi cỡ lớn",        price: 60000, imageUrl: null, imageEmoji: "🍿", quantity: 99 },
      { uid: "food-5",  id: 5, type: "food",  name: "Nước Ngọt Lớn",  description: "Ly nước ngọt 32oz mát lạnh",                  price: 35000, imageUrl: null, imageEmoji: "🥤", quantity: 99 },
    ];
  }

  return [...combos, ...foods];
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
      quantity: item.quantity
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

  // Load fallback list if single GET fails
  let allFoods = [];
  let allCombos = [];
  try {
    const [fRes, cRes] = await Promise.all([
      fetch(`${API_URL}/Foods`, { headers: getAuthHeaders() }),
      fetch(`${API_URL}/Combos`, { headers: getAuthHeaders() })
    ]);
    if (fRes.ok) {
      const d = await readResponse(fRes);
      allFoods = Array.isArray(d) ? d : (d?.$values ?? []);
    }
    if (cRes.ok) {
      const d = await readResponse(cRes);
      allCombos = Array.isArray(d) ? d : (d?.$values ?? []);
    }
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
        let foodData = null;
        try {
          const res = await fetch(`${API_URL}/Foods/${id}`, { headers: getAuthHeaders() });
          if (res.ok) foodData = await readResponse(res);
        } catch (e) {}

        if (!foodData) {
          foodData = allFoods.find(f => (f.foodId ?? f.FoodId ?? f.id) == id);
        }

        const baseQty = Number(foodData?.quantity ?? foodData?.Quantity ?? item.quantity ?? 100);
        const currentQty = overrides[key] !== undefined ? Number(overrides[key]) : baseQty;
        const newQty = Math.max(0, currentQty - qty);
        overrides[key] = newQty;

        // Bỏ gọi API PUT cập nhật tồn kho từ Frontend vì Staff không có quyền (gây lỗi 403)
        // Backend nên tự trừ tồn kho khi đơn hàng được tạo/xác nhận thành công.
      } else if (isCombo) {
        let comboData = null;
        try {
          const res = await fetch(`${API_URL}/Combos/${id}`, { headers: getAuthHeaders() });
          if (res.ok) comboData = await readResponse(res);
        } catch (e) {}

        if (!comboData) {
          comboData = allCombos.find(c => (c.comboId ?? c.ComboId ?? c.id) == id);
        }

        const baseQty = Number(comboData?.quantity ?? comboData?.Quantity ?? item.quantity ?? 100);
        const currentQty = overrides[key] !== undefined ? Number(overrides[key]) : baseQty;
        const newQty = Math.max(0, currentQty - qty);
        overrides[key] = newQty;

        // Bỏ gọi API PUT cập nhật tồn kho từ Frontend vì Staff không có quyền (gây lỗi 403)
      }
    } catch (e) {
      console.warn("[deductInventory] Không thể cập nhật tồn kho:", e);
    }
  }

  try {
    localStorage.setItem("inventory_qty_overrides", JSON.stringify(overrides));
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
      quantity: item.quantity
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

  // 3. Deduct stock in Database (Foods / Combos)
  await deductInventory(payload.items);

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
