SHELL := /bin/bash # Use bash syntax

# vars
CLIENT_DIR = --cwd ./src/client
SERVER_DIR = --cwd ./src/server

.PHONY: clean install client server up lint lint-client lint-server \
				test test-client test-server pre-commit pre-commit-client \
				pre-commit-server


help:
	@echo "\nPlease use 'make <target>' where <target> is one of: "
	@echo "  clean            : to remove all temporary unnecessary resources from code base"
	@echo "  client           : to start the front-end web UI"
	@echo "  server           : to start the backend API server"
	@echo "  up               : to start both the front-end & backend services"
	@echo "  lint-client      : to lint the front-end code"
	@echo "  lint-server      : to lint the backend code"
	@echo "  lint             : to lint both front-end and backend code"
	@echo "  test-client      : to run unit tests for the front-end code"
	@echo "  test-server      : to run unit tests for the backend code"
	@echo "  test             : to run unit tests for both front-end and backend code"


install:
	yarn ${CLIENT_DIR} install
	yarn ${SERVER_DIR} install

client:
	@source .env && \
	PORT=${WEB_PORT} yarn ${CLIENT_DIR} start

server:
	@source .env && \
	yarn ${SERVER_DIR} start

lint-client:
	@set -e; \
	yarn ${CLIENT_DIR} lint

lint-server:
	@set -e; \
	yarn ${SERVER_DIR} lint;

lint: lint-client lint-server

test-client:
	@set -e; \
	yarn ${CLIENT_DIR} test

test-server:
	@set -e; \
	[[ -f .env.test ]] && source .env.test; \
	export LOG_LEVEL=silent; \
	yarn ${SERVER_DIR} test

test-file:
	@set -e; \
	[[ -f .env.test ]] && source .env.test; \
	yarn ${SERVER_DIR} test-file ${args}

test: test-client test-server

pre-commit: lint test
pre-commit-client: lint-client test-client
pre-commit-server: lint-server test-server

push: pre-commit
	@set -e; \
	git push -u origin
