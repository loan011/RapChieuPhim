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

  const combos = combosData.map(c => {
    const rawId = c.comboId ?? c.ComboId;
    return {
      uid: `combo-${rawId}`,   // unique React key
      id: rawId,               // numeric ID dùng cho API
      type: "combo",
      name: c.comboName ?? c.ComboName ?? "",
      description: c.description ?? c.Description ?? "",
      price: Number(c.price ?? c.Price ?? 0),
      imageUrl: c.imageUrl ?? c.ImageUrl ?? null,
      imageEmoji: "🍿🥤",
      quantity: Number(c.quantity ?? c.Quantity ?? 0),
      category: "combo",
    };
  });

  const foods = foodsData.map(f => {
    const rawId = f.foodId ?? f.FoodId;
    const cat = (f.category ?? f.Category ?? "").toLowerCase();
    const isDrink = cat.includes("nước") || cat.includes("uống");
    return {
      uid: `food-${rawId}`,    // unique React key
      id: rawId,               // numeric ID dùng cho API
      type: "food",
      name: f.foodName ?? f.FoodName ?? "",
      description: f.category ?? f.Category ?? "",
      price: Number(f.price ?? f.Price ?? 0),
      imageUrl: f.imageUrl ?? f.ImageUrl ?? null,
      imageEmoji: isDrink ? "🥤" : "🍿",
      quantity: Number(f.quantity ?? f.Quantity ?? 0),
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
  const orderPayload = {
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

export async function sellCombo(payload) {
  const orderPayload = {
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
  // Backend trả về { Message, Data: { OrderId, ... } } - cover cả PascalCase và camelCase
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
    date: new Date().toLocaleDateString("en-CA"), // YYYY-MM-DD
    createdAt: new Date().toISOString()
  };
}
