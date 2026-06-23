import "./Room.css";
import { useEffect, useState } from "react";
import { getRoomList, createRoom, updateRoom, deleteRoom } from "./roomService";

const EMPTY_FORM = {
  name: "",
  capacity: "",
  type: "",
  status: "Active",
};

export default function PhongChieu() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  function unwrapList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.$values)) return data.$values;
    return [];
  }

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      const data = await getRoomList();
      setList(unwrapList(data));
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu phòng chiếu.");
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(room) {
    const id = room.id ?? room.roomId ?? room.RoomId;

    setEditId(id);
    setForm({
      name: room.name ?? room.roomName ?? room.RoomName ?? "",
      capacity: room.capacity ?? room.totalSeats ?? room.TotalSeats ?? "",
      type: room.type ?? room.roomType ?? room.RoomType ?? "",
      status:
        room.status ??
        room.Status ??
        (room.isActive === true || room.IsActive === true
          ? "Active"
          : "Inactive"),
    });

    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Vui lòng nhập tên phòng chiếu.");
      return;
    }

    if (!form.capacity || Number(form.capacity) <= 0) {
      setFormError("Vui lòng nhập sức chứa hợp lệ.");
      return;
    }

    if (!form.type) {
      setFormError("Vui lòng chọn loại phòng.");
      return;
    }

    const payload = {
      roomName: form.name.trim(),
      roomType: form.type,
      totalSeats: Number(form.capacity),
      isActive: form.status !== "Inactive",
      cinemaId: 1,
    };

    try {
      setSubmitting(true);

      if (editId !== null) {
        await updateRoom(editId, payload);
      } else {
        await createRoom(payload);
      }

      await fetchData();
      closeModal();
    } catch (err) {
      setFormError(err.message || "Lưu phòng chiếu thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Bạn có chắc muốn xóa phòng chiếu này?")) return;

    try {
      await deleteRoom(id);

      setList((prev) =>
        prev.filter((room) => {
          const roomId = room.id ?? room.roomId ?? room.RoomId;
          return roomId !== id;
        })
      );
    } catch (err) {
      alert(err.message || "Xóa phòng chiếu thất bại.");
    }
  }

  function getStatusLabel(room) {
    const status = room.status ?? room.Status;
    const isActive = room.isActive ?? room.IsActive;

    if (status === "Maintenance") return "Bảo trì";
    if (status === "Inactive" || isActive === false) return "Ngừng hoạt động";
    return "Hoạt động";
  }

  function getStatusClass(room) {
    const status = room.status ?? room.Status;
    const isActive = room.isActive ?? room.IsActive;

    if (status === "Maintenance") return "status-maintenance";
    if (status === "Inactive" || isActive === false) return "status-inactive";
    return "status-active";
  }

  return (
    <div>
      <div className="room-header">
        <h4>Quản Lý Phòng Chiếu</h4>

        <button type="button" className="room-add-btn" onClick={openAddModal}>
          + Thêm
        </button>
      </div>

      <div className="room-card">
        {loading && <p className="room-muted">Đang tải...</p>}
        {error && <p className="room-error">{error}</p>}

        {!loading && !error && (
          <div className="room-table-wrap">
            <table className="admin-table room-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên Phòng</th>
                  <th>Sức Chứa</th>
                  <th>Loại Phòng</th>
                  <th>Trạng Thái</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>

              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="room-empty">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  list.map((room, index) => {
                    const id = room.id ?? room.roomId ?? room.RoomId;
                    const name =
                      room.name ?? room.roomName ?? room.RoomName ?? "—";
                    const capacity =
                      room.capacity ?? room.totalSeats ?? room.TotalSeats ?? "—";
                    const type =
                      room.type ?? room.roomType ?? room.RoomType ?? "—";

                    return (
                      <tr key={id ?? index}>
                        <td>{index + 1}</td>

                        <td className="room-name">{name}</td>

                        <td>{capacity}</td>

                        <td>{type}</td>

                        <td>
                          <span className={`room-status ${getStatusClass(room)}`}>
                            {getStatusLabel(room)}
                          </span>
                        </td>

                        <td>
                          <div className="room-actions">
                            <button
                              type="button"
                              onClick={() => openEditModal(room)}
                            >
                              Sửa
                            </button>

                            <button
                              type="button"
                              className="delete"
                              onClick={() => handleDelete(id)}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="room-modal-overlay">
          <div className="room-modal">
            <h5>
              {editId !== null ? "Cập Nhật Phòng Chiếu" : "Thêm Phòng Chiếu"}
            </h5>

            {formError && <p className="room-form-error">{formError}</p>}

            <form onSubmit={handleSubmit} className="room-form">
              <div>
                <label>
                  Tên Phòng <span>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Nhập tên phòng chiếu"
                  autoComplete="off"
                />
              </div>

              <div>
                <label>
                  Sức Chứa <span>*</span>
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={form.capacity}
                  onChange={handleChange}
                  placeholder="Nhập sức chứa"
                  min={1}
                  autoComplete="off"
                />
              </div>

              <div>
                <label>
                  Loại Phòng <span>*</span>
                </label>
                <select name="type" value={form.type} onChange={handleChange}>
                  <option value="">-- Chọn loại phòng --</option>
                  <option value="2D">2D</option>
                  <option value="3D">3D</option>
                  <option value="IMAX">IMAX</option>
                  <option value="4DX">4DX</option>
                </select>
              </div>

              <div>
                <label>Trạng Thái</label>
                <select name="status" value={form.status} onChange={handleChange}>
                  <option value="Active">Hoạt động</option>
                  <option value="Inactive">Ngừng hoạt động</option>
                  <option value="Maintenance">Bảo trì</option>
                </select>
              </div>

              <div className="room-modal-actions">
                <button type="button" className="cancel" onClick={closeModal}>
                  Hủy
                </button>

                <button type="submit" className="save" disabled={submitting}>
                  {submitting
                    ? "Đang xử lý..."
                    : editId !== null
                    ? "Cập Nhật"
                    : "Thêm Mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}