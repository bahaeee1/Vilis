
import React, { useState } from 'react'
import { searchCars } from '../api.js'
import { useNavigate } from 'react-router-dom'

function SpecsLine({c}){
  const tags = []
  if (c.year) tags.push(c.year)
  if (c.transmission) tags.push(c.transmission)
  if (c.seats) tags.push(c.seats + ' seats')
  if (c.doors) tags.push(c.doors + ' doors')
  if (c.trunk_liters) tags.push(c.trunk_liters + 'L trunk')
  if (c.fuel_type) tags.push(c.fuel_type)
  return <div className="muted">{tags.join(' · ')}</div>
}

export default function Search(){
  const [location,setLocation] = useState('')
  const [minPrice,setMinPrice] = useState('')
  const [maxPrice,setMaxPrice] = useState('')
  const [startDate,setStartDate] = useState('')
  const [endDate,setEndDate] = useState('')
  const [cars,setCars] = useState([])
  const [error,setError] = useState(null)
  const nav = useNavigate()

  const run = async () => {
    setError(null)
    try { setCars(await searchCars({ location, minPrice, maxPrice, startDate, endDate })) }
    catch(e){ setError(e.error || 'Search failed') }
  }

  return (
    <div className="card">
      <h2>Find a car</h2>
      <div className="row">
        <div className="col-4"><label>Location</label><input value={location} onChange={e=>setLocation(e.target.value)} /></div>
        <div className="col-2"><label>Min/day</label><input type="number" value={minPrice} onChange={e=>setMinPrice(e.target.value)} /></div>
        <div className="col-2"><label>Max/day</label><input type="number" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} /></div>
        <div className="col-2"><label>Start</label><input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} /></div>
        <div className="col-2"><label>End</label><input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} /></div>
      </div>
      <div style={{marginTop:12}}><button className="btn" onClick={run}>Search</button></div>
      {error && <div className="error" style={{marginTop:8}}>{String(error)}</div>}
      <div className="grid" style={{marginTop:16}}>
        {cars.map(c => (
          <div key={c.id} className="car">
            <img src={c.image_url || 'https://picsum.photos/seed/'+c.id+'/600/400'} alt={c.title} />
            <div className="body">
              <div style={{fontWeight:700}}>{c.title}</div>
              <div className="muted">Agency: <b>{c.agency_name || '—'}</b></div>
              <div className="muted">Tel: <b>{c.agency_phone || '—'}</b></div>
              <SpecsLine c={c} />
              <div style={{margin:'6px 0'}}><b>{c.daily_price} / day</b> · {c.location}</div>
              <button className="btn" style={{marginTop:8}} onClick={()=>nav('/car/'+c.id)}>View</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
