const REGISTER_WITH_GOOGLE_URL =
  "https://localhost:7013/api/Auth/RegisterWithGoogle";

export async function registerWithGoogle() {
  const response = await fetch(REGISTER_WITH_GOOGLE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.Message ||
        "Đăng ký bằng Google thất bại"
    );
  }

  return data;
}