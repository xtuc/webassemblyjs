MOCHA = ./node_modules/.bin/mocha --reporter=tap
BABEL = ./node_modules/.bin/babel
FLOW = ./node_modules/.bin/flow
HTTP_SERVER = ./node_modules/.bin/http-server -d-1
MARKDOWN_TO_HTML = ./node_modules/.bin/markdown

.PHONY: test build

make-executables:
	chmod +x ./lib/bin/*

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

generate-doc:
	$(MARKDOWN_TO_HTML) README.md

serve-docs:
	$(HTTP_SERVER) docs
