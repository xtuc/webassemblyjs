#!/usr/bin/env bash

node ./scripts/generateTypeDefinitions.js | npx prettier > src/types.js
node ./scripts/generateNodeUtils.js | npx prettier > src/nodes.js
