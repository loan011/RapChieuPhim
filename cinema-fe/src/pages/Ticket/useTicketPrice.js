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

    // Collect prices by room format
    const pricesByFormat = {
      "2D": { std: [], vip: [], cp: [], fallbackBase: [] },
      "3D": { std: [], vip: [], cp: [], fallbackBase: [] },
      "IMAX": { std: [], vip: [], cp: [], fallbackBase: [] },
      "4DX": { std: [], vip: [], cp: [], fallbackBase: [] }
    };

    // First, collect fallback base prices from showtimes
    cinemaShowtimes.forEach(st => {
      const room = rooms.find(r => String(r?.roomId ?? r?.RoomId ?? r?.id ?? r?.Id) === String(st?.roomId ?? st?.RoomId));
      const roomName = room ? (room?.roomName ?? room?.RoomName ?? "").toLowerCase() : "";
      const basePrice = Number(st?.basePrice ?? st?.BasePrice ?? st?.price ?? st?.Price ?? 0);
      
      if (basePrice <= 0) return;

      let format = "2D";
      if (roomName.includes("4dx")) format = "4DX";
      else if (roomName.includes("imax")) format = "IMAX";
      else if (roomName.includes("3d")) format = "3D";
      
      pricesByFormat[format].fallbackBase.push(basePrice);
    });

    // Then, collect admin prices from localStorage for the active rooms
    Array.from(cinemaRoomIds).forEach(roomIdStr => {
      const room = rooms.find(r => String(r?.roomId ?? r?.RoomId ?? r?.id ?? r?.Id) === roomIdStr);
      if (!room) return;

      const roomNameLower = (room?.roomName ?? room?.RoomName ?? "").toLowerCase();
      let format = "2D";
      if (roomNameLower.includes("4dx")) format = "4DX";
      else if (roomNameLower.includes("imax")) format = "IMAX";
      else if (roomNameLower.includes("3d")) format = "3D";

      const cId = room?.cinemaId ?? room?.CinemaId ?? "";
      const rName = room?.roomName ?? room?.RoomName ?? "";
      
      const stdPriceStr = localStorage.getItem(`room_price_std_wd_c${cId}_r${rName}`);
      const vipPriceStr = localStorage.getItem(`room_price_vip_wd_c${cId}_r${rName}`);
      const cpPriceStr = localStorage.getItem(`room_price_cp_wd_c${cId}_r${rName}`);

      if (stdPriceStr) {
        const val = Number(stdPriceStr.replace(/\./g, "").trim());
        if (!isNaN(val) && val > 0) pricesByFormat[format].std.push(val);
      }
      if (vipPriceStr) {
        const val = Number(vipPriceStr.replace(/\./g, "").trim());
        if (!isNaN(val) && val > 0) pricesByFormat[format].vip.push(val);
      }
      if (cpPriceStr) {
        const val = Number(cpPriceStr.replace(/\./g, "").trim());
        if (!isNaN(val) && val > 0) pricesByFormat[format].cp.push(val);
      }
    });

    const getAvgPrice = (arr, fallback) => {
      if (!arr || arr.length === 0) return fallback;
      const avg = arr.reduce((sum, p) => sum + p, 0) / arr.length;
      return Math.round(avg / 5000) * 5000; // Round to nearest 5k
    };

    const getPricesForFormat = (formatKey, defaultBase) => {
      const formatData = pricesByFormat[formatKey];
      const baseAvg = getAvgPrice(formatData.fallbackBase, defaultBase);
      
      return {
        std: getAvgPrice(formatData.std, baseAvg),
        vip: getAvgPrice(formatData.vip, baseAvg + 25000), // Consistent fallback
        cp: getAvgPrice(formatData.cp, baseAvg * 2 + 50000) // Consistent fallback
      };
    };

    const p2D = getPricesForFormat("2D", 75000);
    const p3D = getPricesForFormat("3D", 90000);
    const pIMAX = getPricesForFormat("IMAX", 100000);
    const p4DX = getPricesForFormat("4DX", 120000);

    return {
      "2D": p2D,
      "IMAX 2D": pIMAX,
      "3D": p3D,
      "IMAX 3D": { std: pIMAX.std + 20000, vip: pIMAX.vip + 20000, cp: pIMAX.cp + 40000 },
      "4DX 2D": p4DX,
      "4DX 3D": { std: p4DX.std + 20000, vip: p4DX.vip + 20000, cp: p4DX.cp + 40000 }
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
