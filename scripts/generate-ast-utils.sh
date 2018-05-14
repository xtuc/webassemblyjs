#!/usr/bin/env bash

pkg=packages/ast

node $pkg/scripts/generateTypeDefinitions.js > $pkg/src/types/nodes.js
node $pkg/scripts/generateNodeUtils.js > $pkg/src/nodes.js

npx prettier --write $pkg/src/types/nodes.js
npx prettier --write $pkg/src/nodes.js
