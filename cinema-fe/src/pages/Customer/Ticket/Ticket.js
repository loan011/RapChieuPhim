import { useEffect, useState } from "react";

import {
  MdConfirmationNumber,
  MdLocationOn,
  MdCalendarToday,
  MdAccessTime,
  MdEventSeat,
  MdQrCode2,
} from "react-icons/md";

export const TICKET_TEXT = {
  header: {
    icon: "🎫",
    title: "Vé của tôi",
    description: "Danh sách tất cả vé bạn đã đặt",
  },

  statusKeys: {
    all: "all",
    upcoming: "upcoming",
    watched: "watched",
    cancelled: "cancelled",
  },

  tabs: [
    {
      key: "all",
      label: "Tất cả",
    },
    {
      key: "upcoming",
      label: "Sắp chiếu",
    },
    {
      key: "watched",
      label: "Đã xem",
    },
    {
      key: "cancelled",
      label: "Đã hủy",
    },
  ],

  stats: {
    total: "Tổng vé",
    upcoming: "Sắp chiếu",
    cancelled: "Đã hủy",
  },

  statusLabel: {
    upcoming: "Sắp chiếu",
    watched: "Đã xem",
    cancelled: "Đã hủy",
  },

  empty: {
    icon: "🎟️",
    title: "Không có vé nào",
    description: "Bạn chưa có vé trong mục này",
  },

  qr: {
    title: "Mã QR vé",
  },

  storageKeys: {
    bookedTickets: "bookedTickets",
  },

  icons: {
    ticket: MdConfirmationNumber,
    location: MdLocationOn,
    calendar: MdCalendarToday,
    time: MdAccessTime,
    seat: MdEventSeat,
    qr: MdQrCode2,
  },
};

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
      localStorage.getItem(TICKET_TEXT.storageKeys.bookedTickets) || "[]"
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
  if (activeTab === TICKET_TEXT.statusKeys.all) {
    return tickets;
  }

  return tickets.filter((ticket) => ticket.status === activeTab);
}

export function countTicketsByStatus(tickets) {
  return {
    all: tickets.length,

    upcoming: tickets.filter(
      (ticket) => ticket.status === TICKET_TEXT.statusKeys.upcoming
    ).length,

    watched: tickets.filter(
      (ticket) => ticket.status === TICKET_TEXT.statusKeys.watched
    ).length,

    cancelled: tickets.filter(
      (ticket) => ticket.status === TICKET_TEXT.statusKeys.cancelled
    ).length,
  };
}

export function getTicketStatusLabel(status) {
  return TICKET_TEXT.statusLabel[status] || "Không rõ";
}

export function handlePosterError(e) {
  e.target.style.background = "rgba(255,255,255,0.05)";
}

export function useTicket() {
  const [activeTab, setActiveTab] = useState(TICKET_TEXT.statusKeys.all);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const data = loadTickets();
    setTickets(data);
  }, []);

  const filteredTickets = filterTicketsByStatus(tickets, activeTab);
  const counts = countTicketsByStatus(tickets);

  return {
    activeTab,
    setActiveTab,

    tickets,
    filteredTickets,
    counts,
  };
}