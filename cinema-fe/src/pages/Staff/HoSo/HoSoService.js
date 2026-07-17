import { getProfileAdmin, updateProfile, changePassword } from "../../Admin/User/userService";

export async function fetchProfile() {
  return await getProfileAdmin();
}

export async function saveProfile(payload) {
  return await updateProfile(payload);
}

export async function updatePassword(payload) {
  return await changePassword(payload);
}
