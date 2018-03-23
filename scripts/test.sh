#!/usr/bin/env bash

set -e

OPTS="$@"

./node_modules/.bin/mocha "./packages/*/test/**/*.js" \
    --recursive \
    --reporter=tap \
    $OPTS
