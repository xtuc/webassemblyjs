MOCHA_OPTS =
NODE_OPTS =

NODE = node
MOCHA = ./node_modules/.bin/mocha --reporter=tap $(MOCHA_OPTS)
BABEL = ./node_modules/.bin/babel
FLOW = ./node_modules/.bin/flow
HTTP_SERVER = ./node_modules/.bin/http-server -d-1
MARKDOWN_TO_HTML = ./node_modules/.bin/markdown

.PHONY: test build

make-executables:
	chmod +x ./lib/bin/*

clean:
	rm -rf ./lib

clean-all: clean
	rm -rf ./node_modules

bootstrap: clean-all
	npm install

build: clean
	$(BABEL) --out-dir lib/ src/

watch:
	$(BABEL) --out-dir lib/ src/ --watch

test: build
	$(MOCHA) --recursive

lint:
	$(FLOW) src/

publish: build
	npm publish

repl: build
	$(NODE) $(NODE_OPTS) ./lib/repl

generate-doc:
	$(MARKDOWN_TO_HTML) README.md

serve-docs:
	$(HTTP_SERVER) docs

bench:
	$(NODE) $(NODE_OPTS) ./benchmark
