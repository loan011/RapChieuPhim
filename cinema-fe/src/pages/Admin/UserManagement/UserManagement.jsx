import { useState } from "react";
import { MdBadge, MdPersonOutline, MdManageAccounts, MdPeople } from "react-icons/md";
import "./UserManagement.css";

// Import the three sub-pages as components
import Personnel from "../Personnel/Personnel.jsx";
import Customer from "../Customer/Customer.jsx";
import TaiKhoan from "../Account/Account.jsx";

const TABS = [
  {
    key: "nhan-vien",
    label: "Nhân Viên",
    icon: <MdBadge />,
    color: "#3b82f6",
    bg: "#eff6ff",
  },
  {
    key: "khach-hang",
    label: "Khách Hàng",
    icon: <MdPersonOutline />,
    color: "#10b981",
    bg: "#ecfdf5",
  },
  {
    key: "tai-khoan",
    label: "Tài Khoản Đăng Nhập",
    icon: <MdManageAccounts />,
    color: "#f59e0b",
    bg: "#fffbeb",
  },
];

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState("nhan-vien");
  const active = TABS.find((t) => t.key === activeTab);

  return (
    <div className="um-wrapper">
      {/* Page Header */}
      <div className="um-header">
        <div className="um-header-left">
          <span className="um-header-icon">
            <MdPeople />
          </span>
          <div>
            <h4 className="um-title">Quản Lý Người Dùng</h4>
            <p className="um-subtitle">Nhân viên, khách hàng và tài khoản đăng nhập</p>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="um-tabbar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`um-tab${activeTab === tab.key ? " um-tab--active" : ""}`}
            style={
              activeTab === tab.key
                ? { color: tab.color, borderBottomColor: tab.color, background: tab.bg }
                : {}
            }
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="um-tab-icon">{tab.icon}</span>
            <span className="um-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="um-content">
        {activeTab === "nhan-vien" && <Personnel />}
        {activeTab === "khach-hang" && <Customer />}
        {activeTab === "tai-khoan" && <TaiKhoan />}
      </div>
    </div>
  );
}
