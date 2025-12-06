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
      setError('加载车辆失败: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      // 如果改变的是页码，不重置为1；否则重置为1
      if (key === 'page') {
        return { ...prev, [key]: value }
      } else {
        return { ...prev, [key]: value, page: 1 }
      }
    })
  }

  const handleDeleteCar = async (carId, carName) => {
    if (!window.confirm(`确定要删除车辆 "${carName}" 吗？\n\n注意：\n- 如果该车辆有未完成的租赁订单，将无法删除\n- 如果该车辆有任何租赁历史记录（包括已完成的订单），将无法删除，因为需要保留业务数据`)) {
      return
    }

    try {
      setDeletingCar(carId)
      await client.delete(`/cars/${carId}`)
      alert('车辆删除成功！')
      // 刷新车辆列表
      await fetchCars()
      await fetchBrands()
    } catch (err) {
      alert('删除车辆失败: ' + (err.response?.data?.error || err.message))
    } finally {
      setDeletingCar(null)
    }
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
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.875rem',
        fontWeight: '500',
        background: statusInfo.color + '20',
        color: statusInfo.color
      }}>
        {statusInfo.text}
      </span>
    )
  }

  if (loading && !cars.length) {
    return <div className="loading">加载中...</div>
  }

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>车辆管理</h1>

      {/* 筛选器 */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="grid grid-4">
          <div className="form-group">
            <label className="form-label">搜索</label>
            <input
              type="text"
              className="form-input"
              placeholder="品牌、型号、描述..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">品牌</label>
            <select
              className="form-select"
              value={filters.brand}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
            >
              <option value="">全部</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">状态</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">全部</option>
              <option value="available">可用</option>
              <option value="rented">已租赁</option>
              <option value="maintenance">维护中</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">价格范围</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number"
                className="form-input"
                placeholder="最低"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                type="number"
                className="form-input"
                placeholder="最高"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          </div>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {/* 车辆列表 */}
      {cars.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#666' }}>暂无车辆数据</p>
        </div>
      ) : (
        <>
          <div className="grid grid-3">
            {cars.map(car => (
              <div key={car.id} className="card" style={{ cursor: 'pointer' }}>
                <Link to={`/cars/${car.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ 
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
                  }}>
                    <CarImage
                      src={car.image_url}
                      brand={car.brand}
                      model={car.model}
                      alt={car.brand + ' ' + car.model}
                    />
                  </div>
                  <h3 style={{ marginBottom: '0.5rem' }}>{car.brand} {car.model}</h3>
                  <div style={{ marginBottom: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                    <div>年份: {car.year}</div>
                    <div>颜色: {car.color}</div>
                    <div>车牌: {car.license_plate}</div>
                    <div>座位: {car.seats}座 | {car.fuel_type === 'gasoline' ? '汽油' : car.fuel_type === 'diesel' ? '柴油' : car.fuel_type === 'electric' ? '电动' : '混动'} | {car.transmission === 'automatic' ? '自动' : '手动'}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>
                        ¥{parseFloat(car.daily_rate).toFixed(0)}
                      </span>
                      <span style={{ color: '#666', fontSize: '0.9rem' }}>/天</span>
                    </div>
                    {getStatusBadge(car.status)}
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* 分页 */}
          {pagination && pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
              <button
                className="btn btn-secondary"
                disabled={filters.page === 1}
                onClick={() => handleFilterChange('page', filters.page - 1)}
              >
                上一页
              </button>
              <span style={{ 
                padding: '0.75rem 1.5rem', 
                display: 'flex', 
                alignItems: 'center',
                background: 'white',
                borderRadius: '6px'
              }}>
                第 {pagination.page} 页，共 {pagination.totalPages} 页
              </span>
              <button
                className="btn btn-secondary"
                disabled={filters.page === pagination.totalPages}
                onClick={() => handleFilterChange('page', filters.page + 1)}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Cars

