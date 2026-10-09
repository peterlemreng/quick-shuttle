import React,{useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';

const API_URL='http://localhost:4000';

function App(){
 const [routes,setRoutes]=useState([]);
 const [form,setForm]=useState({mainTown:'',from:'',to:'',date:'',time:'',passengerName:'',phone:'',passengers:1});
 const [fareData,setFareData]=useState({fare:0,serviceFee:0});
 const [booking,setBooking]=useState(null);
 const [loading,setLoading]=useState(false);
 const [routesLoading,setRoutesLoading]=useState(true);
 const [error,setError]=useState('');

 useEffect(()=>{
  async function loadRoutes(){
   try{
    const r=await fetch(`${API_URL}/api/routes`);
    const data=await r.json();
    if(!r.ok)throw new Error(data.error||'Failed to load routes.');
    setRoutes(data.routes||[]);
   }catch(err){
    setError('Routes could not be loaded. Start the backend first.');
   }finally{
    setRoutesLoading(false);
   }
  }
  loadRoutes();
 },[]);

 const fromTowns=useMemo(()=>[...new Set(routes.map(route=>route.fromTown))].sort(),[routes]);

 const toTowns=useMemo(()=>{
  if(!form.from)return [];
  return [...new Set(routes.filter(route=>route.fromTown===form.from).map(route=>route.toTown))].sort();
 },[routes,form.from]);

 useEffect(()=>{
  if(!fromTowns.length)return;
  setForm(current=>{
   const nextFrom=fromTowns.includes(current.from)?current.from:fromTowns[0];
   const availableTo=routes.filter(route=>route.fromTown===nextFrom).map(route=>route.toTown);
   const nextTo=availableTo.includes(current.to)?current.to:(availableTo[0]||'');
   const nextMain=fromTowns.includes(current.mainTown)?current.mainTown:nextFrom;
   if(current.from===nextFrom&&current.to===nextTo&&current.mainTown===nextMain)return current;
   return {...current,mainTown:nextMain,from:nextFrom,to:nextTo};
  });
 },[fromTowns,routes]);

 useEffect(()=>{
  if(!form.from||!form.to){
   setFareData({fare:0,serviceFee:0});
   return;
  }

  const controller=new AbortController();

  async function loadFare(){
   try{
    const r=await fetch(`${API_URL}/api/fare?from=${encodeURIComponent(form.from)}&to=${encodeURIComponent(form.to)}`,{signal:controller.signal});
    const data=await r.json();
    if(!r.ok)throw new Error(data.error||'Fare lookup failed.');
    setFareData({fare:Number(data.fare),serviceFee:Number(data.serviceFee)});
   }catch(err){
    if(err.name!=='AbortError'){
     console.error('Fare lookup error:',err);
     setError(`Fare lookup failed: ${err.message}`);
     setFareData({fare:0,serviceFee:0});
    }
   }
  }

  loadFare();

  return ()=>controller.abort();
 },[form.from,form.to]);

 const total=(fareData.fare+fareData.serviceFee)*Number(form.passengers||1);
 const change=e=>{
  const {name,value}=e.target;
  setForm(current=>{
   if(name==='from'){
    const validTo=routes.filter(route=>route.fromTown===value).map(route=>route.toTown);
    return {...current,from:value,to:validTo.includes(current.to)?current.to:(validTo[0]||'')};
   }
   return {...current,[name]:value};
  });
 };

 async function submit(e){
  e.preventDefault();
  if(form.from===form.to)return alert('From and To cannot be the same.');
  setLoading(true);
  try{
   const r=await fetch(`${API_URL}/api/bookings`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(form)
   });
   const data=await r.json();
   if(!r.ok)throw new Error(data.error||'Booking failed.');
   setBooking(data);
  }catch(err){
   alert(err.message||'Booking could not be saved. Start the backend first.');
  }finally{
   setLoading(false);
  }
 }

 if(routesLoading)return <main><div className="card"><h1>Quick Shuttle</h1><p>Loading routes...</p></div></main>;

 if(booking)return <main><div className="card"><div className="success">✓</div><h1>Booking Confirmed</h1><div className="bookingNo">{booking.bookingNo}</div><div className="details"><p><b>Passenger</b><span>{booking.passengerName}</span></p><p><b>Route</b><span>{booking.from} → {booking.to}</span></p><p><b>Travel</b><span>{booking.date} · {booking.time}</span></p><p><b>Passengers</b><span>{booking.passengers}</span></p><p><b>Fare</b><span>KSh {(booking.fare*booking.passengers).toLocaleString()}</span></p><p><b>Service fee</b><span>KSh {(booking.serviceFee*booking.passengers).toLocaleString()}</span></p><p className="total"><b>Total</b><span>KSh {booking.total.toLocaleString()}</span></p></div><button onClick={()=>setBooking(null)}>NEW BOOKING</button></div></main>;

 return <main><div className="card"><header><div className="logo">QS</div><div><h1>Quick Shuttle</h1><p>Book your trip in seconds.</p></div></header><div className="ad">ADVERTISEMENT</div>{error&&<p>{error}</p>}<form onSubmit={submit}><label>Main Town<select name="mainTown" value={form.mainTown} onChange={change} required>{fromTowns.map(t=><option key={t}>{t}</option>)}</select></label><div className="grid"><label>From<select name="from" value={form.from} onChange={change} required>{fromTowns.map(t=><option key={t}>{t}</option>)}</select></label><label>To<select name="to" value={form.to} onChange={change} required>{toTowns.map(t=><option key={t}>{t}</option>)}</select></label></div><div className="grid"><label>Travel date<input required type="date" name="date" value={form.date} onChange={change}/></label><label>Travel time<input required type="time" name="time" value={form.time} onChange={change}/></label></div><label>Passenger name<input required name="passengerName" value={form.passengerName} onChange={change} placeholder="Full name"/></label><label>Phone number<input required name="phone" value={form.phone} onChange={change} placeholder="07XX XXX XXX" inputMode="tel"/></label><label>Passengers<input required type="number" min="1" max="20" name="passengers" value={form.passengers} onChange={change}/></label><div className="summary"><p>Fare <span>KSh {(fareData.fare*form.passengers).toLocaleString()}</span></p><p>Quick Shuttle fee <span>KSh {(fareData.serviceFee*form.passengers).toLocaleString()}</span></p><p className="total"><b>Total</b><strong>KSh {total.toLocaleString()}</strong></p></div><button disabled={loading||!fareData.fare}>{loading?'PROCESSING...':'BOOK NOW'}</button></form><footer>Secure booking · Clear pricing · Easy travel</footer></div></main>
}

createRoot(document.getElementById('root')).render(<App/>);



