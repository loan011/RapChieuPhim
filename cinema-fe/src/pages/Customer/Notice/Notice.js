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