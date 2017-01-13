export SHELL=/bin/bash
export PATH := ./node_modules/.bin:$(PATH)

SRC = index.js validator.js

TESTS = $(wildcard tests/*.js)

.PHONY: test build-docker

test:
	mocha $(TESTS)

build-docker:
	docker build -t sturm/cqrs-grid-demo/validator .
