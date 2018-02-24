MOCHA_OPTS =
NODE_OPTS =

LERNA = ./node_modules/.bin/lerna
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
	$(LERNA) bootstrap

build: clean
	./scripts/build.sh

watch:
	$(BABEL) --out-dir lib/ src/ --watch

test-ci: test test-whitelisted-spec lint

test-nobuild:
	./scripts/test.sh

test: build
	./scripts/test.sh

test-whitelisted-spec: make-executables
	./lib/bin/repl.js spec/test/core/exports.wast
	./lib/bin/repl.js spec/test/core/globals.wast
	./lib/bin/repl.js spec/test/core/i32.wast
	./lib/bin/repl.js spec/test/core/binary.wast

test-spec:
	./spec/test/core/run.py --wasm ./lib/bin/repl.js

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
	$(PRETTIER) --write "{src,test,docs,benchmark}/**/*.js" "**/*.tjs"

flow-update-def:
	$(FLOWTYPED) install --libdefDir src/types
