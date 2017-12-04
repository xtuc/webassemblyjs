MOCHA = ./node_modules/.bin/mocha --reporter=tap
BABEL = ./node_modules/.bin/babel

.PHONY: test build

build:
	$(BABEL) --out-dir lib/ src/

test: build
	$(MOCHA) --recursive
