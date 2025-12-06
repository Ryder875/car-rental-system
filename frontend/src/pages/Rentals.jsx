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
      setError('加载订单失败: ' + (err.response?.data?.error || err.message))
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

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: '待确认', color: '#ffc107' },
      active: { text: '进行中', color: '#28a745' },
      completed: { text: '已完成', color: '#6c757d' },
      cancelled: { text: '已取消', color: '#dc3545' }
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

  if (loading && !rentals.length) {
    return <div className="loading">加载中...</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>租赁订单</h1>
        <Link to="/rentals/new" className="btn btn-primary">创建新订单</Link>
      </div>

      {/* 筛选器 */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="form-group">
          <label className="form-label">订单状态</label>
          <select
            className="form-select"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={{ maxWidth: '300px' }}
          >
            <option value="">全部</option>
            <option value="pending">待确认</option>
            <option value="active">进行中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {/* 订单列表 */}
      {rentals.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#666' }}>暂无订单数据</p>
        </div>
      ) : (
        <>
          <div className="grid grid-2">
            {rentals.map(rental => (
              <div key={rental.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ marginBottom: '0.5rem' }}>订单 #{rental.id}</h3>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>
                      {rental.brand} {rental.model}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>
                      车牌: {rental.license_plate}
                    </div>
                  </div>
                  {getStatusBadge(rental.status)}
                </div>

                <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#666' }}>客户:</span>
                    <strong>{rental.customer_name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#666' }}>联系电话:</span>
                    <span>{rental.customer_phone}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#666' }}>租赁日期:</span>
                    <span>{new Date(rental.start_date).toLocaleDateString('zh-CN')} - {new Date(rental.end_date).toLocaleDateString('zh-CN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#666' }}>租赁天数:</span>
                    <span>{rental.total_days} 天</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>总金额:</span>
                    <strong style={{ fontSize: '1.25rem', color: '#28a745' }}>¥{parseFloat(rental.total_amount).toFixed(2)}</strong>
                  </div>
                </div>

                <Link to={`/rentals/${rental.id}`} className="btn btn-secondary" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                  查看详情
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

export default Rentals

