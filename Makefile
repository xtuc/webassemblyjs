MOCHA_OPTS =
NODE_OPTS =

TEST_TIMEOUT = 4000

LERNA = ./node_modules/.bin/lerna
FLOWTYPED = ./node_modules/.bin/flow-typed
NODE = node
PRETTIER = ./node_modules/.bin/prettier --ignore-path .prettierignore
MOCHA = ./node_modules/.bin/mocha --reporter=tap $(MOCHA_OPTS)
BABEL = ./node_modules/.bin/babel --ignore src/types/npm
ESLINT = ./node_modules/.bin/eslint
HTTP_SERVER = ./node_modules/.bin/http-server -d-1
MARKDOWN_TO_HTML = ./node_modules/.bin/markdown

SPEC_TEST_DIR = testsuite

REPL = $(NODE) ./packages/repl/lib/bin.js

.PHONY: test build

clean-all:
	rm -rf ./node_modules ./packages/*/node_modules ./packages/*/lib

bootstrap: clean-all
	yarn install
	$(LERNA) bootstrap

build:
	./scripts/build.sh

watch:
	./scripts/build.sh --watch

test-ci: test test-whitelisted-spec lint
test-ci-windows: test test-whitelisted-spec

test-pnpm: clean-all
	yarn install
	npm i -g pnpm
	$(LERNA) exec pnpm install
	make build lint

test: build
	./scripts/test.sh --timeout $(TEST_TIMEOUT)

test-whitelisted-spec:
	$(REPL) $(SPEC_TEST_DIR)/exports.wast
	$(REPL) $(SPEC_TEST_DIR)/globals.wast
	$(REPL) $(SPEC_TEST_DIR)/i32.wast
	$(REPL) $(SPEC_TEST_DIR)/binary.wast
	$(REPL) $(SPEC_TEST_DIR)/typecheck.wast
	$(REPL) $(SPEC_TEST_DIR)/comments.wast
	$(REPL) $(SPEC_TEST_DIR)/inline-module.wast
	$(REPL) $(SPEC_TEST_DIR)/store_retval.wast
	$(REPL) $(SPEC_TEST_DIR)/utf8-custom-section-id.wast
	$(REPL) $(SPEC_TEST_DIR)/utf8-import-field.wast
	$(REPL) $(SPEC_TEST_DIR)/utf8-import-module.wast

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
