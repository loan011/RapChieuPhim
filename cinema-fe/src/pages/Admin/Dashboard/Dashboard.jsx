import "./Dashboard.css";
import { useState } from "react";
import { useDashboard, formatMoney } from "./useDashboard";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";

const MOVIE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];
const FOOD_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const { 
    stats, recentTickets, loading, error, 
    timeFilter, setTimeFilter,
    cinemaId, setCinemaId, cinemas,
    chartData, movieStats,
    selectedMovie, movieDetailStats, isDetailModalOpen,
    openMovieDetail, closeMovieDetail
  } = useDashboard();

  const [activeTab, setActiveTab] = useState('Phim');


  const handleQuickDate = (type) => {
    const now = new Date();
    if (type === 'today') {
      setTimeFilter(now.toISOString().split('T')[0]);
    } else if (type === 'week') {
      setTimeFilter('week');
    } else if (type === 'month') {
      setTimeFilter('month');
    }
  };

  // Format big numbers
  const formatBillion = (val) => {
    if (val >= 1000000000) return (val / 1000000000).toFixed(1) + ' tỷ';
    if (val >= 1000000) return (val / 1000000).toFixed(1) + ' Tr';
    return formatMoney(val) + ' đ';
  };

  const totalMoviesRevSum = movieStats.reduce((sum, m) => sum + (m.totalRevenue || 0), 0);
  const moviePieData = movieStats.map(m => {
    const calcPct = totalMoviesRevSum > 0 ? Number(((m.totalRevenue / totalMoviesRevSum) * 100).toFixed(1)) : 0;
    return {
      name: m.movieTitle,
      value: m.totalRevenue,
      percent: Math.min(100, calcPct)
    };
  });

  const foodPieData = chartData?.foodDistributions || [];
  const totalFoodRevenueStr = formatBillion(chartData?.totalFoodRevenue || 0);

  return (
    <div className="dashboard-page">
      {loading && (
        <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(59,130,246,0.12)', color: '#bfdbfe', border: '1px solid rgba(59,130,246,0.35)' }}>
          Đang tải dữ liệu dashboard...
        </div>
      )}

      {!loading && error && (
        <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.12)', color: '#fecaca', border: '1px solid rgba(239,68,68,0.45)' }}>
          {error}
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="dashboard-header-bar">
        <div className="dashboard-header-right">
          <select
            value={['week', 'last_week', 'month', 'last_month', 'today'].includes(timeFilter) ? timeFilter : 'today'}
            onChange={(e) => setTimeFilter(e.target.value)}
            style={{
              padding: '7px 14px',
              border: '1px solid #2c2c2e',
              borderRadius: '8px',
              background: '#1c1c1e',
              color: '#f4f4f5',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.88rem',
              outline: 'none',
              marginRight: '16px'
            }}
          >
            <option value="today">Hôm nay</option>
            <option value="week">Tuần này</option>
            <option value="last_week">Tuần trước</option>
            <option value="month">Tháng này</option>
            <option value="last_month">Tháng trước</option>
          </select>
          <div className="dashboard-date-picker">
            <i className="fi fi-rr-calendar"></i>
            <input 
              type="date" 
              value={!['week', 'last_week', 'month', 'last_month', 'today'].includes(timeFilter) ? timeFilter : ''} 
              onChange={e => setTimeFilter(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', color: '#d1d5db', cursor: 'pointer' }}
            />
          </div>
          <select 
            className="dashboard-cinema-select"
            value={cinemaId}
            onChange={(e) => setCinemaId(e.target.value)}
          >
            <option value="">Tất cả rạp</option>
            {cinemas.map(c => (
              <option key={c.cinemaId || c.id} value={c.cinemaId || c.id}>{c.cinemaName || c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TABS */}
      <div className="dashboard-tabs">
        {['Tổng quan', 'Phim', 'Đồ ăn & Combo'].map(tab => (
          <div 
            key={tab} 
            className={`dashboard-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* KPI CARDS */}
      <div className="dashboard-stats-grid">
        {activeTab === 'Tổng quan' && (
          <div className="dashboard-stat-card stat-blue" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <div className="dashboard-stat-content">
              <span className="dashboard-stat-label" style={{ color: '#fff' }}>Tổng doanh thu (Thực nhận)</span>
              <strong className="dashboard-stat-value" style={{ color: '#fff' }}>{formatMoney((chartData?.totalTicketRevenue || 0) + (chartData?.totalFoodRevenue || 0))}đ</strong>
              <span className="dashboard-stat-trend trend-up" style={{ color: '#d1fae5', background: 'rgba(255,255,255,0.2)' }}>▲ 16.5% so với hôm qua</span>
            </div>
            <div className="dashboard-stat-icon" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
              💰
            </div>
          </div>
        )}

        {(activeTab === 'Tổng quan' || activeTab === 'Phim') && (
          <>
            <div className="dashboard-stat-card stat-blue">
              <div className="dashboard-stat-content">
                <span className="dashboard-stat-label">Doanh thu vé</span>
                <strong className="dashboard-stat-value">{formatMoney(chartData?.totalTicketRevenue || 0)}đ</strong>
                <span className="dashboard-stat-trend trend-up">▲ 18.6% so với hôm qua</span>
              </div>
              <div className="dashboard-stat-icon">
                🎫
              </div>
            </div>
            <div className="dashboard-stat-card stat-green">
              <div className="dashboard-stat-content">
                <span className="dashboard-stat-label">Tổng vé đã bán</span>
                <strong className="dashboard-stat-value">{formatMoney(stats.totalTickets)} vé</strong>
                <span className="dashboard-stat-trend trend-up">▲ 12.4% so với hôm qua</span>
              </div>
              <div className="dashboard-stat-icon">
                🎟️
              </div>
            </div>
            <div className="dashboard-stat-card stat-purple">
              <div className="dashboard-stat-content">
                <span className="dashboard-stat-label">Tỷ lệ lấp đầy ghế TB</span>
                <strong className="dashboard-stat-value">
                  {movieStats.length > 0 ? (movieStats.reduce((s, m) => s + (m.seatOccupancyPercentage || 0), 0) / movieStats.length).toFixed(1) : 0}%
                </strong>
                <span className="dashboard-stat-trend trend-up">▲ 7.3% so với hôm qua</span>
              </div>
              <div className="dashboard-stat-icon">
                💺
              </div>
            </div>
          </>
        )}
        
        {(activeTab === 'Tổng quan' || activeTab === 'Đồ ăn & Combo') && (
          <div className="dashboard-stat-card stat-orange">
            <div className="dashboard-stat-content">
              <span className="dashboard-stat-label">Doanh thu đồ ăn</span>
              <strong className="dashboard-stat-value">{formatMoney(chartData?.totalFoodRevenue || 0)}đ</strong>
              <span className="dashboard-stat-trend trend-up">▲ 15.2% so với hôm qua</span>
            </div>
            <div className="dashboard-stat-icon">
              🍿
            </div>
          </div>
        )}
      </div>

      {/* MAIN CONTENT (2 columns) */}
      <div className="dashboard-main-grid" style={{ gridTemplateColumns: activeTab === 'Đồ ăn & Combo' ? '1fr' : '2fr 1fr' }}>
        {/* LEFT: MOVIE TABLE */}
        {(activeTab === 'Tổng quan' || activeTab === 'Phim') && (
          <div className="dashboard-section-card">
            <div className="dashboard-section-header">
              <h3 className="dashboard-section-title">Hiệu suất theo phim</h3>
            </div>
            <table className="movie-perf-table">
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Phim</th>
                  <th>Doanh thu (đ)<br/><span style={{fontSize:'10px', color:'#d1d5db'}}>Tổng / %</span></th>
                  <th>Vé đã bán<br/><span style={{fontSize:'10px', color:'#d1d5db'}}>Tổng / %</span></th>
                  <th>Lấp đầy ghế<br/><span style={{fontSize:'10px', color:'#d1d5db'}}>%</span></th>
                  {cinemaId && <th>Phòng chiếu<br/><span style={{fontSize:'10px', color:'#d1d5db'}}>% phân bổ</span></th>}
                </tr>
              </thead>
              <tbody>
                {movieStats.map((m) => {
                  const rank = m.rank || 1;
                  const rankColors = ['#f59e0b', '#9ca3af', '#b45309'];
                  const rankLabels = ['🥇', '🥈', '🥉'];
                  const rankBg = rank <= 3 ? rankColors[rank - 1] : 'transparent';
                  const rankLabel = rank <= 3 ? rankLabels[rank - 1] : `#${rank}`;
                  return (
                  <tr key={m.movieId || m.movieTitle}>
                    <td style={{ textAlign: 'center', width: '52px' }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: rank <= 3 ? '32px' : '28px', height: rank <= 3 ? '32px' : '28px',
                        borderRadius: '50%', background: rankBg,
                        fontSize: rank <= 3 ? '1.2rem' : '0.8rem',
                        fontWeight: 700, color: rank <= 3 ? '#fff' : '#9ca3af',
                        boxShadow: rank <= 3 ? `0 0 8px ${rankBg}80` : 'none'
                      }}>{rankLabel}</div>
                    </td>
                    <td>
                      <div className="movie-cell">
                        <img
                          src={m.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=100&auto=format&fit=crop'}
                          alt="poster"
                          className="movie-poster-mock"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=100&auto=format&fit=crop';
                          }}
                        />
                        <div>
                          <span className="movie-title">{m.movieTitle}</span>
                          <span className="movie-date">{m.movieStatus}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="val-with-bar">
                        <span className="val-text">{formatMoney(m.totalRevenue)}</span>
                        <span className="val-sub">{m.revenueContributionPercentage}%</span>
                        <div className="prog-bar-bg"><div className="prog-bar-fill" style={{width: `${m.revenueContributionPercentage}%`, background: '#3b82f6'}}></div></div>
                      </div>
                    </td>
                    <td>
                      <div className="val-with-bar">
                        <span className="val-text">{m.totalTicketsSold} vé</span>
                        <span className="val-sub">{m.revenueContributionPercentage}%</span>
                        <div className="prog-bar-bg"><div className="prog-bar-fill" style={{width: `${m.revenueContributionPercentage}%`, background: '#10b981'}}></div></div>
                      </div>
                    </td>
                    <td>
                      <div className="val-with-bar">
                        <span className="val-text">{m.seatOccupancyPercentage}%</span>
                        <div className="prog-bar-bg"><div className="prog-bar-fill" style={{width: `${Math.min(100, m.seatOccupancyPercentage)}%`, background: '#8b5cf6'}}></div></div>
                      </div>
                    </td>
                    {cinemaId && (
                      <td>
                        <div style={{ fontSize: '0.85rem', color: '#d1d5db', lineHeight: '1.4' }}>
                          {(m.cinemaDistributions || []).map((c, i) => (
                            <div key={i} style={{ display: 'flex', gap: '8px' }}>
                              <span style={{ fontWeight: 600, color: '#f3f4f6' }}>- {c.cinemaName}:</span>
                              <span>{c.percentage}% ({c.ticketsSold} vé)</span>
                            </div>
                          ))}
                          {(!m.cinemaDistributions || m.cinemaDistributions.length === 0) && (
                            <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>Không có dữ liệu</span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* RIGHT: DONUT CHARTS */}
        <div className="donut-charts-container" style={{ flexDirection: activeTab === 'Đồ ăn & Combo' ? 'row' : 'column' }}>
          {/* Chart 1 */}
          {(activeTab === 'Tổng quan' || activeTab === 'Phim') && (
            <div className="donut-card" style={{ flex: activeTab === 'Tổng quan' ? 'none' : 1, width: '100%' }}>
              <h6>Tỷ lệ doanh thu theo phim</h6>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="chart-wrapper" style={{ width: '180px', height: '180px', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={moviePieData} innerRadius={65} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                        {moviePieData.map((entry, index) => <Cell key={`cell-${index}`} fill={MOVIE_COLORS[index % MOVIE_COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip formatter={(val) => formatMoney(val) + 'đ'} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="chart-center-text" style={{ whiteSpace: 'nowrap' }}>
                    <span className="chart-center-val">{formatBillion(chartData?.totalTicketRevenue || 0)}</span>
                    <span className="chart-center-lbl">Doanh thu vé</span>
                  </div>
                </div>
                <div style={{ flex: 1, paddingLeft: '24px' }}>
                  <ul className="custom-legend">
                    {moviePieData.map((m, idx) => (
                      <li key={idx}>
                        <div className="custom-legend-left">
                          <span className="legend-dot" style={{ background: MOVIE_COLORS[idx % MOVIE_COLORS.length] }}></span>
                          {m.name.length > 15 ? m.name.substring(0, 15) + '...' : m.name}
                        </div>
                        <div className="custom-legend-right">{m.percent}%</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Chart 2 */}
          {activeTab === 'Đồ ăn & Combo' && (
            <div className="donut-card" style={{ flex: activeTab === 'Tổng quan' ? 'none' : 1, width: '100%' }}>
              <h6>Tỷ lệ doanh thu đồ ăn</h6>
              {foodPieData.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '180px', color: '#9ca3af', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', padding: '0 20px' }}>
                  Không có giao dịch đồ ăn trong khoảng thời gian đã chọn.
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div className="chart-wrapper" style={{ width: '180px', height: '180px', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={foodPieData} innerRadius={65} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                          {foodPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={FOOD_COLORS[index % FOOD_COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip formatter={(val) => formatMoney(val) + 'đ'} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="chart-center-text" style={{ whiteSpace: 'nowrap' }}>
                      <span className="chart-center-val">{totalFoodRevenueStr}</span>
                      <span className="chart-center-lbl">Tổng đồ ăn</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, paddingLeft: '20px' }}>
                    <ul className="custom-legend">
                      {foodPieData.map((f, idx) => (
                        <li key={idx}>
                          <div className="custom-legend-left">
                            <span className="legend-dot" style={{ background: FOOD_COLORS[idx % FOOD_COLORS.length] }}></span>
                            <span style={{ color: '#e4e4e7', fontWeight: 500 }}>{f.name}</span>
                          </div>
                          <div className="custom-legend-right" style={{ display: 'flex', gap: '12px', textAlign: 'right' }}>
                            <span style={{ color: '#9ca3af' }}>{f.quantity && f.quantity !== "-" ? `${f.quantity} phần` : ""}</span>
                            <span style={{ color: '#9ca3af' }}>{formatMoney(f.value)}đ</span>
                            <span style={{ minWidth: '40px', fontWeight: 'bold' }}>{f.percent}%</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
