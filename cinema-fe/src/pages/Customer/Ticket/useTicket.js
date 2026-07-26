import { useEffect, useState } from "react";
import { getCustomerTickets, getTicketFoodCatalogs } from "./customerTicketService.js";

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

function normalizeFoodsList(rawFoods, catalogs = { foods: [], combos: [] }) {
  const findCatalogItem = (item) => {
    const foodId = item.foodId ?? item.FoodId ?? item.food?.foodId ?? item.Food?.FoodId;
    const comboId = item.comboId ?? item.ComboId ?? item.combo?.comboId ?? item.Combo?.ComboId;

    if (foodId != null) {
      return catalogs.foods.find((food) =>
        String(food.foodId ?? food.FoodId ?? food.id ?? food.Id) === String(foodId)
      );
    }
    if (comboId != null) {
      return catalogs.combos.find((combo) =>
        String(combo.comboId ?? combo.ComboId ?? combo.id ?? combo.Id) === String(comboId)
      );
    }
    return null;
  };

  const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = value.$values ?? value.values ?? value.items ?? value.data ?? value.results ?? value.foods ?? value.Foods;
      if (Array.isArray(nested)) return nested;
      return [value];
    }
    if (typeof value === "string") {
      return value
        .split(/[;,]/)
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
          const quantityMatch = part.match(/^(.*?)(?:\s*[xX]\s*(\d+))$/);
          if (quantityMatch) {
            return {
              name: quantityMatch[1].trim() || "Đồ ăn kèm",
              quantity: Number(quantityMatch[2]) || 1,
              price: 0,
            };
          }
          return {
            name: part || "Đồ ăn kèm",
            quantity: 1,
            price: 0,
          };
        });
    }
    return [];
  };

  const foodItems = toArray(rawFoods);
  const parsedFoods = [];

  foodItems.forEach((item) => {
    if (!item) return;

    if (typeof item === "string") {
      const qtyMatch = item.match(/^(.*?)(?:\s*[xX]\s*(\d+))$/);
      parsedFoods.push({
        name: qtyMatch ? (qtyMatch[1].trim() || "Đồ ăn kèm") : item.trim() || "Đồ ăn kèm",
        quantity: qtyMatch ? (Number(qtyMatch[2]) || 1) : 1,
        price: 0,
      });
      return;
    }

    const catalogItem = findCatalogItem(item);
    const foodObj = item.food ?? item.Food ?? item.combo ?? item.Combo ?? item;
    const isCombo = item.comboId || item.ComboId || item.combo || item.Combo;
    const directName = isCombo
      ? (item.comboName ?? item.ComboName ?? item.combo?.comboName ?? item.Combo?.ComboName ?? foodObj?.comboName ?? foodObj?.ComboName ?? "Combo")
      : (item.foodName ?? item.FoodName ?? item.food?.foodName ?? item.Food?.FoodName ?? foodObj?.foodName ?? foodObj?.FoodName ?? foodObj?.name ?? foodObj?.Name ?? item.name ?? item.Name);
    const catalogName = catalogItem?.foodName ?? catalogItem?.FoodName ?? catalogItem?.comboName ?? catalogItem?.ComboName ?? catalogItem?.name ?? catalogItem?.Name;
    const name = String(directName || "").trim().toLowerCase() === "string"
      ? (catalogName || "Đồ ăn kèm")
      : (directName || catalogName || "Đồ ăn kèm");
    const qty = Number(item.quantity ?? item.Quantity ?? item.qty ?? item.Qty ?? 1);
    const price = Number(item.price ?? item.Price ?? item.unitPrice ?? item.UnitPrice ?? foodObj?.price ?? foodObj?.Price ?? catalogItem?.price ?? catalogItem?.Price ?? 0);

    if (qty > 0) {
      parsedFoods.push({ name, quantity: qty, price });
    }
  });

  return parsedFoods;
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

        const [data, catalogs] = await Promise.all([
          getCustomerTickets(userId),
          getTicketFoodCatalogs(),
        ]);
        let list = Array.isArray(data) ? data : (data?.$values || data?.data || []);
        console.log("=== RAW TICKETS DATA FROM BACKEND ===", list);
        console.log("=== RAW TICKETS JSON ===", JSON.stringify(list));
        setRawList(list);

        let allTickets = [];
        
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
            let ticketCode =
              t.ticketCode ??
              t.TicketCode ??
              t.code ??
              t.Code ??
              (booking.tickets?.[0]?.ticketCode ?? booking.Tickets?.[0]?.TicketCode);

            if (!ticketCode && allTickets.length > 0) {
              const currentBId = t.bookingId ?? booking.bookingId ?? booking.BookingId ?? t.id ?? t.Id;
              const matched = allTickets.find(tk => {
                const bId = tk.bookingId ?? tk.BookingId;
                return String(bId) === String(currentBId);
              });
              if (matched) {
                ticketCode = matched.ticketCode ?? matched.TicketCode ?? matched.code ?? matched.Code;
              }
            }

            if (!ticketCode) {
              ticketCode = `BK${t.bookingId ?? booking.bookingId ?? booking.BookingId ?? t.id ?? t.Id}`;
            }
              
            const seatObj = booking.seat ?? booking.Seat ?? t.seat ?? t.Seat;
            const explicitSeatPrice = Number(seatObj?.price ?? seatObj?.Price ?? 0);
            const rawBookingAmount = Number(t.totalAmount ?? t.TotalAmount ?? booking.totalAmount ?? booking.TotalAmount ?? booking.ticketPrice ?? booking.TicketPrice ?? t.price ?? t.Price ?? 0);
            
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

            const currentBId = t.bookingId ?? booking.bookingId ?? booking.BookingId ?? t.id ?? t.Id;
            let savedInfo = {};
            if (typeof window !== "undefined") {
              try {
                const savedDiscountsMap = JSON.parse(localStorage.getItem("customer_ticket_discounts") || "{}");
                if (currentBId && savedDiscountsMap[currentBId]) savedInfo = savedDiscountsMap[currentBId];
                else if (ticketCode && savedDiscountsMap[ticketCode]) savedInfo = savedDiscountsMap[ticketCode];
              } catch(e) {}
            }

            const itemPrice = savedInfo.seatPrice > 0
              ? savedInfo.seatPrice
              : (rawBookingAmount > 0 ? rawBookingAmount : explicitSeatPrice);

            const parsedFoods = (savedInfo.foodsList && savedInfo.foodsList.length > 0)
              ? savedInfo.foodsList
              : normalizeFoodsList(rawFoods, catalogs);

            if (existingGroup) {
              if (seatLabel && !existingGroup.seatsList.includes(seatLabel)) {
                existingGroup.seatsList.push(seatLabel);
              }
              existingGroup.totalPriceSum += itemPrice;
              if (ticketCode && !existingGroup.ticketCodes.includes(ticketCode)) {
                existingGroup.ticketCodes.push(ticketCode);
              }
              if (currentBId && !existingGroup.bookingIds.includes(currentBId)) {
                existingGroup.bookingIds.push(currentBId);
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
                bookingIds: currentBId ? [currentBId] : [],
                foodsList: [...parsedFoods]
              });
            }
          });

          setTickets(
            groupedList
              .filter(t => {
                const booking = t.booking || t;
                const statusVal = t.status ?? t.Status ?? booking.status ?? booking.Status ?? "";
                const statusStr = String(statusVal).trim().toLowerCase();
                return !(statusStr === "pending" || statusStr === "unpaid" || statusStr === "chưa thanh toán");
              })
              .map((t) => {
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
              
              let savedShowDate = "";
              let savedStartTime = "";
              if (typeof window !== "undefined") {
                try {
                  const savedDiscounts = JSON.parse(localStorage.getItem("customer_ticket_discounts") || "{}");
                  const bIds = t.bookingIds || [t.bookingId || t.id];
                  for (const bId of bIds) {
                    if (savedDiscounts[bId]) {
                      if (savedDiscounts[bId].showDate) savedShowDate = savedDiscounts[bId].showDate;
                      if (savedDiscounts[bId].startTime) savedStartTime = savedDiscounts[bId].startTime;
                    }
                  }
                } catch (e) {}
              }

              // 1. Xác định Ngày Chiếu (showDate): Ưu tiên vết đặt hàng từ trang mua vé, rồi đến API, cuối cùng mới là ngày tạo
              const rawDateVal =
                (savedShowDate || null) ??
                showTimeObj?.showDate ??
                showTimeObj?.ShowDate ??
                showTimeObj?.date ??
                showTimeObj?.Date ??
                showTimeObj?.showtimeDate ??
                showTimeObj?.ShowtimeDate ??
                t.showDate ??
                t.ShowDate ??
                booking.showDate ??
                booking.ShowDate ??
                t.date ??
                t.Date ??
                bookingDate;
              
              // 2. Xác định Giờ Chiếu (startTime)
              const rawTimeVal =
                (savedStartTime || null) ??
                showTimeObj?.startTime ??
                showTimeObj?.StartTime ??
                showTimeObj?.time ??
                showTimeObj?.Time ??
                t.startTime ??
                t.StartTime ??
                t.showTime ??
                t.ShowTime ??
                booking.showTime ??
                booking.ShowTime ??
                "00:00";

              let formattedDate = "Chưa rõ";
              let datePartForCompare = "";
              if (rawDateVal) {
                const str = String(rawDateVal).trim();
                const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
                if (match) {
                  const [, y, m, d] = match;
                  formattedDate = `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;
                  datePartForCompare = `${y}-${m}-${d}`;
                } else {
                  const dt = new Date(rawDateVal);
                  if (!isNaN(dt.getTime())) {
                    const y = dt.getFullYear();
                    const m = String(dt.getMonth() + 1).padStart(2, "0");
                    const d = String(dt.getDate()).padStart(2, "0");
                    formattedDate = `${dt.getDate()}/${dt.getMonth() + 1}/${y}`;
                    datePartForCompare = `${y}-${m}-${d}`;
                  }
                }
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

              // 3. Tính toán xem suất chiếu đã trôi qua chưa (dựa trên giờ địa phương, không lệch UTC)
              let isPast = false;
              if (datePartForCompare) {
                try {
                  const showtimeDateTime = new Date(`${datePartForCompare}T${timePart}:00`);
                  if (!isNaN(showtimeDateTime.getTime()) && showtimeDateTime.getTime() < new Date().getTime()) {
                    isPast = true;
                  }
                } catch (e) {
                  console.error("Lỗi so sánh ngày giờ suất chiếu:", e);
                }
              }

              // 4. Xác định Trạng thái hiển thị (status)
              let finalStatus = "upcoming";
              if (isCancelled) {
                finalStatus = "cancelled";
              } else if (isPast) {
                finalStatus = "watched";
              } else {
                finalStatus = "upcoming";
              }

              const ticketCode = t.ticketCodes.join(", ");
              const ticketPriceAmount = Number(t.totalPriceSum || 0);
              const foodPriceAmount = (t.foodsList || []).reduce(
                (sum, food) => sum + (Number(food.price || 0) * Number(food.quantity || 0)),
                0
              );
              const rawTotalAmount = ticketPriceAmount + foodPriceAmount;

              // Trích xuất số tiền giảm giá từ API backend hoặc từ vết lưu ở localStorage
              const bookingObj = t.booking || t;
              let discountAmount = Number(
                t.discountAmount ??
                t.DiscountAmount ??
                bookingObj.discountAmount ??
                bookingObj.DiscountAmount ??
                t.discount ??
                t.Discount ??
                bookingObj.discount ??
                bookingObj.Discount ??
                0
              );
              let discountCode =
                t.discountCode ??
                t.DiscountCode ??
                bookingObj.discountCode ??
                bookingObj.DiscountCode ??
                "";

              let savedFinalAmount = null;

              if (typeof window !== "undefined") {
                try {
                  const savedDiscounts = JSON.parse(localStorage.getItem("customer_ticket_discounts") || "{}");
                  const bIds = t.bookingIds || [];
                  for (const bId of bIds) {
                    if (savedDiscounts[bId]) {
                      if (!discountAmount) {
                        discountAmount += Number(savedDiscounts[bId].discountAmount || savedDiscounts[bId].totalDiscountAmount || 0);
                      }
                      discountCode = discountCode || savedDiscounts[bId].discountCode;
                      if (savedDiscounts[bId].finalTotalAmount) {
                        savedFinalAmount = Number(savedDiscounts[bId].finalTotalAmount);
                      }
                    }
                  }
                  if (!discountAmount && savedDiscounts[ticketCode]) {
                    discountAmount = Number(savedDiscounts[ticketCode].discountAmount || savedDiscounts[ticketCode].totalDiscountAmount || 0);
                    discountCode = savedDiscounts[ticketCode].discountCode;
                    if (savedDiscounts[ticketCode].finalTotalAmount) {
                      savedFinalAmount = Number(savedDiscounts[ticketCode].finalTotalAmount);
                    }
                  }
                } catch (e) {}
              }

              const calculatedFinal = Math.max(0, rawTotalAmount - discountAmount);
              const finalTotalAmount = savedFinalAmount !== null ? savedFinalAmount : calculatedFinal;

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
                ticketPrice: ticketPriceAmount.toLocaleString("vi-VN") + "đ",
                rawPrice: rawTotalAmount.toLocaleString("vi-VN") + "đ",
                discountAmount: discountAmount,
                discountCode: discountCode,
                price: finalTotalAmount.toLocaleString("vi-VN") + "đ",
                status: finalStatus,
                foods: t.foodsList || [],
                bookingIds: t.bookingIds || [],
                rawBooking: t,
              };
            })
            .sort((a, b) => {
              const dateA = new Date(a.rawBooking?.bookingDate ?? a.rawBooking?.BookingDate ?? 0).getTime();
              const dateB = new Date(b.rawBooking?.bookingDate ?? b.rawBooking?.BookingDate ?? 0).getTime();
              return dateB - dateA;
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
