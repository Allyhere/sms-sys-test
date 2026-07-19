.PHONY: help install start stop restart logs logs-api logs-mock logs-frontend logs-db logs-redis \
       test test-backend test-mock test-frontend test-e2e test-all \
       stress stress-webhook stress-concurrency stress-burst stress-sustained \
       clean simulate health conversations conversation

## ─────────────────────────────────────────────────────────────
##  SMS System — Makefile
##  Run `make help` to see all available commands.
## ─────────────────────────────────────────────────────────────

help: ## Show this help
	@echo "Usage: make <target>"
	@echo ""
	@echo "Setup:"
	@echo "  make install          Install dependencies for all services"
	@echo "  make install-backend  Install backend dependencies only"
	@echo "  make install-mock     Install mock-twilio dependencies only"
	@echo "  make install-frontend Install frontend dependencies only"
	@echo ""
	@echo "Docker (all services):"
	@echo "  make start            Build and start all containers (detached)"
	@echo "  make stop             Stop all containers"
	@echo "  make restart          Stop and start all containers"
	@echo "  make logs             Tail logs for all services"
	@echo "  make logs-api         Tail API logs"
	@echo "  make logs-mock        Tail mock-twilio logs"
	@echo "  make logs-frontend    Tail frontend logs"
	@echo "  make logs-db          Tail postgres logs"
	@echo "  make logs-redis       Tail redis logs"
	@echo ""
	@echo "Testing:"
	@echo "  make test             Run unit tests for all services"
	@echo "  make test-backend     Run backend unit tests"
	@echo "  make test-mock        Run mock-twilio unit tests"
	@echo "  make test-frontend    Run frontend lint + build check"
	@echo "  make test-e2e         Run backend e2e tests"
	@echo "  make test-all         Run all tests (unit + e2e)"
	@echo ""
	@echo "Stress tests (requires running stack):"
	@echo "  make stress           Run default webhook stress test (100 req/s, 60s)"
	@echo "  make stress-webhook   Same as above"
	@echo "  make stress-concurrency  High concurrency (100 req/s, 60s)"
	@echo "  make stress-burst     Burst traffic (50->200->50 req/s)"
	@echo "  make stress-sustained Sustained load (20 req/s, 10 min)"
	@echo ""
	@echo "Manual testing:"
	@echo "  make simulate         Send a test inbound SMS via mock-twilio"
	@echo "  make health           Check API health endpoint"
	@echo "  make conversations    List all conversations (JSON)"
	@echo "  make conversation     Show a specific conversation (CONV_ID=...)"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean            Stop and remove containers + volumes"

## ── Setup ──

install: install-backend install-mock install-frontend ## Install all dependencies

install-backend:
	cd backend && npm install

install-mock:
	cd mock-twilio && npm install

install-frontend:
	cd frontend && npm install

## ── Docker ──

start: ## Build and start all containers
	docker compose up --build -d

stop: ## Stop all containers
	docker compose down

restart: ## Restart all containers
	docker compose restart

logs: ## Tail all logs
	docker compose logs -f --tail=50

logs-api: ## Tail API logs
	docker compose logs -f --tail=50 api

logs-mock: ## Tail mock-twilio logs
	docker compose logs -f --tail=50 mock-twilio

logs-frontend: ## Tail frontend logs
	docker compose logs -f --tail=50 frontend

logs-db: ## Tail postgres logs
	docker compose logs -f --tail=50 postgres

logs-redis: ## Tail redis logs
	docker compose logs -f --tail=50 redis

## ── Testing ──

test: test-backend test-mock test-frontend ## Run unit tests for all services

test-backend: ## Run backend unit tests
	cd backend && npm test

test-mock: ## Run mock-twilio unit tests
	cd mock-twilio && npm test

test-frontend: ## Run frontend lint + build check
	cd frontend && npm run lint && npm run build

test-e2e: ## Run backend e2e tests
	cd backend && npm run test:e2e

test-all: test test-e2e ## Run all tests (unit + e2e)

## ── Stress tests (require running stack) ──

stress: stress-webhook ## Run default stress test

stress-webhook: ## 100 req/s for 60s
	cd backend && npx artillery run test/stress/config/artillery-webhook.yml

stress-concurrency: ## High concurrency 100 req/s for 60s
	cd backend && npx artillery run test/stress/scenarios/high-concurrency.yml

stress-burst: ## Burst traffic 50->200->50 req/s
	cd backend && npx artillery run test/stress/scenarios/burst-traffic.yml

stress-sustained: ## Sustained 20 req/s for 10 min
	cd backend && npx artillery run test/stress/scenarios/sustained-load.yml

## ── Manual testing helpers ──

simulate: ## Send a test inbound SMS
	curl -s -X POST http://localhost:4000/simulate-inbound \
		-H "Content-Type: application/json" \
		-d '{"from":"+15551234567","body":"Hello from make!"}' | python3 -m json.tool

health: ## Check API health
	curl -s http://localhost:3000/api/health | python3 -m json.tool

conversations: ## List all conversations
	curl -s http://localhost:3000/api/conversations | python3 -m json.tool

conversation: ## Show specific conversation: make conversation CONV_ID=<uuid>
	@if [ -z "$(CONV_ID)" ]; then echo "Usage: make conversation CONV_ID=<uuid>"; exit 1; fi
	curl -s http://localhost:3000/api/conversations/$(CONV_ID) | python3 -m json.tool

## ── Cleanup ──

clean: ## Stop and remove containers + volumes
	docker compose down -v
