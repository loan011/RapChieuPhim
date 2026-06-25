import { useEffect, useState } from "react";
import { getCustomerTickets } from "./customerTicketService.js";

export const MOCK_TICKETS = [
  {
    id: "TK001",
    movie: "Avengers: Doomsday",
    poster: "https://image.tmdb.org/t/p/w200/tCDFohxiCXBcCEMInFTlZiPASv.jpg",
    date: "20/06/2026",
    time: "19:30",
    cinema: "Rạp T&M - Quận 1",
    hall: "Phòng 3",
    seats: ["C5", "C6"],
    price: "240.000đ",
    status: "upcoming",
  },
  {
    id: "TK002",
    movie: "Moana 2",
    poster: "https://image.tmdb.org/t/p/w200/yh64qw9mgXBvlaWDi7Q9tpUBAvH.jpg",
    date: "15/06/2026",
    time: "14:00",
    cinema: "Rạp T&M - Quận 7",
    hall: "Phòng 1",
    seats: ["A3"],
    price: "90.000đ",
    status: "watched",
  },
  {
    id: "TK003",
    movie: "Deadpool & Wolverine",
    poster: "https://image.tmdb.org/t/p/w200/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    date: "10/06/2026",
    time: "21:00",
    cinema: "Rạp T&M - Bình Thạnh",
    hall: "Phòng 2",
    seats: ["D7", "D8", "D9"],
    price: "360.000đ",
    status: "cancelled",
  },
];

export function getLocalBookedTickets() {
  try {
    const localTickets = JSON.parse(
      localStorage.getItem("bookedTickets") || "[]"
    );
    return Array.isArray(localTickets) ? localTickets : [];
  } catch {
    return [];
  }
}

export function loadTickets() {
  const localTickets = getLocalBookedTickets();
  return [...localTickets, ...MOCK_TICKETS];
}

export function filterTicketsByStatus(tickets, activeTab) {
  if (activeTab === "all") {
    return tickets;
  }
  return tickets.filter((ticket) => ticket.status === activeTab);
}

export function countTicketsByStatus(tickets) {
  return {
    all: tickets.length,
    upcoming: tickets.filter((ticket) => ticket.status === "upcoming").length,
    watched: tickets.filter((ticket) => ticket.status === "watched").length,
    cancelled: tickets.filter((ticket) => ticket.status === "cancelled").length,
  };
}

export function getTicketStatusLabel(status) {
  const statusLabel = {
    upcoming: "Sắp chiếu",
    watched: "Đã xem",
    cancelled: "Đã hủy",
  };
  return statusLabel[status] || "Không rõ";
}

export function handlePosterError(e) {
  e.target.style.background = "rgba(255,255,255,0.05)";
}

export function useTicket() {
  const [activeTab, setActiveTab] = useState("all");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTickets() {
      try {
        setLoading(true);
        const data = await getCustomerTickets();
        let list = Array.isArray(data) ? data : (data?.$values || data?.data || []);
        if (list.length === 0) {
          setTickets(loadTickets());
        } else {
          setTickets(list.map((t) => {
            const isCancelled = t.status === "Đã hủy";
            const isPaid = t.status === "Đã thanh toán" || t.status === "Đã đặt";
            return {
              id: t.code || `TK${t.id}`,
              movie: t.movieTitle || "Phim chưa rõ",
              poster: t.moviePoster || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=200&auto=format&fit=crop",
              date: t.showDate || t.createdAt || "Chưa rõ",
              time: t.showTime || "",
              cinema: t.cinemaName || "Rạp chiếu phim",
              hall: t.roomName || "Phòng chiếu",
              seats: t.seatCode ? [t.seatCode] : (t.seats || []),
              price: (t.price || 0).toLocaleString("vi-VN") + "đ",
              status: isCancelled ? "cancelled" : isPaid ? "upcoming" : "watched",
            };
          }));
        }
      } catch (err) {
        console.error("Lỗi lấy vé từ API, sử dụng mock:", err);
        setTickets(loadTickets());
      } finally {
        setLoading(false);
      }
    }
    fetchTickets();
  }, []);

  const filteredTickets = filterTicketsByStatus(tickets, activeTab);
  const counts = countTicketsByStatus(tickets);

  return {
    activeTab,
    setActiveTab,
    tickets,
    filteredTickets,
    counts,
    loading,
  };
}