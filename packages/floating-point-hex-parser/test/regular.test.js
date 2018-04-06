const { expect } = require("chai");
const parse = require("../lib");

it("Positive values should be parsed correctly", () => {
  expect(parse("0x1")).to.be.equal(1);
  expect(parse("0x1p-1")).to.be.equal(0.5);
  expect(parse("0x1p1")).to.be.equal(2);
  expect(parse("0x1p+8")).to.be.equal(256);
  expect(parse("0x1p-6")).to.be.equal(0.015625);
  expect(parse("0x1.b7p-1")).to.be.equal(0.857421875);
  expect(parse("0X1.921FB4D12D84AP+1")).to.be.equal(3.1415926);
  expect(parse("0x1.999999999999ap-4")).to.be.equal(0.1);

  expect(parse("0x1.921fb54442d18p+2")).to.be.equal(6.283185307179586);
  expect(parse("0x0.0000000000001p-1022")).to.be.equal(5e-324);
  expect(parse("0x1p-1022")).to.be.equal(2.2250738585072014e-308);
  expect(parse("0x0.fffffffffffffp-1022")).to.be.equal(2.225073858507201e-308);
  expect(parse("0x1.fffffffffffffp+1023")).to.be.equal(1.7976931348623157e308);
  expect(parse("0x1.p100")).to.be.equal(1.2676506002282294e30);
});

it("Should return the same value for equivalent inputs", () => {
  expect(parse("0x1.999999999999ap-4")).to.be.equal(
    parse("0x3.3333333333334p-5")
  );
  expect(parse("0xcc.ccccccccccdp-11")).to.be.equal(
    parse("0x1.999999999999ap-4")
  );
});

it("Zeros should be parsed with correct sign", () => {
  expect(parse("-0x0p0")).to.be.equal(-0);
  expect(parse("+0x0p-4")).to.be.equal(+0);
  expect(parse("-0x0")).to.be.equal(-0);
  expect(parse("-0x0.0p0")).to.be.equal(-0);
  expect(parse("-0x0.p0")).to.be.equal(-0);
  expect(parse("+0x0p0")).to.be.equal(+0);
  expect(parse("+0x0")).to.be.equal(+0);
  expect(parse("+0x0p36")).to.be.equal(+0);
  expect(parse("+0x0.0p0")).to.be.equal(+0);
  expect(parse("+0x0.p0")).to.be.equal(+0);
});

it("Negative values should be parsed correctly", () => {
  expect(parse("-0x0.1p4")).to.be.equal(-1);
  expect(parse("-0x1.1")).to.be.equal(-1.0625);
  expect(parse("-0x0.1")).to.be.equal(-0.0625);
  expect(parse("-0x1")).to.be.equal(-1);
  expect(parse("-0x1p-1")).to.be.equal(-0.5);
  expect(parse("-0x1p1")).to.be.equal(-2);
  expect(parse("-0x1p+8")).to.be.equal(-256);
  expect(parse("-0x1p-6")).to.be.equal(-0.015625);
  expect(parse("-0x1.b7p-1")).to.be.equal(-0.857421875);
  expect(parse("-0X1.921FB4D12D84AP+1")).to.be.equal(-3.1415926);
  expect(parse("-0x1.999999999999ap-4")).to.be.equal(-0.1);
  expect(parse("-0x1.921fb54442d18p+2")).to.be.equal(-6.283185307179586);
  expect(parse("-0x0.0000000000001p-1022")).to.be.equal(-5e-324);
  expect(parse("-0x1p-1022")).to.be.equal(-2.2250738585072014e-308);
  expect(parse("-0x0.fffffffffffffp-1022")).to.be.equal(
    -2.225073858507201e-308
  );
  expect(parse("-0x1.fffffffffffffp+1023")).to.be.equal(
    -1.7976931348623157e308
  );
  expect(parse("-0x1.p100")).to.be.equal(-1.2676506002282294e30);
});

it("Compensated overflow in exponent", () => {
  expect(parse("0x1p-1074")).to.be.equal(5e-324);
});
