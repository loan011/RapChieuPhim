import { useEffect, useState } from "react";
import { getCustomerTickets, getTicketFoodCatalogs } from "./customerTicketService.js";
import { getShowtimeDate, getShowtimeHour } from "../../Booking/usebooking.js";

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
  return localTickets;
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
    const directName = item.itemNameSnapshot ?? item.ItemNameSnapshot ?? (isCombo
      ? (item.comboName ?? item.ComboName ?? item.combo?.comboName ?? item.Combo?.ComboName ?? foodObj?.comboName ?? foodObj?.ComboName ?? "Combo")
      : (item.foodName ?? item.FoodName ?? item.food?.foodName ?? item.Food?.FoodName ?? foodObj?.foodName ?? foodObj?.FoodName ?? foodObj?.name ?? foodObj?.Name ?? item.name ?? item.Name));
    const catalogName = catalogItem?.foodName ?? catalogItem?.FoodName ?? catalogItem?.comboName ?? catalogItem?.ComboName ?? catalogItem?.name ?? catalogItem?.Name;
    const name = String(directName || "").trim().toLowerCase() === "string"
      ? (catalogName || "Đồ ăn kèm")
      : (directName || catalogName || "Đồ ăn kèm");
    const qty = Number(item.quantity ?? item.Quantity ?? item.qty ?? item.Qty ?? 1);
    const price = Number(item.unitPriceSnapshot ?? item.UnitPriceSnapshot ?? item.price ?? item.Price ?? item.unitPrice ?? item.UnitPrice ?? foodObj?.price ?? foodObj?.Price ?? catalogItem?.price ?? catalogItem?.Price ?? 0);
    const lineTotal = Number(item.lineTotal ?? item.LineTotal ?? item.subtotal ?? item.Subtotal ?? price * qty);
    const rawSelections = item.comboSelections?.$values ?? item.comboSelections
      ?? item.ComboSelections?.$values ?? item.ComboSelections
      ?? item.comboComponents?.$values ?? item.comboComponents
      ?? item.ComboComponents?.$values ?? item.ComboComponents ?? [];
    const comboSelections = rawSelections.map((selection) => ({
      foodId: selection.foodId ?? selection.FoodId,
      name: selection.foodNameSnapshot ?? selection.FoodNameSnapshot ?? selection.foodName ?? selection.FoodName ?? "Món trong Combo",
      quantity: Number(selection.quantity ?? selection.Quantity ?? 0)
    }));

    if (qty > 0) {
      parsedFoods.push({ name, quantity: qty, price, lineTotal,
        itemType: item.itemType ?? item.ItemType ?? (isCombo ? "COMBO" : "FOOD"),
        comboSelections,
        comboSelectionDataUnavailable: Boolean(item.comboSelectionDataUnavailable ?? item.ComboSelectionDataUnavailable)
      });
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
            const seatRow = String(t.seatRow ?? t.SeatRow ?? seat?.seatRow ?? seat?.SeatRow ?? "").trim();
            const seatNumber = String(t.seatNumber ?? t.SeatNumber ?? seat?.seatNumber ?? seat?.SeatNumber ?? "").trim();
            const apiSeatCode = String(t.seatCode ?? t.SeatCode ?? "").trim();
            const seatLabel = seatRow && seatNumber
              ? (seatNumber.toUpperCase().startsWith(seatRow.toUpperCase()) ? seatNumber : `${seatRow}${seatNumber}`)
              : (apiSeatCode || seatNumber);
            const seatType = t.seatType ?? t.SeatType ?? seat?.seatType ?? seat?.SeatType ?? "Chưa rõ";
            
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

            const itemPrice = Number(t.price ?? t.Price ?? t.ticketPrice ?? t.TicketPrice ?? explicitSeatPrice ?? rawBookingAmount);
            const seatDetail = { seatCode: seatLabel, seatType, price: itemPrice };

            // API lưu snapshot món trong combo (bắp, nước...) chính xác theo lúc đặt vé.
            // Chỉ dùng dữ liệu local cũ khi API không trả về đồ ăn.
            const foodsFromApi = normalizeFoodsList(rawFoods, catalogs);
            const parsedFoods = foodsFromApi.length > 0
              ? foodsFromApi
              : (savedInfo.foodsList || []);

            if (existingGroup) {
              if (seatLabel && !existingGroup.seatsList.includes(seatLabel)) {
                existingGroup.seatsList.push(seatLabel);
                existingGroup.seatDetails.push(seatDetail);
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
                seatDetails: seatLabel ? [seatDetail] : [],
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
              
              let savedShowDate = "";
              let savedStartTime = "";
              if (typeof window !== "undefined") {
                try {
                  const savedDiscounts = JSON.parse(localStorage.getItem("customer_ticket_discounts") || "{}");
                  const bIds = t.bookingIds || [t.bookingId || t.id];
                  for (const rawBId of bIds) {
                    const digitsOnly = String(rawBId).replace(/[^0-9]/g, "");
                    const foundObj = savedDiscounts[rawBId] || (digitsOnly ? savedDiscounts[digitsOnly] : null);
                    if (foundObj) {
                      if (foundObj.showDate) savedShowDate = foundObj.showDate;
                      if (foundObj.startTime) savedStartTime = foundObj.startTime;
                    }
                  }
                } catch (e) {}
              }

              // Extract date & time from backend objects using || (so empty string "" falls back to next field)
              let extractedDate =
                savedShowDate ||
                getShowtimeDate(showTimeObj) ||
                getShowtimeDate(t) ||
                getShowtimeDate(booking) ||
                showTimeObj?.showtimeStartTime ||
                showTimeObj?.ShowtimeStartTime ||
                showTimeObj?.startTime ||
                showTimeObj?.StartTime ||
                showTimeObj?.showDate ||
                showTimeObj?.ShowDate ||
                t.showtimeStartTime ||
                t.ShowtimeStartTime ||
                t.showDate ||
                t.ShowDate ||
                booking.showtimeStartTime ||
                booking.ShowtimeStartTime ||
                booking.showDate ||
                booking.ShowDate;

              let extractedTime =
                savedStartTime ||
                (getShowtimeHour(showTimeObj) !== "N/A" ? getShowtimeHour(showTimeObj) : "") ||
                (getShowtimeHour(t) !== "N/A" ? getShowtimeHour(t) : "") ||
                (getShowtimeHour(booking) !== "N/A" ? getShowtimeHour(booking) : "") ||
                showTimeObj?.startTime ||
                showTimeObj?.StartTime ||
                showTimeObj?.time ||
                showTimeObj?.Time ||
                t.startTime ||
                t.StartTime ||
                booking.showTime ||
                booking.ShowTime ||
                "00:00";

              let formattedDate = "Chưa rõ";
              let formattedTime = String(extractedTime || "").includes("T")
                ? String(extractedTime).split("T")[1].slice(0, 5)
                : extractedTime;
              let datePartForCompare = "";
              let parsedDtObj = null;

              if (extractedDate) {
                const str = String(extractedDate).trim();
                if (str.endsWith("Z") || str.includes("+") || (str.includes("T") && str.length > 19)) {
                  // UTC String với Z -> Chuyển sang múi giờ Asia/Ho_Chi_Minh (UTC+7)
                  const dt = new Date(str);
                  if (!isNaN(dt.getTime())) {
                    parsedDtObj = dt;
                    const parts = new Intl.DateTimeFormat("en-GB", {
                      timeZone: "Asia/Ho_Chi_Minh",
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    }).formatToParts(dt);

                    let d = "", m = "", y = "", h = "", min = "";
                    parts.forEach(p => {
                      if (p.type === "day") d = p.value;
                      if (p.type === "month") m = p.value;
                      if (p.type === "year") y = p.value;
                      if (p.type === "hour") h = p.value;
                      if (p.type === "minute") min = p.value;
                    });

                    formattedDate = `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;
                    datePartForCompare = `${y}-${m}-${d}`;
                    if (formattedTime === "00:00" || !formattedTime) {
                      formattedTime = `${h}:${min}`;
                    }
                  }
                } else if (str.includes("T")) {
                  // Giờ địa phương không có Z (VD: 2026-07-31T10:25:00) -> Tách trực tiếp tránh JS đổi lệch múi giờ
                  const [dPart, tPart] = str.split("T");
                  const matchIso = dPart.match(/^(\d{4})-(\d{2})-(\d{2})/);
                  if (matchIso) {
                    const [, y, m, d] = matchIso;
                    formattedDate = `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;
                    datePartForCompare = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                  }
                  if (tPart && (formattedTime === "00:00" || !formattedTime)) {
                    formattedTime = tPart.slice(0, 5);
                  }
                } else {
                  // Chuỗi ngày thường (VD: 2026-07-31 hoặc 31/07/2026)
                  const matchIso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
                  const matchVn = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                  if (matchIso) {
                    const [, y, m, d] = matchIso;
                    formattedDate = `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;
                    datePartForCompare = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                  } else if (matchVn) {
                    const [, d, m, y] = matchVn;
                    formattedDate = `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;
                    datePartForCompare = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                  }
                }
              }

              if ((formattedTime === "00:00" || !formattedTime) && extractedTime) {
                const tStr = String(extractedTime).trim();
                formattedTime = tStr.includes("T") ? tStr.split("T")[1].slice(0, 5) : tStr.slice(0, 5);
              }

              // 2. Phân loại trạng thái vé (Sắp chiếu, Đã xem, Đã hủy) dựa trên Showtime.StartTime
              let isPastDay = false;
              if (parsedDtObj) {
                isPastDay = parsedDtObj.getTime() < Date.now();
              } else if (datePartForCompare) {
                try {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const parts = datePartForCompare.split("-").map(Number);
                  if (parts.length === 3) {
                    const [y, m, d] = parts;
                    const showtimeEnd = new Date(y, m - 1, d, 23, 59, 59);
                    if (showtimeEnd.getTime() < today.getTime()) {
                      isPastDay = true;
                    }
                  }
                } catch (e) {
                  console.error("Lỗi so sánh ngày giờ suất chiếu:", e);
                }
              }

              // 3. Phân loại vé thành Sắp chiếu, Đã xem hoặc Đã hủy
              let finalStatus = "upcoming";
              if (isCancelled) {
                finalStatus = "cancelled";
              } else if (isPastDay) {
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
              let purchaseTimeStr = "";

              if (typeof window !== "undefined") {
                try {
                  const savedDiscounts = JSON.parse(localStorage.getItem("customer_ticket_discounts") || "{}");
                  const bIds = t.bookingIds || [t.bookingId || t.id];
                  for (const rawBId of bIds) {
                    const digitsOnly = String(rawBId).replace(/[^0-9]/g, "");
                    const foundObj = savedDiscounts[rawBId] || (digitsOnly ? savedDiscounts[digitsOnly] : null);
                    if (foundObj) {
                      if (!discountAmount) {
                        discountAmount += Number(foundObj.discountAmount || foundObj.totalDiscountAmount || 0);
                      }
                      discountCode = discountCode || foundObj.discountCode;
                      if (foundObj.finalTotalAmount) {
                        savedFinalAmount = Number(foundObj.finalTotalAmount);
                      }
                      if (foundObj.purchaseTime) {
                        purchaseTimeStr = foundObj.purchaseTime;
                      }
                    }
                  }
                } catch (e) {}
              }

              if (!purchaseTimeStr) {
                const rawCreated = t.createdDate || t.CreatedDate || t.bookingDate || t.BookingDate || booking.createdDate || booking.CreatedDate || booking.bookingDate || booking.BookingDate;
                if (rawCreated) {
                  const dateObj = new Date(rawCreated);
                  if (!isNaN(dateObj.getTime())) {
                    const d = String(dateObj.getDate()).padStart(2, '0');
                    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const y = dateObj.getFullYear();
                    const h = String(dateObj.getHours()).padStart(2, '0');
                    const min = String(dateObj.getMinutes()).padStart(2, '0');
                    purchaseTimeStr = `${d}/${m}/${y} ${h}:${min}`;
                  } else {
                    purchaseTimeStr = String(rawCreated);
                  }
                }
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
                purchaseTime: purchaseTimeStr || "Chưa rõ",
                cinema: t.cinemaName ?? t.CinemaName ?? cinema?.cinemaName ?? cinema?.CinemaName ?? cinema?.name ?? cinema?.Name ?? "Rạp chiếu phim",
                hall: t.roomName ?? t.RoomName ?? room?.roomName ?? room?.RoomName ?? room?.name ?? room?.Name ?? "Phòng chiếu",
                seats: t.seatsList,
                seatDetails: t.seatDetails || [],
                ticketPrice: ticketPriceAmount.toLocaleString("vi-VN") + "đ",
                rawPrice: rawTotalAmount.toLocaleString("vi-VN") + "đ",
                discountAmount: discountAmount,
                discountCode: discountCode,
                price: finalTotalAmount.toLocaleString("vi-VN") + "đ",
                status: finalStatus,
                qrCodeUrl: t.qrCodeUrl ?? t.QrCodeUrl ?? booking.qrCodeUrl ?? booking.QrCodeUrl ?? null,
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
