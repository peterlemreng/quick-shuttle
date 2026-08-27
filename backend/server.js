const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const bookings = [];

const SERVICE_FEE = 70;
const fares = require('./fares');

app.get('/api/health', (req, res) => {
  res.json({ ok: true, name: 'Quick Shuttle' });
});

app.get('/api/fare', (req, res) => {
  const fare = fares[`${req.query.from}|${req.query.to}`];

  if (fare === undefined) {
    return res.status(404).json({
      error: 'Fare not configured for this route.'
    });
  }

  res.json({
    fare,
    serviceFee: SERVICE_FEE
  });
});

app.post('/api/bookings', (req, res) => {
  const {
    mainTown,
    from,
    to,
    date,
    time,
    passengerName,
    phone,
    passengers
  } = req.body;

  if (!mainTown || !from || !to || !date || !time || !passengerName || !phone || !passengers) {
    return res.status(400).json({
      error: 'Please complete all booking fields.'
    });
  }

  if (from === to) {
    return res.status(400).json({
      error: 'From and To cannot be the same.'
    });
  }

  const fare = fares[`${from}|${to}`];

  if (fare === undefined) {
    return res.status(400).json({
      error: 'Fare not configured for this route.'
    });
  }

  const count = Number(passengers);

  if (!Number.isInteger(count) || count < 1 || count > 20) {
    return res.status(400).json({
      error: 'Passengers must be between 1 and 20.'
    });
  }

  const booking = {
    bookingNo: `QS-${String(bookings.length + 1).padStart(5, '0')}`,
    mainTown,
    from,
    to,
    date,
    time,
    passengerName,
    phone,
    passengers: count,
    fare,
    serviceFee: SERVICE_FEE,
    total: (fare + SERVICE_FEE) * count,
    status: 'PENDING_PAYMENT',
    paymentStatus: 'UNPAID',
    bookingSource: 'CUSTOMER',
    createdAt: new Date().toISOString()
  };

  bookings.push(booking);

  res.status(201).json(booking);
});

app.post('/api/customer-care/bookings', (req, res) => {
  const {
    mainTown,
    from,
    to,
    date,
    time,
    passengerName,
    phone,
    passengers,
    fare
  } = req.body;

  if (!mainTown || !from || !to || !date || !time || !passengerName || !phone || !passengers || fare === undefined) {
    return res.status(400).json({
      error: 'Please complete all booking fields including fare.'
    });
  }

  if (from === to) {
    return res.status(400).json({
      error: 'From and To cannot be the same.'
    });
  }

  const count = Number(passengers);
  const enteredFare = Number(fare);

  if (!Number.isInteger(count) || count < 1 || count > 20) {
    return res.status(400).json({
      error: 'Passengers must be between 1 and 20.'
    });
  }

  if (!Number.isFinite(enteredFare) || enteredFare < 0) {
    return res.status(400).json({
      error: 'Fare must be a valid amount.'
    });
  }

  const booking = {
    bookingNo: `QS-${String(bookings.length + 1).padStart(5, '0')}`,
    mainTown,
    from,
    to,
    date,
    time,
    passengerName,
    phone,
    passengers: count,
    fare: enteredFare,
    serviceFee: SERVICE_FEE,
    total: (enteredFare + SERVICE_FEE) * count,
    status: 'CONFIRMED',
    bookingSource: 'CUSTOMER_CARE',
    createdAt: new Date().toISOString()
  };

  bookings.push(booking);

  res.status(201).json(booking);
});

app.get('/api/bookings', (req, res) => {
  res.json(bookings);
});

app.listen(4000, () => {
  console.log('Quick Shuttle API: http://localhost:4000');
});

