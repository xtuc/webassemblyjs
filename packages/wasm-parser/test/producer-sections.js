const { traverse } = require("@webassemblyjs/ast");
const { readFileSync } = require("fs");
const { assert } = require("chai");
const { join } = require("path");

const { decode } = require("../lib");

function toArrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

describe("Binary decoder", () => {
  it("should decode the producers section", () => {
    const buff = toArrayBuffer(
      readFileSync(
        join(__dirname, "fixtures", "producers-section", "actual.wasm"),
        null
      )
    );
    const ast = decode(buff);

    let found = false;

    traverse(ast, {
      ProducersSectionMetadata({ node }) {
        assert.equal(node.producers.length, 2);

        const [first, second] = node.producers;
        assert.equal(first.length, 1);
        assert.equal(second.length, 1);
        assert.equal(first[0].name, "Rust");
        assert.equal(second[0].name, "rustc");
        assert.equal(first[0].version, "2018");
        assert.equal(second[0].version, "1.32.0 (9fda7c223 2019-01-16)");

        found = true;
      }
    });

    assert.isTrue(found, "no producers section was found");
  });
});
