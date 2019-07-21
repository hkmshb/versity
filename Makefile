# vars
CLIENT_DIR = --cwd ./src/client
SERVER_DIR = --cwd ./src/server

.PHONY: client


help:
	@echo "\nPlease use 'make <target>' where <target> is one of: "
	@echo "  client           : to start the front-end web UI"
	@echo "  server           : to start the backend API server"
	@echo "  up               : to start both the front-end & backend services"


client:
	source .env && \
	PORT=${WEB_PORT} yarn ${CLIENT_DIR} start

server:
	source .env && \
	yarn ${SERVER_DIR} start
