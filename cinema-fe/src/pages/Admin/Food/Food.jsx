import React, { useState } from 'react';
import { useFood } from './useFood';
import './Food.css';
import { MdAdd, MdSearch, MdMoreVert, MdTrendingUp, MdTrendingDown, MdWarning, MdEdit, MdDelete } from 'react-icons/md';
import { FaHamburger, FaCoins, FaShoppingCart, FaChartLine } from 'react-icons/fa';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line } from 'recharts';

export default function Food() {
  const {
    items, allCategories, activeCategory, handleCategorySelect, stats,
    loading, error, searchTerm, handleSearch,
    currentPage, totalPages, handlePageChange,
    showAddModal, setShowAddModal, openAddModal, handleAddSubmit,
    showEditModal, setShowEditModal, openEditModal, handleEditSubmit,
    showDeleteModal, setShowDeleteModal, openDeleteModal, confirmDelete,
    showImportModal, setShowImportModal, openImportModal, handleImportSubmit, importQuantity, setImportQuantity,
    formData, handleInputChange, handleFileChange,
    timeFilter, setTimeFilter, getSold, getRev
  } = useFood();

  const [activeDropdown, setActiveDropdown] = useState(null);

  const toggleDropdown = (id) => {
    if (activeDropdown === id) setActiveDropdown(null);
    else setActiveDropdown(id);
  };

  // Màu cho Pie Chart
  const COLORS = ['#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#10b981', '#6b7280'];

  const getBadgeClass = (category) => {
    if (!category) return 'khac';
    const cat = category.toLowerCase();
    if (cat.includes('bắp') || cat.includes('combo')) return 'bap-rang';
    if (cat.includes('nước')) return 'nuoc-uong';
    if (cat.includes('hotdog')) return 'hotdog';
    if (cat.includes('nachos')) return 'nachos';
    return 'khac';
  };

  return (
    <div className="food-dashboard" onClick={() => setActiveDropdown(null)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>🍿 Quản lý đồ ăn</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ display: 'flex', background: '#1c1c24', border: '1px solid #3a3a45', borderRadius: 8, padding: 4 }}>
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              style={{ padding: '6px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', background: 'transparent', color: '#fff', outline: 'none' }}
            >
              <option value="month" style={{ background: '#1c1c24', color: '#fff' }}>Tháng này</option>
              <option value="week" style={{ background: '#1c1c24', color: '#fff' }}>Tuần này</option>
              <option value="today" style={{ background: '#1c1c24', color: '#fff' }}>Hôm nay</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', background: '#1c1c24', border: '1px solid #3a3a45', borderRadius: 8, padding: '4px 12px' }}>
            <input 
              type="date" 
              value={timeFilter !== 'week' && timeFilter !== 'month' && timeFilter !== 'today' ? timeFilter : ''} 
              onChange={e => setTimeFilter(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', color: '#9ca3af', cursor: 'pointer', fontSize: 13 }}
            />
          </div>
        </div>
      </div>
      
      {/* 4 Summary Cards */}
      <div className="fd-header-cards">
        <div className="fd-card">
          <div className="fd-card-icon red"><FaHamburger /></div>
          <div className="fd-card-info">
            <h4>Tổng số món</h4>
            <div className="fd-value">{stats.totalItems} <span style={{ fontSize: 13, fontWeight: 400 }}>món</span></div>
            <div className="fd-trend up"><MdTrendingUp /> 3 món so với tháng trước</div>
          </div>
        </div>
        <div className="fd-card">
          <div className="fd-card-icon yellow"><FaCoins /></div>
          <div className="fd-card-info">
            <h4>Tổng số lượng tồn kho</h4>
            <div className="fd-value">{stats.totalStock.toLocaleString('vi-VN')} <span style={{ fontSize: 13, fontWeight: 400 }}>phần</span></div>
            <div className="fd-trend up"><MdTrendingUp /> 8% so với tháng trước</div>
          </div>
        </div>
        <div className="fd-card">
          <div className="fd-card-icon blue"><FaShoppingCart /></div>
          <div className="fd-card-info">
            <h4>
              {timeFilter === 'month' ? 'Đã bán trong tháng' : 
               timeFilter === 'week' ? 'Đã bán trong tuần' : 
               timeFilter === 'today' ? 'Đã bán hôm nay' : 
               `Đã bán ngày ${timeFilter.split('-').reverse().join('/')}`}
            </h4>
            <div className="fd-value">{stats.totalSold.toLocaleString('vi-VN')} <span style={{ fontSize: 13, fontWeight: 400 }}>phần</span></div>
            <div className="fd-trend up"><MdTrendingUp /> 12% so với kỳ trước</div>
          </div>
        </div>
        <div className="fd-card">
          <div className="fd-card-icon green"><FaChartLine /></div>
          <div className="fd-card-info">
            <h4>Doanh thu từ đồ ăn</h4>
            <div className="fd-value">{stats.totalRevenue.toLocaleString("vi-VN")}đ</div>
            <div className="fd-trend up"><MdTrendingUp /> 15% so với kỳ trước</div>
          </div>
        </div>
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: 15 }}>Lỗi: {error}</div>}

      <div className="fd-main-layout">
        {/* Left Side: Table & Filters */}
        <div className="fd-table-section">
          <div className="fd-filters">
            <div className="fd-category-tabs">
              {allCategories.map(cat => (
                <button 
                  key={cat} 
                  className={`fd-tab ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="fd-search-bar">
              <div className="fd-search-input-wrap">
                <MdSearch size={18} />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm món ăn..." 
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              <button className="fd-btn-filter" onClick={openAddModal}>
                <MdAdd size={16} /> Thêm món
              </button>
            </div>
          </div>

          <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '5px' }} className="fd-table-wrapper">
            <table className="fd-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>STT</th>
                <th>Tên món</th>
                <th>Danh mục</th>
                <th>Giá bán</th>
                <th>Tồn kho</th>
                <th>Đã bán</th>
                <th>Trạng thái</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center' }}>Đang tải...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center' }}>Không có dữ liệu</td></tr>
              ) : (
                items.map((item, index) => (
                  <tr key={`${item.itemType}-${item.id}`}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="fd-td-name">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} />
                        ) : (
                          <div style={{ width: 40, height: 40, background: '#f3f4f6', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#9ca3af' }}>No IMG</div>
                        )}
                        <div>
                          <div className="name">{item.name}</div>
                          {item.itemType === 'combo' && <div className="sub">Combo</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`fd-badge ${getBadgeClass(item.category)}`}>
                        {item.category || 'Khác'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{item.price.toLocaleString("vi-VN")}đ</td>
                    <td>{Math.max(0, item.quantity - getSold(item))}</td>
                    <td>{getSold(item)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className={`fd-status ${item.isAvailable && item.quantity > 0 ? 'active' : 'inactive'}`}>
                          {item.isAvailable && item.quantity > 0 ? 'Đang bán' : 'Sắp hết hàng'}
                        </span>
                        {/* Mini Sparkline Chart */}
                        <div style={{ width: 60, height: 20 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[{v:10}, {v:12}, {v:8}, {v:15}, {v:item.trend > 0 ? 20 : 5}]}>
                              <Line type="monotone" dataKey="v" stroke={item.trend >= 0 ? '#10b981' : '#f59e0b'} strokeWidth={1.5} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </td>
                    <td className="fd-actions">
                      <button className="fd-btn-more" onClick={(e) => { e.stopPropagation(); toggleDropdown(index); }}>
                        <MdMoreVert size={20} />
                      </button>
                      {activeDropdown === index && (
                        <div className="fd-dropdown">
                          <button onClick={() => openImportModal(item)}><MdAdd size={16} className="mr-1" /> Nhập kho</button>
                          <button onClick={() => openEditModal(item)}><MdEdit size={16} className="mr-1" /> Chỉnh sửa</button>
                          <button className="delete" onClick={() => openDeleteModal(item)}><MdDelete size={16} className="mr-1" /> Xóa</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="fd-pagination" style={{ justifyContent: 'flex-start' }}>
            <div className="fd-page-info">
              Đã hiển thị tất cả {items.length} món
            </div>
          </div>
        </div>

        {/* Right Side: Sidebar Widgets */}
        <div className="fd-sidebar">
          {/* Chart Widget */}
          <div className="fd-widget">
            <h3>Tồn kho theo danh mục</h3>
            <div style={{ height: 200, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.chartData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.totalStock.toLocaleString('vi-VN')}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>Tổng</div>
              </div>
            </div>
            {/* Chart Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 15 }}>
              {stats.chartData.map((d, i) => (
                <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }}></span>
                    <span style={{ color: '#374151', fontWeight: 500 }}>{d.name}</span>
                  </div>
                  <div style={{ color: '#6b7280' }}>
                    {Math.round((d.value / stats.totalStock) * 100)}% ({d.value})
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Selling Widget */}
          <div className="fd-widget">
            <h3>Top món bán chạy</h3>
            {stats.topSelling.map((item, index) => (
              <div key={item.id} className="fd-top-item">
                <div className={`fd-top-rank rank-${index + 1}`}>{index + 1}</div>
                {item.imageUrl ? <img src={item.imageUrl} className="fd-top-img" alt={item.name}/> : <div className="fd-top-img" style={{background: '#f3f4f6'}}></div>}
                <div className="fd-top-info">
                  <h5>{item.name}</h5>
                  <p>{getSold(item)} phần đã bán</p>
                </div>
                <div className="fd-top-trend">
                  <MdTrendingUp /> {item.trend > 0 ? item.trend : 5}%
                </div>
              </div>
            ))}
          </div>

          {/* Alerts Widget */}
          <div className="fd-widget">
            <h3>Cảnh báo</h3>
            {stats.lowStockItems.length === 0 ? (
              <p style={{ fontSize: 12, color: '#6b7280' }}>Kho hàng đang ổn định.</p>
            ) : (
              stats.lowStockItems.slice(0, 3).map(item => (
                <div key={item.id} className="fd-alert-item">
                  <MdWarning className="fd-alert-icon" />
                  <div className="fd-alert-info">
                    <h5>{item.name}</h5>
                    <p>Tồn kho chỉ còn {item.quantity} phần</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showAddModal && (
        <div className="food-modal-overlay">
          <div className="food-modal">
            <div className="modal-header">
              <h3>Thêm Đồ ăn / Combo</h3>
              <button className="btn-close" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Loại món (*)</label>
                  <select name="itemType" value={formData.itemType} onChange={handleInputChange}>
                    <option value="food">Đồ ăn</option>
                    <option value="combo">Combo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Tên món (*)</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                {formData.itemType === 'food' && (
                  <div className="form-group">
                    <label>Danh mục</label>
                    <input type="text" name="category" value={formData.category} onChange={handleInputChange} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 15 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Giá tiền (*)</label>
                    <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min={0} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Số lượng (*)</label>
                    <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} required min={0} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 15 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Ảnh từ máy</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Hoặc Link ảnh</label>
                    <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                  <input type="checkbox" name="isAvailable" checked={formData.isAvailable} onChange={handleInputChange} style={{ width: 'auto' }} />
                  <label style={{ margin: 0 }}>Đang bán</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>Hủy</button>
                <button type="submit" className="btn-submit" disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu lại'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="food-modal-overlay">
          <div className="food-modal">
            <div className="modal-header">
              <h3>Sửa Đồ ăn / Combo</h3>
              <button className="btn-close" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Loại món</label>
                  <input type="text" value={formData.itemType === 'combo' ? 'Combo' : 'Đồ ăn'} disabled style={{ background: '#f3f4f6', cursor: 'not-allowed' }} />
                </div>
                <div className="form-group">
                  <label>Tên món (*)</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                {formData.itemType === 'food' && (
                  <div className="form-group">
                    <label>Danh mục</label>
                    <input type="text" name="category" value={formData.category} onChange={handleInputChange} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 15 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Giá tiền (*)</label>
                    <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min={0} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Số lượng (*)</label>
                    <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} required min={0} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 15 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Ảnh từ máy</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Hoặc Link ảnh</label>
                    <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                  <input type="checkbox" name="isAvailable" checked={formData.isAvailable} onChange={handleInputChange} style={{ width: 'auto' }} />
                  <label style={{ margin: 0 }}>Đang bán</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>Hủy</button>
                <button type="submit" className="btn-submit" disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="food-modal-overlay">
          <div className="food-modal" style={{ width: 400 }}>
            <div className="modal-header">
              <h3>Nhập Hàng: {formData.name}</h3>
              <button className="btn-close" onClick={() => setShowImportModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleImportSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Số lượng nhập thêm (*)</label>
                  <input 
                    type="number" 
                    value={importQuantity} 
                    onChange={(e) => setImportQuantity(e.target.value)} 
                    required 
                    min={1} 
                    style={{ fontSize: 18, fontWeight: 'bold' }}
                  />
                  <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
                    Tồn kho hiện tại: {formData.quantity} <br/>
                    Tồn kho sau khi nhập: {Number(formData.quantity) + Number(importQuantity)}
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowImportModal(false)}>Hủy</button>
                <button type="submit" className="btn-submit" disabled={loading} style={{ background: '#10b981' }}>
                  {loading ? 'Đang lưu...' : 'Xác nhận nhập'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="food-modal-overlay">
          <div className="food-modal" style={{ width: 400 }}>
            <div className="modal-header">
              <h3 style={{ color: '#ef4444' }}>Xác nhận xóa</h3>
              <button className="btn-close" onClick={() => setShowDeleteModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn xóa <strong>{formData.name}</strong> không? Hành động này không thể hoàn tác.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>Hủy</button>
              <button className="btn-submit" style={{ background: '#ef4444' }} onClick={confirmDelete} disabled={loading}>
                {loading ? 'Đang xóa...' : 'Xóa món'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
