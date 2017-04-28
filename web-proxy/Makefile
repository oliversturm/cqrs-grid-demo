export SHELL=/bin/bash
export PATH := ./node_modules/.bin:$(PATH)

SRC = index.js proxy.js routes.js

TESTS = $(wildcard tests/*.js)

.PHONY: test

test:
	mocha --harmony $(TESTS) 

