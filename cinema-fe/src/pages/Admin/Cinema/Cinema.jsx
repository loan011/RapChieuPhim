import "./Cinema.css";
import { createPortal } from "react-dom";

import {
  RAP_CHIEU_TEXT as T,
  CINEMA_STATUS_OPTIONS,
  useRapChieu,
  getCinemaIdField,
  getCinemaName,
  getCinemaAddress,
  getCinemaArea,
  getCinemaPhone,
  getCinemaEmail,
  getCinemaStatus,
  getAreaId,
  getAreaName,
  getStatusClassName,
  getStatusLabel,
} from "./RapChieu";

export default function RapChieu() {
  const {
    areas,
    loading,
    error,
    search,
    setSearch,

    showModal,
    editId,
    form,
    submitting,
    formError,
    filtered,

    openAddModal,
    openEditModal,
    closeModal,
    handleChange,
    handleSubmit,
    handleDelete,
  } = useRapChieu();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-xl">{T.header.title}</h4>

        <button
          type="button"
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
          onClick={openAddModal}
        >
          {T.buttons.add}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="mb-4">
          <input
            type="text"
            placeholder={T.search.placeholder}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full max-w-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <p className="text-gray-500 text-sm">{T.loading}</p>}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  {T.tableHeaders.map((header) => (
                    <th key={header} className="px-3 py-2 text-left">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={T.tableHeaders.length}
                      className="text-center py-6 text-gray-400"
                    >
                      {T.empty}
                    </td>
                  </tr>
                ) : (
                  filtered.map((cinema, index) => {
                    const cinemaId = getCinemaIdField(cinema);
                    const status = getCinemaStatus(cinema);

                    return (
                      <tr
                        key={cinemaId ?? index}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-3 py-2">{index + 1}</td>

                        <td className="px-3 py-2 font-medium">
                          {getCinemaName(cinema)}
                        </td>

                        <td className="px-3 py-2">
                          {getCinemaAddress(cinema)}
                        </td>

                        <td className="px-3 py-2">
                          {getCinemaArea(cinema)}
                        </td>

                        <td className="px-3 py-2">
                          {getCinemaPhone(cinema)}
                        </td>

                        <td className="px-3 py-2">
                          {getCinemaEmail(cinema)}
                        </td>

                        <td className="px-3 py-2">
                          <span className={getStatusClassName(status)}>
                            {getStatusLabel(status)}
                          </span>
                        </td>

                        <td className="px-3 py-2 flex gap-2">
                          <button
                            type="button"
                            className="text-blue-600 hover:underline text-xs"
                            onClick={() => openEditModal(cinema)}
                          >
                            {T.buttons.edit}
                          </button>

                          <button
                            type="button"
                            className="text-red-500 hover:underline text-xs"
                            onClick={() => handleDelete(cinemaId)}
                          >
                            {T.buttons.delete}
                          </button>
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

      {showModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
              <h5 className="font-bold text-lg mb-4">
                {editId !== null ? T.modal.editTitle : T.modal.addTitle}
              </h5>

              {formError && (
                <p className="text-red-500 text-sm mb-3">{formError}</p>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {T.fields.cinemaName.label}{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="cinemaName"
                    value={form.cinemaName}
                    onChange={handleChange}
                    placeholder={T.fields.cinemaName.placeholder}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {T.fields.address.label}{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder={T.fields.address.placeholder}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {T.fields.area.label}
                  </label>

                  <select
                    name="area"
                    value={form.area}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">{T.fields.area.placeholder}</option>

                    {areas.map((area) => {
                      const areaId = getAreaId(area);

                      return (
                        <option key={areaId} value={areaId}>
                          {getAreaName(area)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {T.fields.phone.label}
                    </label>

                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder={T.fields.phone.placeholder}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {T.fields.email.label}
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder={T.fields.email.placeholder}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {T.fields.status.label}
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {CINEMA_STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
                    disabled={submitting}
                  >
                    {T.buttons.cancel}
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
                    disabled={submitting}
                  >
                    {submitting
                      ? T.buttons.processing
                      : editId !== null
                      ? T.buttons.update
                      : T.buttons.create}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}