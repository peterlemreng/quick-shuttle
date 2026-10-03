require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { stkPush } = require('./mpesa');
const db = require('./db');

const app = express();

app.use(helmet());
app.use(cors({ origin: ['http://localhost:5173', 'https://petech.co.ke', 'https://www.petech.co.ke'] }));
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false
});

app.use('/api', apiLimiter);

const SERVICE_FEE = 70;
const fares = require('./fares');

/*
 * Find town IDs by town name.
 */
async function getTownIds(mainTown, from, to) {
  const [rows] = await db.query(
    `SELECT id, name
     FROM towns
     WHERE name IN (?, ?, ?)`,
    [mainTown, from, to]
  );

  const towns = {};

  for (const town of rows) {
    towns[town.name] = town.id;
  }

  if (!towns[mainTown] || !towns[from] || !towns[to]) {
    return null;
  }

  return {
    mainTownId: towns[mainTown],
    fromTownId: towns[from],
    toTownId: towns[to]
  };
}

/*
 * Find the active database fare for a route.
 */
async function getDatabaseFare(fromTownId, toTownId) {
  const [rows] = await db.query(
    `SELECT r.id AS route_id, f.amount AS fare
     FROM routes r
     INNER JOIN fares f
       ON f.route_id = r.id
      AND f.active = 1
     WHERE r.from_town_id = ?
       AND r.to_town_id = ?
     LIMIT 1`,
    [fromTownId, toTownId]
  );

  if (rows.length === 0) {
    return null;
  }

  return {
    routeId: rows[0].route_id,
    fare: Number(rows[0].fare)
  };
}

/*
 * Create a booking number after MySQL generates the booking ID.
 */
function createBookingNumber(id) {
  return `QS-${String(id).padStart(5, '0')}`;
}

app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');

    res.json({
      ok: true,
      name: 'Quick Shuttle',
      database: 'connected'
    });
  } catch (error) {
    console.error('Health check database error:', error.message);

    res.status(503).json({
      ok: false,
      name: 'Quick Shuttle',
      database: 'disconnected'
    });
  }
});

app.get('/api/fare', async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        error: 'From and To are required.'
      });
    }

    if (from === to) {
      return res.status(400).json({
        error: 'From and To cannot be the same.'
      });
    }

    const [townRows] = await db.query(
      `SELECT id, name
       FROM towns
       WHERE name IN (?, ?)`,
      [from, to]
    );

    const townMap = {};

    for (const town of townRows) {
      townMap[town.name] = town.id;
    }

    if (!townMap[from] || !townMap[to]) {
      return res.status(404).json({
        error: 'Town not found.'
      });
    }

    const result = await getDatabaseFare(
      townMap[from],
      townMap[to]
    );

    if (!result) {
      return res.status(404).json({
        error: 'Fare not configured for this route.'
      });
    }

    res.json({
      fare: result.fare,
      serviceFee: SERVICE_FEE
    });
  } catch (error) {
    console.error('Fare lookup error:', error.message);

    res.status(500).json({
      error: 'Failed to retrieve fare.'
    });
  }
});

