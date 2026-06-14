const API_URL = import.meta.env.VITE_API_URL;

export const MOVIE_TABS = [
  {
    key: "coming",
    label: "PHIM SẮP CHIẾU",
    endpoint: `${API_URL}/Movie/coming`,
    tag: "SOON",
  },
  {
    key: "now",
    label: "PHIM ĐANG CHIẾU",
    endpoint: `${API_URL}/Movie/now-showing`,
    tag: "HOT",
  },
  {
    key: "special",
    label: "SUẤT CHIẾU ĐẶC BIỆT",
    endpoint: `${API_URL}/Movie/special`,
    tag: "SPECIAL",
  },
];

async function readResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { message: text };
  }
}

export async function getMoviesByTab(tabKey) {
  const currentTab = MOVIE_TABS.find((tab) => tab.key === tabKey);

  if (!currentTab) return [];

  const response = await fetch(currentTab.endpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || "Không gọi được API phim");
  }

  return Array.isArray(data) ? data : data?.data || data?.result || [];
}