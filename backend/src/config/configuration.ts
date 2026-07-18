export default () => ({
  port: parseInt(process.env.API_PORT || '3000', 10),
  database: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'sms',
    password: process.env.POSTGRES_PASSWORD || 'smspassword',
    name: process.env.POSTGRES_DB || 'sms_system',
  },
});
