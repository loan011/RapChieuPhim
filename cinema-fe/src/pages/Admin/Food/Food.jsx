import React, { useState } from 'react';
import { useFood } from './useFood';
import './Food.css';
import { MdAdd, MdSearch, MdMoreVert, MdTrendingUp, MdTrendingDown, MdWarning, MdEdit, MdDelete, MdToggleOn } from 'react-icons/md';
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
    showImportModal, setShowImportModal, openImportModal, handleImportSubmit, importQuantity, setImportQuantity, importDetails, setImportDetails,
    showStatusModal, setShowStatusModal, openStatusModal, confirmStatusChange, saleStatusDraft, setSaleStatusDraft,
    formData, handleInputChange, handleFileChange, selectedItem,
    comboFoodItems, setComboFoodItems, availableFoods,
    timeFilter, setTimeFilter, getSold, getRev,
    statusFilter, setStatusFilter,
    cinemas, selectedCinemaId, setSelectedCinemaId
  } = useFood();

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [viewComponentsItem, setViewComponentsItem] = useState(null);
  const selectedCinemaName = cinemas.find(cinema => String(cinema.id) === String(selectedCinemaId))?.name || '';

  const toggleDropdown = (id) => {
    if (activeDropdown === id) setActiveDropdown(null);
    else setActiveDropdown(id);
  };

  const getDisplayStatus = (item) => {
    if (item.saleStatus === 'INACTIVE') return { label: 'Ngừng bán', className: 'inactive' };
    if (item.itemType === 'combo' && item.quantity <= 0) return { label: 'Hết thành phần', className: 'inactive' };
    if (item.quantity <= 0) return { label: 'Hết hàng', className: 'inactive' };
    if (item.quantity <= item.minStock) return { label: 'Sắp hết hàng', className: 'low-stock' };
    return { label: 'Còn hàng', className: 'active' };
  };

  const normalizeCategory = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const drinkFoods = availableFoods.filter(x => normalizeCategory(x.category).includes('nuoc'));
  const popcornFoods = availableFoods.filter(x => normalizeCategory(x.category).includes('bap'));
  const toggleAllowedFood = (foodId) => setComboFoodItems(rows => rows.some(x => Number(x.foodId) === Number(foodId))
    ? rows.filter(x => Number(x.foodId) !== Number(foodId))
    : [...rows, { foodId: Number(foodId), quantity: 0 }]);
  const renderComboComponentsEditor = () => (
    <div className="form-group">
      <label>Cấu hình lựa chọn Combo (*)</label>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
        <label>Số lượng nước được chọn<input type="number" name="drinkSlotCount" min="0" max="20" value={formData.drinkSlotCount ?? 0} onChange={handleInputChange}/></label>
        <label>Số lượng bắp được chọn<input type="number" name="popcornSlotCount" min="0" max="20" value={formData.popcornSlotCount ?? 0} onChange={handleInputChange}/></label>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <input type="checkbox" name="allowsCustomization" checked={Boolean(formData.allowsCustomization)} onChange={handleInputChange}/>
        Cho khách tự chọn nước và vị bắp
      </label>
      <strong>Nước được phép chọn</strong>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,margin:'8px 0 12px'}}>{drinkFoods.map(food => <label key={food.id} style={{display:'flex',gap:6}}><input type="checkbox" checked={comboFoodItems.some(x=>Number(x.foodId)===Number(food.id))} onChange={()=>toggleAllowedFood(food.id)}/>{food.name}</label>)}</div>
      <strong>Bắp được phép chọn</strong>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginTop:8}}>{popcornFoods.map(food => <label key={food.id} style={{display:'flex',gap:6}}><input type="checkbox" checked={comboFoodItems.some(x=>Number(x.foodId)===Number(food.id))} onChange={()=>toggleAllowedFood(food.id)}/>{food.name}</label>)}</div>
      <small>Combo chỉ lưu số slot và danh sách món được phép; không lưu tồn kho riêng.</small>
    </div>
  );

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
          <div style={{ display: 'flex', alignItems: 'center', background: '#1c1c24', border: '1px solid #3a3a45', borderRadius: 8, padding: '4px 12px' }}>
            <select
              value={selectedCinemaId}
              onChange={(e) => setSelectedCinemaId(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', color: '#fff', cursor: 'pointer', fontSize: 13 }}
            >
              {cinemas.map((cinema) => (
                <option key={cinema.id} value={cinema.id} style={{ background: '#1c1c24', color: '#fff' }}>
                  {cinema.name}
                </option>
              ))}
            </select>
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
            <div className="fd-trend up">Theo rạp đang chọn</div>
          </div>
        </div>
        <div className="fd-card">
          <div className="fd-card-icon yellow"><FaCoins /></div>
          <div className="fd-card-info">
            <h4>Tổng số lượng tồn kho</h4>
            <div className="fd-value">{stats.totalStock.toLocaleString('vi-VN')} <span style={{ fontSize: 13, fontWeight: 400 }}>phần</span></div>
            <div className="fd-trend up">Cập nhật từ tồn kho rạp</div>
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
            <div className="fd-trend up">Theo kỳ đang chọn</div>
          </div>
        </div>
        <div className="fd-card">
          <div className="fd-card-icon green"><FaChartLine /></div>
          <div className="fd-card-info">
            <h4>Doanh thu từ đồ ăn</h4>
            <div className="fd-value">{stats.totalRevenue.toLocaleString("vi-VN")}đ</div>
            <div className="fd-trend up">Theo kỳ đang chọn</div>
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
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  background: '#1c1c24',
                  border: '1px solid #3a3a45',
                  borderRadius: 8,
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="Tất cả" style={{ background: '#1c1c24', color: '#fff' }}>Tất cả trạng thái</option>
                <option value="Còn hàng" style={{ background: '#1c1c24', color: '#fff' }}>Còn hàng</option>
                <option value="Hết hàng" style={{ background: '#1c1c24', color: '#fff' }}>Hết hàng</option>
              </select>
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
                    <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                    <td>{getSold(item)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className={`fd-status ${getDisplayStatus(item).className}`}>
                          {getDisplayStatus(item).label}
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
                      <button className="fd-btn-more" onClick={(e) => { e.stopPropagation(); toggleDropdown(`${item.itemType}_${item.id}`); }}>
                        <MdMoreVert size={20} />
                      </button>
                      {activeDropdown === `${item.itemType}_${item.id}` && (
                        <div className="fd-dropdown">
                          <button onClick={() => openEditModal(item)}><MdEdit size={16} className="mr-1" /> {item.itemType === 'combo' ? 'Chỉnh sửa Combo' : 'Chỉnh sửa'}</button>
                          {item.itemType === 'combo'
                            ? <button onClick={() => setViewComponentsItem(item)}><MdSearch size={16} className="mr-1" /> Xem thành phần</button>
                            : <button onClick={() => openImportModal(item)}><MdAdd size={16} className="mr-1" /> Nhập hàng</button>}
                          <button onClick={() => openStatusModal(item)}><MdToggleOn size={16} className="mr-1" /> Chỉnh trạng thái</button>
                          {item.itemType === 'food' && <button className="delete" onClick={() => openDeleteModal(item)}><MdDelete size={16} className="mr-1" /> Xóa món</button>}
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
              <div key={`${item.itemType || 'item'}-${item.id}-${index}`} className="fd-top-item">
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
                    <select name="category" value={formData.category} onChange={handleInputChange}>
                      <option value="Nước Uống">Nước Uống</option>
                      <option value="Bắp Rang">Bắp Rang</option>
                      <option value="Đồ ăn">Đồ ăn</option>
                    </select>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 15 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Giá tiền (*)</label>
                    <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min={0} />
                  </div>
                  {formData.itemType === 'food' && <div className="form-group" style={{ flex: 1 }}>
                    <label>Số lượng (*)</label>
                    <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} required min={0} />
                  </div>}
                </div>
                {formData.itemType === 'combo' && renderComboComponentsEditor()}
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
                    <select name="category" value={formData.category} onChange={handleInputChange}>
                      <option value="Nước Uống">Nước Uống</option>
                      <option value="Bắp Rang">Bắp Rang</option>
                      <option value="Đồ ăn">Đồ ăn</option>
                    </select>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 15 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Giá tiền (*)</label>
                    <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min={0} />
                  </div>
                  {formData.itemType === 'food' && <div className="form-group" style={{ flex: 1 }}>
                    <label>Số lượng (*)</label>
                    <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} required min={0} />
                  </div>}
                </div>
                {formData.itemType === 'combo' && renderComboComponentsEditor()}
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
              <h3>Nhập Hàng: {selectedItem?.name || formData.name}</h3>
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
                    Tồn kho hiện tại: {selectedItem?.quantity ?? formData.quantity} <br/>
                    Tồn kho sau khi nhập: {Number(selectedItem?.quantity ?? formData.quantity) + Number(importQuantity)}
                  </p>
                </div>
                <div className="form-group"><label>Giá nhập (*)</label><input type="number" min="1" required value={importDetails.unitCost} onChange={e => setImportDetails(v => ({...v, unitCost: e.target.value}))}/></div>
                <div className="form-group"><label>Ngày nhập (*)</label><input type="date" required value={importDetails.receivedAt} onChange={e => setImportDetails(v => ({...v, receivedAt: e.target.value}))}/></div>
                <div className="form-group"><label>Hạn sử dụng</label><input type="date" value={importDetails.expirationDate} onChange={e => setImportDetails(v => ({...v, expirationDate: e.target.value}))}/></div>
                <div className="form-group"><label>Ghi chú</label><textarea maxLength="500" value={importDetails.notes} onChange={e => setImportDetails(v => ({...v, notes: e.target.value}))}/></div>
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

      {viewComponentsItem && (
        <div className="food-modal-overlay">
          <div className="food-modal" style={{ width: 430 }}>
            <div className="modal-header"><h3>Thành phần: {viewComponentsItem.name}</h3><button className="btn-close" onClick={() => setViewComponentsItem(null)}>&times;</button></div>
            <div className="modal-body">
              {(viewComponentsItem.foodItems || []).length === 0 ? <p>Combo chưa được cấu hình thành phần.</p> :
                (viewComponentsItem.foodItems || []).map((part, index) => <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #374151' }}>
                  <span>{part.foodName ?? part.FoodName}</span><strong>x{part.quantity ?? part.Quantity}</strong>
                </div>)}
            </div>
            <div className="modal-footer"><button className="btn-submit" onClick={() => setViewComponentsItem(null)}>Đóng</button></div>
          </div>
        </div>
      )}

      {showStatusModal && (
        <div className="food-modal-overlay">
          <div className="food-modal" style={{ width: 400 }}>
            <div className="modal-header">
              <h3>Chỉnh trạng thái: {selectedItem?.name}</h3>
              <button className="btn-close" onClick={() => setShowStatusModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Trạng thái bán</label>
                <select value={saleStatusDraft} onChange={(e) => setSaleStatusDraft(e.target.value)}>
                  <option value="ACTIVE">Đang bán</option>
                  <option value="INACTIVE">Ngừng bán</option>
                </select>
              </div>
              <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 12 }}>
                Trạng thái tồn kho được hệ thống tự tính từ số lượng và mức tồn kho tối thiểu.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowStatusModal(false)}>Hủy</button>
              <button className="btn-submit" onClick={confirmStatusChange} disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu trạng thái'}
              </button>
            </div>
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
              <p>Bạn có chắc muốn xóa món <strong>{selectedItem?.name}</strong> khỏi rạp <strong>{selectedCinemaName}</strong> không?</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>Hủy</button>
              <button className="btn-submit" style={{ background: '#ef4444' }} onClick={confirmDelete} disabled={loading}>
                {loading ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
