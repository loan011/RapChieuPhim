import { useEffect, useState, useMemo } from "react";
import { getCinemasForPrice } from "./ticketPriceService.js";
import { getHomeShowtimes, getHomeRooms, getHomeAreas } from "../usehome.js";

export function useTicketPrice() {
  const savedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const userEmail =
    localStorage.getItem("userEmail") ||
    localStorage.getItem("email") ||
    savedUser.email ||
    savedUser.Email;

  const [cinemas, setCinemas] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [selectedCinemaId, setSelectedCinemaId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInitialData() {
      try {
        setLoading(true);
        const [rawCinemas, rawShowtimes, rawRooms, rawAreas] = await Promise.all([
          getCinemasForPrice(),
          getHomeShowtimes(),
          getHomeRooms(),
          getHomeAreas()
        ]);

        const arr = Array.isArray(rawCinemas)
          ? rawCinemas
          : Array.isArray(rawCinemas?.data)
          ? rawCinemas.data
          : Array.isArray(rawCinemas?.$values)
          ? rawCinemas.$values
          : [];

        setCinemas(arr);
        setShowtimes(Array.isArray(rawShowtimes) ? rawShowtimes : []);
        setRooms(Array.isArray(rawRooms) ? rawRooms : []);
        setAreas(Array.isArray(rawAreas) ? rawAreas : []);

        if (arr.length > 0) {
          const firstId = arr[0].id ?? arr[0].Id ?? arr[0].cinemaId ?? arr[0].CinemaId ?? "";
          setSelectedCinemaId(String(firstId));
        }
      } catch (err) {
        console.error("Lỗi lấy dữ liệu bảng giá:", err);
        setCinemas([]);
        setShowtimes([]);
        setRooms([]);
        setAreas([]);
      } finally {
        setLoading(false);
      }
    }
    fetchInitialData();
  }, []);

  // Filter cinemas by selected area
  const filteredCinemas = useMemo(() => {
    if (!selectedAreaId) return cinemas;
    return cinemas.filter(c => {
      const areaId = c?.areaId ?? c?.AreaId;
      return String(areaId) === String(selectedAreaId);
    });
  }, [cinemas, selectedAreaId]);

  // When filteredCinemas changes, reset selectedCinemaId to first cinema in list
  useEffect(() => {
    if (filteredCinemas.length > 0) {
      const activeIds = filteredCinemas.map(c => String(c.id ?? c.Id ?? c.cinemaId ?? c.CinemaId ?? ""));
      if (!selectedCinemaId || !activeIds.includes(String(selectedCinemaId))) {
        setSelectedCinemaId(activeIds[0]);
      }
    } else {
      setSelectedCinemaId("");
    }
  }, [filteredCinemas, selectedCinemaId]);

  const basePrices = useMemo(() => {
    // Default fallback base prices matching mockup
    const defaults = {
      "2D": 75000,
      "IMAX 2D": 100000,
      "3D": 90000,
      "IMAX 3D": 120000,
      "4DX 2D": 120000,
      "4DX 3D": 140000
    };

    if (!selectedCinemaId || showtimes.length === 0 || rooms.length === 0) {
      return defaults;
    }

    // Filter rooms of the selected cinema
    const cinemaRoomIds = new Set(
      rooms
        .filter(r => {
          const roomCinemaId = r?.cinemaId ?? r?.CinemaId;
          return String(roomCinemaId) === String(selectedCinemaId);
        })
        .map(r => String(r?.roomId ?? r?.RoomId ?? r?.id ?? r?.Id))
    );

    // Filter active showtimes in these rooms
    const cinemaShowtimes = showtimes.filter(st => {
      const stRoomId = st?.roomId ?? st?.RoomId ?? st?.room?.roomId ?? st?.room?.RoomId;
      return cinemaRoomIds.has(String(stRoomId));
    });

    if (cinemaShowtimes.length === 0) return defaults;

    // Collect base prices by room format
    const pricesByFormat = {
      "2D": [],
      "3D": [],
      "IMAX": [],
      "4DX": []
    };

    cinemaShowtimes.forEach(st => {
      const room = rooms.find(r => String(r?.roomId ?? r?.RoomId ?? r?.id ?? r?.Id) === String(st?.roomId ?? st?.RoomId));
      const roomName = room ? (room?.roomName ?? room?.RoomName ?? "").toLowerCase() : "";
      const basePrice = Number(st?.basePrice ?? st?.BasePrice ?? st?.price ?? st?.Price ?? 0);
      
      if (basePrice <= 0) return;

      if (roomName.includes("4dx")) {
        pricesByFormat["4DX"].push(basePrice);
      } else if (roomName.includes("imax")) {
        pricesByFormat["IMAX"].push(basePrice);
      } else if (roomName.includes("3d")) {
        pricesByFormat["3D"].push(basePrice);
      } else {
        pricesByFormat["2D"].push(basePrice);
      }
    });

    const getAvgPrice = (arr, fallback) => {
      if (arr.length === 0) return fallback;
      // Round to nearest 5000 VND
      const avg = arr.reduce((sum, p) => sum + p, 0) / arr.length;
      return Math.round(avg / 5000) * 5000;
    };

    const avg2D = getAvgPrice(pricesByFormat["2D"], 75000);
    const avg3D = getAvgPrice(pricesByFormat["3D"], 90000);
    const avgIMAX = getAvgPrice(pricesByFormat["IMAX"], 100000);
    const avg4DX = getAvgPrice(pricesByFormat["4DX"], 120000);

    return {
      "2D": avg2D,
      "IMAX 2D": avgIMAX,
      "3D": avg3D,
      "IMAX 3D": avgIMAX + 20000,
      "4DX 2D": avg4DX,
      "4DX 3D": avg4DX + 20000
    };
  }, [selectedCinemaId, showtimes, rooms]);

  return {
    cinemas: filteredCinemas,
    allAreas: areas,
    selectedAreaId,
    setSelectedAreaId,
    selectedCinemaId,
    setSelectedCinemaId,
    userEmail,
    loading,
    basePrices
  };
}
