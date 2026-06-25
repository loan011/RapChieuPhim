import { useState } from "react";
import {
  MdLocalOffer,
  MdConfirmationNumber,
  MdSettings,
  MdInfo,
  MdNotifications,
} from "react-icons/md";

export const NOTICE_TEXT = {
  header: {
    icon: "🔔",
    title: "Thông báo",
    description: "Cập nhật ưu đãi, vé đặt và hoạt động tài khoản",
  },
  stats: {
    unread: "Chưa đọc",
    total: "Tổng thông báo",
    promo: "Ưu đãi",
  },
  tabKeys: {
    all: "all",
    unread: "unread",
    promo: "promo",
    ticket: "ticket",
    system: "system",
  },
  tabs: [
    { key: "all", label: "Tất cả" },
    { key: "unread", label: "Chưa đọc" },
    { key: "promo", label: "Ưu đãi" },
    { key: "ticket", label: "Vé" },
    { key: "system", label: "Hệ thống" },
  ],
  labels: {
    notification: "thông báo",
  },
  buttons: {
    markAllRead: "Đánh dấu tất cả đã đọc",
  },
  empty: {
    Icon: MdNotifications,
    title: "Không có thông báo",
    description: "Bạn đã đọc hết tất cả thông báo",
  },
};

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
  const T = NOTICE_TEXT;

  const [notices, setNotices] = useState(INITIAL_NOTICES);
  const [activeTab, setActiveTab] = useState(T.tabKeys.all);

  const unreadCount = notices.filter((notice) => notice.unread).length;

  const promoCount = notices.filter(
    (notice) => notice.type === T.tabKeys.promo
  ).length;

  const filteredNotices = filterNoticesByTab(notices, activeTab);

  function markRead(id) {
    setNotices((prev) =>
      prev.map((notice) =>
        notice.id === id ? { ...notice, unread: false } : notice
      )
    );
  }

  function markAllRead() {
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

    setActiveTab,
    markRead,
    markAllRead,
  };
}