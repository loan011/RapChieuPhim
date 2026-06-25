import { useEffect, useState } from "react";
import { getCustomerTickets } from "./customerTicketService.js";

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
  const [rawList, setRawList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTickets() {
      try {
        setLoading(true);
        
        const savedUser = (() => {
          try {
            return (
              JSON.parse(localStorage.getItem("user")) ||
              JSON.parse(localStorage.getItem("currentUser")) ||
              {}
            );
          } catch {
            return {};
          }
        })();
        
        const userId = savedUser.userId ?? savedUser.id ?? savedUser.UserId ?? savedUser.Id;
        if (!userId) {
          setTickets(loadTickets());
          setLoading(false);
          return;
        }

        const data = await getCustomerTickets(userId);
        let list = Array.isArray(data) ? data : (data?.$values || data?.data || []);
        setRawList(list);
        
        if (list.length === 0) {
          setTickets(loadTickets());
        } else {
          // Gom nhóm các Booking đơn lẻ theo Movie, Showtime và Booking Date gần nhau 
          const groupedList = [];
          
          list.forEach((t) => {
            const booking = t.booking || t;
            const rawBookingDate = t.bookingDate ?? t.BookingDate ?? booking.bookingDate ?? booking.BookingDate ?? "";
            const bookingTime = rawBookingDate ? new Date(rawBookingDate).getTime() : 0;
            
            const showTime = booking.showTime ?? booking.showtime ?? booking.ShowTime ?? booking.Showtime;
            const rawStartTime = t.startTime ?? t.StartTime ?? showTime?.startTime ?? showTime?.StartTime ?? "";
            
            const movieTitle = t.movieTitle ?? t.MovieTitle ?? showTime?.movie?.title ?? showTime?.movie?.Title ?? "Phim chưa rõ";
            
            // Tìm nhóm đã tồn tại có cùng phim, cùng suất chiếu và thời gian đặt cách nhau không quá 3 phút
            const existingGroup = groupedList.find((g) => {
              const gBooking = g.booking || g;
              const gShowTime = gBooking.showTime ?? gBooking.showtime ?? gBooking.ShowTime ?? gBooking.Showtime;
              const gStartTime = g.startTime ?? g.StartTime ?? gShowTime?.startTime ?? gShowTime?.StartTime ?? "";
              const gMovieTitle = g.movieTitle ?? g.MovieTitle ?? gShowTime?.movie?.title ?? gShowTime?.movie?.Title ?? "Phim chưa rõ";
              const gBookingDate = g.bookingDate ?? g.BookingDate ?? gBooking.bookingDate ?? gBooking.BookingDate ?? "";
              const gBookingTime = gBookingDate ? new Date(gBookingDate).getTime() : 0;
              
              const sameMovie = movieTitle === gMovieTitle;
              const sameShowTime = rawStartTime === gStartTime;
              const closeTime = Math.abs(bookingTime - gBookingTime) <= 180000; // 3 phút
              
              return sameMovie && sameShowTime && closeTime;
            });
            
            // Lấy thông tin ghế
            const seat = booking.seat ?? booking.Seat;
            const seatLabel = t.seatNumber ?? t.SeatNumber ?? (seat ? `${seat.seatRow ?? seat.SeatRow ?? ""}${seat.seatNumber ?? seat.SeatNumber ?? ""}` : "") ?? t.seatCode ?? t.SeatCode ?? "";
            
            // Lấy mã vé
            const ticketCode =
              t.ticketCode ??
              t.TicketCode ??
              t.code ??
              t.Code ??
              (booking.tickets?.[0]?.ticketCode ?? booking.Tickets?.[0]?.TicketCode) ??
              `BK${t.bookingId ?? booking.bookingId ?? booking.BookingId ?? t.id ?? t.Id}`;
              
            const itemPrice = Number(t.totalAmount ?? t.TotalAmount ?? booking.totalAmount ?? booking.TotalAmount ?? booking.ticketPrice ?? booking.TicketPrice ?? t.price ?? t.Price ?? 0);
            
            if (existingGroup) {
              if (seatLabel && !existingGroup.seatsList.includes(seatLabel)) {
                existingGroup.seatsList.push(seatLabel);
              }
              existingGroup.totalPriceSum += itemPrice;
              if (ticketCode && !existingGroup.ticketCodes.includes(ticketCode)) {
                existingGroup.ticketCodes.push(ticketCode);
              }
            } else {
              groupedList.push({
                ...t,
                seatsList: seatLabel ? [seatLabel] : [],
                totalPriceSum: itemPrice,
                ticketCodes: ticketCode ? [ticketCode] : []
              });
            }
          });

          setTickets(
            groupedList.map((t) => {
              const booking = t.booking || t;
              
              const statusVal = t.status ?? t.Status ?? booking.status ?? booking.Status ?? "";
              const showTime = booking.showTime ?? booking.showtime ?? booking.ShowTime ?? booking.Showtime;
              const movie = showTime?.movie ?? showTime?.Movie;
              const room = showTime?.room ?? showTime?.Room;
              const cinema = room?.cinema ?? room?.Cinema;

              const statusStr = String(statusVal).trim().toLowerCase();
              const isCancelled = statusStr === "đã hủy" || statusStr === "cancelled" || statusStr === "cancel";
              const isPaid = statusStr === "đã thanh toán" || statusStr === "đã đặt" || statusStr === "paid" || statusStr === "success" || statusStr === "successful" || statusStr === "pending";

              let isPast = false;
              const rawStartTime = t.startTime ?? t.StartTime ?? showTime?.startTime ?? showTime?.StartTime;
              const bookingDate = t.bookingDate ?? t.BookingDate ?? booking.bookingDate ?? booking.BookingDate;
              
              const rawDate = rawStartTime ?? showTime?.showDate ?? showTime?.ShowDate ?? t.showDate ?? t.ShowDate ?? bookingDate;
              const rawTime = rawStartTime ?? t.showTime ?? t.ShowTime ?? booking.showTime ?? booking.ShowTime;

              let formattedDate = "Chưa rõ";
              if (rawDate) {
                let d = new Date(rawDate);
                const bDate = bookingDate ? new Date(bookingDate) : null;
                
                if (bDate && !isNaN(d.getTime()) && !isNaN(bDate.getTime()) && d < bDate) {
                  d = bDate;
                }

                if (!isNaN(d.getTime())) {
                  formattedDate = d.toLocaleDateString("vi-VN");
                } else {
                  formattedDate = String(rawDate);
                }
              }

              let formattedTime = "";
              if (rawTime) {
                const d = new Date(rawTime);
                if (!isNaN(d.getTime()) && String(rawTime).includes("T")) {
                  formattedTime = d.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                } else {
                  formattedTime = String(rawTime).slice(0, 5);
                }
              }

              if (rawDate && rawTime) {
                try {
                  let d = new Date(rawDate);
                  const bDate = bookingDate ? new Date(bookingDate) : null;
                  if (bDate && !isNaN(d.getTime()) && !isNaN(bDate.getTime()) && d < bDate) {
                    d = bDate;
                  }
                  
                  const datePart = d.toISOString().split("T")[0];
                  let timePart = "14:00";
                  if (String(rawTime).includes("T")) {
                    timePart = String(rawTime).split("T")[1]?.slice(0, 5) || "14:00";
                  } else {
                    timePart = String(rawTime).slice(0, 5);
                  }

                  const showtimeDateTime = new Date(`${datePart}T${timePart}:00`);

                  if (!isNaN(showtimeDateTime.getTime()) && showtimeDateTime < new Date()) {
                    isPast = true;
                  }
                } catch (e) {
                  console.error("Lỗi kiểm tra suất chiếu qua giờ:", e);
                }
              }

              const ticketCode = t.ticketCodes.join(", ");

              return {
                id: ticketCode,
                movie: t.movieTitle ?? t.MovieTitle ?? movie?.title ?? movie?.Title ?? "Phim chưa rõ",
                poster:
                  t.moviePoster ??
                  t.MoviePoster ??
                  movie?.posterUrl ??
                  movie?.PosterUrl ??
                  movie?.imageUrl ??
                  movie?.ImageUrl ??
                  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=200&auto=format&fit=crop",
                date: formattedDate,
                time: formattedTime,
                cinema: t.cinemaName ?? t.CinemaName ?? cinema?.cinemaName ?? cinema?.CinemaName ?? cinema?.name ?? cinema?.Name ?? "Rạp chiếu phim",
                hall: t.roomName ?? t.RoomName ?? room?.roomName ?? room?.RoomName ?? room?.name ?? room?.Name ?? "Phòng chiếu",
                seats: t.seatsList,
                price: t.totalPriceSum.toLocaleString("vi-VN") + "đ",
                status: isCancelled ? "cancelled" : isPaid ? (isPast ? "watched" : "upcoming") : "watched",
              };
            })
          );
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
    rawList,
    filteredTickets,
    counts,
    loading,
  };
}