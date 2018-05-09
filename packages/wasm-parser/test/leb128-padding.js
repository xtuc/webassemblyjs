// @flow

const { compareStrings } = require("@webassemblyjs/helper-test-framework");

const { decode } = require("../lib");

it("should decode a binary with LEB128 padding", () => {
  const bin = new Buffer([
    0x00,
    0x61,
    0x73,
    0x6d,
    0x01,
    0x00,
    0x00,
    0x00,
    /* _global section */ 0x06,
    /* size 1 padded */ 0x81,
    0x80,
    0x80,
    0x80,
    0x00,
    /* vector size 0 padded */ 0x80,
    0x80,
    0x80,
    0x80,
    0x00
  ]);

  const ast = decode(bin);
  const actual = JSON.stringify(ast, null, 2);

  const expected = JSON.stringify(
    {
      type: "Program",
      body: [
        {
          type: "Module",
          id: null,
          fields: [],
          metadata: {
            type: "ModuleMetadata",
            sections: [
              {
                type: "SectionMetadata",
                section: "global",
                startOffset: 9,
                size: {
                  type: "NumberLiteral",
                  value: 1,
                  raw: "1",
                  loc: {
                    start: {
                      line: -1,
                      column: 9
                    },
                    end: {
                      line: -1,
                      column: 14
                    }
                  }
                },
                vectorOfSize: {
                  type: "NumberLiteral",
                  value: 0,
                  raw: "0",
                  loc: {
                    start: {
                      line: -1,
                      column: 14
                    },
                    end: {
                      line: -1,
                      column: 19
                    }
                  }
                }
              }
            ]
          }
        }
      ]
    },
    null,
    2
  );

  compareStrings(actual, expected);
});
