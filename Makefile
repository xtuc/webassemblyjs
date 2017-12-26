NODE_OPTS =
NODE = node
MOCHA = ./node_modules/.bin/mocha --reporter=tap
BABEL = ./node_modules/.bin/babel
FLOW = ./node_modules/.bin/flow
HTTP_SERVER = ./node_modules/.bin/http-server -d-1
MARKDOWN_TO_HTML = ./node_modules/.bin/markdown

.PHONY: test build

make-executables:
	chmod +x ./lib/bin/*

clean:
	rm -rf ./lib

build: clean
	$(BABEL) --out-dir lib/ src/

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
