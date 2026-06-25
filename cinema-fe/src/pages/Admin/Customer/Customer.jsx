import "./Customer.css";
import { createPortal } from "react-dom";

import {
  CUSTOMER_TEXT as T,
  CUSTOMER_MEMBERSHIP_OPTIONS,
  useCustomer,

  getCustomerId,
  getCustomerName,
  getCustomerEmail,
  getCustomerPhone,
  getCustomerPoint,
  getCustomerCreatedAt,
  getCustomerMembershipLevel,
  getMembershipClass,
} from "./Customer";

export default function Customer() {
  const {
    loading,
    error,

    search,
    setSearch,

    filtered,

    showModal,
    editId,
    form,
    submitting,
    formError,

    openAddModal,
    openEditModal,
    closeModal,
    handleChange,
    handleSubmit,
    handleDelete,
  } = useCustomer();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-xl">{T.header.title}</h4>

        <button
          type="button"
          className={T.classNames.addButton}
          onClick={openAddModal}
        >
          {T.buttons.add}
        </button>
      </div>

      <div className={T.classNames.card}>
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="text"
            placeholder={T.search.placeholder}
            className={T.classNames.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && (
          <p className={T.classNames.loadingText}>{T.messages.loading}</p>
        )}

        {error && (
          <p className={T.classNames.errorText}>{error}</p>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  {T.table.headers.map((header) => (
                    <th key={header} className={T.classNames.tableHead}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={T.table.headers.length}
                      className={T.classNames.emptyCell}
                    >
                      {T.messages.empty}
                    </td>
                  </tr>
                ) : (
                  filtered.map((customer, index) => {
                    const customerId = getCustomerId(customer);

                    return (
                      <tr
                        key={customerId ?? index}
                        className={T.classNames.tableRow}
                      >
                        <td className={T.classNames.tableCell}>{index + 1}</td>

                        <td className={`${T.classNames.tableCell} font-medium`}>
                          {getCustomerName(customer)}
                        </td>

                        <td className={T.classNames.tableCell}>
                          {getCustomerEmail(customer)}
                        </td>

                        <td className={T.classNames.tableCell}>
                          {getCustomerPhone(customer)}
                        </td>

                        <td className={T.classNames.tableCell}>
                          {getCustomerPoint(customer)}
                        </td>

                        <td className={T.classNames.tableCell}>
                          <span
                            className={getMembershipClass(
                              getCustomerMembershipLevel(customer)
                            )}
                          >
                            {getCustomerMembershipLevel(customer)}
                          </span>
                        </td>

                        <td className={T.classNames.tableCell}>
                          {getCustomerCreatedAt(customer)}
                        </td>

                        <td className={`${T.classNames.tableCell} flex gap-2`}>
                          <button
                            type="button"
                            className={T.classNames.editButton}
                            onClick={() => openEditModal(customer)}
                          >
                            {T.buttons.edit}
                          </button>

                          <button
                            type="button"
                            className={T.classNames.deleteButton}
                            onClick={() => handleDelete(customerId)}
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
          <div className={T.classNames.modalOverlay}>
            <div className={T.classNames.modalBox}>
              <h5 className="font-bold text-lg mb-4">
                {editId !== null ? T.modal.editTitle : T.modal.addTitle}
              </h5>

              {formError && (
                <p className="text-red-500 text-sm mb-3">{formError}</p>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className={T.classNames.label}>
                    {T.fields.fullName.label}{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder={T.fields.fullName.placeholder}
                    className={T.classNames.input}
                  />
                </div>

                <div>
                  <label className={T.classNames.label}>
                    {T.fields.email.label}{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder={T.fields.email.placeholder}
                    className={T.classNames.input}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={T.classNames.label}>
                      {T.fields.phone.label}
                    </label>

                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder={T.fields.phone.placeholder}
                      className={T.classNames.input}
                    />
                  </div>

                  <div>
                    <label className={T.classNames.label}>
                      {T.fields.rewardPoint.label}
                    </label>

                    <input
                      type="number"
                      name="rewardPoint"
                      value={form.rewardPoint}
                      onChange={handleChange}
                      placeholder={T.fields.rewardPoint.placeholder}
                      className={T.classNames.input}
                    />
                  </div>
                </div>

                <div>
                  <label className={T.classNames.label}>
                    {T.fields.membershipLevel.label}
                  </label>

                  <select
                    name="membershipLevel"
                    value={form.membershipLevel}
                    onChange={handleChange}
                    className={T.classNames.input}
                  >
                    {CUSTOMER_MEMBERSHIP_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className={T.classNames.cancelButton}
                    disabled={submitting}
                  >
                    {T.buttons.cancel}
                  </button>

                  <button
                    type="submit"
                    className={T.classNames.submitButton}
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