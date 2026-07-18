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
  const combosController = new AbortController();
  const combosTimeout = setTimeout(() => combosController.abort(), 3000);
  try {
    const res = await fetch(`${API_URL}/Combos/Available`, {
      headers: getAuthHeaders(),
      signal: combosController.signal
    });
    const data = await readResponse(res);
    combosData = normalizeArray(data);
  } catch (err) {
    console.warn("Failed to load combos:", err);
  } finally {
    clearTimeout(combosTimeout);
  }

  // 2. Fetch Foods
  const foodsController = new AbortController();
  const foodsTimeout = setTimeout(() => foodsController.abort(), 3000);
  try {
    const res = await fetch(`${API_URL}/Foods/Available`, {
      headers: getAuthHeaders(),
      signal: foodsController.signal
    });
    const data = await readResponse(res);
    foodsData = normalizeArray(data);
  } catch (err) {
    console.warn("Failed to load foods:", err);
  } finally {
    clearTimeout(foodsTimeout);
  }

  const combos = combosData.map(c => ({
    id: c.comboId ?? c.ComboId,
    type: "combo",
    name: c.comboName ?? c.ComboName ?? "",
    description: c.description ?? c.Description ?? "",
    price: Number(c.price ?? c.Price ?? 0),
    image: c.imageUrl ?? c.ImageUrl ?? "🍿🥤",
    category: "combo",
  }));

  const foods = foodsData.map(f => ({
    id: f.foodId ?? f.FoodId,
    type: "food",
    name: f.foodName ?? f.FoodName ?? "",
    description: f.category ?? f.Category ?? "",
    price: Number(f.price ?? f.Price ?? 0),
    image: f.imageUrl ?? f.ImageUrl ?? "🥤",
    category: (f.category ?? f.Category ?? "").toLowerCase().includes("nước") || (f.category ?? f.Category ?? "").toLowerCase().includes("uống") ? "drink" : "food",
  }));

  if (combos.length === 0 && foods.length === 0) {
    return [
      { id: 1, type: "combo", name: "Combo Solo", description: "1 Bắp ngọt lớn + 1 Nước ngọt lớn (Coke/Pepsi/Fanta)", price: 85000, image: "🍿🥤" },
      { id: 2, type: "combo", name: "Combo Couple", description: "1 Bắp ngọt lớn + 2 Nước ngọt lớn (Coke/Pepsi/Fanta)", price: 115000, image: "🍿🥤🥤" },
      { id: 3, type: "combo", name: "Combo Family", description: "2 Bắp ngọt lớn + 3 Nước ngọt lớn + 1 Snack Khoai tây", price: 185000, image: "🍿🍿🥤🥤🥤" },
      { id: 4, type: "food", name: "Bắp Ngọt Lớn", description: "Bắp ngọt giòn thơm nóng hổi cỡ lớn", price: 60000, image: "🍿" },
      { id: 5, type: "food", name: "Nước Ngọt Lớn", description: "Ly nước ngọt 32oz mát lạnh (Coca, Pepsi, Sprite)", price: 35000, image: "🥤" }
    ];
  }

  return [...combos, ...foods];
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
    }))
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
  const orderId = orderResult?.data?.orderId || orderResult?.OrderId;

  if (!orderId) {
    throw new Error("Không nhận được mã đơn hàng từ máy chủ!");
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
