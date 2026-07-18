export default () => ({
  port: parseInt(process.env.MOCK_PORT || '4000', 10),
  webhookUrl: process.env.WEBHOOK_URL || 'http://api:3000/api/webhooks/twilio',
  webhookStatusUrl:
    process.env.WEBHOOK_STATUS_URL ||
    'http://api:3000/api/webhooks/twilio/status',
  defaultToNumber: process.env.DEFAULT_TO_NUMBER || '+15550000000',
  mockDelayMs: parseInt(process.env.MOCK_DELAY_MS || '100', 10),
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
});
