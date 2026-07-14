import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../../services/apiHelper";

const API_URL = getApiUrl();

function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

// GET /api/Combos/Available + /api/Foods/Available
export async function getCombosList() {
  const [combosRes, foodsRes] = await Promise.all([
    fetch(`${API_URL}/Combos/Available`, { headers: getAuthHeaders() }),
    fetch(`${API_URL}/Foods/Available`, { headers: getAuthHeaders() }),
  ]);

  const combosData = await readResponse(combosRes).catch(() => []);
  const foodsData = await readResponse(foodsRes).catch(() => []);

  const combos = normalizeArray(combosData).map(c => ({
    id: c.comboId,
    type: "combo",
    name: c.comboName,
    description: c.description || "",
    price: c.price,
    image: c.imageUrl || "🍿",
  }));

  const foods = normalizeArray(foodsData).map(f => ({
    id: f.foodId,
    type: "food",
    name: f.foodName,
    description: f.category || "",
    price: f.price,
    image: f.imageUrl || "🥤",
  }));

  return [...combos, ...foods];
}

// POST /api/Orders
export async function sellCombo({ customerName, items, totalAmount }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.userId || user?.UserId || 0;

  const orderItems = items.map(item => ({
    comboId: item.type === "combo" ? item.id : null,
    foodId: item.type === "food" ? item.id : null,
    quantity: item.quantity,
    unitPrice: item.price,
    subtotal: item.price * item.quantity,
  }));

  const response = await fetch(`${API_URL}/Orders`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      userId,
      totalAmount,
      orderType: "Combo",
      status: "Completed",
      orderitems: orderItems,
    }),
  });

  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Bán combo thất bại!"));


  return {
    success: true,
    id: data?.orderId || data?.OrderId || `CB${Math.floor(Math.random() * 90000) + 10000}`,
    customerName,
    items,
    totalAmount,
    time: new Date().toLocaleString("vi-VN"),
  };
}

// POST /api/Foods
export async function addFood(food) {
  const response = await fetch(`${API_URL}/Foods`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(food),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Thêm đồ ăn thất bại!"));
  return data;
}

// DELETE /api/Foods/{id} or /api/Combos/{id}
export async function deleteItem(id, type) {
  const endpoint = type === "combo" ? `${API_URL}/Combos/${id}` : `${API_URL}/Foods/${id}`;
  const response = await fetch(endpoint, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Xóa thất bại!"));
  return data;
}

// POST /api/Combos
export async function addCombo(combo) {
  const response = await fetch(`${API_URL}/Combos`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(combo),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Thêm combo thất bại!"));
  return data;
}
