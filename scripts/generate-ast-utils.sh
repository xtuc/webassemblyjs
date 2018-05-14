#!/usr/bin/env bash

pkg=packages/ast

node $pkg/scripts/generateTypeDefinitions.js | npx prettier --parser flow > $pkg/src/types/nodes.js
node $pkg/scripts/generateNodeUtils.js | npx prettier --parser flow > $pkg/src/nodes.js
