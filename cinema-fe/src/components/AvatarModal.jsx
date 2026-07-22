import { useState, useRef } from "react";
import { MdClose, MdCloudUpload, MdFileUpload, MdSave } from "react-icons/md";
import { updateProfile } from "../pages/Admin/User/userService";
import "../styles/Customer/AvatarModal.css";

export default function AvatarModal({ open, onClose, onSaved }) {
  const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const fallbackChar = (
    savedUser.fullName ||
    savedUser.FullName ||
    localStorage.getItem("fullName") ||
    "C"
  ).charAt(0).toUpperCase();

  const currentAvatar =
    savedUser.avatarUrl ||
    savedUser.AvatarUrl ||
    localStorage.getItem("avatarUrl") ||
    `https://ui-avatars.com/api/?name=${fallbackChar}&background=dc2626&color=fff&size=200`;

  const [preview, setPreview] = useState(currentAvatar);
  const [changed, setChanged] = useState(false);
  const fileRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
      setChanged(true);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!changed) return;
    try {
      await updateProfile({ avatarUrl: preview });
      
      const oldUser = JSON.parse(localStorage.getItem("user") || "{}");
      const email = (
        oldUser.email ||
        oldUser.Email ||
        localStorage.getItem("userEmail") ||
        localStorage.getItem("email") ||
        ""
      ).trim().toLowerCase();
      
      const updated = { ...oldUser, avatarUrl: preview };
      localStorage.setItem("user", JSON.stringify(updated));
      localStorage.setItem("avatarUrl", preview);
      if (email) {
        localStorage.setItem(`user_avatar_${email}`, preview);
      }
      window.dispatchEvent(new Event("avatarUpdated"));
      if (onSaved) onSaved(preview);
      onClose();
      setChanged(false);
    } catch (err) {
      console.error("Lỗi cập nhật avatar:", err);
      alert(err?.message || "Cập nhật ảnh đại diện thất bại!");
    }
  }

  function handleClose() {
    setPreview(currentAvatar);
    setChanged(false);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="am-overlay" onClick={handleClose}>
      <div className="am-container" onClick={(e) => e.stopPropagation()}>
        <button className="am-close-btn" onClick={handleClose}>
          <MdClose size={20} />
        </button>

        <div className="am-header">
          <h2>Đổi ảnh đại diện</h2>
        </div>

        <div className="am-body">
          <div className="am-left">
            <h3 className="am-col-title">Ảnh hiện tại</h3>
            <div className="am-current-wrapper">
              <img
                src={currentAvatar}
                alt="Current"
                onError={(e) =>
                  (e.target.src = `https://ui-avatars.com/api/?name=${fallbackChar}&background=dc2626&color=fff&size=200`)
                }
              />
            </div>
            <p className="am-left-desc">
              Ảnh đại diện giúp bạn được nhận diện dễ dàng hơn.
            </p>
          </div>

          <div className="am-divider"></div>

          <div className="am-right">
            <h3 className="am-col-title">Chọn ảnh mới</h3>

            <label className="am-upload-box" htmlFor="am-file-upload">
              <MdCloudUpload className="am-upload-icon" />
              <p className="am-upload-text-main">Kéo và thả ảnh vào đây</p>
              <p className="am-upload-text-sub">hoặc</p>
              <div className="am-upload-btn-fake">
                <MdFileUpload size={18} /> Chọn ảnh từ thiết bị
              </div>
              <input
                id="am-file-upload"
                type="file"
                accept="image/jpeg, image/png, image/webp"
                onChange={handleFile}
                ref={fileRef}
              />
            </label>

            <p className="am-upload-hint">
              Hỗ trợ JPG, PNG, WebP. Kích thước tối đa 5MB.
            </p>

            <h3 className="am-col-title">Xem trước</h3>
            <div className="am-preview-container">
              <div className="am-preview-item">
                <div className="am-preview-circle am-preview-large">
                  <img
                    src={preview}
                    alt="Large Preview"
                    onError={(e) =>
                      (e.target.src = `https://ui-avatars.com/api/?name=${fallbackChar}&background=dc2626&color=fff&size=128`)
                    }
                  />
                </div>
                <span className="am-preview-label">Lớn</span>
                <span className="am-preview-size">128px</span>
              </div>

              <div className="am-preview-item">
                <div className="am-preview-circle am-preview-small">
                  <img
                    src={preview}
                    alt="Small Preview"
                    onError={(e) =>
                      (e.target.src = `https://ui-avatars.com/api/?name=${fallbackChar}&background=dc2626&color=fff&size=64`)
                    }
                  />
                </div>
                <span className="am-preview-label">Nhỏ</span>
                <span className="am-preview-size">64px</span>
              </div>
            </div>
          </div>
        </div>

        <div className="am-footer">
          <button className="am-btn am-btn-cancel" onClick={handleClose}>
            Hủy
          </button>
          <button
            className="am-btn am-btn-save"
            onClick={handleSave}
            disabled={!changed}
          >
            <MdSave size={18} /> Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
