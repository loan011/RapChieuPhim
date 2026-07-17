import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../../services/apiHelper";

const API_URL = getApiUrl();

function norm(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export async function getFoodInventory() {
  const response = await fetch(`${API_URL}/Foods`, { headers: getAuthHeaders() });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Lấy danh sách đồ ăn thất bại!"));
  return norm(data).map(f => ({
    id:          f.foodId   || f.FoodId,
    name:        f.foodName || f.FoodName,
    category:    f.category || f.Category || "—",
    price:       f.price    || f.Price    || 0,
    quantity:    f.quantity ?? f.Quantity ?? 0,
    isAvailable: f.isAvailable ?? f.IsAvailable ?? false,
    imageUrl:    f.imageUrl || f.ImageUrl || null,
  }));
}

export async function updateFoodQuantity(food, newQuantity) {
  const response = await fetch(`${API_URL}/Foods/${food.id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      foodId:      food.id,
      foodName:    food.name,
      category:    food.category,
      price:       food.price,
      quantity:    newQuantity,
      isAvailable: newQuantity > 0,
      imageUrl:    food.imageUrl,
    }),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Cập nhật tồn kho thất bại!"));
  return data;
}
