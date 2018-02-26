MOCHA_OPTS =
NODE_OPTS =

LERNA = ./node_modules/.bin/lerna
FLOWTYPED = ./node_modules/.bin/flow-typed
NODE = node
PRETTIER = ./node_modules/.bin/prettier --ignore-path .prettierignore
MOCHA = ./node_modules/.bin/mocha --reporter=tap $(MOCHA_OPTS)
BABEL = ./node_modules/.bin/babel --ignore src/types/npm
ESLINT = ./node_modules/.bin/eslint
HTTP_SERVER = ./node_modules/.bin/http-server -d-1
MARKDOWN_TO_HTML = ./node_modules/.bin/markdown

REPL = $(NODE) ./packages/cli/lib/repl.js

.PHONY: test build

clean-all:
	rm -rf ./node_modules ./packages/*/node_modules

bootstrap: clean-all
	npm install
	$(LERNA) bootstrap

build:
	./scripts/build.sh

watch:
	$(BABEL) --out-dir lib/ src/ --watch

test-ci: test test-whitelisted-spec lint

test: build
	./scripts/test.sh

test-whitelisted-spec:
	$(REPL) spec/test/core/exports.wast
	$(REPL) spec/test/core/globals.wast
	$(REPL) spec/test/core/i32.wast
	$(REPL) spec/test/core/binary.wast

test-spec:
	./spec/test/core/run.py --wasm ./lib/bin/repl.js

lint:
	$(ESLINT) packages

publish: build
	lerna publish --force-publish=* --exact

repl: build
	$(NODE) $(NODE_OPTS) ./lib/repl

generate-doc:
	$(MARKDOWN_TO_HTML) README.md

serve-docs:
	$(HTTP_SERVER) docs

bench:
	$(NODE) $(NODE_OPTS) ./benchmark

fix:
	$(PRETTIER) --write "{packages,docs,benchmark}/**/*.js" "**/*.tjs"

flow-update-def:
	$(FLOWTYPED) install --libdefDir src/types
