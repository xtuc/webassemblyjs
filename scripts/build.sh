#!/usr/bin/env bash
set -e

ROOT_DIR=$(cd $(dirname $0)/..; pwd)
cd $ROOT_DIR

OPTS="$@"

for D in ./packages/*; do
  if [ ! -d "${D}/src" ]; then
    continue
  fi

  echo "Building $D $OPTS..."

  # Clean
  rm -rf "${D}/lib"

  # Build
  ./node_modules/.bin/babel "${D}/src" \
    --out-dir "${D}/lib" \
    --ignore packages/dce/src/libwabt.js \
    $OPTS &
done

wait

cp -v packages/dce/src/libwabt.js packages/dce/lib/libwabt.js
