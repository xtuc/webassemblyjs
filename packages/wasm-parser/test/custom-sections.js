const {
  encodeVersion,
  encodeHeader,
  encodeU32,
  encodeUTF8Vec
} = require("@webassemblyjs/wasm-gen/lib/encoder");
const { makeBuffer } = require("@webassemblyjs/helper-buffer");
const constants = require("@webassemblyjs/helper-wasm-bytecode");

const { compareStrings } = require("@webassemblyjs/helper-test-framework");

const { decode } = require("../lib");

describe("Binary decoder", () => {
  it("should decode a binary with interspersed custom sections", () => {
    const bin = makeBuffer(
      encodeHeader(),
      encodeVersion(1),
      randCustSection("cust1", 1),
      [constants.sections.type, 0x04, 0x01, 0x60, 0x00, 0x00],
      randCustSection("cust2", 2),
      [constants.sections.func, 0x02, 0x01, 0x00],
      // include a long custom section name before a standard section to make sure
      // we can skip the correct number of bytes; 5 * 30 = 150, so long enough that
      // the LEB-encoded section name takes 2 bytes
      randCustSection("cust3".repeat(30), 3),
      [constants.sections.code, 0x04, 0x01, 0x02, 0x00, 0x0b],
      randCustSection("cust4", 4)
    );

    const ast = decode(bin);
    const actual = JSON.stringify(ast, null, 2);

    const expected = JSON.stringify(expectedForInterspersedCustom(), null, 2);

    compareStrings(actual, expected);
  });

  it("should decode a binary with another custom section after the custom name section", () => {
    const bin = makeBuffer(
      encodeHeader(),
      encodeVersion(1),
      [constants.sections.type, 0x04, 0x01, 0x60, 0x00, 0x00],
      [constants.sections.func, 0x02, 0x01, 0x00],
      [constants.sections.code, 0x04, 0x01, 0x02, 0x00, 0x0b],
      // Custom name section that names the 0th func "foo"
      [
        constants.sections.custom,
        0x0d,
        0x04,
        0x6e,
        0x61,
        0x6d,
        0x65,
        0x01,
        0x06,
        0x01,
        0x00,
        0x03,
        0x66,
        0x6f,
        0x6f
      ],
      randCustSection("?", 5)
    );

    const ast = decode(bin);
    const actual = JSON.stringify(ast, null, 2);

    const expected = JSON.stringify(expectedForCustomAfterName(), null, 2);

    compareStrings(actual, expected);
  });
});

// Generate a custom section with random contents
function randCustSection(name, contentLength) {
  const contents = [];
  for (let i = 0; i < contentLength; i++) {
    contents.push(Math.floor(Math.random() * 255));
  }

  const nameBytes = encodeUTF8Vec(name),
    secLengthBytes = encodeU32(nameBytes.length + contents.length);

  return [
    constants.sections.custom,
    ...secLengthBytes,
    ...nameBytes,
    ...contents
  ];
}

function expectedForInterspersedCustom() {
  return {
    type: "Program",
    body: [
      {
        type: "Module",
        id: null,
        fields: [
          {
            type: "TypeInstruction",
            functype: {
              type: "Signature",
              params: [],
              results: []
            },
            loc: {
              start: {
                line: -1,
                column: 20
              },
              end: {
                line: -1,
                column: 23
              }
            }
          },
          {
            type: "Func",
            name: {
              type: "Identifier",
              value: "func_0",
              raw: ""
            },
            signature: {
              type: "Signature",
              params: [],
              results: []
            },
            body: [],
            loc: {
              start: {
                line: -1,
                column: 198
              },
              end: {
                line: -1,
                column: 201
              }
            },
            metadata: {
              bodySize: 2
            }
          }
        ],
        metadata: {
          type: "ModuleMetadata",
          sections: [
            {
              type: "SectionMetadata",
              section: "custom",
              startOffset: 9,
              size: {
                type: "NumberLiteral",
                value: 7,
                raw: "7",
                loc: {
                  start: {
                    line: -1,
                    column: 9
                  },
                  end: {
                    line: -1,
                    column: 10
                  }
                }
              }
            },
            {
              type: "SectionMetadata",
              section: "type",
              startOffset: 18,
              size: {
                type: "NumberLiteral",
                value: 4,
                raw: "4",
                loc: {
                  start: {
                    line: -1,
                    column: 18
                  },
                  end: {
                    line: -1,
                    column: 19
                  }
                }
              },
              vectorOfSize: {
                type: "NumberLiteral",
                value: 1,
                raw: "1",
                loc: {
                  start: {
                    line: -1,
                    column: 19
                  },
                  end: {
                    line: -1,
                    column: 20
                  }
                }
              }
            },
            {
              type: "SectionMetadata",
              section: "custom",
              startOffset: 24,
              size: {
                type: "NumberLiteral",
                value: 8,
                raw: "8",
                loc: {
                  start: {
                    line: -1,
                    column: 24
                  },
                  end: {
                    line: -1,
                    column: 25
                  }
                }
              }
            },
            {
              type: "SectionMetadata",
              section: "func",
              startOffset: 34,
              size: {
                type: "NumberLiteral",
                value: 2,
                raw: "2",
                loc: {
                  start: {
                    line: -1,
                    column: 34
                  },
                  end: {
                    line: -1,
                    column: 35
                  }
                }
              },
              vectorOfSize: {
                type: "NumberLiteral",
                value: 1,
                raw: "1",
                loc: {
                  start: {
                    line: -1,
                    column: 35
                  },
                  end: {
                    line: -1,
                    column: 36
                  }
                }
              }
            },
            {
              type: "SectionMetadata",
              section: "custom",
              startOffset: 38,
              size: {
                type: "NumberLiteral",
                value: 155,
                raw: "155",
                loc: {
                  start: {
                    line: -1,
                    column: 38
                  },
                  end: {
                    line: -1,
                    column: 40
                  }
                }
              }
            },
            {
              type: "SectionMetadata",
              section: "code",
              startOffset: 196,
              size: {
                type: "NumberLiteral",
                value: 4,
                raw: "4",
                loc: {
                  start: {
                    line: -1,
                    column: 196
                  },
                  end: {
                    line: -1,
                    column: 197
                  }
                }
              },
              vectorOfSize: {
                type: "NumberLiteral",
                value: 1,
                raw: "1",
                loc: {
                  start: {
                    line: -1,
                    column: 197
                  },
                  end: {
                    line: -1,
                    column: 198
                  }
                }
              }
            },
            {
              type: "SectionMetadata",
              section: "custom",
              startOffset: 202,
              size: {
                type: "NumberLiteral",
                value: 10,
                raw: "10",
                loc: {
                  start: {
                    line: -1,
                    column: 202
                  },
                  end: {
                    line: -1,
                    column: 203
                  }
                }
              }
            }
          ]
        }
      }
    ]
  };
}

