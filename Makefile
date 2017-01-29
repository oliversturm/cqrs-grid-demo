export SHELL=/bin/bash

PROJECTS = command-service query-service web-proxy validator webapp testing
DOCKERS = $(PROJECTS:%=bd-%)

.PHONY: dcup dcupb test

test:
	for p in $(PROJECTS); do \
		pushd $$p && make test; popd ; \
	done

bd-%:
	docker build -t sturm/cqrs-grid-demo/$* -f Dockerfile-$* .

build-docker: $(DOCKERS)

dcup:
	docker-compose up

dcup-nomounts:
	docker-compose -f docker-compose-nomounts.yml up

modules-install:
	for p in $(PROJECTS) db message-utils; do \
		pushd $$p && npm install; popd ; \
	done
	pushd webapp/static && ../node_modules/.bin/bower install; popd
