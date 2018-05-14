#!/usr/bin/env bash

pkg=packages/ast

node $pkg/scripts/generateTypeDefinitions.js | npx prettier > $pkg/src/types/nodes.js
node $pkg/scripts/generateNodeUtils.js | npx prettier > $pkg/src/nodes.js
