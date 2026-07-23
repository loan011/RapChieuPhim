import { useEffect, useState } from "react";
import {
  MdLocalOffer,
  MdConfirmationNumber,
  MdSettings,
  MdInfo,
} from "react-icons/md";
import { getNotificationsForCustomer } from "./noticeService.js";

export const INITIAL_NOTICES = [
  {
    id: 1,
    type: "promo",
    title: "🎉 Ưu đãi cuối tuần — Giảm 30%",
    body: "Đặt vé từ T6 đến CN tuần này, nhận ngay ưu đãi giảm 30% cho tất cả suất chiếu buổi tối.",
    time: "2 giờ trước",
    unread: true,
  },
  {
    id: 2,
    type: "ticket",
    title: "✅ Đặt vé thành công",
    body: "Vé xem phim \"Avengers: Doomsday\" lúc 19:30 ngày 20/06 tại Rạp T&M Quận 1 đã được xác nhận.",
    time: "5 giờ trước",
    unread: true,
  },
  {
    id: 3,
    type: "promo",
    title: "🍿 Combo bắp nước giảm 50%",
    body: "Thêm combo bắp nước vào đơn hàng tiếp theo, giảm ngay 50% — áp dụng đến 30/06/2026.",
    time: "Hôm qua",
    unread: true,
  },
  {
    id: 4,
    type: "system",
    title: "🔐 Đăng nhập từ thiết bị mới",
    body: "Tài khoản của bạn vừa đăng nhập từ Chrome · Windows lúc 09:41 ngày 17/06.",
    time: "1 ngày trước",
    unread: false,
  },
  {
    id: 5,
    type: "ticket",
    title: "🔄 Hoàn tiền thành công",
    body: "Đơn hoàn tiền 360.000đ cho vé \"Deadpool & Wolverine\" đã được xử lý thành công.",
    time: "2 ngày trước",
    unread: false,
  },
  {
    id: 6,
    type: "info",
    title: "📢 Phim mới ra mắt tháng 7",
    body: "\"Superman: Legacy\", \"Fantastic Four\" và nhiều bom tấn sắp ra mắt. Đặt vé sớm để chọn ghế đẹp!",
    time: "3 ngày trước",
    unread: false,
  },
  {
    id: 7,
    type: "system",
    title: "⚙️ Cập nhật ứng dụng",
    body: "Hệ thống vừa nâng cấp lên phiên bản mới. Trải nghiệm mượt mà hơn, tính năng đặt vé cải tiến.",
    time: "5 ngày trước",
    unread: false,
  },
];

export function getNoticeTypeConfig(type) {
  const TYPE_ICON_CLASS = {
    promo: { cls: "promo", Icon: MdLocalOffer },
    ticket: { cls: "ticket", Icon: MdConfirmationNumber },
    system: { cls: "system", Icon: MdSettings },
    info: { cls: "info", Icon: MdInfo },
  };

  return TYPE_ICON_CLASS[type] || { cls: "info", Icon: MdInfo };
}

export function filterNoticesByTab(notices, activeTab) {
  if (activeTab === "all") return notices;
  if (activeTab === "unread") return notices.filter((n) => n.unread);
  return notices.filter((n) => n.type === activeTab);
}

export function useNotice() {
  const [notices, setNotices] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotices() {
      try {
        setLoading(true);
        const data = await getNotificationsForCustomer();
        const readIds = JSON.parse(localStorage.getItem("readNotices") || "[]");
        // Chuẩn hóa và map dữ liệu trả về từ API
        let list = Array.isArray(data) ? data : (data?.$values || data?.data || []);
        if (list.length === 0) {
          setNotices(INITIAL_NOTICES.map(n => ({ ...n, unread: !readIds.includes(n.id) })));
        } else {
          setNotices(list.map((n) => {
            const nId = n.notificationId || n.id;
            return {
              id: nId,
              type: n.type || "info",
              title: n.title || "Thông báo mới",
              body: n.content || n.message || n.body || "",
              time: n.createdAt ? String(n.createdAt).split("T")[0] : "Vừa xong",
              unread: !readIds.includes(nId),
            };
          }));
        }
      } catch (err) {
        console.error("Lỗi lấy thông báo, sử dụng dữ liệu mặc định:", err);
        const readIds = JSON.parse(localStorage.getItem("readNotices") || "[]");
        setNotices(INITIAL_NOTICES.map(n => ({ ...n, unread: !readIds.includes(n.id) })));
      } finally {
        setLoading(false);
      }
    }
    fetchNotices();
  }, []);

  const unreadCount = notices.filter((notice) => notice.unread).length;

  const promoCount = notices.filter(
    (notice) => notice.type === "promo"
  ).length;

  const filteredNotices = filterNoticesByTab(notices, activeTab);

  function markRead(id) {
    const readIds = JSON.parse(localStorage.getItem("readNotices") || "[]");
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem("readNotices", JSON.stringify(readIds));
    }
    setNotices((prev) =>
      prev.map((notice) =>
        notice.id === id ? { ...notice, unread: false } : notice
      )
    );
  }

  function markAllRead() {
    const readIds = JSON.parse(localStorage.getItem("readNotices") || "[]");
    notices.forEach((n) => {
      if (!readIds.includes(n.id)) readIds.push(n.id);
    });
    localStorage.setItem("readNotices", JSON.stringify(readIds));
    
    setNotices((prev) =>
      prev.map((notice) => ({
        ...notice,
        unread: false,
      }))
    );
  }

  return {
    notices,
    activeTab,
    unreadCount,
    promoCount,
    filteredNotices,
    loading,
    setActiveTab,
    markRead,
    markAllRead,
  };
}