const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
const bookings=[];
const SERVICE_FEE=70;
const fares={
  'Kakamega|Kitale':500,
  'Kakamega|Eldoret':400,
  'Kakamega|Bungoma':300,
  'Kitale|Eldoret':300
};
app.get('/api/health',(req,res)=>res.json({ok:true,name:'Quick Shuttle'}));
app.get('/api/fare',(req,res)=>{
  const fare=fares[`${req.query.from}|${req.query.to}`] ?? 500;
  res.json({fare,serviceFee:SERVICE_FEE});
});
app.post('/api/bookings',(req,res)=>{
  const {mainTown,from,to,date,time,passengerName,phone,passengers}=req.body;
  if(!mainTown||!from||!to||!date||!time||!passengerName||!phone||!passengers)
    return res.status(400).json({error:'Please complete all booking fields.'});
  const fare=fares[`${from}|${to}`] ?? 500;
  const count=Number(passengers);
  const booking={
    bookingNo:`QS-${String(bookings.length+1).padStart(5,'0')}`,
    mainTown,from,to,date,time,passengerName,phone,passengers:count,
    fare,serviceFee:SERVICE_FEE,total:(fare+SERVICE_FEE)*count,
    status:'CONFIRMED',createdAt:new Date().toISOString()
  };
  bookings.push(booking);
  res.status(201).json(booking);
});
app.get('/api/bookings',(req,res)=>res.json(bookings));
app.listen(4000,()=>console.log('Quick Shuttle API: http://localhost:4000'));
