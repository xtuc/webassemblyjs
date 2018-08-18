#!/usr/bin/env bash

OPTS="$@"

set -e

PACKAGES="./packages/*"

./node_modules/.bin/mocha "$PACKAGES/test/**/*.js" \
    --recursive \
    --reporter=tap \
    $OPTS
