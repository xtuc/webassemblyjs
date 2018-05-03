#!/usr/bin/env bash

OPTS="$@"

set -e

PACKAGES="./packages/*"


## Launch pretest scripts if provided
for D in ./packages/*; do
    (npm run pretest --silent --prefix $D || true) &
    echo "launch pretest target for $D ..."
done

wait

./node_modules/.bin/mocha "$PACKAGES/test/**/*.js" \
    --recursive \
    --reporter=tap \
    $OPTS
