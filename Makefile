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

run-without-docker:
	@echo "Make sure you have mongodb running locally on port 27017"
	if echo $$EXCLUDE | grep -v -q VALIDATOR; then cd validator; node index.js & fi # port 3003
	if echo $$EXCLUDE | grep -v -q QUERY; then cd query-service; MONGO_HOST=localhost node --harmony index.js & fi # port 3001
	if echo $$EXCLUDE | grep -v -q COMMAND; then cd command-service; MONGO_HOST=localhost VALSRVC_HOST=localhost node index.js & fi # port 3002
	if echo $$EXCLUDE | grep -v -q TESTING; then cd testing; CMDSRVC_HOST=localhost node index.js & fi # port 3005
	if echo $$EXCLUDE | grep -v -q PROXY; then cd web-proxy; QRYSRVC_HOST=localhost CMDSRVC_HOST=localhost VALSRVC_HOST=localhost \
		TESTSRVC_HOST=localhost node index.js & fi # port 3000
	if echo $$EXCLUDE | grep -v -q WEBAPP; then cd webapp; node index.js & fi # port 8080

stop-run-without-docker:
	skill node

