import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import client from '../api/client'
import CarImage from '../components/CarImage'
import '../App.css'

function CarDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [car, setCar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCar()
  }, [id])

  const fetchCar = async () => {
    try {
      setLoading(true)
      const response = await client.get(`/cars/${id}`)
      setCar(response.data)
      setError(null)
    } catch (err) {
      setError('Failed to load car details: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (error || !car) {
    return (
      <div>
        <div className="error">{error || 'Car not found'}</div>
        <Link to="/cars" className="btn btn-secondary">Back to Cars</Link>
      </div>
    )
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      available: { text: 'Available', color: '#28a745' },
      rented: { text: 'Rented', color: '#ffc107' },
      maintenance: { text: 'Maintenance', color: '#dc3545' }
    }
    const statusInfo = statusMap[status] || { text: status, color: '#6c757d' }
    return (
      <span style={{
        padding: '0.5rem 1rem',
        borderRadius: '6px',
        fontSize: '1rem',
        fontWeight: '500',
        background: statusInfo.color + '20',
        color: statusInfo.color
      }}>
        {statusInfo.text}
      </span>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/cars" className="btn btn-secondary">← Back to Cars</Link>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div style={{
            width: '100%',
            height: '400px',
            background: '#f0f0f0',
            borderRadius: '8px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            position: 'relative'
          }}>
            <CarImage
              src={car.image_url}
              brand={car.brand}
              model={car.model}
              alt={car.brand + ' ' + car.model}
            />
          </div>
        </div>

        <div className="card">
          <h1 style={{ marginBottom: '1rem' }}>{car.brand} {car.model}</h1>
          <div style={{ marginBottom: '1.5rem' }}>
            {getStatusBadge(car.status)}
          </div>

          {/* Price */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#667eea', marginBottom: '0.5rem' }}>
              ${parseFloat(car.daily_rate).toFixed(0)}
              <span style={{ fontSize: '1rem', color: '#666', fontWeight: 'normal' }}>/day</span>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Car Information</h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <CarInfo label="Brand" value={car.brand} />
              <CarInfo label="Model" value={car.model} />
              <CarInfo label="Year" value={car.year} />
              <CarInfo label="Color" value={car.color} />
              <CarInfo label="License Plate" value={car.license_plate} />
              <CarInfo label="Mileage" value={`${car.mileage.toLocaleString()} km`} />
              <CarInfo label="Seats" value={`${car.seats} seats`} />
              <CarInfo label="Fuel Type" value={formatFuel(car.fuel_type)} />
              <CarInfo label="Transmission" value={car.transmission === 'automatic' ? 'Automatic' : 'Manual'} />
            </div>
          </div>

          {car.description && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Description</h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>{car.description}</p>
            </div>
          )}

          {car.status === 'available' && (
            <Link 
              to={`/rentals/new?car_id=${car.id}`} 
              className="btn btn-primary"
              style={{ width: '100%', textAlign: 'center', display: 'block' }}
            >
              Rent Now
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

const CarInfo = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
    <span style={{ color: '#666' }}>{label}</span>
    <strong>{value}</strong>
  </div>
)

const formatFuel = (type) => {
  const map = {
    gasoline: 'Gasoline',
    diesel: 'Diesel',
    electric: 'Electric',
    hybrid: 'Hybrid'
  }
  return map[type] || type
}

export default CarDetail
