const wabt = require("wabt");

const filename = "module.wast";

export default function loader(source) {
  this.cacheable();

  const module = wabt.parseWat(filename, source);
  const { buffer } = module.toBinary({ write_debug_names: false });

  this.callback(null, new Buffer(buffer.buffer));
}
