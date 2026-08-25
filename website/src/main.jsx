import React,{useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';

const towns=['Kakamega','Kitale','Eldoret','Webuye','Bungoma','Kapenguria'];
const fares={'Kakamega|Kitale':500,'Kakamega|Eldoret':400,'Kakamega|Bungoma':300,'Kitale|Eldoret':300};
const SERVICE_FEE=70;

function App(){
 const [form,setForm]=useState({mainTown:'Kakamega',from:'Kakamega',to:'Kitale',date:'',time:'',passengerName:'',phone:'',passengers:1});
 const [booking,setBooking]=useState(null); const [loading,setLoading]=useState(false);
 const fare=useMemo(()=>fares[`${form.from}|${form.to}`]??500,[form.from,form.to]);
 const total=(fare+SERVICE_FEE)*Number(form.passengers||1);
 const change=e=>setForm({...form,[e.target.name]:e.target.value});
 async function submit(e){e.preventDefault(); if(form.from===form.to)return alert('From and To cannot be the same.'); setLoading(true); try{const r=await fetch('http://localhost:4000/api/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}); const data=await r.json(); if(!r.ok)throw new Error(data.error); setBooking(data)}catch(err){alert('Booking could not be saved. Start the backend first.')}finally{setLoading(false)}}
 if(booking)return <main><div className="card"><div className="success">✓</div><h1>Booking Confirmed</h1><div className="bookingNo">{booking.bookingNo}</div><div className="details"><p><b>Passenger</b><span>{booking.passengerName}</span></p><p><b>Route</b><span>{booking.from} → {booking.to}</span></p><p><b>Travel</b><span>{booking.date} · {booking.time}</span></p><p><b>Passengers</b><span>{booking.passengers}</span></p><p><b>Fare</b><span>KSh {(booking.fare*booking.passengers).toLocaleString()}</span></p><p><b>Service fee</b><span>KSh {(booking.serviceFee*booking.passengers).toLocaleString()}</span></p><p className="total"><b>Total</b><span>KSh {booking.total.toLocaleString()}</span></p></div><button onClick={()=>setBooking(null)}>NEW BOOKING</button></div></main>;
 return <main><div className="card"><header><div className="logo">QS</div><div><h1>Quick Shuttle</h1><p>Book your trip in seconds.</p></div></header><div className="ad">ADVERTISEMENT</div><form onSubmit={submit}><label>Main Town<select name="mainTown" value={form.mainTown} onChange={change}>{towns.map(t=><option key={t}>{t}</option>)}</select></label><div className="grid"><label>From<select name="from" value={form.from} onChange={change}>{towns.map(t=><option key={t}>{t}</option>)}</select></label><label>To<select name="to" value={form.to} onChange={change}>{towns.map(t=><option key={t}>{t}</option>)}</select></label></div><div className="grid"><label>Travel date<input required type="date" name="date" value={form.date} onChange={change}/></label><label>Travel time<input required type="time" name="time" value={form.time} onChange={change}/></label></div><label>Passenger name<input required name="passengerName" value={form.passengerName} onChange={change} placeholder="Full name"/></label><label>Phone number<input required name="phone" value={form.phone} onChange={change} placeholder="07XX XXX XXX" inputMode="tel"/></label><label>Passengers<input required type="number" min="1" max="20" name="passengers" value={form.passengers} onChange={change}/></label><div className="summary"><p>Fare <span>KSh {(fare*form.passengers).toLocaleString()}</span></p><p>Quick Shuttle fee <span>KSh {(SERVICE_FEE*form.passengers).toLocaleString()}</span></p><p className="total"><b>Total</b><strong>KSh {total.toLocaleString()}</strong></p></div><button disabled={loading}>{loading?'PROCESSING...':'BOOK NOW'}</button></form><footer>Secure booking · Clear pricing · Easy travel</footer></div></main>
}
createRoot(document.getElementById('root')).render(<App/>);
