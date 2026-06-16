import { getApiUrl, readResponse, getErrorMessage, getAuthHeaders } from "../../services/apiHelper";

const API_URL = getApiUrl();

function readLocalData(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeLocalData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeProfile(data) {
  return {
    fullName: data.fullName || data.FullName || "",
    email: data.email || data.Email || "",
    phone: data.phone || data.Phone || "",
    dateOfBirth: data.dateOfBirth || data.DateOfBirth || "",
    gender: data.gender || data.Gender || "",
    address: data.address || data.Address || "",
    avatarUrl:
      data.avatarUrl || data.AvatarUrl || localStorage.getItem("avatarUrl") || "/images/default-avatar.png",
  };
}

function saveProfileToStorage(profile) {
  const normalized = {
    ...profile,
    FullName: profile.fullName,
    Email: profile.email,
    Phone: profile.phone,
    DateOfBirth: profile.dateOfBirth,
    Gender: profile.gender,
    Address: profile.address,
    AvatarUrl: profile.avatarUrl,
  };

  writeLocalData("user", normalized);
  localStorage.setItem("fullName", profile.fullName);
  localStorage.setItem("email", profile.email);
  localStorage.setItem("phone", profile.phone);
  localStorage.setItem("dateOfBirth", profile.dateOfBirth);
  localStorage.setItem("gender", profile.gender);
  localStorage.setItem("address", profile.address);
  localStorage.setItem("avatarUrl", profile.avatarUrl);
}

export async function fetchCustomerProfile() {
  const response = await fetch(`${API_URL}/api/Users/GetProfile`, {
    headers: getAuthHeaders(),
  });
  const data = await readResponse(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Lấy hồ sơ thất bại"));
  }

  const profile = normalizeProfile(data);
  saveProfileToStorage(profile);
  return profile;
}

export async function updateCustomerProfile(form) {
  const payload = {
    FullName: form.fullName.trim(),
    Email: form.email.trim(),
    Phone: form.phone.trim(),
    DateOfBirth: form.dateOfBirth ? form.dateOfBirth.slice(0, 10) : null,
    Gender: form.gender || null,
    Address: form.address.trim() || null,
  };

  const response = await fetch(`${API_URL}/api/Users/UpdateProfile`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await readResponse(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Cập nhật hồ sơ thất bại"));
  }

  const profile = {
    ...form,
    avatarUrl: form.avatarUrl || "/images/default-avatar.png",
  };
  saveProfileToStorage(profile);
  return data;
}

export function getUserTickets() {
  return readLocalData("myTickets", []);
}

export function getBookingHistory() {
  return readLocalData("bookingHistory", []);
}

export function getNotifications() {
  return readLocalData("notifications", []);
}
