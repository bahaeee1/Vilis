
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Search from './pages/Search.jsx'
import Car from './pages/Car.jsx'
import AgencyRegister from './pages/AgencyRegister.jsx'

function Shell({children}){
  return (<>
    <header><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <div className="brand">Car Rental (v2)</div>
      <nav><NavLink to="/">Search</NavLink><NavLink to="/agency/register">Agency</NavLink></nav>
    </div></header>
    <main>{children}</main>
  </>)
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Shell>
      <Routes>
        <Route path="/" element={<Search/>}/>
        <Route path="/car/:id" element={<Car/>}/>
        <Route path="/agency/register" element={<AgencyRegister/>}/>
      </Routes>
    </Shell>
  </BrowserRouter>
)
