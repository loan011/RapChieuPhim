import { getApiUrl, cachedFetch, getErrorMessage } from "../../services/apiHelper";

const API_URL = getApiUrl();

// GET /api/Movies
export async function getMovieList() {
  return cachedFetch(`${API_URL}/Movies`);
}

// GET /api/Areas
export async function getAreaList() {
  return cachedFetch(`${API_URL}/Areas`);
}

// GET /api/Showtimes
export async function getShowtimeList() {
  return cachedFetch(`${API_URL}/Showtimes`);
}

// GET /api/Cinemas
export async function getCinemaList() {
  return cachedFetch(`${API_URL}/Cinemas`);
}

// GET /api/Rooms
export async function getRoomList() {
  return cachedFetch(`${API_URL}/Rooms`);
}


