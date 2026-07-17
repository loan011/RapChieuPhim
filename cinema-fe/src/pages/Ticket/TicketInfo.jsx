import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MdMovie, MdEventSeat, MdAccessTime, MdLocationOn, MdFastfood, MdCheckCircle, MdCancel, MdHourglassEmpty } from "react-icons/md";
import { getApiUrl, readResponse, getErrorMessage } from "../../services/apiHelper";

const API_URL = getApiUrl();

export default function TicketInfo() {
  const { ticketCode } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTicketData() {
      if (!ticketCode) return;
      try {
        setLoading(true);
        setError(null);
        
        // Gọi endpoint public mới
        const res = await fetch(`${API_URL}/Tickets/Public/${ticketCode}`);
        const data = await readResponse(res);
        
        if (!res.ok) {
          throw new Error(getErrorMessage(data, "Không tìm thấy thông tin vé!"));
        }

        setTicket(data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Lấy thông tin vé thất bại.");
      } finally {
        setLoading(false);
      }
    }

    fetchTicketData();
  }, [ticketCode]);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0f12 0%, #15151e 100%)",
        color: "#fff",
        fontFamily: "'Outfit', 'Segoe UI', sans-serif"
      }}>
        <div style={{
          border: "4px solid rgba(255, 255, 255, 0.1)",
          borderTop: "4px solid #e50914",
          borderRadius: "50%",
          width: "50px",
          height: "50px",
          animation: "spin 1s linear infinite",
          marginBottom: "20px"
        }}></div>
        <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.7)" }}>Đang đối soát thông tin vé soát...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0f12 0%, #15151e 100%)",
        color: "#fff",
        fontFamily: "'Outfit', 'Segoe UI', sans-serif",
        padding: "20px",
        textAlign: "center"
      }}>
        <MdCancel style={{ fontSize: "5rem", color: "#e50914", marginBottom: "16px" }} />
        <h2 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "8px" }}>THẤT BẠI</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.95rem", maxWidth: "400px", marginBottom: "24px" }}>
          {error || "Mã vé không tồn tại hoặc đã bị hủy khỏi hệ thống."}
        </p>
        <Link to="/" style={{
          background: "rgba(255,255,255,0.08)",
          color: "#fff",
          textDecoration: "none",
          padding: "10px 24px",
          borderRadius: "8px",
          fontSize: "0.9rem",
          fontWeight: "600",
          border: "1px solid rgba(255,255,255,0.15)",
          transition: "all 0.2s"
        }}>
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  // Phân tích trạng thái vé
  const isActive = ticket.status === "Active" || ticket.status === "Đã đặt";
  const isUsed = ticket.status === "Used" || ticket.status === "Đã thanh toán";
  const isCancelled = ticket.status === "Cancelled" || ticket.status === "Đã hủy";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0f12 0%, #15151e 100%)",
      color: "#fff",
      fontFamily: "'Outfit', 'Segoe UI', sans-serif",
      padding: "30px 15px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
      {/* Container chính */}
      <div style={{
        maxWidth: "480px",
        width: "100%",
        background: "rgba(25, 25, 35, 0.65)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: "24px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        overflow: "hidden"
      }}>
        {/* Header Trạng Thái Vé */}
        <div style={{
          background: isUsed 
            ? "linear-gradient(90deg, #1b4d3e 0%, #113429 100%)" 
            : isCancelled 
            ? "linear-gradient(90deg, #6b21a8 0%, #581c87 100%)" 
            : "linear-gradient(90deg, #ea580c 0%, #c2410c 100%)",
          padding: "20px",
          textAlign: "center",
          borderBottom: "1px solid rgba(255,255,255,0.05)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "6px" }}>
            {isUsed && <MdCheckCircle style={{ fontSize: "1.6rem", color: "#10b981" }} />}
            {isActive && <MdHourglassEmpty style={{ fontSize: "1.6rem", color: "#f97316" }} />}
            {isCancelled && <MdCancel style={{ fontSize: "1.6rem", color: "#ec4899" }} />}
            <span style={{ fontSize: "1.05rem", fontWeight: "800", letterSpacing: "1px", textTransform: "uppercase" }}>
              {isUsed ? "VÉ ĐÃ SỬ DỤNG" : isCancelled ? "VÉ ĐÃ HỦY" : "VÉ HỢP LỆ (CHƯA VÀO)"}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>
            {isUsed ? "Vé này đã check-in vào phòng chiếu." : isCancelled ? "Giao dịch đã bị hủy bỏ." : "Vui lòng xuất trình mã này tại quầy soát vé."}
          </p>
        </div>

        {/* Nội dung vé */}
        <div style={{ padding: "24px" }}>
          {/* Thông tin Phim */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "24px", borderBottom: "1px dashed rgba(255,255,255,0.08)", paddingBottom: "20px" }}>
            <div style={{
              width: "80px",
              height: "115px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden"
            }}>
              <MdMovie style={{ fontSize: "2.5rem", color: "rgba(255,255,255,0.2)" }} />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "#e50914", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>Vé Xem Phim</span>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "800", margin: "4px 0 8px 0", color: "#fff", lineHeight: "1.3" }}>
                {ticket.movieTitle || "Tên phim chiếu"}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
                <MdLocationOn style={{ color: "#e50914" }} />
                <span>{ticket.cinemaName || "Rạp phim"}</span>
              </div>
            </div>
          </div>

          {/* Chi tiết Suất chiếu */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.5)" }}>
                <MdAccessTime style={{ fontSize: "1.1rem" }} />
                <span>Suất chiếu:</span>
              </div>
              <div style={{ fontWeight: "700", color: "#fff" }}>
                {ticket.issuedAt ? new Date(ticket.issuedAt).toLocaleDateString("vi-VN") : "Hôm nay"} - {ticket.roomName || "N/A"}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.5)" }}>
                <MdEventSeat style={{ fontSize: "1.1rem" }} />
                <span>Vị trí ghế:</span>
              </div>
              <div style={{ fontWeight: "800", color: "#10b981", fontSize: "1.05rem" }}>
                {ticket.seatCode || "N/A"}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>Tên khách hàng:</span>
              <span style={{ fontWeight: "600", color: "#fff" }}>{ticket.customerName || "Khách vãng lai"}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>Mã vé soát:</span>
              <span style={{ fontWeight: "700", color: "#fff", letterSpacing: "0.5px" }}>{ticket.ticketCode}</span>
            </div>
          </div>

          {/* Đồ ăn nước uống đính kèm */}
          <div style={{
            background: "rgba(255, 255, 255, 0.02)",
            borderRadius: "16px",
            padding: "16px",
            border: "1px solid rgba(255,255,255,0.04)",
            marginBottom: "24px"
          }}>
            <h4 style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.85rem",
              fontWeight: "800",
              color: "#e50914",
              margin: "0 0 12px 0",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              <MdFastfood /> Đồ ăn & Nước uống đi kèm
            </h4>
            
            {ticket.foods && ticket.foods.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {ticket.foods.map((food, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                    <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: "500" }}>{food.name}</span>
                    <span style={{ fontWeight: "700", color: "#fff" }}>x{food.quantity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
                Không có combo bắp nước đính kèm trong vé này.
              </p>
            )}
          </div>

          {/* Tổng tiền thanh toán */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "16px",
            borderTop: "1px solid rgba(255,255,255,0.08)"
          }}>
            <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>Tổng tiền giao dịch:</span>
            <span style={{ fontSize: "1.3rem", fontWeight: "800", color: "#e50914" }}>
              {Number(ticket.price).toLocaleString("vi-VN")}đ
            </span>
          </div>
        </div>
      </div>

      {/* Footer bản quyền */}
      <p style={{
        marginTop: "30px",
        fontSize: "0.75rem",
        color: "rgba(255,255,255,0.3)",
        textAlign: "center"
      }}>
        © 2026 CinemasHCM. Hệ Thống Xác Thực Vé Vào Cổng Tự Động.
      </p>
    </div>
  );
}
