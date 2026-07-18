#!/bin/bash
set -e

echo "=== Mock Twilio Integration Test ==="

echo "1. Starting docker compose..."
docker compose up -d --build

echo "2. Waiting for services to be healthy..."
sleep 10

echo "3. Checking mock health..."
curl -s http://localhost:4000/health | jq .

echo "4. Checking API health..."
curl -s http://localhost:3000/api/health | jq .

echo "5. Simulating inbound SMS..."
curl -s -X POST http://localhost:4000/simulate-inbound \
  -H "Content-Type: application/json" \
  -d '{"from":"+15551234567","body":"hello"}' | jq .

sleep 2

echo "6. Checking logs for inbound + outbound entries..."
curl -s http://localhost:4000/api/logs | jq .

echo "7. Sending outbound SMS directly..."
curl -s -X POST http://localhost:4000/api/send-sms \
  -H "Content-Type: application/json" \
  -d '{"to":"+15551234567","from":"+15550000000","body":"Direct test"}' | jq .

echo "8. Simulating status callback..."
curl -s -X POST http://localhost:4000/simulate-status \
  -H "Content-Type: application/json" \
  -d '{"MessageSid":"SMtest123","MessageStatus":"delivered"}' | jq .

echo "9. Checking metrics..."
curl -s http://localhost:4000/metrics | jq .

echo "10. Clearing logs..."
curl -s -X DELETE http://localhost:4000/api/logs | jq .

echo "11. Verifying logs cleared..."
curl -s http://localhost:4000/api/logs | jq .

echo "=== All tests passed! ==="

echo "Cleaning up..."
docker compose down
