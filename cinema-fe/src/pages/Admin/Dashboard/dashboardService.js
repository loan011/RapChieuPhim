import {
  getApiUrl,
  readResponse,
  getErrorMessage,
  getAuthHeaders,
} from "../../../services/apiHelper";

const API_URL = getApiUrl();

async function apiGet(path, fallbackMessage) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, fallbackMessage));
  }

  return data;
}

export async function getDashboardStats(filter, cinemaId = "") {
  const cinemaParam = cinemaId ? `&cinemaId=${cinemaId}` : "";
  return apiGet(
    `/Dashboard/Stats?filter=${filter}${cinemaParam}`,
    "Lấy số liệu tổng quan thất bại!"
  );
}

export async function getRecentTickets() {
  return apiGet(
    "/Dashboard/RecentTickets",
    "Lấy danh sách vé gần đây thất bại!"
  );
}

export async function getRevenueChart(filter, cinemaId = "") {
  const cinemaParam = cinemaId ? `&cinemaId=${cinemaId}` : "";
  return apiGet(
    `/Dashboard/RevenueChart?filter=${filter}${cinemaParam}`,
    "Lấy dữ liệu biểu đồ thất bại!"
  );
}

export async function getMovieStats(filter, cinemaId = "") {
  const cinemaParam = cinemaId ? `&cinemaId=${cinemaId}` : "";
  return apiGet(
    `/Dashboard/MovieStats?filter=${filter}${cinemaParam}`,
    "Lấy thống kê phim thất bại!"
  );
}

export async function getCinemas() {
  return apiGet(
    "/Cinemas",
    "Lấy danh sách rạp thất bại!"
  );
}

export async function getMovieDetailStats(movieId) {
  return apiGet(
    `/Dashboard/MovieDetailStats/${movieId}`,
    "Lấy thống kê chi tiết phim thất bại!"
  );
}

export async function getMovies() {
  return apiGet(
    "/Movies",
    "Lấy danh sách phim thất bại!"
  );
}

export async function getDashboardFoodSources() {
  const apiOrders = await apiGet("/Orders", "Lấy danh sách order thất bại!").catch(() => []);
  let orders = Array.isArray(apiOrders) ? [...apiOrders] : (apiOrders?.$values || apiOrders?.items || []);
  if (!Array.isArray(orders)) orders = [];

  // Đồng bộ thêm các order giả lập bán trực tiếp tại quầy (từ Staff)
  try {
    const localStr = localStorage.getItem("simulated_orders");
    if (localStr) {
      const localOrders = JSON.parse(localStr);
      if (Array.isArray(localOrders)) {
        localOrders.forEach(lo => {
          orders.push({
            ...lo,
            orderDate: lo.date || lo.orderDate,
            status: "Success",
            cinemaId: 1 // Gắn mặc định về Đồng Khởi để hiện đúng khi lọc
          });
        });
      }
    }
  } catch (e) {}

  return { orders };
}