app.post('/api/bookings', [body('mainTown').trim().notEmpty(), body('from').trim().notEmpty(), body('to').trim().notEmpty(), body('date').isISO8601(), body('time').matches(/^\d{2}:\d{2}$/), body('passengerName').trim().isLength({min:2,max:100}), body('phone').trim().matches(/^(\+254|0)7\d{8}$/), body('passengers').isInt({min:1,max:20})], async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) { return res.status(400).json({ error: 'Invalid booking details.', details: errors.array() }); }
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

  if (
    !mainTown ||
    !from ||
    !to ||
    !date ||
    !time ||
    !passengerName ||
    !phone ||
    passengers === undefined
  ) {
    return res.status(400).json({
      error: 'Please complete all booking fields.'
    });
  }

  if (from === to) {
    return res.status(400).json({
      error: 'From and To cannot be the same.'
    });
  }

  const count = Number(passengers);

  if (!Number.isInteger(count) || count < 1 || count > 20) {
    return res.status(400).json({
      error: 'Passengers must be between 1 and 20.'
    });
  }

  try {
    const townIds = await getTownIds(
      mainTown,
      from,
      to
    );

    if (!townIds) {
      return res.status(400).json({
        error: 'One or more towns could not be found.'
      });
    }

    const routeFare = await getDatabaseFare(
      townIds.fromTownId,
      townIds.toTownId
    );

    if (!routeFare) {
      return res.status(400).json({
        error: 'Fare not configured for this route.'
      });
    }

    const total = (routeFare.fare + SERVICE_FEE) * count;

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const temporaryBookingNo =
        `TMP-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

      const [result] = await connection.execute(
        `INSERT INTO bookings (
          booking_no,
          main_town_id,
          from_town_id,
          to_town_id,
          travel_date,
          travel_time,
          passenger_name,
          phone,
          passengers,
          fare_per_passenger,
          service_fee_per_passenger,
          total_amount,
          status,
          payment_status,
          booking_source
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          temporaryBookingNo,
          townIds.mainTownId,
          townIds.fromTownId,
          townIds.toTownId,
          date,
          time,
          passengerName,
          phone,
          count,
          routeFare.fare,
          SERVICE_FEE,
          total,
          'PENDING_PAYMENT',
          'UNPAID',
          'CUSTOMER'
        ]
      );

      const bookingNo = createBookingNumber(result.insertId);

      await connection.execute(
        `UPDATE bookings
         SET booking_no = ?
         WHERE id = ?`,
        [bookingNo, result.insertId]
      );

      await connection.commit();

      res.status(201).json({
        bookingNo,
        mainTown,
        from,
        to,
        date,
        time,
        passengerName,
        phone,
        passengers: count,
        fare: routeFare.fare,
        serviceFee: SERVICE_FEE,
        total,
        status: 'PENDING_PAYMENT',
        paymentStatus: 'UNPAID',
        bookingSource: 'CUSTOMER'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Booking creation error:', error.message);

    res.status(500).json({
      error: 'Failed to create booking.'
    });
  }
});

app.post('/api/customer-care/bookings', [body('mainTown').trim().notEmpty(), body('from').trim().notEmpty(), body('to').trim().notEmpty(), body('date').isISO8601(), body('time').matches(/^\d{2}:\d{2}$/), body('passengerName').trim().isLength({min:2,max:100}), body('phone').trim().matches(/^(\+254|0)7\d{8}$/), body('passengers').isInt({min:1,max:20}), body('fare').isFloat({min:0})], async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid booking details.', details: errors.array() });
  }

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

  if (
    !mainTown ||
    !from ||
    !to ||
    !date ||
    !time ||
    !passengerName ||
    !phone ||
    passengers === undefined ||
    fare === undefined
  ) {
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

  try {
    const townIds = await getTownIds(
      mainTown,
      from,
      to
    );

    if (!townIds) {
      return res.status(400).json({
        error: 'One or more towns could not be found.'
      });
    }

    const total = (enteredFare + SERVICE_FEE) * count;

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const temporaryBookingNo =
        `TMP-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

      const [result] = await connection.execute(
        `INSERT INTO bookings (
          booking_no,
          main_town_id,
          from_town_id,
          to_town_id,
          travel_date,
          travel_time,
          passenger_name,
          phone,
          passengers,
          fare_per_passenger,
          service_fee_per_passenger,
          total_amount,
          status,
          payment_status,
          booking_source
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          temporaryBookingNo,
          townIds.mainTownId,
          townIds.fromTownId,
          townIds.toTownId,
          date,
          time,
          passengerName,
          phone,
          count,
          enteredFare,
          SERVICE_FEE,
          total,
          'CONFIRMED',
          'UNPAID',
          'CUSTOMER_CARE'
        ]
      );

      const bookingNo = createBookingNumber(result.insertId);

      await connection.execute(
        `UPDATE bookings
         SET booking_no = ?
         WHERE id = ?`,
        [bookingNo, result.insertId]
      );

      await connection.commit();

      res.status(201).json({
        bookingNo,
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
        total,
        status: 'CONFIRMED',
        paymentStatus: 'UNPAID',
        bookingSource: 'CUSTOMER_CARE'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Customer-care booking error:', error.message);

    res.status(500).json({
      error: 'Failed to create customer-care booking.'
    });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        b.booking_no AS bookingNo,
        mt.name AS mainTown,
        ft.name AS \`from\`,
        tt.name AS \`to\`,
        b.travel_date AS date,
        b.travel_time AS time,
        b.passenger_name AS passengerName,
        b.phone,
        b.passengers,
        b.fare_per_passenger AS fare,
        b.service_fee_per_passenger AS serviceFee,
        b.total_amount AS total,
        b.status,
        b.payment_status AS paymentStatus,
        b.booking_source AS bookingSource,
        b.created_at AS createdAt
       FROM bookings b
       INNER JOIN towns mt ON mt.id = b.main_town_id
       INNER JOIN towns ft ON ft.id = b.from_town_id
       INNER JOIN towns tt ON tt.id = b.to_town_id
       ORDER BY b.id DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error('Booking retrieval error:', error.message);

    res.status(500).json({
      error: 'Failed to retrieve bookings.'
    });
  }
});

app.post('/api/payments/stkpush', paymentLimiter, body('bookingNo').trim().matches(/^QS-\d{5}$/), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid booking number.', details: errors.array() });
    }

    const { bookingNo } = req.body;

    if (!bookingNo) {
      return res.status(400).json({
        error: 'Booking number is required.'
      });
    }
    const [rows] = await db.query(
      `SELECT
        id,
        booking_no,
        phone,
        total_amount,
        status,
        payment_status
       FROM bookings
       WHERE booking_no = ?
       LIMIT 1`,
      [bookingNo]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Booking not found.'
      });
    }

    const booking = rows[0];

    if (booking.payment_status === 'PAID') {
      return res.status(400).json({
        error: 'This booking has already been paid.'
      });
    }

    const result = await stkPush({
      phone: booking.phone,
      amount: Number(booking.total_amount),
      bookingNo: booking.booking_no
    });

    if (!result.MerchantRequestID || !result.CheckoutRequestID) {
      return res.status(502).json({
        error: 'M-Pesa did not return the required payment identifiers.'
      });
    }

    await db.query(
      `INSERT INTO payments (
        booking_id, provider, amount, status, merchant_request_id,
        checkout_request_id, phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        booking.id,
        'MPESA',
        Number(booking.total_amount),
        'PENDING',
        result.MerchantRequestID,
        result.CheckoutRequestID,
        booking.phone
      ]
    );

    res.json({
      success: true,
      message: result.CustomerMessage || 'STK Push sent.',
      bookingNo: booking.booking_no,
      total: Number(booking.total_amount),
      checkoutRequestID: result.CheckoutRequestID || null
    });
  } catch (error) {
    console.error(
      'M-Pesa STK Push Error:',
      error.response?.data || error.message
    );

    res.status(500).json({
      error: 'Failed to initiate M-Pesa payment.',
      details: error.response?.data || error.message
    });
  }
});

