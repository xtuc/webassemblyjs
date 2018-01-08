MOCHA_OPTS =
NODE_OPTS =

FLOWTYPED = ./node_modules/.bin/flow-typed
NODE = node
PRETTIER = ./node_modules/.bin/prettier
MOCHA = ./node_modules/.bin/mocha --reporter=tap $(MOCHA_OPTS)
BABEL = ./node_modules/.bin/babel --ignore src/types/npm
ESLINT = ./node_modules/.bin/eslint
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

test-ci: test lint

test: build
	$(MOCHA) --recursive --grep spec --invert

test-spec: build
	$(MOCHA) --grep spec

lint:
	$(ESLINT) src test docs benchmark

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

fix:
	$(PRETTIER) --write "{src,test,docs,benchmark}/**/*.js"

flow-update-def:
	$(FLOWTYPED) install --libdefDir src/types
