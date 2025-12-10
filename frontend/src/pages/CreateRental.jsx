import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import client from '../api/client'
import '../App.css'

function CreateRental() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const carIdFromUrl = searchParams.get('car_id')

  const [cars, setCars] = useState([])
  const [customers, setCustomers] = useState([])
  const [formData, setFormData] = useState({
    customer_id: '',
    car_id: carIdFromUrl || '',
    start_date: '',
    end_date: '',
    pickup_location: '',
    return_location: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [calculation, setCalculation] = useState(null)

  useEffect(() => {
    fetchCars()
    fetchCustomers()
    if (carIdFromUrl) {
      fetchCarDetails(carIdFromUrl)
    }
  }, [carIdFromUrl])

  useEffect(() => {
    if (formData.car_id && formData.start_date && formData.end_date) {
      calculateRental()
    } else {
      setCalculation(null)
    }
  }, [formData.car_id, formData.start_date, formData.end_date])

  const fetchCars = async () => {
    try {
      const response = await client.get('/cars?status=available&limit=100')
      setCars(response.data.cars)
    } catch (err) {
      console.error('Failed to fetch cars:', err)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await client.get('/customers?limit=1000')
      const customersList = response.data?.customers || response.data || []
      setCustomers(Array.isArray(customersList) ? customersList : [])
    } catch (err) {
      console.error('Failed to fetch customers:', err)
      setCustomers([])
    }
  }

  const fetchCarDetails = async (carId) => {
    try {
      const response = await client.get(`/cars/${carId}`)
      if (response.data.status !== 'available') {
        setError('Selected car is currently not available.')
      }
    } catch (err) {
      setError('Failed to load car information.')
    }
  }

  const calculateRental = async () => {
    try {
      const start = new Date(formData.start_date)
      const end = new Date(formData.end_date)
      if (end <= start) {
        setCalculation(null)
        return
      }

      const car = cars.find(c => c.id === parseInt(formData.car_id))
      if (!car) {
        setCalculation(null)
        return
      }

      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
      const total = car.daily_rate * days

      setCalculation({
        days,
        daily_rate: car.daily_rate,
        total
      })
    } catch (err) {
      setCalculation(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!formData.customer_id || !formData.car_id || !formData.start_date || !formData.end_date) {
      setError('Please fill in all required fields.')
      return
    }

    try {
      setLoading(true)
      const response = await client.post('/rentals', formData)
      alert('Rental created successfully!')
      navigate(`/rentals/${response.data.id}`)
    } catch (err) {
      setError('Failed to create rental: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Create Rental</h1>

      <div className="card" style={{ maxWidth: '800px' }}>
        <form onSubmit={handleSubmit}>
          {error && <div className="error">{error}</div>}

          {/* Customer */}
          <div className="form-group">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}
            >
              <label className="form-label">Customer *</label>
              <Link
                to="/customers"
                className="btn btn-secondary"
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  textDecoration: 'none'
                }}
              >
                + Add New Customer
              </Link>
            </div>
            <select
              className="form-select"
              name="customer_id"
              value={formData.customer_id}
              onChange={handleChange}
              required
            >
              <option value="">Select a customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={String(customer.id)}>
                  {customer.name} - {customer.phone} - {customer.email}
                </option>
              ))}
            </select>
            {customers.length === 0 && (
              <p
                style={{
                  marginTop: '0.5rem',
                  color: '#666',
                  fontSize: '0.875rem'
                }}
              >
                No customers yet. Please go to{' '}
                <Link to="/customers" style={{ color: '#667eea' }}>
                  Customers
                </Link>{' '}
                page to add one.
              </p>
            )}
          </div>

          {/* Car */}
          <div className="form-group">
            <label className="form-label">Car *</label>
            <select
              className="form-select"
              name="car_id"
              value={formData.car_id}
              onChange={handleChange}
              required
            >
              <option value="">Select a car</option>
              {cars.map(car => (
                <option key={car.id} value={car.id}>
                  {car.brand} {car.model} - {car.license_plate} - $
                  {parseFloat(car.daily_rate).toFixed(0)}/day
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                className="form-input"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input
                type="date"
                className="form-input"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                required
                min={formData.start_date || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Locations */}
          <div className="form-group">
            <label className="form-label">Pickup Location</label>
            <input
              type="text"
              className="form-input"
              name="pickup_location"
              value={formData.pickup_location}
              onChange={handleChange}
              placeholder="e.g. store address"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Return Location</label>
            <input
              type="text"
              className="form-input"
              name="return_location"
              value={formData.return_location}
              onChange={handleChange}
              placeholder="e.g. store address"
            />
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional information..."
            />
          </div>

          {/* Price Calculation */}
          {calculation && (
            <div
              style={{
                padding: '1.5rem',
                background: '#f8f9fa',
                borderRadius: '6px',
                marginBottom: '1.5rem'
              }}
            >
              <h3 style={{ marginBottom: '1rem' }}>Price Calculation</h3>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>Daily Rate:</span>
                  <strong>
                    ${parseFloat(calculation.daily_rate).toFixed(2)}
                  </strong>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>Rental Days:</span>
                  <strong>{calculation.days} day(s)</strong>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1.25rem',
                    marginTop: '0.5rem',
                    paddingTop: '0.5rem',
                    borderTop: '2px solid #ddd'
                  }}
                >
                  <span>Total Amount:</span>
                  <strong style={{ color: '#28a745' }}>
                    ${parseFloat(calculation.total).toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Rental'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/rentals')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateRental
