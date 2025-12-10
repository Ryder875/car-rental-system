import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Cars from './pages/Cars'
import CarDetail from './pages/CarDetail'
import Customers from './pages/Customers'
import Rentals from './pages/Rentals'
import RentalDetail from './pages/RentalDetail'
import CreateRental from './pages/CreateRental'
import Stats from './pages/Stats'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
            Vehicle Rental Management System
            </Link>
            <div className="nav-menu">
              <Link to="/" className="nav-link">Dashboard</Link>
              <Link to="/cars" className="nav-link">Vehicle Management</Link>
              <Link to="/customers" className="nav-link">Customer Management</Link>
              <Link to="/rentals" className="nav-link">Rental orders</Link>
              <Link to="/stats" className="nav-link">Statistical analysis</Link>
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cars" element={<Cars />} />
            <Route path="/cars/:id" element={<CarDetail />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/rentals" element={<Rentals />} />
            <Route path="/rentals/new" element={<CreateRental />} />
            <Route path="/rentals/:id" element={<RentalDetail />} />
            <Route path="/stats" element={<Stats />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

