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
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60000', 10),
    limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  circuitBreaker: {
    timeout: parseInt(process.env.CB_TIMEOUT || '10000', 10),
    errorThresholdPercentage: parseInt(
      process.env.CB_ERROR_THRESHOLD || '50',
      10,
    ),
    resetTimeout: parseInt(process.env.CB_RESET_TIMEOUT || '30000', 10),
  },
});
