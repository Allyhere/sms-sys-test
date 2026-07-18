# SMS Viewer

A full-stack SMS management system with a NestJS backend, React frontend, and local Twilio mock service for development.

## Services

- **Postgres** — Database for conversations and messages
- **API** (backend/) — NestJS backend on port 3000
- **Mock Twilio** (mock-twilio/) — NestJS mock Twilio service on port 4000
- **Frontend** (frontend/) — React + Vite app on port 80

## Quickstart

```bash
# Copy env file
cp .env.example .env

# Start all services
docker compose up -d --build

# Simulate an inbound SMS
curl -X POST http://localhost:4000/simulate-inbound \
  -H "Content-Type: application/json" \
  -d '{"from":"+15551234567","body":"Hello"}'

# Check logs
curl http://localhost:4000/api/logs

# Tear down
docker compose down
```

## Development

All three apps (backend, mock-twilio, frontend) share a single `.env` file at the project root. See `.env.example` for all available variables.

### Backend

```bash
cd backend && npm install && npm run start:dev
```

### Mock Twilio

```bash
cd mock-twilio && npm install && npm run start:dev
```

### Frontend

```bash
cd frontend && npm install && npm run dev
```
