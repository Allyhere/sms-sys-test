export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'sms',
    password: process.env.POSTGRES_PASSWORD || 'smspassword',
    name: process.env.POSTGRES_DB || 'sms_system',
  },
  twilio: {
    mode: process.env.TWILIO_MODE || 'mock',
    mockUrl: process.env.MOCK_TWILIO_URL || 'http://mock-twilio:4000',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    fromNumber: process.env.TWILIO_FROM_NUMBER || '+15550000000',
    validateSignature: process.env.TWILIO_VALIDATE_SIGNATURE === 'true',
  },
});
