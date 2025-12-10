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
      setError('Failed to load order details: ' + (err.response?.data?.error || err.message))
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
        alert(`Order cannot be completed! Total order amount: ¥${totalAmount.toFixed(2)} Paid amount: ¥${totalPaid.toFixed(2)} Balance due: ¥${(totalAmount - totalPaid).toFixed(2)} Please complete the payment first.`)
        return
      }
    }

    const statusText = {
      'active': 'In progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'pending': 'Pending confirmation'
    }[newStatus] || newStatus

    if (!window.confirm(`Confirm that the order status needs to be updated to"${statusText}"吗？`)) {
      return
    }

    try {
      setUpdating(true)
      await client.patch(`/rentals/${id}/status`, { status: newStatus })
      await fetchRental()
      alert('Order status updated successfully')
    } catch (err) {
      alert('Update failed: ' + (err.response?.data?.error || err.message))
    } finally {
      setUpdating(false)
    }
  }

  const handleCreatePayment = async () => {
    const amount = prompt('Please enter the payment amount:', rental?.total_amount)
    if (!amount) return

    const paymentMethod = prompt('Please enter your payment method. (cash/credit_card/debit_card/online):', 'cash')
    if (!paymentMethod) return

    try {
      await client.post('/payments', {
        rental_id: id,
        amount: parseFloat(amount),
        payment_method: paymentMethod
      })
      await fetchPayments()
      await fetchRental()
      alert('Payment record created successfully')
    } catch (err) {
      alert('Failed to create payment record: ' + (err.response?.data?.error || err.message))
    }
  }

  if (loading) {
    return <div className="loading">loading...</div>
  }

  if (error || !rental) {
    return (
      <div>
        <div className="error">{error || 'Order does not exist'}</div>
        <Link to="/rentals" className="btn btn-secondary">Return to order list</Link>
      </div>
    )
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: 'Pending confirmation', color: '#ffc107' },
      active: { text: 'In progress', color: '#28a745' },
      completed: { text: 'Completed', color: '#6c757d' },
      cancelled: { text: 'Cancelled', color: '#dc3545' }
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
        <Link to="/rentals" className="btn btn-secondary">← Return to order list</Link>
      </div>

      <div className="grid grid-2">
        {/* 订单信息 */}
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>Order Information</h2>
          <div style={{ marginBottom: '1.5rem' }}>
            {getStatusBadge(rental.status)}
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Order Information</h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>Order number</span>
                <strong>#{rental.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>Creation time</span>
                <span>{new Date(rental.created_at).toLocaleString('zh-CN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>start date</span>
                <strong>{new Date(rental.start_date).toLocaleDateString('zh-CN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>End Date</span>
                <strong>{new Date(rental.end_date).toLocaleDateString('zh-CN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>Rental days</span>
                <strong>{rental.total_days} 天</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>Daily rental</span>
                <strong>¥{parseFloat(rental.daily_rate).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>lump sum</span>
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
                          Additional payment required: ¥{remaining.toFixed(2)}
                        </div>
                      )}
                      {totalPaid >= totalAmount && (
                        <div style={{ fontSize: '0.875rem', color: '#28a745', marginTop: '0.25rem' }}>
                          ✓ Payment completed
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
              <strong>Pick-up location:</strong> {rental.pickup_location}
            </div>
          )}
          {rental.return_location && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Return location:</strong> {rental.return_location}
            </div>
          )}
          {rental.notes && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Remark:</strong> {rental.notes}
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
                Confirm Order
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
                  title={!canComplete ? `Payment needs to be completed first. Paid: ¥${totalPaid.toFixed(2)} / 总金额: ¥${totalAmount.toFixed(2)}` : ''}
                  style={!canComplete ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                >
                  Complete the order {!canComplete && `(Payment required ¥${(totalAmount - totalPaid).toFixed(2)})`}
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
              <div><strong>Name:</strong> {rental.customer_name}</div>
              <div><strong>Email:</strong> {rental.customer_email}</div>
              <div><strong>Phone:</strong> {rental.customer_phone}</div>
              <div><strong>ID:</strong> {rental.id_card}</div>
            </div>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '1rem' }}>Vehicle Information</h2>
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
              <div><strong>Brand Model:</strong> {rental.brand} {rental.model}</div>
              <div><strong>Years:</strong> {rental.year}</div>
              <div><strong>Color:</strong> {rental.color}</div>
              <div><strong>license plate number:</strong> {rental.license_plate}</div>
            </div>
            <Link 
              to={`/cars/${rental.car_id}`} 
              className="btn btn-secondary"
              style={{ marginTop: '1rem', width: '100%', textAlign: 'center', display: 'block' }}
            >
              View vehicle details
            </Link>
          </div>
        </div>
      </div>

      {/* 支付记录 */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Payment records</h2>
          {rental.status !== 'cancelled' && (
            <button className="btn btn-primary" onClick={handleCreatePayment}>
              Add payment record
            </button>
          )}
        </div>
        {payments.length === 0 ? (
          <p style={{ color: '#666' }}>No payment records yet</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Payment amount</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Payment method</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Payment status</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Payment time</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '1rem' }}>¥{parseFloat(payment.amount).toFixed(2)}</td>
                  <td style={{ padding: '1rem' }}>
                    {payment.payment_method === 'cash' ? 'cash' :
                     payment.payment_method === 'credit_card' ? 'credit card' :
                     payment.payment_method === 'debit_card' ? 'credit card' : 'online payment'}
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

