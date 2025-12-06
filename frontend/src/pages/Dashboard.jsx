import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'
import '../App.css'

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await client.get('/stats/dashboard')
      setStats(response.data)
      setError(null)
    } catch (err) {
      setError('加载数据失败: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  if (!stats) {
    return null
  }

  const { overview, popularBrands, revenueTrend } = stats

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>仪表板</h1>
        <Link to="/rentals/new" className="btn btn-primary">创建新订单</Link>
      </div>

      {/* 概览统计 */}
      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-label">总车辆数</div>
          <div className="stat-value">{overview.totalCars}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">可用车辆</div>
          <div className="stat-value" style={{ color: '#28a745' }}>{overview.availableCars}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">已租赁</div>
          <div className="stat-value" style={{ color: '#ffc107' }}>{overview.rentedCars}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">总客户数</div>
          <div className="stat-value">{overview.totalCustomers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">活跃订单</div>
          <div className="stat-value">{overview.activeRentals}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">本月收入</div>
          <div className="stat-value" style={{ color: '#28a745' }}>¥{overview.monthlyRevenue.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">总收入</div>
          <div className="stat-value" style={{ color: '#28a745' }}>¥{overview.totalRevenue.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">本月订单</div>
          <div className="stat-value">{overview.monthlyRentals}</div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* 热门品牌 */}
        <div className="card">
          <h2 className="card-title">热门品牌</h2>
          {popularBrands.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {popularBrands.map((brand, index) => (
                <li key={index} style={{ 
                  padding: '0.75rem', 
                  marginBottom: '0.5rem', 
                  background: '#f8f9fa', 
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>{brand.brand}</span>
                  <strong>{brand.rental_count} 次租赁</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#666' }}>暂无数据</p>
          )}
        </div>

        {/* 收入趋势 */}
        <div className="card">
          <h2 className="card-title">最近7天收入趋势</h2>
          {revenueTrend.length > 0 ? (
            <div>
              {revenueTrend.map((item, index) => (
                <div key={index} style={{ 
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  background: '#f8f9fa',
                  borderRadius: '4px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>{item.date}</span>
                    <strong style={{ color: '#28a745' }}>¥{parseFloat(item.revenue).toFixed(2)}</strong>
                  </div>
                  <div style={{ 
                    height: '8px', 
                    background: '#e9ecef', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      height: '100%', 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      width: `${(parseFloat(item.revenue) / Math.max(...revenueTrend.map(r => parseFloat(r.revenue)))) * 100}%`
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666' }}>暂无数据</p>
          )}
        </div>
      </div>

      {/* 快速操作 */}
      <div className="card">
        <h2 className="card-title">快速操作</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/cars" className="btn btn-primary">浏览车辆</Link>
          <Link to="/customers" className="btn btn-secondary">管理客户</Link>
          <Link to="/rentals" className="btn btn-secondary">查看订单</Link>
          <Link to="/stats" className="btn btn-secondary">统计分析</Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

