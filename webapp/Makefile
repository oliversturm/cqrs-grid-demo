export SHELL=/bin/bash
export PATH := ./node_modules/.bin:$(PATH)

SRC = index.js

TESTS = $(wildcard tests/*.js)

.PHONY: test

test:
	mocha $(TESTS)
