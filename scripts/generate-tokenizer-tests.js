#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const packageDir = './packages/wast-parser/test/tokenizer/'

const all = fs.readFileSync(path.join(packageDir, 'raw/int_literals.txt'), 'utf-8').split('\n').map(s => s.trim())

const expected = literal => JSON.stringify([
  {
    "type": "number",
    "value": literal,
    "loc": {
      "start": {
          "line": 1,
          "column": 1
        }
    }
  }
])

all.forEach(literal => {

  const dir = path.join(packageDir, `number-literals/${literal}/`)

  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }

  fs.writeFileSync(path.join(dir, 'actual.wast'), literal)

  fs.writeFileSync(path.join(dir, 'expected.json'), JSON.stringify(expected(literal)))

})
