const API_URL = import.meta.env.VITE_API_URL;

export const MOVIE_STATUS = {
  now: "suất đang chiếu",
  coming: "suất sắp chiếu",
  special: "suất đặc biệt",
};

export const MOVIE_TABS = [
  {
    key: "now",
    label: "PHIM ĐANG CHIẾU",
    status: MOVIE_STATUS.now,
    endpoint: `${API_URL}/Movies/ByStatus/${encodeURIComponent(MOVIE_STATUS.now)}`,
    tag: "HOT",
  },
  {
    key: "coming",
    label: "PHIM SẮP CHIẾU",
    status: MOVIE_STATUS.coming,
    endpoint: `${API_URL}/Movies/ByStatus/${encodeURIComponent(MOVIE_STATUS.coming)}`,
    tag: "SOON",
  },
  {
    key: "special",
    label: "SUẤT CHIẾU ĐẶC BIỆT",
    status: MOVIE_STATUS.special,
    endpoint: `${API_URL}/Movies/ByStatus/${encodeURIComponent(MOVIE_STATUS.special)}`,
    tag: "SPECIAL",
  },
];

async function readResponse(response) {
  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.title ||
        text ||
        `Lỗi API: ${response.status}`
    );
  }

  return data;
}

function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;

  return [];
}

export async function getMoviesByTab(tabKey) {
  const tab = MOVIE_TABS.find((item) => item.key === tabKey);

  if (!tab) {
    return [];
  }

  console.log("API phim đang gọi:", tab.endpoint);

  const response = await fetch(tab.endpoint);
  const data = await readResponse(response);

  return normalizeArray(data);
}

export async function getMovieCategories() {
  const response = await fetch(`${API_URL}/MovieCategories`);
  const data = await readResponse(response);

  return normalizeArray(data);
}

export async function getAreaList() {
  const response = await fetch(`${API_URL}/Areas`);
  const data = await readResponse(response);

  return normalizeArray(data);
}