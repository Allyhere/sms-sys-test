# Mock Twilio Service

A local Twilio mock service built with NestJS for SMS development and testing.

## Architecture

```
┌────────────┐     POST /api/send-sms      ┌──────────────┐
│   Backend   │ ──────────────────────────→ │  Mock Twilio  │
│   (API)     │ ←─── status callbacks ────  │   (NestJS)    │
└────────────┘                              └──────────────┘
      ↑                                           ↑
      │ POST /api/webhooks/twilio                 │
      │ (inbound SMS)                             │
      │                                     ┌──────────────┐
      └────────────────────────────────────  │  Developer   │
                                            │  (curl/tests) │
                                            └──────────────┘
```

## Environment Variables

| Var | Default | Description |
|-----|---------|-------------|
| `MOCK_PORT` | `4000` | Port the mock service listens on |
| `WEBHOOK_URL` | `http://api:3000/api/webhooks/twilio` | Backend webhook URL for inbound SMS |
| `WEBHOOK_STATUS_URL` | `http://api:3000/api/webhooks/twilio/status` | Backend webhook URL for status callbacks |
| `DEFAULT_TO_NUMBER` | `+15550000000` | Default `To` number for inbound simulation |
| `MOCK_DELAY_MS` | `100` | Delay between status callbacks (ms) |
| `TWILIO_AUTH_TOKEN` | `""` | Auth token for signature generation |

## Endpoints

### `POST /api/send-sms`
Simulate sending an outbound SMS (called by the backend).

```bash
curl -X POST http://localhost:4000/api/send-sms \
  -H "Content-Type: application/json" \
  -d '{"to":"+15551234567","from":"+15550000000","body":"Hello","statusCallback":"http://api:3000/api/webhooks/twilio/status"}'
```

### `POST /simulate-inbound`
Simulate receiving an inbound SMS from a user.

```bash
curl -X POST http://localhost:4000/simulate-inbound \
  -H "Content-Type: application/json" \
  -d '{"from":"+15551234567","body":"Hi there","signature":true}'
```

### `POST /simulate-status`
Simulate a status callback for a specific message SID.

```bash
curl -X POST http://localhost:4000/simulate-status \
  -H "Content-Type: application/json" \
  -d '{"MessageSid":"SM123","MessageStatus":"delivered"}'
```

### `GET /api/logs`
Retrieve logs of all mock SMS activity.

```bash
# All logs
curl http://localhost:4000/api/logs

# Filtered by direction
curl http://localhost:4000/api/logs?direction=inbound&limit=10&from=+15551234567
```

### `DELETE /api/logs`
Clear all logs and reset metrics.

```bash
curl -X DELETE http://localhost:4000/api/logs
```

### `GET /health`
Health check endpoint.

```bash
curl http://localhost:4000/health
```

### `GET /metrics`
Get metrics counters.

```bash
curl http://localhost:4000/metrics
```

## Running with Docker Compose

```bash
# From project root
docker compose up -d --build

# Run integration tests
./mock-twilio/tests/integration-test.sh

# Tear down
docker compose down
```

## Running Tests

```bash
cd mock-twilio
npm test          # Unit tests
npm run test:e2e  # E2e tests
```
