require('dotenv').config();
const axios = require('axios');

async function testMpesa() {
  try {
    const credentials = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64');

    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${credentials}`
        }
      }
    );

    console.log('M-Pesa authentication successful');
    console.log('Access token received:', !!response.data.access_token);

  } catch (error) {
    console.error(
      'M-Pesa authentication failed:',
      error.response?.data || error.message
    );
  }
}

testMpesa();