app.post('/api/mpesa/callback', async (req, res) => {
  const callback = req.body?.Body?.stkCallback;

  if (!callback || !callback.CheckoutRequestID) {
    return res.status(400).json({
      error: 'Invalid M-Pesa callback.'
    });
  }

  const resultCode = Number(callback.ResultCode);
  const resultDescription = String(callback.ResultDesc || 'No result description.');
  const checkoutRequestID = callback.CheckoutRequestID;

  const metadata = callback.CallbackMetadata?.Item || [];
  const receiptItem = metadata.find(
    item => item.Name === 'MpesaReceiptNumber'
  );
  const receiptNumber = receiptItem?.Value || null;

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [payments] = await connection.query(
      `SELECT id, booking_id, status
       FROM payments
       WHERE checkout_request_id = ?
       ORDER BY id DESC
       LIMIT 1
       FOR UPDATE`,
      [checkoutRequestID]
    );

    if (payments.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        error: 'Payment transaction not found.'
      });
    }

    const payment = payments[0];

    if (payment.status !== 'PENDING') {
      await connection.rollback();

      return res.json({
        ResultCode: 0,
        ResultDesc: 'Callback already processed.'
      });
    }

    if (resultCode === 0) {
      await connection.query(
        `UPDATE payments
         SET status = 'PAID',
             mpesa_receipt_number = ?,
             result_code = ?,
             result_description = ?
         WHERE id = ?`,
        [
          receiptNumber,
          resultCode,
          resultDescription,
          payment.id
        ]
      );

      await connection.query(
        `UPDATE bookings
         SET payment_status = 'PAID',
             status = 'CONFIRMED'
         WHERE id = ?`,
        [payment.booking_id]
      );
    } else {
      await connection.query(
        `UPDATE payments
         SET status = 'FAILED',
             result_code = ?,
             result_description = ?
         WHERE id = ?`,
        [
          resultCode,
          resultDescription,
          payment.id
        ]
      );
    }

    await connection.commit();

    res.json({
      ResultCode: 0,
      ResultDesc: 'Callback processed successfully.'
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error('M-Pesa Callback Error:', error.message);

    res.status(500).json({
      error: 'Failed to process M-Pesa callback.'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});
app.listen(4000, () => {
  console.log('Quick Shuttle API: http://localhost:4000');
});

















