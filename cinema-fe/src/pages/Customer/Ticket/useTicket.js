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
        console.log("=== RAW TICKETS DATA FROM BACKEND ===", list);
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
            
            const rawFoods = 
              t.bookingFoods ?? t.BookingFoods ?? 
              booking.bookingFoods ?? booking.BookingFoods ?? 
              t.foods ?? t.Foods ?? 
              booking.foods ?? booking.Foods ?? 
              t.bookingCombos ?? t.BookingCombos ?? 
              booking.bookingCombos ?? booking.BookingCombos ?? 
              t.combos ?? t.Combos ?? 
              booking.combos ?? booking.Combos ?? 
              [];

            const parsedFoods = [];
            if (Array.isArray(rawFoods)) {
              rawFoods.forEach(f => {
                const foodObj = f.food ?? f.Food ?? f;
                const name = f.foodName ?? f.FoodName ?? foodObj.foodName ?? foodObj.FoodName ?? foodObj.name ?? foodObj.Name ?? f.name ?? f.Name ?? "Đồ ăn kèm";
                const qty = Number(f.quantity ?? f.Quantity ?? 0);
                const price = Number(f.price ?? f.Price ?? f.unitPrice ?? f.UnitPrice ?? foodObj.price ?? foodObj.Price ?? 0);
                
                if (qty > 0) {
                  parsedFoods.push({ name, quantity: qty, price });
                }
              });
            }

            if (existingGroup) {
              if (seatLabel && !existingGroup.seatsList.includes(seatLabel)) {
                existingGroup.seatsList.push(seatLabel);
              }
              existingGroup.totalPriceSum += itemPrice;
              if (ticketCode && !existingGroup.ticketCodes.includes(ticketCode)) {
                existingGroup.ticketCodes.push(ticketCode);
              }
              
              parsedFoods.forEach(pf => {
                const exist = existingGroup.foodsList.find(ef => ef.name === pf.name);
                if (exist) {
                  exist.quantity += pf.quantity;
                } else {
                  existingGroup.foodsList.push({ ...pf });
                }
              });
            } else {
              groupedList.push({
                ...t,
                seatsList: seatLabel ? [seatLabel] : [],
                totalPriceSum: itemPrice,
                ticketCodes: ticketCode ? [ticketCode] : [],
                foodsList: [...parsedFoods]
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

              const showTimeObj = booking.showTime ?? booking.showtime ?? booking.ShowTime ?? booking.Showtime;
              const bookingDate = t.bookingDate ?? t.BookingDate ?? booking.bookingDate ?? booking.BookingDate;
              
              // 1. Xác định Ngày Chiếu (showDate): Ưu tiên của suất chiếu, rồi tới vé, cuối cùng mới là ngày đặt
              const rawDateVal = showTimeObj?.showDate ?? showTimeObj?.ShowDate ?? t.showDate ?? t.ShowDate ?? bookingDate;
              
              // 2. Xác định Giờ Chiếu (startTime): Tránh lấy đè lên showDate
              const rawTimeVal = showTimeObj?.startTime ?? showTimeObj?.StartTime ?? t.startTime ?? t.StartTime ?? t.showTime ?? t.ShowTime ?? booking.showTime ?? booking.ShowTime ?? "00:00";

              let formattedDate = "Chưa rõ";
              let d = new Date(rawDateVal);
              if (!isNaN(d.getTime())) {
                formattedDate = d.toLocaleDateString("vi-VN");
              } else if (rawDateVal) {
                formattedDate = String(rawDateVal).split("T")[0];
              }

              let formattedTime = "";
              let timePart = "00:00";
              if (rawTimeVal) {
                if (typeof rawTimeVal === "string") {
                  if (rawTimeVal.includes("T")) {
                    timePart = rawTimeVal.split("T")[1]?.slice(0, 5) || "00:00";
                  } else {
                    timePart = rawTimeVal.slice(0, 5);
                  }
                }
                formattedTime = timePart;
              }

              // 3. Tính toán xem suất chiếu đã trôi qua chưa (so với thời điểm hiện tại)
              let isPast = false;
              if (!isNaN(d.getTime())) {
                try {
                  const datePart = d.toISOString().split("T")[0];
                  const showtimeDateTime = new Date(`${datePart}T${timePart}:00`);
                  if (!isNaN(showtimeDateTime.getTime()) && showtimeDateTime.getTime() < new Date().getTime()) {
                    isPast = true;
                  }
                } catch (e) {
                  console.error("Lỗi so sánh ngày giờ suất chiếu:", e);
                }
              }

              // 4. Xác định Trạng thái hiển thị (status)
              // Chỉ chuyển sang "đã hủy" nếu có trạng thái hủy, ngược lại phân loại theo thời gian chiếu (đã chiếu -> watched, chưa chiếu -> upcoming)
              let finalStatus = "upcoming";
              if (isCancelled) {
                finalStatus = "cancelled";
              } else if (isPast) {
                finalStatus = "watched";
              } else {
                finalStatus = "upcoming";
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
                status: finalStatus,
                foods: t.foodsList || [],
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