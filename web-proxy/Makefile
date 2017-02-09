export SHELL=/bin/bash
export PATH := ./node_modules/.bin:$(PATH)

SRC = index.js proxy.js routes.js

TESTS = $(wildcard tests/*.js)

.PHONY: test

test:
	ID=`docker run -p=27017:27017 -d mongo:latest`; \
	sleep 2; \
	mocha --harmony $(TESTS) ; \
	docker kill $$ID

