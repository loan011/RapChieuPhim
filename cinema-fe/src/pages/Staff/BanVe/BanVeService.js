import {
  getApiUrl,
  readResponse,
  getErrorMessage,
  getAuthHeaders,
  cachedFetch,
} from "../../../services/apiHelper";

function generateMockSeats(roomId) {
  const seats = [];
  const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  let idCounter = 1;
  rows.forEach((row) => {
    const isCoupleRow = row === "I" || row === "J";
    const seatCount = isCoupleRow ? 20 : 16;
    for (let col = 1; col <= seatCount; col++) {
      let seatType = "Standard";
      if (isCoupleRow) seatType = "Couple";
      else if (row === "E" || row === "F" || row === "G") seatType = "VIP";

      seats.push({
        seatId: idCounter++,
        roomId,
        seatRow: row,
        seatNumber: `${row}${col}`,
        seatType,
        isAvailable: true,
      });
    }
  });
  return seats;
}

const API_URL = getApiUrl();

function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.$values)) return data.data.$values;
  return [];
}

export async function getMovieList() {
  try {
    const data = await cachedFetch(`${API_URL}/Movies`);
    return normalizeArray(data);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Lấy danh sách phim thất bại!"));
  }
}

export async function getShowtimeList() {
  try {
    const data = await cachedFetch(`${API_URL}/Showtimes`);
    return normalizeArray(data);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Lấy danh sách suất chiếu thất bại!"));
  }
}

export async function getShowtimeDetailList() {
  try {
    const data = await cachedFetch(`${API_URL}/Showtimes`);
    return normalizeArray(data);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Lấy danh sách suất chiếu thất bại!"));
  }
}

export async function getSeatsByRoomId(roomId) {
  try {
    const data = await cachedFetch(`${API_URL}/Seats/ByRoom/${roomId}`);
    const seats = normalizeArray(data);
    if (seats.length === 0) {
      return generateMockSeats(roomId);
    }
    return seats;
  } catch (err) {
    throw new Error(getErrorMessage(err, "Lấy sơ đồ ghế thất bại!"));
  }
}

export async function getAvailableSeats(showtimeId) {
  const response = await fetch(
    `${API_URL}/Bookings/AvailableSeats/${showtimeId}`,
    {
      headers: getAuthHeaders(),
    }
  );

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Lấy danh sách ghế trống thất bại!")
    );
  }

  return normalizeArray(data);
}

export async function createBooking(payload) {
  const response = await fetch(`${API_URL}/Bookings`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Đặt vé thất bại!"));
  }

  return data?.data || data;
}

export function normalizeStudentExpiryDate(value) {
  const input = String(value || "").trim();
  let match;

  if ((match = input.match(/^(\d{4})$/))) return `${match[1]}-12-31`;
  if ((match = input.match(/^(\d{2})$/))) return `20${match[1]}-12-31`;
  if ((match = input.match(/^(\d{1,2})[/.\-](\d{4})$/))) {
    const month = Number(match[1]);
    const year = Number(match[2]);
    if (month < 1 || month > 12) return input;
    const lastDay = new Date(year, month, 0).getDate();
    return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  }
  if ((match = input.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/))) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return input;
}

export async function submitStudentVerification(bookingId, cardInfo) {
  const body = new FormData();
  body.append("bookingId", bookingId); body.append("studentCode", cardInfo.studentId);
  if (cardInfo.studentName) body.append("studentName", cardInfo.studentName);
  if (cardInfo.school) body.append("schoolName", cardInfo.school);
  body.append("expiryDate", normalizeStudentExpiryDate(cardInfo.expiryDate)); body.append("cardImage", cardInfo.imageFile);
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/student-card-verifications`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Không thể gửi yêu cầu xác minh."));
  return data;
}

export async function getStudentVerificationStatus(id) {
  const response = await fetch(`${API_URL}/student-card-verifications/${id}/status`, { headers: getAuthHeaders() });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(data, "Không thể cập nhật trạng thái xác minh."));
  return data;
}

export async function getRoomList() {
  try {
    const data = await cachedFetch(`${API_URL}/Rooms`);
    return normalizeArray(data);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Lấy danh sách phòng thất bại!"));
  }
}

export async function getCombosAndFoodsList(cinemaIdOverride) {
  let combosData = [];
  let foodsData = [];
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const cinemaId = cinemaIdOverride ?? user.cinemaId ?? user.CinemaId;

  try {
    const response = await fetch(`${API_URL}/food-inventory/menu?cinemaId=${encodeURIComponent(cinemaId)}`, {
      headers: getAuthHeaders(), cache: "no-store"
    });
    const raw = await readResponse(response);
    if (!response.ok) throw new Error(getErrorMessage(raw, "Không tải được menu của rạp."));
    combosData = normalizeArray(raw?.combos);
    foodsData = normalizeArray(raw?.foods);
  } catch (err) {
    console.warn("[BanVe] Failed to load combos:", err);
  }

  console.log("[BanVe] Combos:", combosData.length, "| Foods:", foodsData.length);

  const combos = combosData.map(c => ({
    id: c.comboId ?? c.ComboId,
    type: "combo",
    name: c.comboName ?? c.ComboName ?? "",
    description: c.description ?? c.Description ?? "",
    price: Number(c.price ?? c.Price ?? 0),
    image: c.imageUrl ?? c.ImageUrl ?? "🍿",
    category: "combo",
    quantity: Number(c.quantity ?? c.Quantity ?? 0),
    isAvailable: Boolean(c.isAvailable ?? c.IsAvailable),
    drinkSlotCount: Number(c.drinkSlotCount ?? c.DrinkSlotCount ?? 0),
    popcornSlotCount: Number(c.popcornSlotCount ?? c.PopcornSlotCount ?? 0),
    allowedItems: normalizeArray(c.foodItems ?? c.FoodItems).map(option => {
      const optionId = option.foodId ?? option.FoodId;
      const inventory = foodsData.find(food => Number(food.foodId ?? food.FoodId) === Number(optionId));
      return {
        ...option,
        quantity: Number(inventory?.quantity ?? inventory?.Quantity ?? 0),
        isAvailable: Boolean(inventory?.isAvailable ?? inventory?.IsAvailable),
      };
    }),
  }));

  const foods = foodsData.map(f => ({
    id: f.foodId ?? f.FoodId,
    type: "food",
    name: f.foodName ?? f.FoodName ?? "",
    description: f.category ?? f.Category ?? "",
    price: Number(f.price ?? f.Price ?? 0),
    quantity: Number(f.quantity ?? f.Quantity ?? 0),
    isAvailable: Boolean(f.isAvailable ?? f.IsAvailable),
    image: f.imageUrl ?? f.ImageUrl ?? "🥤",
    category: (f.category ?? f.Category ?? "").toLowerCase().includes("nước") || (f.category ?? f.Category ?? "").toLowerCase().includes("uống") ? "drink" : "food",
  }));

  return [...combos, ...foods];
}
