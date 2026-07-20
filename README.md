# SMS Viewer

A full-stack conversational SMS system with a NestJS backend, React frontend, and local Twilio mock service for development.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full architecture and design document covering:

- System architecture and data flow (with Mermaid diagram)
- How the 5-second webhook timeout is handled (BullMQ queue)
- Message processing decoupling strategy
- Idempotency and duplicate prevention
- How messages are not lost
- Data modeling decisions
- Tradeoffs and production scaling notes

See [PROCESS.md](./PROCESS.md) for the incremental development log.

## Services

| Service       | Port | Description                                     |
| ------------- | ---- | ----------------------------------------------- |
| Postgres      | 5432 | Database for conversations and messages         |
| Redis         | 6379 | BullMQ job queue for async message processing   |
| API (backend) | 3000 | NestJS backend — webhooks, conversations API    |
| Mock Twilio   | 4000 | Simulates Twilio for local testing              |
| Frontend      | 80   | React + Vite admin UI for viewing conversations |

## Quickstart

```bash
# 1. Copy env file
cp .env.example .env

# 2. Start everything
make start

# 3. Send a test SMS
make simulate

# 4. View conversations
make conversations

# 5. Open the frontend
open http://localhost
```

## Makefile Commands

Run `make help` to see all commands. Here are the main ones:

### Setup

```bash
make install          # Install deps for all services
make install-backend  # Backend only
make install-mock     # Mock Twilio only
make install-frontend # Frontend only
```

### Docker — Start / Stop / Logs

```bash
make start            # Build and start all containers
make stop             # Stop all containers
make restart          # Restart all containers
make logs             # Tail all logs
make logs-api         # Tail API logs only
make logs-mock        # Tail mock-twilio logs only
make logs-frontend    # Tail frontend logs only
make logs-db          # Tail postgres logs only
make logs-redis       # Tail redis logs only
```

### Tests

```bash
make test             # Unit tests for all services
make test-backend     # Backend unit tests
make test-mock        # Mock Twilio unit tests
make test-frontend    # Frontend lint + build check
make test-e2e         # Backend e2e tests
make test-all         # Everything (unit + e2e)
```

### Stress Tests

> Requires the stack to be running (`make start`).

```bash
make stress               # Default: 100 req/s for 60s
make stress-webhook       # Same as above
make stress-concurrency   # High concurrency: 100 req/s, 60s
make stress-burst         # Burst: 50 → 200 → 50 req/s
make stress-sustained     # Sustained: 20 req/s for 10 min
```

### Manual Testing Helpers

```bash
make simulate         # Send a test inbound SMS
make health           # Check API health
make conversations    # List all conversations (JSON)
make conversation CONV_ID=<uuid>  # Show a specific conversation
```

### Cleanup

```bash
make clean            # Stop and remove containers + volumes
```

## Manual Testing with curl

### Send an inbound SMS

```bash
curl -X POST http://localhost:4000/simulate-inbound \
  -H "Content-Type: application/json" \
  -d '{"from":"+15551234567","body":"Hello world"}'
```

Response:

```json
{ "sid": "SM...", "status": "delivered", "webhookStatus": 200 }
```

### Check API health

```bash
curl http://localhost:3000/api/health
```

### List all conversations

```bash
curl http://localhost:3000/api/conversations | python3 -m json.tool
```

### Get a specific conversation

```bash
# Replace <uuid> with a conversation ID from the list above
curl http://localhost:3000/api/conversations/<uuid> | python3 -m json.tool
```

### Send an outbound SMS via mock Twilio

```bash
curl -X POST http://localhost:4000/api/send-sms \
  -H "Content-Type: application/json" \
  -d '{"to":"+15551234567","from":"+15550000000","body":"Test outbound"}'
```

### Simulate a status callback

```bash
curl -X POST http://localhost:4000/simulate-status \
  -H "Content-Type: application/json" \
  -d '{"MessageSid":"SMtest123","MessageStatus":"delivered"}'
```

### Check mock Twilio logs

```bash
curl http://localhost:4000/api/logs | python3 -m json.tool
```

### Check mock Twilio metrics

```bash
curl http://localhost:4000/metrics | python3 -m json.tool
```

### Validation checks

```bash
# Invalid UUID → 400
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/conversations/not-a-uuid

# Non-existent UUID → 404
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/conversations/00000000-0000-0000-0000-000000000000
```

## Using a Real Twilio Account (Local with ngrok)

```bash
# 1. Start the stack
make start

# 2. Expose the API to the internet
ngrok http 3000
# → copy the https URL (e.g. https://abc123.ngrok.app)
```

Set these in your `.env`:

```env
TWILIO_MODE=real
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1555YOUR_TWILIO_NUMBER
TWILIO_VALIDATE_SIGNATURE=true
```

Then in the [Twilio Console](https://console.twilio.com), configure your phone number's webhook:

- **A message comes in** → `https://abc123.ngrok.app/api/webhooks/twilio` (POST)
- **Status callback** → `https://abc123.ngrok.app/api/webhooks/twilio/status` (POST)

Restart: `make restart`

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
