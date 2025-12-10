import React, { useState, useEffect } from 'react'
import client from '../api/client'
import '../App.css'

function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    id_card: '',
    address: '',
    driver_license: ''
  })
  const [creatingCustomer, setCreatingCustomer] = useState(false)
  const [deletingCustomer, setDeletingCustomer] = useState(null)
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: ''
  })
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    fetchCustomers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key])
        }
      })

      const response = await client.get(`/customers?${params.toString()}`)
      setCustomers(response.data.customers)
      setPagination(response.data.pagination)
      setError(null)
    } catch (err) {
      setError('Failed to load customers: ' + (err.response?.data?.error || err.message))
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

  const handleCustomerChange = (e) => {
    setNewCustomer(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleCreateCustomer = async (e) => {
    e.preventDefault()
    setCreatingCustomer(true)
    setError(null)

    try {
      await client.post('/customers', newCustomer)
      // refresh list
      await fetchCustomers()
      // reset form
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        id_card: '',
        address: '',
        driver_license: ''
      })
      setShowCustomerForm(false)
      alert('Customer created successfully.')
    } catch (err) {
      setError('Failed to create customer: ' + (err.response?.data?.error || err.message))
    } finally {
      setCreatingCustomer(false)
    }
  }

  const handleDeleteCustomer = async (customerId, customerName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete customer "${customerName}"?\n\nNote:\n- If this customer has any active rentals, they cannot be deleted.\n- If this customer has any rental history (including completed rentals), they cannot be deleted in order to preserve business data.`
      )
    ) {
      return
    }

    try {
      setDeletingCustomer(customerId)
      await client.delete(`/customers/${customerId}`)
      alert('Customer deleted successfully.')
      await fetchCustomers()
    } catch (err) {
      alert('Failed to delete customer: ' + (err.response?.data?.error || err.message))
    } finally {
      setDeletingCustomer(null)
    }
  }

  if (loading && !customers.length) {
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
        <h1>Customer Management</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowCustomerForm(!showCustomerForm)}
        >
          {showCustomerForm ? 'Cancel' : '+ Add New Customer'}
        </button>
      </div>

      {/* Create Customer Form */}
      {showCustomerForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Add New Customer</h2>
          <form onSubmit={handleCreateCustomer}>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  className="form-input"
                  name="name"
                  value={newCustomer.name}
                  onChange={handleCustomerChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className="form-input"
                  name="email"
                  value={newCustomer.email}
                  onChange={handleCustomerChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input
                  type="tel"
                  className="form-input"
                  name="phone"
                  value={newCustomer.phone}
                  onChange={handleCustomerChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">ID Card Number *</label>
                <input
                  type="text"
                  className="form-input"
                  name="id_card"
                  value={newCustomer.id_card}
                  onChange={handleCustomerChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Driver License Number *</label>
                <input
                  type="text"
                  className="form-input"
                  name="driver_license"
                  value={newCustomer.driver_license}
                  onChange={handleCustomerChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-input"
                  name="address"
                  value={newCustomer.address}
                  onChange={handleCustomerChange}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={creatingCustomer}
              >
                {creatingCustomer ? 'Creating...' : 'Create Customer'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowCustomerForm(false)
                  setNewCustomer({
                    name: '',
                    email: '',
                    phone: '',
                    id_card: '',
                    address: '',
                    driver_license: ''
                  })
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="form-group">
          <label className="form-label">Search Customers</label>
          <input
            type="text"
            className="form-input"
            placeholder="Name, email, phone..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Customer List */}
      {customers.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#666' }}>
            No customers found.
          </p>
        </div>
      ) : (
        <>
          <div className="card">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Phone</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>ID Card</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>
                    Driver License
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>
                    Registered At
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(customer => (
                  <tr key={customer.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '1rem' }}>{customer.name}</td>
                    <td style={{ padding: '1rem' }}>{customer.email}</td>
                    <td style={{ padding: '1rem' }}>{customer.phone}</td>
                    <td style={{ padding: '1rem' }}>{customer.id_card}</td>
                    <td style={{ padding: '1rem' }}>
                      {customer.driver_license}
                    </td>
                    <td style={{ padding: '1rem', color: '#666' }}>
                      {customer.created_at
                        ? new Date(customer.created_at).toLocaleDateString('en-US')
                        : '-'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        onClick={() =>
                          handleDeleteCustomer(customer.id, customer.name)
                        }
                        disabled={deletingCustomer === customer.id}
                      >
                        {deletingCustomer === customer.id
                          ? 'Deleting...'
                          : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

export default Customers
