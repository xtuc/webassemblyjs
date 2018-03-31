#!/usr/bin/env bash

OPTS="$@"

set -e

./node_modules/.bin/mocha "./packages/*/test/**/*.js" \
    --recursive \
    --reporter=tap \
    $OPTS
