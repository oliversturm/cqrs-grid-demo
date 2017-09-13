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
	for p in $(PROJECTS) db message-utils resolve-bus-seneca; do \
		pushd $$p && npm install; popd ; \
	done
	pushd webapp/static && ../node_modules/.bin/bower install; popd

run-without-docker:
	@echo "Make sure you have mongodb running locally on port 27017, and rabbitmq on port 5672"
	if echo $$EXCLUDE | grep -v -q VALIDATOR; then cd validator; RABBITMQ_HOST=localhost node index.js & fi
	if echo $$EXCLUDE | grep -v -q QUERY; then cd query-service; MONGO_HOST=localhost RABBITMQ_HOST=localhost node --harmony index.js & fi
	if echo $$EXCLUDE | grep -v -q COMMAND; then cd command-service; MONGO_HOST=localhost RABBITMQ_HOST=localhost node index.js & fi
	if echo $$EXCLUDE | grep -v -q READMODEL; then cd readmodel; MONGO_HOST=localhost RABBITMQ_HOST=localhost node index.js & fi
	if echo $$EXCLUDE | grep -v -q QRYCHANGES; then cd query-change-detector; RABBITMQ_HOST=localhost node index.js & fi
	if echo $$EXCLUDE | grep -v -q TESTING; then cd testing; RABBITMQ_HOST=localhost node index.js & fi
	if echo $$EXCLUDE | grep -v -q PROXY; then cd web-proxy; RABBITMQ_HOST=localhost node index.js & fi
	if echo $$EXCLUDE | grep -v -q WEBAPP; then cd webapp; node index.js & fi # port 8080

stop-run-without-docker:
	skill node

push-to-aws:
	@echo "Make sure you have run 'aws ecr get-login --no-include-email --region eu-west-1' and executed the output."
	for d in $(DOCKERS); do \
		aws ecr create-repository --repository-name $$d; \
		docker tag $$d:latest 505978303296.dkr.ecr.eu-west-1.amazonaws.com/$$d:latest; \
		docker push 505978303296.dkr.ecr.eu-west-1.amazonaws.com/$$d:latest; \
	done
