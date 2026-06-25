import { useEffect, useState } from "react";
import { getCinemasForPrice } from "./ticketPriceService.js";

export function useTicketPrice() {
  const savedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const userEmail =
    localStorage.getItem("userEmail") ||
    localStorage.getItem("email") ||
    savedUser.email ||
    savedUser.Email;

  const [cinemas, setCinemas] = useState([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCinemas() {
      try {
        setLoading(true);
        const raw = await getCinemasForPrice();
        const arr = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.$values)
          ? raw.$values
          : [];
        setCinemas(arr);
        if (arr.length > 0) {
          const firstId = arr[0].id ?? arr[0].Id ?? arr[0].cinemaId ?? arr[0].CinemaId ?? "";
          setSelectedCinemaId(String(firstId));
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách rạp:", err);
        setCinemas([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCinemas();
  }, []);

  return {
    cinemas,
    selectedCinemaId,
    setSelectedCinemaId,
    userEmail,
    loading,
  };
}
