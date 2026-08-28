require('dotenv').config();
const axios = require('axios');

async function stkPush() {
  try {
    // 1. Get access token
    const credentials = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64');

    const tokenResponse = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${credentials}`
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // 2. Create timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, '')
      .slice(0, 14);

    // 3. Create password
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    // 4. Send STK Push
    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: Number(process.env.MPESA_SHORTCODE),
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: 1,
        PartyA: '254708374149',
        PartyB: Number(process.env.MPESA_SHORTCODE),
        PhoneNumber: '254708374149',
        CallBackURL: 'https://example.com/api/mpesa/callback',
        AccountReference: 'QS-TEST',
        TransactionDesc: 'Quick Shuttle'
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('M-Pesa STK Push response:');
    console.log(response.data);

  } catch (error) {
    console.error(
      'STK Push failed:',
      error.response?.data || error.message
    );
  }
}

stkPush();