# vars
CLIENT_DIR = --cwd ./src/client
SERVER_DIR = --cwd ./src/server

.PHONY: install client server lint test pre-commit


help:
	@echo "\nPlease use 'make <target>' where <target> is one of: "
	@echo "  client           : to start the front-end web UI"
	@echo "  server           : to start the backend API server"
	@echo "  up               : to start both the front-end & backend services"

install:
	yarn ${CLIENT_DIR} install
	yarn ${SERVER_DIR} install

client:
	source .env && \
	PORT=${WEB_PORT} yarn ${CLIENT_DIR} start

server:
	source .env && \
	yarn ${SERVER_DIR} start

lint-client:
	set -e; \
	yarn ${CLIENT_DIR} lint

lint-server:
	set -e; \
	yarn ${SERVER_DIR} lint;

lint: lint-client lint-server

test-client:
	set -e; \
	yarn ${CLIENT_DIR} test

test-server:
	set -e; \
	export VERSITY_API_URL='http://api.versity.local'; \
	yarn ${SERVER_DIR} test

test: test-client test-server

pre-commit: lint test

push: pre-commit
	set -e; \
	git push -u origin
