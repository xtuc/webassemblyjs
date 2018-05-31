#!/usr/bin/env bash
set -e

ROOT_DIR=$(cd $(dirname $0)/..; pwd)
cd $ROOT_DIR

OPTS="$@"

sh ./scripts/generate-ast-utils.sh
./scripts/generate-polyfills.js

if [ -z "$DISABLE_FUZZER_TEST" ]; then
  yarn --cwd ./packages/floating-point-hex-parser run build-fuzzer
fi

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

cp -r packages/proposal-sign-extension-ops/src/polyfills packages/proposal-sign-extension-ops/lib/
cp -v packages/dce/src/libwabt.js packages/dce/lib/libwabt.js
