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
    endpoint: `${API_URL}/Movies/NowShowing`,
    tag: "HOT",
  },
  {
    key: "coming",
    label: "PHIM SẮP CHIẾU",
    status: MOVIE_STATUS.coming,
    endpoint: `${API_URL}/Movies/ComingSoon`,
    tag: "SOON",
  },
  {
    key: "special",
    label: "SUẤT CHIẾU ĐẶC BIỆT",
    status: MOVIE_STATUS.special,
    endpoint: `${API_URL}/Movies/Special`,
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

function normalizeCategory(category) {
  return {
    categoryId:
      category.categoryId ||
      category.CategoryId ||
      category.id ||
      category.Id ||
      category.movieCategoryId ||
      category.MovieCategoryId,

    categoryName:
      category.categoryName ||
      category.CategoryName ||
      category.name ||
      category.Name ||
      category.title ||
      category.Title ||
      category.description ||
      category.Description ||
      "Đang cập nhật",
  };
}

export async function getMoviesByTab(tabKey) {
  const tab = MOVIE_TABS.find((item) => item.key === tabKey);

  if (!tab) {
    return [];
  }

  const response = await fetch(tab.endpoint);
  const data = await readResponse(response);

  return normalizeArray(data);
}

export async function getMovieCategories() {
  const response = await fetch(`${API_URL}/MovieCategories`);
  const data = await readResponse(response);

  return normalizeArray(data).map(normalizeCategory);
}