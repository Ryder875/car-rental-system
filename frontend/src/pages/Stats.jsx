import React, { useState, useEffect } from 'react'
import client from '../api/client'
import '../App.css'

function Stats() {
  const [dashboardStats, setDashboardStats] = useState(null)
  const [revenueStats, setRevenueStats] = useState([])
  const [utilization, setUtilization] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    fetchDashboardStats()
    fetchRevenueStats()
    fetchUtilization()
  }, [period])

  const fetchDashboardStats = async () => {
    try {
      const response = await client.get('/stats/dashboard')
      setDashboardStats(response.data)
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err)
    }
  }

  const fetchRevenueStats = async () => {
    try {
      const response = await client.get(`/stats/revenue?period=${period}`)
      setRevenueStats(response.data)
    } catch (err) {
      console.error('Failed to fetch revenue stats:', err)
    }
  }

  const fetchUtilization = async () => {
    try {
      const response = await client.get('/stats/car-utilization')
      setUtilization(response.data)
      setLoading(false)
    } catch (err) {
      setError('加载统计数据失败: ' + (err.response?.data?.error || err.message))
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  const maxRevenue = revenueStats.length > 0 ? Math.max(...revenueStats.map(r => parseFloat(r.revenue))) : 0

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>统计分析</h1>

      {/* 收入统计 */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="card-title">收入统计</h2>
          <select
            className="form-select"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{ maxWidth: '200px' }}
          >
            <option value="day">按天</option>
            <option value="week">按周</option>
            <option value="month">按月</option>
            <option value="year">按年</option>
          </select>
        </div>
        {revenueStats.length > 0 ? (
          <div>
            {revenueStats.map((stat, index) => (
              <div key={index} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>{stat.period}</span>
                  <strong style={{ color: '#28a745' }}>
                    ¥{parseFloat(stat.revenue).toFixed(2)} ({stat.transaction_count} 笔交易)
                  </strong>
                </div>
                <div style={{ 
                  height: '12px', 
                  background: '#e9ecef', 
                  borderRadius: '6px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    height: '100%', 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    width: `${maxRevenue > 0 ? (parseFloat(stat.revenue) / maxRevenue) * 100 : 0}%`,
                    transition: 'width 0.3s'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#666' }}>暂无数据</p>
        )}
      </div>

      {/* 车辆利用率 */}
      <div className="card">
        <h2 className="card-title">车辆利用率统计</h2>
        {utilization.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>车辆</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>车牌号</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>租赁次数</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>总租赁天数</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>总收入</th>
                </tr>
              </thead>
              <tbody>
                {utilization.map(car => (
                  <tr key={car.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '1rem' }}>
                      <strong>{car.brand} {car.model}</strong>
                    </td>
                    <td style={{ padding: '1rem' }}>{car.license_plate}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>{car.rental_count || 0}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>{car.total_rental_days || 0} 天</td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#28a745', fontWeight: 'bold' }}>
                      ¥{parseFloat(car.total_revenue || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#666' }}>暂无数据</p>
        )}
      </div>
    </div>
  )
}

export default Stats

