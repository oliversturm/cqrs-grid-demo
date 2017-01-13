export SHELL=/bin/bash
export PATH := ./node_modules/.bin:$(PATH)

SRC = index.js proxy.js routes.js

TESTS = $(wildcard tests/*.js)

.PHONY: build-docker test

test:
	mocha $(TESTS)

build-docker:
	docker build -t sturm/cqrs-grid-demo/web-proxy .
