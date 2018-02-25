#!/usr/bin/env bash
set -e

./node_modules/.bin/mocha "./packages/*/test/**/*.js" \
    --recursive \
    --reporter=tap
