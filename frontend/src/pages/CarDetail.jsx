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
      setError('加载车辆详情失败: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  if (error || !car) {
    return (
      <div>
        <div className="error">{error || '车辆不存在'}</div>
        <Link to="/cars" className="btn btn-secondary">返回车辆列表</Link>
      </div>
    )
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      available: { text: '可用', color: '#28a745' },
      rented: { text: '已租赁', color: '#ffc107' },
      maintenance: { text: '维护中', color: '#dc3545' }
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
        <Link to="/cars" className="btn btn-secondary">← 返回车辆列表</Link>
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

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#667eea', marginBottom: '0.5rem' }}>
              ¥{parseFloat(car.daily_rate).toFixed(0)}
              <span style={{ fontSize: '1rem', color: '#666', fontWeight: 'normal' }}>/天</span>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>车辆信息</h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>品牌</span>
                <strong>{car.brand}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>型号</span>
                <strong>{car.model}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>年份</span>
                <strong>{car.year}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>颜色</span>
                <strong>{car.color}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>车牌号</span>
                <strong>{car.license_plate}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>里程数</span>
                <strong>{car.mileage.toLocaleString()} 公里</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>座位数</span>
                <strong>{car.seats} 座</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>燃料类型</span>
                <strong>
                  {car.fuel_type === 'gasoline' ? '汽油' : 
                   car.fuel_type === 'diesel' ? '柴油' : 
                   car.fuel_type === 'electric' ? '电动' : '混动'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>变速箱</span>
                <strong>{car.transmission === 'automatic' ? '自动' : '手动'}</strong>
              </div>
            </div>
          </div>

          {car.description && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>描述</h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>{car.description}</p>
            </div>
          )}

          {car.status === 'available' && (
            <Link 
              to={`/rentals/new?car_id=${car.id}`} 
              className="btn btn-primary"
              style={{ width: '100%', textAlign: 'center', display: 'block' }}
            >
              立即租赁
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default CarDetail

