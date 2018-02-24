#!/usr/bin/env bash
set -e

ROOT_DIR=$(cd $(dirname $0)/..; pwd)
cd $ROOT_DIR

PACKAGE="$1"

for D in ./packages/*; do
  if [ ! -d "${D}/src" ]; then
    continue
  fi

  if [ -n "$PACKAGE" ] && [ `basename $D` != "$PACKAGE" ]; then
    continue
  fi

  if [ $D = "./packages/cli" ]; then
    continue
  fi

  echo "Testing $D..."

  ./node_modules/.bin/mocha "${D}/test" \
    --recursive \
    --reporter=tap
done
