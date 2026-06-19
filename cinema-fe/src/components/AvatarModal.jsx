import { useState, useRef } from "react";
import { MdCameraAlt, MdCheckCircle, MdClose } from "react-icons/md";
import "../styles/Customer/CustomerPages.css";

/**
 * AvatarModal — Modal đổi avatar, dùng chung toàn app.
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   onSaved: (newUrl: string) => void   // optional callback
 */
export default function AvatarModal({ open, onClose, onSaved }) {
  const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentAvatar =
    savedUser.avatarUrl ||
    savedUser.AvatarUrl ||
    localStorage.getItem("avatarUrl") ||
    "/images/default-avatar.png";

  const [preview, setPreview] = useState(currentAvatar);
  const [changed, setChanged] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
      setChanged(true);
      setSaved(false);
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    const oldUser = JSON.parse(localStorage.getItem("user") || "{}");
    const updated = { ...oldUser, avatarUrl: preview };
    localStorage.setItem("user", JSON.stringify(updated));
    localStorage.setItem("avatarUrl", preview);
    setSaved(true);
    setChanged(false);
    if (onSaved) onSaved(preview);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  }

  function handleClose() {
    setPreview(currentAvatar);
    setChanged(false);
    setSaved(false);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="avatar-modal-overlay" onClick={handleClose}>
      <div className="avatar-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "rgba(255,255,255,0.08)",
            border: "none",
            color: "rgba(255,255,255,0.5)",
            width: 30,
            height: 30,
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem",
          }}
        >
          <MdClose />
        </button>

        <h2>Đổi ảnh đại diện</h2>

        {/* Preview */}
        <img
          src={preview}
          alt="Avatar preview"
          className="avatar-preview-big"
          onError={(e) =>
            (e.target.src =
              "https://ui-avatars.com/api/?name=User&background=dc2626&color=fff&size=120")
          }
        />

        {/* Upload zone */}
        <label className="avatar-upload-zone" htmlFor="avatarModalInput">
          <MdCameraAlt />
          <p>
            {changed
              ? "Ảnh đã được chọn — nhấn Lưu để áp dụng"
              : "Nhấn để chọn ảnh từ thiết bị"}
          </p>
          <input
            id="avatarModalInput"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            ref={fileRef}
            onChange={handleFile}
          />
        </label>

        {/* Actions */}
        <div className="avatar-modal-actions">
          <button className="avatar-cancel-btn" onClick={handleClose}>
            Hủy
          </button>
          <button
            className="avatar-save-btn"
            onClick={handleSave}
            disabled={!changed && !saved}
            style={{ opacity: !changed && !saved ? 0.5 : 1 }}
          >
            {saved ? (
              <>
                <MdCheckCircle style={{ marginRight: 6 }} />
                Đã lưu!
              </>
            ) : (
              "Lưu ảnh"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
