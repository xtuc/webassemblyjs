// @flow

type ImportObject = Object;
type Key = string;
type Visitor = (Key, Key, any) => void;

export function walk(object: ImportObject, visitor: Visitor) {
  Object.keys(object).forEach(key => {
    Object.keys(object[key]).forEach(key2 => {
      const val = object[key][key2];

      visitor(key, key2, val);
    });
  });
}
