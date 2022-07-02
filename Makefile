NODE_OPTS =

TEST_TIMEOUT = 10000

TRACE = 0
LERNA = ./node_modules/.bin/lerna
FLOWTYPED = ./node_modules/.bin/flow-typed
NODE = node
PRETTIER = ./node_modules/.bin/prettier --ignore-path .prettierignore
BABEL = ./node_modules/.bin/babel --ignore src/types/npm
ESLINT = ./node_modules/.bin/eslint
HTTP_SERVER = ./node_modules/.bin/http-server -d-1
MARKDOWN_TO_HTML = ./node_modules/.bin/markdown
YARN_EXTRA_ARGS =
YARN = yarn $(YARN_EXTRA_ARGS)

SPEC_TEST_DIR = testsuite

SPECTEST_RUNNER = $(NODE) ./packages/helper-testsuite-runner/lib/cli.js
REPL = $(NODE) ./packages/repl/lib/bin.js

.PHONY: test build

.PHONY: clean-all
clean-all:
	rm -rf ./node_modules ./packages/*/node_modules ./packages/*/{lib,esm}

bootstrap: clean-all
	$(YARN) install

build:
	WITH_TRACE=$(TRACE) ./scripts/build.sh

watch:
	WITH_TRACE=$(TRACE) ./scripts/build.sh --watch

test-ci: test test-whitelisted-spec lint
test-ci-windows: test test-whitelisted-spec

test-pnpm: clean-all
	$(YARN) install
	npm i -g pnpm
	$(LERNA) exec pnpm install
	make build lint

test: build
	./scripts/test.sh --timeout $(TEST_TIMEOUT)

test-whitelisted-spec:
	$(SPECTEST_RUNNER) $(SPEC_TEST_DIR)/exports.wast
	# FIXME(sven): issue with number binary encoding/decoding used in wast2json
	# $(SPECTEST_RUNNER) $(SPEC_TEST_DIR)/globals.wast
	$(SPECTEST_RUNNER) $(SPEC_TEST_DIR)/i32.wast
	$(SPECTEST_RUNNER) $(SPEC_TEST_DIR)/binary.wast
	$(SPECTEST_RUNNER) $(SPEC_TEST_DIR)/typecheck.wast
	$(SPECTEST_RUNNER) $(SPEC_TEST_DIR)/comments.wast
	$(SPECTEST_RUNNER) $(SPEC_TEST_DIR)/inline-module.wast
	$(SPECTEST_RUNNER) $(SPEC_TEST_DIR)/store_retval.wast
	$(SPECTEST_RUNNER) $(SPEC_TEST_DIR)/utf8-custom-section-id.wast
	$(SPECTEST_RUNNER) $(SPEC_TEST_DIR)/utf8-import-field.wast
	$(SPECTEST_RUNNER) $(SPEC_TEST_DIR)/utf8-import-module.wast
	$(SPECTEST_RUNNER) $(SPEC_TEST_DIR)/break-drop.wast
	$(SPECTEST_RUNNER) $(SPEC_TEST_DIR)/i64.wast

lint:
	$(ESLINT) packages

publish: build
	$(LERNA) publish --force-publish --exact --otp=${read}

repl: build
	$(NODE) $(NODE_OPTS) ./lib/repl

generate-doc:
	$(MARKDOWN_TO_HTML) README.md

serve-docs:
	$(HTTP_SERVER) docs

bench:
	$(NODE) $(NODE_OPTS) ./packages/webassemblyjs/benchmark

fix:
	$(PRETTIER) --write "{packages,docs,benchmark}/**/*.js"

flow-update-def:
	$(FLOWTYPED) install --libdefDir src/types
