import React, { useState, useEffect } from 'react'
import client from '../api/client'
import '../App.css'

function Stats() {
  const [dashboardStats, setDashboardStats] = useState(null)
  const [recentRentals, setRecentRentals] = useState([])
  const [utilization, setUtilization] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true)
        setError(null)

        // 和 Dashboard 一样：同时拿 dashboard stats + rentals
        const [statsRes, rentalsRes, utilRes] = await Promise.all([
          client.get('/stats/dashboard'),
          client.get('/rentals'),
          client.get('/stats/car-utilization'),
        ])

        setDashboardStats(statsRes.data)

        // /rentals 返回可能是数组或 { rentals: [...] }
        const rentalsData = Array.isArray(rentalsRes.data)
          ? rentalsRes.data
          : rentalsRes.data?.rentals || []

        setRecentRentals(rentalsData)
        setUtilization(utilRes.data || [])
      } catch (err) {
        console.error(err)
        setError(
          'Failed to load statistics: ' +
            (err.response?.data?.error || err.message)
        )
      } finally {
        setLoading(false)
      }
    }

    loadAll()
  }, [])

  const formatCurrency = (v) => `$${Number(v || 0).toFixed(2)}`

  const formatDateShort = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  // ========== 最近 10 场交易折线图（完全照抄 Dashboard 的逻辑） ==========

  // 1. 按时间老 → 新排序
  const rentalsSorted = [...recentRentals].sort((a, b) => {
    const da = new Date(a.created_at || a.start_date || 0).getTime()
    const db = new Date(b.created_at || b.start_date || 0).getTime()
    return da - db
  })

  // 2. 取最后 10 条
  const last10 = rentalsSorted.slice(-10)

  // 3. 映射成坐标点
  const revenuePoints = last10.map((rental, index) => {
    const amount =
      Number(rental.total_amount ?? rental.totalAmount ?? 0) || 0
    const date =
      rental.created_at || rental.start_date || rental.startDate || ''
    return {
      index: index + 1, // 1..10
      date,
      orderAmount: amount,
    }
  })

  // 4. 纵轴最大值
  const maxRevenueRaw = revenuePoints.length
    ? Math.max(...revenuePoints.map((p) => Number(p.orderAmount) || 0), 0)
    : 0

  const maxRevenue = Math.max(maxRevenueRaw, 5000)

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Statistics Dashboard</h1>

      {/* Recent 10 Rentals Revenue – 和 Dashboard 的图完全同源（最近 10 条 rentals） */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">Recent 10 Rentals Revenue</h2>
            <p className="card-subtitle">
              Single order revenue (old → new), same as dashboard chart
            </p>
          </div>
        </div>

        {revenuePoints.length > 0 ? (
          <div className="revenue-chart">
            <svg
              viewBox="0 0 320 160"
              preserveAspectRatio="none"
              className="revenue-chart-svg"
            >
              {/* grid lines */}
              <line
                x1="24"
                y1="130"
                x2="304"
                y2="130"
                className="revenue-grid-line"
              />
              <line
                x1="24"
                y1="90"
                x2="304"
                y2="90"
                className="revenue-grid-line"
              />
              <line
                x1="24"
                y1="50"
                x2="304"
                y2="50"
                className="revenue-grid-line"
              />

              {/* 折线，逻辑和 Dashboard 一模一样 */}
              <polyline
                className="revenue-line"
                fill="none"
                points={(() => {
                  const count = revenuePoints.length
                  const max = maxRevenue || 1
                  const left = 24
                  const right = 304
                  const top = 20
                  const bottom = 130
                  const width = right - left
                  const height = bottom - top

                  return revenuePoints
                    .map((p, idx) => {
                      const value = Number(p.orderAmount) || 0
                      const t = count === 1 ? 0.5 : idx / (count - 1)
                      const x = left + t * width
                      const y = bottom - (value / max) * height
                      return `${x},${y}`
                    })
                    .join(' ')
                })()}
              />

              {/* 点 */}
              {revenuePoints.map((p, idx) => {
                const count = revenuePoints.length
                const max = maxRevenue || 1
                const left = 24
                const right = 304
                const top = 20
                const bottom = 130
                const width = right - left
                const height = bottom - top

                const value = Number(p.orderAmount) || 0
                const t = count === 1 ? 0.5 : idx / (count - 1)
                const x = left + t * width
                const y = bottom - (value / max) * height

                return (
                  <g key={idx}>
                    <circle className="revenue-dot-shadow" cx={x} cy={y} r="5" />
                    <circle className="revenue-dot" cx={x} cy={y} r="4" />
                  </g>
                )
              })}
            </svg>

            {/* 底部标签：#序号 + 日期 + 单笔金额 */}
            <div className="revenue-chart-footer">
              {revenuePoints.map((p) => (
                <div key={p.index} className="revenue-chart-tick">
                  <span className="revenue-date">
                    #{p.index} {formatDateShort(p.date)}
                  </span>
                  <span className="revenue-amount">
                    {formatCurrency(p.orderAmount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="empty-text">
            No rentals yet. Create some rentals to see the trend.
          </p>
        )}
      </div>

      {/* Car Utilization Statistics（保持原来逻辑不变） */}
      <div className="card">
        <h2 className="card-title">Car Utilization Statistics</h2>
        {utilization.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Car</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>
                    License Plate
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>
                    Rentals
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>
                    Total Rental Days
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>
                    Total Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {utilization.map((car) => (
                  <tr key={car.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '1rem' }}>
                      <strong>
                        {car.brand} {car.model}
                      </strong>
                    </td>
                    <td style={{ padding: '1rem' }}>{car.license_plate}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      {car.rental_count || 0}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      {car.total_rental_days || 0} days
                    </td>
                    <td
                      style={{
                        padding: '1rem',
                        textAlign: 'right',
                        color: '#28a745',
                        fontWeight: 'bold',
                      }}
                    >
                      {formatCurrency(car.total_revenue || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#666' }}>No data available</p>
        )}
      </div>
    </div>
  )
}

export default Stats
