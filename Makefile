export SHELL=/bin/bash
export PATH := ./node_modules/.bin:$(PATH)

PROJECTS = command-service query-service web-proxy

.PHONY: dcup dcupb test

test:
	for p in $(PROJECTS); do \
		pushd $$p && make test; popd ; \
	done

dcup:
	docker-compose up

dcupb:
	docker-compose up --build
