import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'
import '../App.css'

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentRentals, setRecentRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load dashboard stats + rentals together
      const [statsRes, rentalsRes] = await Promise.all([
        client.get('/stats/dashboard'),
        client.get('/rentals'),
      ])

      setStats(statsRes.data)

      // rentals API may return an array or { rentals: [...] }
      const rentalsData = Array.isArray(rentalsRes.data)
        ? rentalsRes.data
        : rentalsRes.data?.rentals || []

      setRecentRentals(rentalsData)
    } catch (err) {
      console.error(err)
      setError('Failed to load data: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (v) => `$${Number(v || 0).toFixed(2)}`

  const formatDateShort = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  if (loading) {
    return (
      <div className="page-center">
        <div className="spinner" />
        <div className="loading-text">Loading dashboard data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-center">
        <div className="alert alert-error">
          {error}
          <button className="btn btn-ghost btn-small" onClick={fetchDashboardData}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const { overview, popularBrands } = stats

  // ------ Build "Recent 10 Rentals Single Revenue" line data ------

  // 1. sort rentals by time (old → new)
  const rentalsSorted = [...recentRentals].sort((a, b) => {
    const da = new Date(a.created_at || a.start_date || 0).getTime()
    const db = new Date(b.created_at || b.start_date || 0).getTime()
    return da - db
  })

  // 2. take last 10 rentals
  const last10 = rentalsSorted.slice(-10)

  // 3. map to points: each rental is one point
  const revenuePoints = last10.map((rental, index) => {
    const amount =
      Number(rental.total_amount ?? rental.totalAmount ?? 0) || 0
    const date =
      rental.created_at || rental.start_date || rental.startDate || ''
    return {
      index: index + 1,     // 1..10
      date,
      orderAmount: amount,  // single rental revenue
    }
  })

  // 4. max Y value based on single-order amounts
  const maxRevenueRaw = revenuePoints.length
    ? Math.max(...revenuePoints.map((p) => Number(p.orderAmount) || 0), 0)
    : 0

  // chart scale max: adjust 5000 according to your typical order size
  const maxRevenue = Math.max(maxRevenueRaw, 5000)

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            Insights into cars, customers & rental activity
          </p>
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-ghost" onClick={fetchDashboardData}>
            🔄 Refresh
          </button>
          <Link to="/rentals/new" className="btn btn-primary">
            ➕ Create Rental
          </Link>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-4 stats-grid">
        <div className="stat-card stat-blue">
          <div className="stat-label">Total Cars</div>
          <div className="stat-value">{overview?.totalCars ?? 0}</div>
          <div className="stat-desc">Cars registered in system</div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-label">Available Cars</div>
          <div className="stat-value">{overview?.availableCars ?? 0}</div>
          <div className="stat-desc">Currently available for rental</div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-label">Rented Cars</div>
          <div className="stat-value">{overview?.rentedCars ?? 0}</div>
          <div className="stat-desc">Cars rented or returning soon</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Customers</div>
          <div className="stat-value">{overview?.totalCustomers ?? 0}</div>
          <div className="stat-desc">Registered customers</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Rentals</div>
          <div className="stat-value">{overview?.activeRentals ?? 0}</div>
          <div className="stat-desc">Rentals currently active</div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-label">Monthly Revenue</div>
          <div className="stat-value">
            {formatCurrency(overview?.monthlyRevenue)}
          </div>
          <div className="stat-desc">Revenue in the last 30 days</div>
        </div>
        <div className="stat-card stat-blue">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">
            {formatCurrency(overview?.totalRevenue)}
          </div>
          <div className="stat-desc">Revenue since system launch</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Monthly Rentals</div>
          <div className="stat-value">{overview?.monthlyRentals ?? 0}</div>
          <div className="stat-desc">Orders placed this month</div>
        </div>
      </div>

      {/* Popular Brands + Recent 10 Rentals Revenue */}
      <div className="grid grid-2 dashboard-main">
        {/* Top Brands */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Top Brands</h2>
            <span className="card-subtitle">By rental frequency</span>
          </div>
          {popularBrands?.length > 0 ? (
            <ul className="brand-list">
              {popularBrands.map((brand, index) => (
                <li key={index} className="brand-item">
                  <div className="brand-left">
                    <span className="brand-rank">{index + 1}</span>
                    <span className="brand-name">{brand.brand}</span>
                  </div>
                  <span className="brand-count">
                    {brand.rental_count} rentals
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-text">
              No brand data yet. Create rentals to generate insights.
            </p>
          )}
        </div>

        {/* Recent 10 Rentals - Single Order Revenue Line Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent 10 Rentals Revenue</h2>
            <span className="card-subtitle">
              Single order revenue (old → new)
            </span>
          </div>
          {revenuePoints.length > 0 ? (
            <div className="revenue-chart">
              <svg
                viewBox="0 0 320 160"
                preserveAspectRatio="none"
                className="revenue-chart-svg"
              >
                {/* horizontal grid lines */}
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

                {/* line path (single order amount) */}
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
                        const t =
                          count === 1 ? 0.5 : idx / (count - 1) // center if single point
                        const x = left + t * width
                        const y = bottom - (value / max) * height
                        return `${x},${y}`
                      })
                      .join(' ')
                  })()}
                />

                {/* dots */}
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

              {/* x-axis labels: order index + date + amount of that order */}
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
      </div>

      {/* Quick Actions */}
      <div className="card quick-actions">
        <div className="card-header">
          <h2 className="card-title">Quick Actions</h2>
          <span className="card-subtitle">Frequently used features</span>
        </div>
        <div className="quick-actions-grid">
          <Link to="/cars" className="btn btn-primary btn-block">
            View Cars
          </Link>
          <Link to="/customers" className="btn btn-secondary btn-block">
            Manage Customers
          </Link>
          <Link to="/rentals" className="btn btn-secondary btn-block">
            View Rentals
          </Link>
          <Link to="/stats" className="btn btn-secondary btn-block">
            Analytics
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
