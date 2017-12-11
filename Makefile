MOCHA = ./node_modules/.bin/mocha --reporter=tap
BABEL = ./node_modules/.bin/babel
FLOW = ./node_modules/.bin/flow
HTTP_SERVER = ./node_modules/.bin/http-server -d-1

.PHONY: test build

build:
	$(BABEL) --out-dir lib/ src/

test: build
	$(MOCHA) --recursive

lint:
	$(FLOW) src/

publish: build
	npm publish

repl: build
	node ./lib/repl

serve-examples:
	$(HTTP_SERVER) docs/examples
