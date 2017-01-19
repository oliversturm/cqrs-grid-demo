export SHELL=/bin/bash
export PATH := ./node_modules/.bin:$(PATH)

SRC = index.js testing.js

.PHONY: build-docker

build-docker:
	docker build -t sturm/cqrs-grid-demo/testing .
