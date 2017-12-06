MOCHA = ./node_modules/.bin/mocha --reporter=tap
BABEL = ./node_modules/.bin/babel
FLOW = ./node_modules/.bin/flow

.PHONY: test build

build:
	$(BABEL) --out-dir lib/ src/

test: build
	$(MOCHA) --recursive

lint:
	$(FLOW) src/

publish: build
	npm publish
