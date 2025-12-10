import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'
import CarImage from '../components/CarImage'
import '../App.css'

function Cars() {
  const [cars, setCars] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingCar, setDeletingCar] = useState(null)
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    status: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    search: ''
  })
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    fetchBrands()
    fetchCars()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const fetchBrands = async () => {
    try {
      const response = await client.get('/cars/meta/brands')
      setBrands(response.data)
    } catch (err) {
      console.error('Failed to fetch brands:', err)
    }
  }

  const fetchCars = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key])
        }
      })

      const response = await client.get(`/cars?${params.toString()}`)
      setCars(response.data.cars)
      setPagination(response.data.pagination)
      setError(null)
    } catch (err) {
      setError('Failed to load cars: ' + (err.response?.data?.error || err.message))
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

  const handleDeleteCar = async (carId, carName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete car "${carName}"?\n\nNote:\n- If this car has any active rentals, it cannot be deleted.\n- If this car has any rental history (including completed rentals), it cannot be deleted in order to preserve business data.`
      )
    ) {
      return
    }

    try {
      setDeletingCar(carId)
      await client.delete(`/cars/${carId}`)
      alert('Car deleted successfully.')
      await fetchCars()
      await fetchBrands()
    } catch (err) {
      alert('Failed to delete car: ' + (err.response?.data?.error || err.message))
    } finally {
      setDeletingCar(null)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      available: { text: 'Available', color: '#28a745' },
      rented: { text: 'Rented', color: '#ffc107' },
      maintenance: { text: 'Maintenance', color: '#dc3545' }
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

  if (loading && !cars.length) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Car Management</h1>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="grid grid-4">
          <div className="form-group">
            <label className="form-label">Search</label>
            <input
              type="text"
              className="form-input"
              placeholder="Brand, model, description..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Brand</label>
            <select
              className="form-select"
              value={filters.brand}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
            >
              <option value="">All</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All</option>
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Price Range</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number"
                className="form-input"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                type="number"
                className="form-input"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          </div>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Car list */}
      {cars.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#666' }}>
            No cars found. Try adjusting the filters or add a new car.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-3">
            {cars.map(car => (
              <div key={car.id} className="card">
                <Link
                  to={`/cars/${car.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '200px',
                      background: '#f0f0f0',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                  >
                    <CarImage
                      src={car.image_url}
                      brand={car.brand}
                      model={car.model}
                      alt={car.brand + ' ' + car.model}
                    />
                  </div>
                  <h3 style={{ marginBottom: '0.5rem' }}>
                    {car.brand} {car.model}
                  </h3>
                  <div
                    style={{
                      marginBottom: '0.5rem',
                      color: '#666',
                      fontSize: '0.9rem'
                    }}
                  >
                    <div>Year: {car.year}</div>
                    <div>Color: {car.color}</div>
                    <div>License: {car.license_plate}</div>
                    <div>
                      Seats: {car.seats} |{' '}
                      {car.fuel_type === 'gasoline'
                        ? 'Gasoline'
                        : car.fuel_type === 'diesel'
                        ? 'Diesel'
                        : car.fuel_type === 'electric'
                        ? 'Electric'
                        : 'Hybrid'}{' '}
                      | {car.transmission === 'automatic' ? 'Automatic' : 'Manual'}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '1rem'
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: '1.5rem',
                          fontWeight: 'bold',
                          color: '#667eea'
                        }}
                      >
                        ${parseFloat(car.daily_rate).toFixed(0)}
                      </span>
                      <span style={{ color: '#666', fontSize: '0.9rem' }}>/day</span>
                    </div>
                    {getStatusBadge(car.status)}
                  </div>
                </Link>

                {/* Optional: delete button, if you want it visible in list
                <button
                  className="btn btn-secondary"
                  style={{ marginTop: '0.75rem', width: '100%' }}
                  disabled={deletingCar === car.id}
                  onClick={() => handleDeleteCar(car.id, `${car.brand} ${car.model}`)}
                >
                  {deletingCar === car.id ? 'Deleting...' : 'Delete'}
                </button> */}
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

export default Cars
