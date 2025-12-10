import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'
import '../App.css'

function Rentals() {
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: ''
  })
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    fetchRentals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const fetchRentals = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key])
        }
      })

      const response = await client.get(`/rentals?${params.toString()}`)
      setRentals(response.data.rentals)
      setPagination(response.data.pagination)
      setError(null)
    } catch (err) {
      setError('Failed to load rentals: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      // keep page when changing page; reset to 1 when changing other filters
      if (key === 'page') {
        return { ...prev, [key]: value }
      } else {
        return { ...prev, [key]: value, page: 1 }
      }
    })
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: 'Pending', color: '#ffc107' },
      active: { text: 'Active', color: '#28a745' },
      completed: { text: 'Completed', color: '#6c757d' },
      cancelled: { text: 'Cancelled', color: '#dc3545' }
    }
    const statusInfo = statusMap[status] || { text: status, color: '#6c757d' }
    return (
      <span
        style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '12px',
          fontSize: '0.875rem',
          fontWeight: '500',
          background: statusInfo.color + '20',
          color: statusInfo.color
        }}
      >
        {statusInfo.text}
      </span>
    )
  }

  if (loading && !rentals.length) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}
      >
        <h1>Rentals</h1>
        <Link to="/rentals/new" className="btn btn-primary">
          Create New Rental
        </Link>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="form-group">
          <label className="form-label">Rental Status</label>
          <select
            className="form-select"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={{ maxWidth: '300px' }}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Rental list */}
      {rentals.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#666' }}>
            No rental records found.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-2">
            {rentals.map(rental => (
              <div key={rental.id} className="card">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                  }}
                >
                  <div>
                    <h3 style={{ marginBottom: '0.5rem' }}>
                      Order #{rental.id}
                    </h3>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>
                      {rental.brand} {rental.model}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>
                      License Plate: {rental.license_plate}
                    </div>
                  </div>
                  {getStatusBadge(rental.status)}
                </div>

                <div
                  style={{
                    marginBottom: '1rem',
                    padding: '1rem',
                    background: '#f8f9fa',
                    borderRadius: '6px'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <span style={{ color: '#666' }}>Customer:</span>
                    <strong>{rental.customer_name}</strong>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <span style={{ color: '#666' }}>Phone:</span>
                    <span>{rental.customer_phone}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <span style={{ color: '#666' }}>Rental Dates:</span>
                    <span>
                      {new Date(rental.start_date).toLocaleDateString('en-US')} -{' '}
                      {new Date(rental.end_date).toLocaleDateString('en-US')}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <span style={{ color: '#666' }}>Total Days:</span>
                    <span>{rental.total_days} day(s)</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span style={{ color: '#666' }}>Total Amount:</span>
                    <strong
                      style={{
                        fontSize: '1.25rem',
                        color: '#28a745'
                      }}
                    >
                      ${parseFloat(rental.total_amount).toFixed(2)}
                    </strong>
                  </div>
                </div>

                <Link
                  to={`/rentals/${rental.id}`}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    display: 'block'
                  }}
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '2rem'
              }}
            >
              <button
                className="btn btn-secondary"
                disabled={filters.page === 1}
                onClick={() => handleFilterChange('page', filters.page - 1)}
              >
                Previous
              </button>
              <span
                style={{
                  padding: '0.75rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'white',
                  borderRadius: '6px'
                }}
              >
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={filters.page === pagination.totalPages}
                onClick={() => handleFilterChange('page', filters.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Rentals
