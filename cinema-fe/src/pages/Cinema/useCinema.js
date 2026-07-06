import { useState, useEffect, useRef } from "react";
import { getCinemaList, getAreaList, getRoomsByCinema } from "./cinemaPageService.js";

export const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1595769816263-9b910be24d5f?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1585647347483-22b66260dfff?q=80&w=600&auto=format&fit=crop",
];

export function getCinemaImage(cinema, index) {
  return (
    cinema.image ||
    cinema.Image ||
    cinema.imageUrl ||
    cinema.ImageUrl ||
    FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
  );
}

export function normalizeCinema(c) {
  return {
    id: c.id ?? c.Id ?? c.cinemaId ?? c.CinemaId ?? "",
    name: c.name ?? c.Name ?? c.cinemaName ?? c.CinemaName ?? "Rạp không tên",
    address: c.address ?? c.Address ?? "",
    city: c.city ?? c.City ?? "",
    phone: c.phone ?? c.Phone ?? "",
    email: c.email ?? c.Email ?? "",
    status: c.status ?? c.Status ?? "",
    image: c.image ?? c.Image ?? c.imageUrl ?? c.ImageUrl ?? "",
    areaName: c.areaName ?? c.AreaName ?? c.area ?? c.Area ?? c.city ?? c.City ?? "",
    rooms: c.rooms ?? c.Rooms ?? [],
    showtimes: c.showtimes ?? c.Showtimes ?? [],
    _raw: c,
  };
}

export function useCustomerCinema() {
  const [cinemas, setCinemas] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedCinema, setSelectedCinema] = useState(null);
  const [selectedArea, setSelectedArea] = useState("");
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [areaDropdownOpen, setAreaDropdownOpen] = useState(false);

  const areaDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        areaDropdownRef.current &&
        !areaDropdownRef.current.contains(e.target)
      ) {
        setAreaDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const savedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const userEmail =
    localStorage.getItem("userEmail") ||
    localStorage.getItem("email") ||
    savedUser.email ||
    savedUser.Email;

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setApiError(null);

      try {
        const raw = await getCinemaList();

        const arr = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.$values)
          ? raw.$values
          : [];

        const list = arr.map(normalizeCinema);

        setCinemas(list);

        if (list.length > 0) {
          setSelectedCinema(list[0]);
        }
      } catch (err) {
        console.error("[Cinema] fetch cinemas error:", err);
        setApiError(err.message);
        setCinemas([]);
      }

      try {
        const raw = await getAreaList();

        const arr = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.$values)
          ? raw.$values
          : [];

        setAreas(arr);
      } catch {
        setAreas([]);
      }

      setLoading(false);
    }

    fetchAll();
  }, []);

  useEffect(() => {
    if (!selectedCinema?.id) {
      setRooms([]);
      return;
    }

    async function fetchRooms() {
      setLoadingRooms(true);

      try {
        const data = await getRoomsByCinema(selectedCinema.id);
        setRooms(data ?? []);
      } catch {
        setRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    }

    fetchRooms();
  }, [selectedCinema?.id]);

  const filteredCinemas = selectedArea
    ? cinemas.filter((c) => {
        const raw = c._raw;

        const cinemaAreaId = String(raw?.areaId ?? raw?.AreaId ?? "");
        if (cinemaAreaId && cinemaAreaId === selectedArea) return true;

        const cinemaAreaName = (
          raw?.areaName ??
          raw?.AreaName ??
          ""
        ).toLowerCase();

        if (
          cinemaAreaName &&
          cinemaAreaName.includes(selectedArea.toLowerCase())
        ) {
          return true;
        }

        const cinemaName = (c.name ?? "").toLowerCase();
        return cinemaName.includes(selectedArea.toLowerCase());
      })
    : cinemas;

  function handleAreaChange(val) {
    setSelectedArea(val);
    setSelectedCinema(null);
  }

  function getAreaName(a) {
    return a.areaName ?? a.AreaName ?? a.name ?? a.Name ?? "";
  }

  function getAreaValue(a) {
    const id = String(a.areaId ?? a.AreaId ?? "");
    return id && id !== "0" ? id : getAreaName(a);
  }

  function getAreaKey(a, idx) {
    return getAreaValue(a) || idx;
  }

  const currentImage = selectedCinema
    ? getCinemaImage(selectedCinema, cinemas.indexOf(selectedCinema))
    : FALLBACK_IMAGES[0];

  return {
    cinemas,
    areas,
    selectedCinema,
    setSelectedCinema,
    selectedArea,
    loading,
    apiError,
    rooms,
    loadingRooms,
    areaDropdownOpen,
    setAreaDropdownOpen,
    areaDropdownRef,
    userEmail,
    filteredCinemas,
    handleAreaChange,
    getAreaName,
    getAreaValue,
    getAreaKey,
    currentImage,
  };
}
