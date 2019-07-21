# vars
CLIENT_DIR = --cwd ./src/client

.PHONY: client


help:
	@echo "\nPlease use 'make <target>' where <target> is one of: "
	@echo "  client           : to start the front-end web UI"
	@echo "  server           : to start the backend API server"
	@echo "  up               : to start both the front-end & backend services"


client:
	yarn ${CLIENT_DIR} start

server:
	echo "pending ..."

up:
	@echo ">> Starting the Server & Client services ..."
	$(MAKE) client &
	$(MAKE) server &
