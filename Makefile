export SHELL=/bin/bash

PROJECTS = command-service query-service web-proxy validator webapp testing readmodel query-change-detector
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
	for p in $(PROJECTS) db message-utils eventex-fork; do \
		pushd $$p && npm install; popd ; \
	done
	pushd webapp/static && ../node_modules/.bin/bower install; popd

run-without-docker:
	@echo "Make sure you have mongodb running locally on port 27017, and rabbitmq on port 5672"
	cd validator; RABBITMQ_HOST=localhost node index.js &
	cd query-service; MONGO_HOST=localhost RABBITMQ_HOST=localhost node --harmony index.js &
	cd command-service; MONGO_HOST=localhost RABBITMQ_HOST=localhost node index.js &
	cd readmodel; MONGO_HOST=localhost RABBITMQ_HOST=localhost node index.js &
	cd query-change-detector; RABBITMQ_HOST=localhost node index.js &
	cd testing; RABBITMQ_HOST=localhost node index.js &
	cd web-proxy; RABBITMQ_HOST=localhost node index.js &
	cd webapp; node index.js & # port 8080
