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
        setError('所选车辆当前不可用')
      }
    } catch (err) {
      setError('加载车辆信息失败')
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
      setError('请填写所有必填字段')
      return
    }

    try {
      setLoading(true)
      const response = await client.post('/rentals', formData)
      alert('订单创建成功！')
      navigate(`/rentals/${response.data.id}`)
    } catch (err) {
      setError('创建订单失败: ' + (err.response?.data?.error || err.message))
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
      <h1 style={{ marginBottom: '2rem' }}>创建租赁订单</h1>

      <div className="card" style={{ maxWidth: '800px' }}>
        <form onSubmit={handleSubmit}>
          {error && <div className="error">{error}</div>}

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label">客户 *</label>
              <Link 
                to="/customers" 
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', textDecoration: 'none' }}
              >
                + 添加新客户
              </Link>
            </div>
            <select
              className="form-select"
              name="customer_id"
              value={formData.customer_id}
              onChange={handleChange}
              required
            >
              <option value="">请选择客户</option>
              {customers.map(customer => (
                <option key={customer.id} value={String(customer.id)}>
                  {customer.name} - {customer.phone} - {customer.email}
                </option>
              ))}
            </select>
            {customers.length === 0 && (
              <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.875rem' }}>
                暂无客户，请先到 <Link to="/customers" style={{ color: '#667eea' }}>客户管理</Link> 页面添加客户
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">车辆 *</label>
            <select
              className="form-select"
              name="car_id"
              value={formData.car_id}
              onChange={handleChange}
              required
            >
              <option value="">请选择车辆</option>
              {cars.map(car => (
                <option key={car.id} value={car.id}>
                  {car.brand} {car.model} - {car.license_plate} - ¥{parseFloat(car.daily_rate).toFixed(0)}/天
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">开始日期 *</label>
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
              <label className="form-label">结束日期 *</label>
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

          <div className="form-group">
            <label className="form-label">取车地点</label>
            <input
              type="text"
              className="form-input"
              name="pickup_location"
              value={formData.pickup_location}
              onChange={handleChange}
              placeholder="例如：门店地址"
            />
          </div>

          <div className="form-group">
            <label className="form-label">还车地点</label>
            <input
              type="text"
              className="form-input"
              name="return_location"
              value={formData.return_location}
              onChange={handleChange}
              placeholder="例如：门店地址"
            />
          </div>

          <div className="form-group">
            <label className="form-label">备注</label>
            <textarea
              className="form-textarea"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="其他说明..."
            />
          </div>

          {calculation && (
            <div style={{
              padding: '1.5rem',
              background: '#f8f9fa',
              borderRadius: '6px',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ marginBottom: '1rem' }}>费用计算</h3>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>日租金:</span>
                  <strong>¥{parseFloat(calculation.daily_rate).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>租赁天数:</span>
                  <strong>{calculation.days} 天</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '2px solid #ddd' }}>
                  <span>总金额:</span>
                  <strong style={{ color: '#28a745' }}>¥{parseFloat(calculation.total).toFixed(2)}</strong>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '创建中...' : '创建订单'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/rentals')}
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateRental

