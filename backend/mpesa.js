const axios = require('axios');

async function getAccessToken() {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;

  const response = await axios.get(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      auth: {
        username: key,
        password: secret
      }
    }
  );

  return response.data.access_token;
}

function getTimestamp() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

async function stkPush({ phone, amount, bookingNo }) {
  const accessToken = await getAccessToken();

  const timestamp = getTimestamp();

  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;

  const password = Buffer.from(
    `${shortcode}${passkey}${timestamp}`
  ).toString('base64');

  let formattedPhone = String(phone).replace(/\D/g, '');

  if (formattedPhone.startsWith('0')) {
    formattedPhone = `254${formattedPhone.substring(1)}`;
  }

  if (formattedPhone.startsWith('+')) {
    formattedPhone = formattedPhone.substring(1);
  }

  const response = await axios.post(
    'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: bookingNo,
      TransactionDesc: `Quick Shuttle ${bookingNo}`
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
}

module.exports = {
  stkPush
};