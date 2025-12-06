import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import client from '../api/client'
import CarImage from '../components/CarImage'
import '../App.css'

function RentalDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rental, setRental] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchRental()
    fetchPayments()
  }, [id])

  const fetchRental = async () => {
    try {
      setLoading(true)
      const response = await client.get(`/rentals/${id}`)
      setRental(response.data)
      setError(null)
    } catch (err) {
      setError('加载订单详情失败: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const fetchPayments = async () => {
    try {
      const response = await client.get(`/payments/rental/${id}`)
      setPayments(response.data)
    } catch (err) {
      console.error('Failed to fetch payments:', err)
    }
  }

  const handleStatusUpdate = async (newStatus) => {
    // 如果要完成订单，检查支付状态
    if (newStatus === 'completed') {
      const totalPaid = payments
        .filter(p => p.payment_status === 'completed')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
      const totalAmount = parseFloat(rental?.total_amount || 0)

      if (totalPaid < totalAmount) {
        alert(`无法完成订单！\n\n订单总金额: ¥${totalAmount.toFixed(2)}\n已支付金额: ¥${totalPaid.toFixed(2)}\n还需支付: ¥${(totalAmount - totalPaid).toFixed(2)}\n\n请先完成支付。`)
        return
      }
    }

    const statusText = {
      'active': '进行中',
      'completed': '已完成',
      'cancelled': '已取消',
      'pending': '待确认'
    }[newStatus] || newStatus

    if (!window.confirm(`确定要将订单状态更新为"${statusText}"吗？`)) {
      return
    }

    try {
      setUpdating(true)
      await client.patch(`/rentals/${id}/status`, { status: newStatus })
      await fetchRental()
      alert('订单状态更新成功')
    } catch (err) {
      alert('更新失败: ' + (err.response?.data?.error || err.message))
    } finally {
      setUpdating(false)
    }
  }

  const handleCreatePayment = async () => {
    const amount = prompt('请输入支付金额:', rental?.total_amount)
    if (!amount) return

    const paymentMethod = prompt('请输入支付方式 (cash/credit_card/debit_card/online):', 'cash')
    if (!paymentMethod) return

    try {
      await client.post('/payments', {
        rental_id: id,
        amount: parseFloat(amount),
        payment_method: paymentMethod
      })
      await fetchPayments()
      await fetchRental()
      alert('支付记录创建成功')
    } catch (err) {
      alert('创建支付记录失败: ' + (err.response?.data?.error || err.message))
    }
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  if (error || !rental) {
    return (
      <div>
        <div className="error">{error || '订单不存在'}</div>
        <Link to="/rentals" className="btn btn-secondary">返回订单列表</Link>
      </div>
    )
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
        <Link to="/rentals" className="btn btn-secondary">← 返回订单列表</Link>
      </div>

      <div className="grid grid-2">
        {/* 订单信息 */}
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>订单信息</h2>
          <div style={{ marginBottom: '1.5rem' }}>
            {getStatusBadge(rental.status)}
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>订单详情</h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>订单号</span>
                <strong>#{rental.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>创建时间</span>
                <span>{new Date(rental.created_at).toLocaleString('zh-CN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>开始日期</span>
                <strong>{new Date(rental.start_date).toLocaleDateString('zh-CN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>结束日期</span>
                <strong>{new Date(rental.end_date).toLocaleDateString('zh-CN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>租赁天数</span>
                <strong>{rental.total_days} 天</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>日租金</span>
                <strong>¥{parseFloat(rental.daily_rate).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>总金额</span>
                <strong style={{ fontSize: '1.25rem', color: '#28a745' }}>¥{parseFloat(rental.total_amount).toFixed(2)}</strong>
              </div>
              {(() => {
                const totalPaid = payments
                  .filter(p => p.payment_status === 'completed')
                  .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
                const totalAmount = parseFloat(rental.total_amount)
                const remaining = totalAmount - totalPaid
                return (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '0.75rem 0', 
                    borderTop: '2px solid #eee',
                    marginTop: '0.5rem'
                  }}>
                    <span style={{ color: '#666', fontWeight: 'bold' }}>已支付</span>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '1.1rem', color: totalPaid >= totalAmount ? '#28a745' : '#ffc107' }}>
                        ¥{totalPaid.toFixed(2)}
                      </strong>
                      {remaining > 0 && (
                        <div style={{ fontSize: '0.875rem', color: '#dc3545', marginTop: '0.25rem' }}>
                          还需支付: ¥{remaining.toFixed(2)}
                        </div>
                      )}
                      {totalPaid >= totalAmount && (
                        <div style={{ fontSize: '0.875rem', color: '#28a745', marginTop: '0.25rem' }}>
                          ✓ 支付完成
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

          {rental.pickup_location && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>取车地点:</strong> {rental.pickup_location}
            </div>
          )}
          {rental.return_location && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>还车地点:</strong> {rental.return_location}
            </div>
          )}
          {rental.notes && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>备注:</strong> {rental.notes}
            </div>
          )}

          {/* 状态更新按钮 */}
          <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {rental.status === 'pending' && (
              <button
                className="btn btn-success"
                onClick={() => handleStatusUpdate('active')}
                disabled={updating}
              >
                确认订单
              </button>
            )}
            {rental.status === 'active' && (() => {
              const totalPaid = payments
                .filter(p => p.payment_status === 'completed')
                .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
              const totalAmount = parseFloat(rental.total_amount)
              const canComplete = totalPaid >= totalAmount
              
              return (
                <button
                  className="btn btn-success"
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={updating || !canComplete}
                  title={!canComplete ? `需要先完成支付。已支付: ¥${totalPaid.toFixed(2)} / 总金额: ¥${totalAmount.toFixed(2)}` : ''}
                  style={!canComplete ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                >
                  完成订单 {!canComplete && `(需支付 ¥${(totalAmount - totalPaid).toFixed(2)})`}
                </button>
              )
            })()}
            {(rental.status === 'pending' || rental.status === 'active') && (
              <button
                className="btn btn-danger"
                onClick={() => handleStatusUpdate('cancelled')}
                disabled={updating}
              >
                取消订单
              </button>
            )}
          </div>
        </div>

        {/* 客户和车辆信息 */}
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>客户信息</h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div><strong>姓名:</strong> {rental.customer_name}</div>
              <div><strong>邮箱:</strong> {rental.customer_email}</div>
              <div><strong>电话:</strong> {rental.customer_phone}</div>
              <div><strong>身份证:</strong> {rental.id_card}</div>
            </div>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '1rem' }}>车辆信息</h2>
            <div style={{ 
              width: '100%', 
              height: '200px', 
              background: '#f0f0f0',
              borderRadius: '8px',
              marginBottom: '1rem',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <CarImage
                src={rental.image_url}
                brand={rental.brand}
                model={rental.model}
                alt={rental.brand + ' ' + rental.model}
              />
            </div>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div><strong>品牌型号:</strong> {rental.brand} {rental.model}</div>
              <div><strong>年份:</strong> {rental.year}</div>
              <div><strong>颜色:</strong> {rental.color}</div>
              <div><strong>车牌号:</strong> {rental.license_plate}</div>
            </div>
            <Link 
              to={`/cars/${rental.car_id}`} 
              className="btn btn-secondary"
              style={{ marginTop: '1rem', width: '100%', textAlign: 'center', display: 'block' }}
            >
              查看车辆详情
            </Link>
          </div>
        </div>
      </div>

      {/* 支付记录 */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>支付记录</h2>
          {rental.status !== 'cancelled' && (
            <button className="btn btn-primary" onClick={handleCreatePayment}>
              添加支付记录
            </button>
          )}
        </div>
        {payments.length === 0 ? (
          <p style={{ color: '#666' }}>暂无支付记录</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>支付金额</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>支付方式</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>支付状态</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>支付时间</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '1rem' }}>¥{parseFloat(payment.amount).toFixed(2)}</td>
                  <td style={{ padding: '1rem' }}>
                    {payment.payment_method === 'cash' ? '现金' :
                     payment.payment_method === 'credit_card' ? '信用卡' :
                     payment.payment_method === 'debit_card' ? '借记卡' : '在线支付'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      background: payment.payment_status === 'completed' ? '#28a74520' : '#ffc10720',
                      color: payment.payment_status === 'completed' ? '#28a745' : '#ffc107'
                    }}>
                      {payment.payment_status === 'completed' ? '已完成' : payment.payment_status === 'pending' ? '待支付' : payment.payment_status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#666' }}>
                    {payment.payment_date ? new Date(payment.payment_date).toLocaleString('zh-CN') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default RentalDetail

