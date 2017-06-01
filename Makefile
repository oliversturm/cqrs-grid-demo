export SHELL=/bin/bash

PROJECTS = command-service query-service web-proxy validator testing
DOCKERS = $(PROJECTS:%=bd-%)

.PHONY: dcup dcupb test

test:
	for p in $(PROJECTS); do \
		pushd $$p && make test; popd ; \
	done

bd-webapp:
	pushd webapp && make publish; popd
	docker build -t sturm/cqrs-grid-demo/webapp -f Dockerfile-webapp .

bd-%:
	docker build -t sturm/cqrs-grid-demo/$* -f Dockerfile-$* .

build-docker: $(DOCKERS) bd-webapp

dcup:
	docker-compose up

dcup-nomounts:
	docker-compose -f docker-compose-nomounts.yml up

modules-install:
	for p in $(PROJECTS) db message-utils; do \
		pushd $$p && npm install; popd ; \
	done
	pushd webapp && make modules-install; popd

run-without-docker:
	@echo "Make sure you have mongodb running locally on port 27017"
	cd validator; node index.js & # port 3003
	cd query-service; MONGO_HOST=localhost node --harmony index.js & # port 3001
	cd command-service; MONGO_HOST=localhost VALSRVC_HOST=localhost node index.js & # port 3002
	cd testing; CMDSRVC_HOST=localhost node index.js & # port 3005
	cd web-proxy; QRYSRVC_HOST=localhost CMDSRVC_HOST=localhost VALSRVC_HOST=localhost \
		TESTSRVC_HOST=localhost node index.js & # port 3000
	cd webapp; dotnet run # port 8080