function expectedForCustomAfterName() {
  return {
    type: "Program",
    body: [
      {
        type: "Module",
        id: null,
        fields: [
          {
            type: "TypeInstruction",
            functype: {
              type: "Signature",
              params: [],
              results: []
            },
            loc: {
              start: {
                line: -1,
                column: 11
              },
              end: {
                line: -1,
                column: 14
              }
            }
          },
          {
            type: "Func",
            name: {
              type: "Identifier",
              value: "foo"
            },
            signature: {
              type: "Signature",
              params: [],
              results: []
            },
            body: [],
            loc: {
              start: {
                line: -1,
                column: 21
              },
              end: {
                line: -1,
                column: 24
              }
            },
            metadata: {
              bodySize: 2
            }
          }
        ],
        metadata: {
          type: "ModuleMetadata",
          sections: [
            {
              type: "SectionMetadata",
              section: "type",
              startOffset: 9,
              size: {
                type: "NumberLiteral",
                value: 4,
                raw: "4",
                loc: {
                  start: {
                    line: -1,
                    column: 9
                  },
                  end: {
                    line: -1,
                    column: 10
                  }
                }
              },
              vectorOfSize: {
                type: "NumberLiteral",
                value: 1,
                raw: "1",
                loc: {
                  start: {
                    line: -1,
                    column: 10
                  },
                  end: {
                    line: -1,
                    column: 11
                  }
                }
              }
            },
            {
              type: "SectionMetadata",
              section: "func",
              startOffset: 15,
              size: {
                type: "NumberLiteral",
                value: 2,
                raw: "2",
                loc: {
                  start: {
                    line: -1,
                    column: 15
                  },
                  end: {
                    line: -1,
                    column: 16
                  }
                }
              },
              vectorOfSize: {
                type: "NumberLiteral",
                value: 1,
                raw: "1",
                loc: {
                  start: {
                    line: -1,
                    column: 16
                  },
                  end: {
                    line: -1,
                    column: 17
                  }
                }
              }
            },
            {
              type: "SectionMetadata",
              section: "code",
              startOffset: 19,
              size: {
                type: "NumberLiteral",
                value: 4,
                raw: "4",
                loc: {
                  start: {
                    line: -1,
                    column: 19
                  },
                  end: {
                    line: -1,
                    column: 20
                  }
                }
              },
              vectorOfSize: {
                type: "NumberLiteral",
                value: 1,
                raw: "1",
                loc: {
                  start: {
                    line: -1,
                    column: 20
                  },
                  end: {
                    line: -1,
                    column: 21
                  }
                }
              }
            },
            {
              type: "SectionMetadata",
              section: "custom",
              startOffset: 25,
              size: {
                type: "NumberLiteral",
                value: 13,
                raw: "13",
                loc: {
                  start: {
                    line: -1,
                    column: 25
                  },
                  end: {
                    line: -1,
                    column: 26
                  }
                }
              }
            },
            {
              type: "SectionMetadata",
              section: "custom",
              startOffset: 40,
              size: {
                type: "NumberLiteral",
                value: 7,
                raw: "7",
                loc: {
                  start: {
                    line: -1,
                    column: 40
                  },
                  end: {
                    line: -1,
                    column: 41
                  }
                }
              }
            }
          ],
          functionNames: [
            {
              type: "FunctionNameMetadata",
              value: "foo",
              index: 0
            }
          ]
        }
      }
    ]
  };
}
